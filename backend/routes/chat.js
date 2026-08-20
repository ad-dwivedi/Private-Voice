const express = require("express");
const router = express.Router();
const db = require("../db");
const {
  verifyAuth,
  verifyRoomMembership,
  verifyAuthority,
} = require("../middleware/authMiddleware");

router.use(verifyAuth, verifyRoomMembership);

// =====================================================
// HELPER: CHECK IF USER IS PRIVILEGED (ADMIN OR ACTIVE AUTHORITY)
// =====================================================
function isPrivilegedUser(userId, organizationId, memberRole, callback) {
  if (memberRole === "admin") {
    return callback(null, true);
  }

  const query = `
    SELECT id FROM verified_authorities
    WHERE user_id = ? AND organization_id = ? AND is_active = TRUE
    LIMIT 1
  `;

  db.query(query, [userId, organizationId], (err, results) => {
    if (err) return callback(err);
    callback(null, results.length > 0);
  });
}

// =====================================================
// GET CHAT HISTORY WITH A SPECIFIC USER
// =====================================================
// GET /api/chat/history/:otherUserId
//
// Only messages from the last 24 hours are returned. Older
// messages are NOT deleted from the database, they are simply
// excluded from this response.
// =====================================================
router.get("/history/:otherUserId", (req, res) => {
  const { id: userId, organizationId, memberRole } = req.user;
  const otherUserId = Number(req.params.otherUserId);

  if (!Number.isInteger(otherUserId) || otherUserId <= 0) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  isPrivilegedUser(userId, organizationId, memberRole, (err, privileged) => {
    if (err) {
      console.error("Privilege check failed.");
      return res.status(500).json({ message: "Database error" });
    }

    const finishFetch = () => {
      const messagesQuery = `
        SELECT id, sender_id AS senderId, receiver_id AS receiverId,
        sender_anonymous_id AS anonymousId, message, created_at AS createdAt
        FROM private_messages
        WHERE organization_id = ?
        AND ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
        AND created_at >= NOW() - INTERVAL 24 HOUR
        ORDER BY created_at ASC
      `;

      db.query(
        messagesQuery,
        [organizationId, userId, otherUserId, otherUserId, userId],
        (msgErr, messages) => {
          if (msgErr) {
            console.error("Chat history fetch failed.");
            return res.status(500).json({ message: "Database error" });
          }

          res.json({ messages });
        }
      );
    };

    if (privileged) {
      const memberCheckQuery = `
        SELECT id FROM organization_members
        WHERE user_id = ? AND organization_id = ? AND approval_status = 'approved'
        LIMIT 1
      `;

      db.query(memberCheckQuery, [otherUserId, organizationId], (checkErr, rows) => {
        if (checkErr) {
          console.error("Member check failed.");
          return res.status(500).json({ message: "Database error" });
        }

        if (rows.length === 0) {
          return res.status(403).json({ message: "This conversation is not available" });
        }

        finishFetch();
      });
    } else {
      // -----------------------------------------------
      // NORMAL MEMBER -> OTHER USER MUST BE AN ACTIVE
      // VERIFIED AUTHORITY *OR* THE ORGANIZATION ADMIN.
      //
      // Admin is always a valid chat target (see socket.js
      // for the matching send-side rule) — otherwise a
      // member could send a message to the admin via socket
      // but then be unable to load that same conversation's
      // history, which would look broken.
      // -----------------------------------------------

      const authorityCheckQuery = `
        SELECT id FROM verified_authorities
        WHERE user_id = ? AND organization_id = ? AND is_active = TRUE

        UNION

        SELECT id FROM organization_members
        WHERE user_id = ? AND organization_id = ?
        AND role = 'admin' AND approval_status = 'approved'

        LIMIT 1
      `;

      db.query(
        authorityCheckQuery,
        [otherUserId, organizationId, otherUserId, organizationId],
        (checkErr, rows) => {
          if (checkErr) {
            console.error("Authority check failed.");
            return res.status(500).json({ message: "Database error" });
          }

          if (rows.length === 0) {
            return res.status(403).json({ message: "This conversation is not available" });
          }

          finishFetch();
        }
      );
    }
  });
});

// =====================================================
// GET LIST OF CONVERSATIONS (AUTHORITY/ADMIN ONLY)
// =====================================================
// GET /api/chat/conversations
//
// Also restricted to the last 24 hours for consistency with
// the chat history requirement — a conversation whose most
// recent message is older than 24 hours will naturally drop
// off this list.
// =====================================================
router.get("/conversations", verifyAuthority, (req, res) => {
  const { id: userId, organizationId } = req.user;

  const query = `
    SELECT
      CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END AS memberId,
      sender_anonymous_id AS anonymousId,
      message AS lastMessage,
      created_at AS createdAt
    FROM private_messages
    WHERE organization_id = ?
    AND (sender_id = ? OR receiver_id = ?)
    AND created_at >= NOW() - INTERVAL 24 HOUR
    ORDER BY created_at DESC
  `;

  db.query(query, [userId, organizationId, userId, userId], (err, rows) => {
    if (err) {
      console.error("Conversations fetch failed.");
      return res.status(500).json({ message: "Database error" });
    }

    const seen = new Map();

    rows.forEach((row) => {
      if (row.memberId === userId) return; // safety: skip self-pairs

      if (!seen.has(row.memberId)) {
        seen.set(row.memberId, {
          memberId: row.memberId,
          anonymousId: row.anonymousId,
          lastMessage: row.lastMessage,
          lastMessageAt: row.createdAt,
        });
      }
    });

    res.json({ conversations: Array.from(seen.values()) });
  });
});

module.exports = router;