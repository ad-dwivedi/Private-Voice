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
// GET COMPLAINTS (Normal user sees their own)
// =====================================================
//
// 24-HOUR VISIBILITY: added here too, matching the same rule
// as the admin view — older complaints remain in the DB
// (removed only by the 48h cleanup job) but drop out of this
// list after 24 hours.
// =====================================================
router.get("/", (req, res) => {
  const { organizationId, id: userId } = req.user;

  const query = `
    SELECT id, category, title, description, status, response, created_at AS createdAt, updated_at AS updatedAt
    FROM complaints
    WHERE organization_id = ? AND user_id = ?
    AND created_at >= NOW() - INTERVAL 24 HOUR
    ORDER BY created_at DESC
  `;

  db.query(query, [organizationId, userId], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.json({ complaints: results });
  });
});

// =====================================================
// CREATE COMPLAINT
// =====================================================
router.post("/", (req, res) => {
  const { organizationId, id: userId } = req.user;
  const { title, description, category } = req.body;

  if (!title || !description || !category) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const query = `
    INSERT INTO complaints (organization_id, user_id, category, title, description)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(query, [organizationId, userId, category, title, description], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });

    res.status(201).json({ message: "Complaint submitted successfully" });

    const io = getIO();
    if (io) {
      io.to(`admins:${organizationId}`).emit("complaint:new", {
        id: result.insertId,
        category,
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
// ADMIN/AUTHORITY: GET ALL COMPLAINTS (LAST 24 HOURS ONLY)
// =====================================================
router.get("/admin", verifyAuthority, (req, res) => {
  const { organizationId } = req.user;

  const query = `
    SELECT id, category, title, description, status, response, created_at AS createdAt, updated_at AS updatedAt
    FROM complaints
    WHERE organization_id = ?
    AND created_at >= NOW() - INTERVAL 24 HOUR
    ORDER BY created_at DESC
  `;

  db.query(query, [organizationId], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.json({ complaints: results });
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
    UPDATE complaints 
    SET status = ?, response = COALESCE(?, response)
    WHERE id = ? AND organization_id = ?
  `;

  db.query(query, [status, response || null, id, organizationId], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (result.affectedRows === 0) return res.status(404).json({ message: "Complaint not found" });

    res.json({ message: "Complaint updated successfully" });

    db.query(`SELECT user_id, title FROM complaints WHERE id = ?`, [id], (err, results) => {
      if (!err && results.length > 0) {
        const submitterId = results[0].user_id;

        createNotification(
          organizationId, 
          submitterId, 
          'complaint_status', 
          id, 
          `Update on your complaint: ${results[0].title}`, 
          `Status changed to ${status}. ${response ? 'An authority has left a response.' : ''}`
        );

        const io = getIO();
        if (io) {
          const payload = {
            id: Number(id),
            status,
            response: response || null,
            updatedAt: new Date(),
          };

          io.to(`user:${submitterId}`).emit("complaint:updated", payload);
          io.to(`admins:${organizationId}`).emit("complaint:updated", payload);
        }
      }
    });
  });
});

module.exports = router;