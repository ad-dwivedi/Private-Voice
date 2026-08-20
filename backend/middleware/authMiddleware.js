const jwt = require("jsonwebtoken");
const db = require("../db");

// =====================================================
// JWT SECRET
// =====================================================

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.trim().length === 0) {
  console.error(
    "FATAL: JWT_SECRET is not set. Add JWT_SECRET to your .env file."
  );

  process.exit(1);
}

// =====================================================
// VERIFY AUTHENTICATION
// =====================================================

const verifyAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        message: "No token provided, authorization denied",
      });
    }

    const token = authHeader.substring(7).trim();

    if (!token) {
      return res.status(401).json({
        message: "No token provided, authorization denied",
      });
    }

    const decoded = jwt.verify(
      token,
      JWT_SECRET
    );

    if (!decoded.id) {
      return res.status(401).json({
        message: "Token is not valid",
      });
    }

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Token is not valid",
    });
  }
};

// =====================================================
// VERIFY ROOM MEMBERSHIP
// =====================================================

const verifyRoomMembership = (
  req,
  res,
  next
) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Not authenticated",
    });
  }

  const userId = req.user.id;
  const organizationId =
    req.user.organizationId;

  if (!organizationId) {
    return res.status(400).json({
      message:
        "Organization ID is missing from session",
    });
  }

  const memberQuery = `
    SELECT
      role,
      approval_status
    FROM organization_members
    WHERE user_id = ?
    AND organization_id = ?
    LIMIT 1
  `;

  db.query(
    memberQuery,
    [userId, organizationId],
    (memberErr, members) => {
      if (memberErr) {
        console.error(
          "Membership verification failed."
        );

        return res.status(500).json({
          message: "Database error",
        });
      }

      if (members.length === 0) {
        return res.status(403).json({
          message:
            "Access denied. Not a member of this organization.",
        });
      }

      const member = members[0];

      if (
        member.approval_status !==
        "approved"
      ) {
        return res.status(403).json({
          message:
            "Access denied. Membership is not approved.",
        });
      }

      // =================================================
      // CHECK SUSPENSION
      // =================================================

      const suspensionQuery = `
        SELECT suspension_until
        FROM suspensions
        WHERE user_id = ?
        AND organization_id = ?
        ORDER BY id DESC
        LIMIT 1
      `;

      db.query(
        suspensionQuery,
        [userId, organizationId],
        (suspensionErr, suspensions) => {
          if (suspensionErr) {
            console.error(
              "Suspension check failed."
            );

            return res.status(500).json({
              message: "Database error",
            });
          }

          if (suspensions.length > 0) {
            const suspension =
              suspensions[0];

            if (
              suspension.suspension_until &&
              new Date() <
                new Date(
                  suspension.suspension_until
                )
            ) {
              return res.status(403).json({
                message:
                  "Access denied. You are currently suspended from this room.",
              });
            }
          }

          // Fresh DB verified role.
          req.user.memberRole =
            member.role;

          req.user.approvalStatus =
            member.approval_status;

          next();
        }
      );
    }
  );
};

// =====================================================
// VERIFY ADMIN
// =====================================================

const verifyAdmin = (
  req,
  res,
  next
) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Not authenticated",
    });
  }

  if (req.user.memberRole !== "admin") {
    return res.status(403).json({
      message: "Admin access required",
    });
  }

  next();
};

// =====================================================
// VERIFY ADMIN OR AUTHORITY
// =====================================================

const verifyAuthority = (
  req,
  res,
  next
) => {
  if (
    !req.user ||
    !req.user.organizationId
  ) {
    return res.status(401).json({
      message: "Not authenticated",
    });
  }

  const userId = req.user.id;
  const organizationId =
    req.user.organizationId;

  // Admin already verified by
  // verifyRoomMembership.
  if (req.user.memberRole === "admin") {
    return next();
  }

  const query = `
    SELECT id
    FROM verified_authorities
    WHERE user_id = ?
    AND organization_id = ?
    AND is_active = TRUE
    LIMIT 1
  `;

  db.query(
    query,
    [userId, organizationId],
    (err, results) => {
      if (err) {
        console.error(
          "Authority verification failed."
        );

        return res.status(500).json({
          message: "Database error",
        });
      }

      if (results.length === 0) {
        return res.status(403).json({
          message:
            "Access denied. Admin or Authority access required.",
        });
      }

      next();
    }
  );
};

module.exports = {
  verifyAuth,
  verifyRoomMembership,
  verifyAdmin,
  verifyAuthority,
  JWT_SECRET,
};