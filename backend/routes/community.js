const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyAuth, verifyRoomMembership } = require("../middleware/authMiddleware");
const { getIO } = require("../socket/socket");

router.use(verifyAuth, verifyRoomMembership);

// =====================================================
// GET POSTS
// =====================================================
router.get("/posts", (req, res) => {
  const { organizationId, id: userId } = req.user;

  // 24-HOUR VISIBILITY: only posts from the last 24h are returned.
  // Older posts remain in the database (removed only by the 48h
  // cleanup job) but are excluded from this response.
  const query = `
    SELECT 
      cp.id, cp.anonymous_id AS anonymousId, cp.content, cp.created_at AS createdAt,
      (SELECT COUNT(*) FROM post_upvotes pu WHERE pu.post_id = cp.id) AS likes,
      EXISTS(SELECT 1 FROM post_upvotes pu WHERE pu.post_id = cp.id AND pu.user_id = ?) AS liked,
      (cp.user_id = ?) AS isOwner
    FROM community_posts cp
    WHERE cp.organization_id = ? AND cp.is_hidden = FALSE
    AND cp.created_at >= NOW() - INTERVAL 24 HOUR
    ORDER BY cp.created_at DESC
  `;

  db.query(query, [userId, userId, organizationId], (err, posts) => {
    if (err) return res.status(500).json({ message: "Database error" });
    
    if (posts.length === 0) return res.json({ posts: [] });

    const postIds = posts.map(p => p.id);
    const commentsQuery = `
      SELECT id, post_id, anonymous_id AS anonymousId, content, created_at AS createdAt
      FROM comments
      WHERE post_id IN (?) AND is_hidden = FALSE
      ORDER BY created_at ASC
    `;

    db.query(commentsQuery, [postIds], (err, comments) => {
      if (err) return res.status(500).json({ message: "Database error" });

      const postsWithComments = posts.map(post => {
        return {
          ...post,
          isOwner: Boolean(post.isOwner),
          replies: comments.filter(c => c.post_id === post.id)
        };
      });

      res.json({ posts: postsWithComments });
    });
  });
});

// =====================================================
// CREATE POST
// =====================================================
router.post("/posts", (req, res) => {
  const { organizationId, id: userId, sessionAnonymousId } = req.user;
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ message: "Content is required" });
  }

  const query = `
    INSERT INTO community_posts (organization_id, user_id, anonymous_id, content)
    VALUES (?, ?, ?, ?)
  `;

  db.query(query, [organizationId, userId, sessionAnonymousId, content.trim()], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });

    const newPost = {
      id: result.insertId,
      anonymousId: sessionAnonymousId,
      content: content.trim(),
      createdAt: new Date(),
      likes: 0,
      liked: false,
      isOwner: true,
      replies: []
    };

    res.status(201).json({
      message: "Post created",
      post: newPost
    });

    const io = getIO();
    if (io) {
      io.to(`organization:${organizationId}`).emit("community:post_new", {
        id: newPost.id,
        anonymousId: newPost.anonymousId,
        content: newPost.content,
        createdAt: newPost.createdAt,
        likes: 0,
      });
    }
  });
});

// =====================================================
// DELETE POST
// =====================================================
router.delete("/posts/:id", (req, res) => {
  const { id } = req.params;
  const { id: userId, organizationId, memberRole } = req.user;

  const query = `SELECT user_id FROM community_posts WHERE id = ? AND organization_id = ? LIMIT 1`;
  db.query(query, [id, organizationId], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length === 0) return res.status(404).json({ message: "Post not found" });

    if (results[0].user_id !== userId && memberRole !== 'admin') {
      return res.status(403).json({ message: "Unauthorized to delete this post" });
    }

    db.query(`DELETE FROM community_posts WHERE id = ?`, [id], (err) => {
      if (err) return res.status(500).json({ message: "Database error" });

      res.json({ message: "Post deleted" });

      const io = getIO();
      if (io) {
        io.to(`organization:${organizationId}`).emit("community:post_deleted", {
          postId: Number(id),
        });
      }
    });
  });
});

// =====================================================
// CREATE COMMENT
// =====================================================
router.post("/posts/:id/comments", (req, res) => {
  const { id: postId } = req.params;
  const { organizationId, id: userId, sessionAnonymousId } = req.user;
  const { content } = req.body;

  if (!content || !content.trim()) return res.status(400).json({ message: "Content is required" });

  db.query(`SELECT id FROM community_posts WHERE id = ? AND organization_id = ? AND is_hidden = FALSE`, [postId, organizationId], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length === 0) return res.status(404).json({ message: "Post not found" });

    const query = `
      INSERT INTO comments (post_id, organization_id, user_id, anonymous_id, content)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(query, [postId, organizationId, userId, sessionAnonymousId, content.trim()], (err, result) => {
      if (err) return res.status(500).json({ message: "Database error" });

      const newComment = {
        id: result.insertId,
        postId: parseInt(postId),
        anonymousId: sessionAnonymousId,
        content: content.trim(),
        createdAt: new Date()
      };

      res.status(201).json({
        message: "Comment created",
        comment: newComment
      });

      const io = getIO();
      if (io) {
        io.to(`organization:${organizationId}`).emit("community:comment_new", {
          postId: newComment.postId,
          comment: newComment,
        });
      }
    });
  });
});

// =====================================================
// UPVOTE POST
// =====================================================
router.post("/posts/:id/upvote", (req, res) => {
  const { id: postId } = req.params;
  const { id: userId, organizationId } = req.user;

  db.query(`SELECT id FROM community_posts WHERE id = ? AND organization_id = ?`, [postId, organizationId], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length === 0) return res.status(404).json({ message: "Post not found" });

    db.query(`SELECT id FROM post_upvotes WHERE post_id = ? AND user_id = ?`, [postId, userId], (err, upvotes) => {
      if (err) return res.status(500).json({ message: "Database error" });

      const afterToggle = (likedNow) => {
        db.query(`SELECT COUNT(*) AS total FROM post_upvotes WHERE post_id = ?`, [postId], (countErr, countRows) => {
          const likes = countErr ? null : countRows[0].total;

          res.json({
            message: likedNow ? "Upvote added" : "Upvote removed",
            liked: likedNow,
            likes,
          });

          const io = getIO();
          if (io && likes !== null) {
            io.to(`organization:${organizationId}`).emit("community:post_upvoted", {
              postId: Number(postId),
              likes,
            });
          }
        });
      };

      if (upvotes.length > 0) {
        db.query(`DELETE FROM post_upvotes WHERE id = ?`, [upvotes[0].id], (err) => {
          if (err) return res.status(500).json({ message: "Database error" });
          afterToggle(false);
        });
      } else {
        db.query(`INSERT INTO post_upvotes (post_id, user_id) VALUES (?, ?)`, [postId, userId], (err) => {
          if (err) return res.status(500).json({ message: "Database error" });
          afterToggle(true);
        });
      }
    });
  });
});

// =====================================================
// REPORT POST / COMMENT
// =====================================================
router.post("/reports", (req, res) => {
  const { organizationId, id: reporterId } = req.user;
  const { targetType, targetId, reason } = req.body;

  if (!['post', 'comment'].includes(targetType) || !targetId || !reason) {
    return res.status(400).json({ message: "Invalid report data" });
  }

  const insertQuery = `
    INSERT INTO reports (organization_id, reporter_id, target_type, target_id, reason)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(insertQuery, [organizationId, reporterId, targetType, targetId, reason], (err) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: "You have already reported this content." });
      }
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }

    res.status(201).json({ message: "Report submitted successfully." });

    checkModerationThreshold(organizationId, targetType, targetId);
  });
});

function checkModerationThreshold(organizationId, targetType, targetId) {
  db.query(`SELECT COUNT(*) AS total FROM organization_members WHERE organization_id = ? AND approval_status = 'approved' AND role = 'member'`, [organizationId], (err, memResults) => {
    if (err || memResults.length === 0) return;
    const totalMembers = memResults[0].total;
    if (totalMembers === 0) return;

    db.query(`SELECT COUNT(*) AS total FROM reports WHERE target_type = ? AND target_id = ?`, [targetType, targetId], (err, repResults) => {
      if (err || repResults.length === 0) return;
      const reportsCount = repResults[0].total;

      const ratio = reportsCount / totalMembers;

      if (ratio >= 0.50) {
        const table = targetType === 'post' ? 'community_posts' : 'comments';
        db.query(`UPDATE ?? SET is_hidden = TRUE WHERE id = ?`, [table, targetId], (err) => {
          if (err) console.error("Error hiding content:", err);
          
          if (ratio >= 0.70) {
            db.query(`SELECT user_id FROM ?? WHERE id = ? LIMIT 1`, [table, targetId], (err, authorResults) => {
              if (err || authorResults.length === 0) return;
              const authorId = authorResults[0].user_id;

              const suspendUntil = new Date();
              suspendUntil.setHours(suspendUntil.getHours() + 48);

              db.query(`
                INSERT INTO suspensions (user_id, organization_id, reason, suspension_until)
                VALUES (?, ?, ?, ?)
              `, [authorId, organizationId, 'Content reported by 70% of room members', suspendUntil]);
            });
          }
        });
      }
    });
  });
}

// =====================================================
// ADMIN GET REPORTS
// =====================================================
router.get("/admin/reports", (req, res) => {
  const { organizationId, memberRole } = req.user;
  if (memberRole !== 'admin') return res.status(403).json({ message: "Admin access required" });

  const query = `SELECT * FROM reports WHERE organization_id = ? ORDER BY created_at DESC`;
  db.query(query, [organizationId], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.json({ reports: results });
  });
});

module.exports = router;