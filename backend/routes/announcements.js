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
// GET ANNOUNCEMENTS (All members)
// =====================================================
//
// 24-HOUR VISIBILITY: added on top of the existing
// published/expiry filter. Older announcements remain in the
// DB (removed only by the 48h cleanup job).
// =====================================================
router.get("/", (req, res) => {
  const { organizationId } = req.user;

  const query = `
    SELECT a.id, a.title, a.content, a.priority, a.status, a.expires_at AS expiresAt, a.created_at AS createdAt,
    u.full_name AS creatorName,
    (SELECT display_name FROM verified_authorities va WHERE va.user_id = a.created_by AND va.organization_id = a.organization_id LIMIT 1) AS authorityTitle
    FROM announcements a
    JOIN users u ON a.created_by = u.id
    WHERE a.organization_id = ? AND a.status = 'published'
    AND (a.expires_at IS NULL OR a.expires_at > NOW())
    AND a.created_at >= NOW() - INTERVAL 24 HOUR
    ORDER BY a.priority = 'urgent' DESC, a.priority = 'high' DESC, a.created_at DESC
  `;

  db.query(query, [organizationId], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.json({ announcements: results });
  });
});

// =====================================================
// ADMIN/AUTHORITY: GET ALL ANNOUNCEMENTS
// =====================================================
router.get("/admin", verifyAuthority, (req, res) => {
  const { organizationId } = req.user;

  const query = `
    SELECT id, title, content, priority, status, expires_at AS expiresAt, created_at AS createdAt
    FROM announcements
    WHERE organization_id = ?
    ORDER BY created_at DESC
  `;

  db.query(query, [organizationId], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.json({ announcements: results });
  });
});

// =====================================================
// ADMIN/AUTHORITY: CREATE ANNOUNCEMENT
// =====================================================
router.post("/", verifyAuthority, (req, res) => {
  const { organizationId, id: userId } = req.user;
  const { title, content, priority, status, expiresAt } = req.body;

  if (!title || !content) return res.status(400).json({ message: "Title and content required" });

  const query = `
    INSERT INTO announcements (organization_id, created_by, title, content, priority, status, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const expiryDate = expiresAt ? new Date(expiresAt) : null;
  const finalStatus = status || 'published';

  db.query(query, [organizationId, userId, title, content, priority || 'medium', finalStatus, expiryDate], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });

    if (finalStatus === 'published') {
      db.query(`SELECT user_id FROM organization_members WHERE organization_id = ? AND approval_status = 'approved'`, [organizationId], (err, members) => {
        if (!err && members) {
          members.forEach(m => {
            createNotification(organizationId, m.user_id, 'announcement', result.insertId, `New Announcement: ${title}`, content.substring(0, 100) + '...');
          });
        }
      });
    }

    res.status(201).json({ message: "Announcement created" });

    if (finalStatus === 'published') {
      const io = getIO();
      if (io) {
        const emitQuery = `
          SELECT a.id, a.title, a.content, a.priority, a.status, a.expires_at AS expiresAt, a.created_at AS createdAt,
          u.full_name AS creatorName,
          (SELECT display_name FROM verified_authorities va WHERE va.user_id = a.created_by AND va.organization_id = a.organization_id LIMIT 1) AS authorityTitle
          FROM announcements a
          JOIN users u ON a.created_by = u.id
          WHERE a.id = ?
        `;

        db.query(emitQuery, [result.insertId], (emitErr, emitRows) => {
          if (!emitErr && emitRows.length > 0) {
            io.to(`organization:${organizationId}`).emit("announcement:new", emitRows[0]);
          }
        });
      }
    }
  });
});

// =====================================================
// ADMIN/AUTHORITY: UPDATE STATUS (Archive/Publish)
// =====================================================
router.patch("/:id/status", verifyAuthority, (req, res) => {
  const { id } = req.params;
  const { organizationId } = req.user;
  const { status } = req.body;

  if (!['draft', 'published', 'archived'].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  db.query(`UPDATE announcements SET status = ? WHERE id = ? AND organization_id = ?`, [status, id, organizationId], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (result.affectedRows === 0) return res.status(404).json({ message: "Not found" });

    res.json({ message: "Status updated" });

    const io = getIO();
    if (io) {
      const emitQuery = `
        SELECT a.id, a.title, a.content, a.priority, a.status, a.expires_at AS expiresAt, a.created_at AS createdAt,
        u.full_name AS creatorName,
        (SELECT display_name FROM verified_authorities va WHERE va.user_id = a.created_by AND va.organization_id = a.organization_id LIMIT 1) AS authorityTitle
        FROM announcements a
        JOIN users u ON a.created_by = u.id
        WHERE a.id = ?
      `;

      db.query(emitQuery, [id], (emitErr, emitRows) => {
        if (!emitErr && emitRows.length > 0) {
          io.to(`organization:${organizationId}`).emit("announcement:updated", emitRows[0]);
        }
      });
    }
  });
});

module.exports = router;