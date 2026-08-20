const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyAuth, verifyRoomMembership } = require("../middleware/authMiddleware");

router.use(verifyAuth, verifyRoomMembership);

// =====================================================
// GET NOTIFICATIONS
// =====================================================
router.get("/", (req, res) => {
  const { organizationId, id: userId } = req.user;

  const query = `
    SELECT id, type, reference_id AS referenceId, title, content, is_read AS isRead, created_at AS createdAt
    FROM notifications
    WHERE organization_id = ? AND user_id = ?
    ORDER BY created_at DESC
    LIMIT 50
  `;

  db.query(query, [organizationId, userId], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.json({ notifications: results });
  });
});

// =====================================================
// GET UNREAD COUNT
// =====================================================
router.get("/count", (req, res) => {
  const { organizationId, id: userId } = req.user;

  const query = `
    SELECT COUNT(*) AS count
    FROM notifications
    WHERE organization_id = ? AND user_id = ? AND is_read = FALSE
  `;

  db.query(query, [organizationId, userId], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.json({ count: results[0].count });
  });
});

// =====================================================
// MARK AS READ
// =====================================================
router.patch("/:id/read", (req, res) => {
  const { id } = req.params;
  const { organizationId, id: userId } = req.user;

  db.query(`UPDATE notifications SET is_read = TRUE WHERE id = ? AND organization_id = ? AND user_id = ?`, [id, organizationId, userId], (err) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.json({ message: "Marked as read" });
  });
});

// =====================================================
// MARK ALL AS READ
// =====================================================
router.patch("/read-all", (req, res) => {
  const { organizationId, id: userId } = req.user;

  db.query(`UPDATE notifications SET is_read = TRUE WHERE organization_id = ? AND user_id = ?`, [organizationId, userId], (err) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.json({ message: "All marked as read" });
  });
});

module.exports = router;
