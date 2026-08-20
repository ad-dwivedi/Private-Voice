const express = require("express");
const router = express.Router();

const db = require("../db");

const {
  verifyAuth,
  verifyRoomMembership,
  verifyAdmin,
} = require("../middleware/authMiddleware");

// =====================================================
// ALL ROUTES REQUIRE AUTH + APPROVED MEMBERSHIP
// =====================================================

router.use(
  verifyAuth,
  verifyRoomMembership
);

// =====================================================
// CREATE NOTIFICATION
// =====================================================

function createNotification(
  organizationId,
  userId,
  type,
  referenceId,
  title,
  content
) {
  const query = `
    INSERT INTO notifications
    (
      organization_id,
      user_id,
      type,
      reference_id,
      title,
      content
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    query,
    [
      organizationId,
      userId,
      type,
      referenceId,
      title,
      content,
    ],
    (err) => {
      if (err) {
        console.error(
          "Error creating notification."
        );
      }
    }
  );
}

// =====================================================
// GET ACTIVE AUTHORITIES (+ ORGANIZATION ADMINS)
// =====================================================
//
// GET /api/authorities
//
// Available to approved room members.
//
// IMPORTANT:
// The organization admin is ALWAYS a valid private-chat
// target — this matches the existing backend permission
// model (verifyAuthority already treats an admin as
// automatically privileged, without needing a row in
// verified_authorities). Previously this endpoint only
// returned verified_authorities rows, so a member had no
// way to message the admin unless the admin was ALSO
// manually added as a verified authority. This UNION adds
// approved admins of the organization who are not already
// listed as a verified authority, so no manual setup step
// is required.
//
// Admin's real full_name is used as displayName here
// intentionally — PrivateVoice's core design states admins
// are NOT anonymous to the system (unlike members), and this
// mirrors existing behavior where admin identity is already
// shown to members elsewhere (e.g. announcements creatorName).
//

router.get(
  "/",
  (req, res) => {
    const organizationId =
      req.user.organizationId;

    const query = `
      SELECT
        va.id,
        va.user_id AS userId,
        va.authority_type AS authorityType,
        va.display_name AS displayName,
        va.is_active AS isActive,
        va.verified_at AS verifiedAt,
        u.full_name AS fullName

      FROM verified_authorities va

      INNER JOIN users u
        ON va.user_id = u.id

      INNER JOIN organization_members om
        ON om.user_id = va.user_id
        AND om.organization_id =
            va.organization_id

      WHERE va.organization_id = ?
      AND va.is_active = TRUE
      AND om.approval_status = 'approved'

      UNION

      SELECT
        NULL AS id,
        om.user_id AS userId,
        'admin' AS authorityType,
        u.full_name AS displayName,
        TRUE AS isActive,
        om.joined_at AS verifiedAt,
        u.full_name AS fullName

      FROM organization_members om

      INNER JOIN users u
        ON om.user_id = u.id

      WHERE om.organization_id = ?
      AND om.role = 'admin'
      AND om.approval_status = 'approved'
      AND om.user_id NOT IN (
        SELECT user_id
        FROM verified_authorities
        WHERE organization_id = ?
        AND is_active = TRUE
      )

      ORDER BY verifiedAt ASC
    `;

    db.query(
      query,
      [organizationId, organizationId, organizationId],
      (err, results) => {
        if (err) {
          console.error(
            "Failed to fetch authorities."
          );

          return res.status(500).json({
            message:
              "Database error",
          });
        }

        return res.status(200).json({
          authorities: results,
        });
      }
    );
  }
);

// =====================================================
// ADMIN - GET ALL AUTHORITIES
// =====================================================
//
// GET /api/authorities/admin
//

router.get(
  "/admin",
  verifyAdmin,
  (req, res) => {
    const organizationId =
      req.user.organizationId;

    const query = `
      SELECT
        va.id,
        va.user_id AS userId,
        va.authority_type AS authorityType,
        va.display_name AS displayName,
        va.is_active AS isActive,
        va.verified_at AS verifiedAt,
        u.full_name AS fullName,
        u.email

      FROM verified_authorities va

      INNER JOIN users u
        ON va.user_id = u.id

      WHERE va.organization_id = ?

      ORDER BY va.created_at ASC
    `;

    db.query(
      query,
      [organizationId],
      (err, results) => {
        if (err) {
          console.error(
            "Failed to fetch admin authorities."
          );

          return res.status(500).json({
            message:
              "Database error",
          });
        }

        return res.status(200).json({
          authorities: results,
        });
      }
    );
  }
);

// =====================================================
// ADMIN - ADD / VERIFY AUTHORITY
// =====================================================
//
// POST /api/authorities
//
// Body:
// {
//   userId,
//   authorityType,
//   displayName
// }
//
// =====================================================

router.post(
  "/",
  verifyAdmin,
  (req, res) => {
    const organizationId =
      req.user.organizationId;

    const {
      userId,
      authorityType,
      displayName,
    } = req.body;

    const cleanUserId =
      Number(userId);

    const cleanAuthorityType =
      String(
        authorityType || ""
      ).trim();

    const cleanDisplayName =
      String(
        displayName || ""
      ).trim();

    if (
      !Number.isInteger(
        cleanUserId
      ) ||
      cleanUserId <= 0
    ) {
      return res.status(400).json({
        message:
          "Valid userId is required",
      });
    }

    if (!cleanAuthorityType) {
      return res.status(400).json({
        message:
          "Authority type is required",
      });
    }

    if (!cleanDisplayName) {
      return res.status(400).json({
        message:
          "Display name is required",
      });
    }

    // =================================================
    // VERIFY APPROVED MEMBER
    // =================================================

    const memberQuery = `
      SELECT
        id
      FROM organization_members
      WHERE user_id = ?
      AND organization_id = ?
      AND approval_status = 'approved'
      LIMIT 1
    `;

    db.query(
      memberQuery,
      [
        cleanUserId,
        organizationId,
      ],
      (
        memberErr,
        members
      ) => {
        if (memberErr) {
          console.error(
            "Authority member verification failed."
          );

          return res.status(500).json({
            message:
              "Database error",
          });
        }

        if (members.length === 0) {
          return res.status(400).json({
            message:
              "User is not an approved member of this organization",
          });
        }

        // =================================================
        // CHECK EXISTING AUTHORITY
        // =================================================

        const existingQuery = `
          SELECT
            id
          FROM verified_authorities
          WHERE organization_id = ?
          AND user_id = ?
          LIMIT 1
        `;

        db.query(
          existingQuery,
          [
            organizationId,
            cleanUserId,
          ],
          (
            existingErr,
            existingAuthorities
          ) => {
            if (existingErr) {
              console.error(
                "Authority lookup failed."
              );

              return res.status(500).json({
                message:
                  "Database error",
              });
            }

            // =============================================
            // UPDATE EXISTING
            // =============================================

            if (
              existingAuthorities.length >
              0
            ) {
              const authorityId =
                existingAuthorities[0]
                  .id;

              const updateQuery = `
                UPDATE verified_authorities

                SET
                  authority_type = ?,
                  display_name = ?,
                  is_active = TRUE,
                  verified_at = CURRENT_TIMESTAMP

                WHERE id = ?
                AND organization_id = ?
              `;

              db.query(
                updateQuery,
                [
                  cleanAuthorityType,
                  cleanDisplayName,
                  authorityId,
                  organizationId,
                ],
                (
                  updateErr
                ) => {
                  if (updateErr) {
                    console.error(
                      "Authority update failed."
                    );

                    return res
                      .status(
                        500
                      )
                      .json({
                        message:
                          "Database error",
                      });
                  }

                  createNotification(
                    organizationId,
                    cleanUserId,
                    "authority_verified",
                    authorityId,
                    "You are now a Verified Authority",
                    `You have been granted authority status as ${cleanDisplayName}.`
                  );

                  return res
                    .status(
                      200
                    )
                    .json({
                      message:
                        "Authority verified successfully",
                      authorityId,
                    });
                }
              );

              return;
            }

            // =============================================
            // CREATE NEW
            // =============================================

            const insertQuery = `
              INSERT INTO verified_authorities
              (
                organization_id,
                user_id,
                authority_type,
                display_name,
                is_active
              )
              VALUES (?, ?, ?, ?, TRUE)
            `;

            db.query(
              insertQuery,
              [
                organizationId,
                cleanUserId,
                cleanAuthorityType,
                cleanDisplayName,
              ],
              (
                insertErr,
                result
              ) => {
                if (insertErr) {
                  console.error(
                    "Authority creation failed."
                  );

                  return res
                    .status(
                      500
                    )
                    .json({
                      message:
                        "Database error",
                    });
                }

                createNotification(
                  organizationId,
                  cleanUserId,
                  "authority_verified",
                  result.insertId,
                  "You are now a Verified Authority",
                  `You have been granted authority status as ${cleanDisplayName}.`
                );

                return res
                  .status(201)
                  .json({
                    message:
                      "Authority verified successfully",
                    authorityId:
                      result.insertId,
                  });
              }
            );
          }
        );
      }
    );
  }
);

// =====================================================
// ADMIN - DEACTIVATE AUTHORITY
// =====================================================
//
// PATCH /api/authorities/:id/deactivate
//

router.patch(
  "/:id/deactivate",
  verifyAdmin,
  (req, res) => {
    const authorityId =
      Number(req.params.id);

    const organizationId =
      req.user.organizationId;

    if (
      !Number.isInteger(
        authorityId
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid authority ID",
      });
    }

    const updateQuery = `
      UPDATE verified_authorities

      SET
        is_active = FALSE

      WHERE id = ?
      AND organization_id = ?
    `;

    db.query(
      updateQuery,
      [
        authorityId,
        organizationId,
      ],
      (
        err,
        result
      ) => {
        if (err) {
          console.error(
            "Authority deactivation failed."
          );

          return res.status(500).json({
            message:
              "Database error",
          });
        }

        if (
          result.affectedRows ===
          0
        ) {
          return res.status(404).json({
            message:
              "Authority not found",
          });
        }

        return res.status(200).json({
          message:
            "Authority deactivated successfully",
        });
      }
    );
  }
);

module.exports = router;