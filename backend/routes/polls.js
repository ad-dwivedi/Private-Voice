const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyAuth, verifyRoomMembership, verifyAuthority } = require("../middleware/authMiddleware");
const { getIO } = require("../socket/socket");

router.use(verifyAuth, verifyRoomMembership);

function createNotification(organizationId, userId, type, referenceId, title, content) {
  const query = `
    INSERT INTO notifications (organization_id, user_id, type, reference_id, title, content)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  db.query(query, [organizationId, userId, type, referenceId, title, content], (err, result) => {
    if (err) {
      console.error("Error creating notification:", err);
      return;
    }

    const io = getIO();
    if (io) {
      io.to(`user:${userId}`).emit("notification:new", {
        id: result.insertId,
        type,
        referenceId,
        title,
        content,
        isRead: false,
        createdAt: new Date(),
      });
    }
  });
}

// =====================================================
// GET POLLS
// =====================================================
//
// 24-HOUR VISIBILITY: only polls created in the last 24h are
// returned. Older polls remain in the DB (removed only by the
// 48h cleanup job).
// =====================================================
router.get("/", (req, res) => {
  const { organizationId, id: userId } = req.user;

  const pollsQuery = `
    SELECT p.id, p.title, p.description, p.is_active, p.expires_at AS expiresAt, p.created_at AS createdAt,
    EXISTS(SELECT 1 FROM poll_votes pv WHERE pv.poll_id = p.id AND pv.user_id = ?) AS hasVoted,
    (SELECT COUNT(*) FROM poll_votes pv WHERE pv.poll_id = p.id) AS totalVotes
    FROM polls p
    WHERE p.organization_id = ?
    AND p.created_at >= NOW() - INTERVAL 24 HOUR
    ORDER BY p.created_at DESC
  `;

  db.query(pollsQuery, [userId, organizationId], (err, polls) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (polls.length === 0) return res.json({ polls: [] });

    const now = new Date();
    polls.forEach(p => {
      if (p.is_active && p.expiresAt && new Date(p.expiresAt) < now) {
        p.is_active = 0;
        db.query(`UPDATE polls SET is_active = FALSE WHERE id = ?`, [p.id], () => {});
      }
    });

    const pollIds = polls.map(p => p.id);
    const optionsQuery = `
      SELECT o.id, o.poll_id, o.option_text,
      (SELECT COUNT(*) FROM poll_votes pv WHERE pv.option_id = o.id) AS votes
      FROM poll_options o
      WHERE o.poll_id IN (?)
    `;

    db.query(optionsQuery, [pollIds], (err, options) => {
      if (err) return res.status(500).json({ message: "Database error" });

      const pollsWithOptions = polls.map(poll => {
        return {
          ...poll,
          isActive: poll.is_active === 1,
          options: options.filter(o => o.poll_id === poll.id)
        };
      });

      res.json({ polls: pollsWithOptions });
    });
  });
});

// =====================================================
// ADMIN/AUTHORITY: CREATE POLL
// =====================================================
router.post("/", verifyAuthority, (req, res) => {
  const { organizationId, id: userId } = req.user;
  const { title, description, expiresAt, options } = req.body;

  if (!title || !options || !Array.isArray(options) || options.length < 2) {
    return res.status(400).json({ message: "Title and at least 2 options required" });
  }

  const pollQuery = `
    INSERT INTO polls (organization_id, created_by, title, description, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `;
  const expiryDate = expiresAt ? new Date(expiresAt) : null;

  db.query(pollQuery, [organizationId, userId, title, description, expiryDate], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });

    const pollId = result.insertId;
    const optionValues = options.map(opt => [pollId, opt]);

    db.query(`INSERT INTO poll_options (poll_id, option_text) VALUES ?`, [optionValues], (err, optResult) => {
      if (err) return res.status(500).json({ message: "Database error options" });
      
      db.query(`SELECT user_id FROM organization_members WHERE organization_id = ? AND approval_status = 'approved'`, [organizationId], (err, members) => {
        if (!err && members) {
          members.forEach(m => {
            createNotification(organizationId, m.user_id, 'new_poll', pollId, 'New Poll Created', `A new poll "${title}" has been posted in your community.`);
          });
        }
      });

      res.status(201).json({ message: "Poll created successfully" });

      const io = getIO();
      if (io) {
        const firstOptionId = optResult.insertId;

        io.to(`organization:${organizationId}`).emit("poll:new", {
          id: pollId,
          title,
          description,
          isActive: true,
          expiresAt: expiryDate,
          createdAt: new Date(),
          hasVoted: false,
          totalVotes: 0,
          options: options.map((optionText, index) => ({
            id: firstOptionId + index,
            poll_id: pollId,
            option_text: optionText,
            votes: 0,
          })),
        });
      }
    });
  });
});

// =====================================================
// VOTE
// =====================================================
router.post("/:id/vote", (req, res) => {
  const { id: pollId } = req.params;
  const { organizationId, id: userId } = req.user;
  const { optionId } = req.body;

  if (!optionId) return res.status(400).json({ message: "Option ID is required" });

  db.query(`SELECT is_active, expires_at FROM polls WHERE id = ? AND organization_id = ?`, [pollId, organizationId], (err, polls) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (polls.length === 0) return res.status(404).json({ message: "Poll not found" });
    
    const poll = polls[0];
    if (!poll.is_active || (poll.expires_at && new Date(poll.expires_at) < new Date())) {
      return res.status(400).json({ message: "Poll is closed" });
    }

    db.query(`INSERT INTO poll_votes (poll_id, option_id, user_id) VALUES (?, ?, ?)`, [pollId, optionId, userId], (err) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: "You have already voted on this poll" });
        return res.status(500).json({ message: "Database error" });
      }

      res.json({ message: "Vote cast successfully" });

      const io = getIO();
      if (io) {
        const countsQuery = `
          SELECT id, (SELECT COUNT(*) FROM poll_votes pv WHERE pv.option_id = po.id) AS votes
          FROM poll_options po
          WHERE po.poll_id = ?
        `;

        db.query(countsQuery, [pollId], (countErr, optionRows) => {
          if (countErr) return;

          db.query(`SELECT COUNT(*) AS total FROM poll_votes WHERE poll_id = ?`, [pollId], (totalErr, totalRows) => {
            if (totalErr) return;

            io.to(`organization:${organizationId}`).emit("poll:voted", {
              pollId: Number(pollId),
              optionVotes: optionRows.map(r => ({ id: r.id, votes: r.votes })),
              totalVotes: totalRows[0].total,
            });
          });
        });
      }
    });
  });
});

// =====================================================
// ADMIN/AUTHORITY: CLOSE POLL EARLY
// =====================================================
router.put("/:id/close", verifyAuthority, (req, res) => {
  const { id } = req.params;
  const { organizationId } = req.user;

  db.query(`UPDATE polls SET is_active = FALSE WHERE id = ? AND organization_id = ?`, [id, organizationId], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (result.affectedRows === 0) return res.status(404).json({ message: "Poll not found" });

    res.json({ message: "Poll closed" });

    const io = getIO();
    if (io) {
      io.to(`organization:${organizationId}`).emit("poll:closed", {
        pollId: Number(id),
      });
    }
  });
});

module.exports = router;