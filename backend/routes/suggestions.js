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
// GET SUGGESTIONS (organization-wide, all approved members)
// =====================================================
//
// 24-HOUR VISIBILITY: only suggestions from the last 24h are
// returned. Older suggestions remain in the DB (removed only
// by the 48h cleanup job).
// =====================================================
router.get("/", (req, res) => {
  const { organizationId } = req.user;

  const query = `
    SELECT id, title, description, status, response, created_at AS createdAt, updated_at AS updatedAt
    FROM suggestions
    WHERE organization_id = ?
    AND created_at >= NOW() - INTERVAL 24 HOUR
    ORDER BY created_at DESC
  `;

  db.query(query, [organizationId], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.json({ suggestions: results });
  });
});

// =====================================================
// CREATE SUGGESTION
// =====================================================
router.post("/", (req, res) => {
  const { organizationId, id: userId } = req.user;
  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const query = `
    INSERT INTO suggestions (organization_id, user_id, title, description)
    VALUES (?, ?, ?, ?)
  `;

  db.query(query, [organizationId, userId, title, description], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });

    res.status(201).json({ message: "Suggestion submitted successfully" });

    const io = getIO();
    if (io) {
      io.to(`organization:${organizationId}`).emit("suggestion:new", {
        id: result.insertId,
        title,
        description,
        status: "PENDING",
        response: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  });
});

// =====================================================
// ADMIN/AUTHORITY: GET ALL SUGGESTIONS (LAST 24 HOURS ONLY)
// =====================================================
router.get("/admin", verifyAuthority, (req, res) => {
  const { organizationId } = req.user;

  const query = `
    SELECT id, title, description, status, response, created_at AS createdAt, updated_at AS updatedAt
    FROM suggestions
    WHERE organization_id = ?
    AND created_at >= NOW() - INTERVAL 24 HOUR
    ORDER BY created_at DESC
  `;

  db.query(query, [organizationId], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.json({ suggestions: results });
  });
});

// =====================================================
// ADMIN/AUTHORITY: UPDATE STATUS & RESPOND
// =====================================================
router.patch("/:id/status", verifyAuthority, (req, res) => {
  const { id } = req.params;
  const { organizationId } = req.user;
  const { status, response } = req.body;

  if (!status) return res.status(400).json({ message: "Status is required" });

  const query = `
    UPDATE suggestions 
    SET status = ?, response = COALESCE(?, response)
    WHERE id = ? AND organization_id = ?
  `;

  db.query(query, [status, response || null, id, organizationId], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (result.affectedRows === 0) return res.status(404).json({ message: "Suggestion not found" });

    res.json({ message: "Suggestion updated successfully" });

    db.query(`SELECT user_id, title FROM suggestions WHERE id = ?`, [id], (err, results) => {
      if (!err && results.length > 0) {
        createNotification(
          organizationId, 
          results[0].user_id, 
          'suggestion_status', 
          id, 
          `Update on your suggestion: ${results[0].title}`, 
          `Status changed to ${status}. ${response ? 'An authority has left a response.' : ''}`
        );
      }
    });

    const io = getIO();
    if (io) {
      io.to(`organization:${organizationId}`).emit("suggestion:updated", {
        id: Number(id),
        status,
        response: response || null,
        updatedAt: new Date(),
      });
    }
  });
});

module.exports = router;