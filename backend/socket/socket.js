const jwt = require("jsonwebtoken");
const db = require("../db");
const { JWT_SECRET } = require("../middleware/authMiddleware");

// =====================================================
// MODULE-LEVEL STATE
// =====================================================

let ioInstance = null;

// userId -> Set(socket.id)
// Multiple tabs/devices supported safely.
const onlineUsers = new Map();

const getIO = () => ioInstance;

// =====================================================
// INITIALIZE SOCKET.IO
// =====================================================

const initializeSocket = (io) => {
  ioInstance = io;

  // ===================================================
  // SOCKET AUTHENTICATION
  // ===================================================

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(token, JWT_SECRET);

      socket.user = decoded;

      next();
    } catch (error) {
      console.error("Socket authentication failed:", error.message);

      return next(new Error("Invalid authentication token"));
    }
  });

  // ===================================================
  // CONNECTION
  // ===================================================

  io.on("connection", (socket) => {
    const userId = Number(socket.user.id);
    const organizationId = socket.user.organizationId;

    const anonymousId =
      socket.user.sessionAnonymousId || "Anonymous";

    console.log(`Socket connected: user ${userId}`);

    // =================================================
    // PERSONAL ROOM
    // =================================================

    socket.join(`user:${userId}`);

    // =================================================
    // ORGANIZATION ROOM
    // =================================================

    if (organizationId) {
      socket.join(`organization:${organizationId}`);
    }

    // =================================================
    // ADMINS / AUTHORITIES ROOM
    // =================================================

    if (organizationId) {
      const privilegeQuery = `
        SELECT
          (
            SELECT role
            FROM organization_members
            WHERE user_id = ?
              AND organization_id = ?
            LIMIT 1
          ) AS role,

          (
            SELECT id
            FROM verified_authorities
            WHERE user_id = ?
              AND organization_id = ?
              AND is_active = TRUE
            LIMIT 1
          ) AS authorityId
      `;

      db.query(
        privilegeQuery,
        [
          userId,
          organizationId,
          userId,
          organizationId,
        ],
        (err, rows) => {
          if (err) {
            console.error(
              "Privilege check for admins room failed:",
              err
            );

            return;
          }

          if (rows.length > 0) {
            const row = rows[0];

            if (row.role === "admin" || row.authorityId) {
              socket.join(`admins:${organizationId}`);
            }
          }
        }
      );
    }

    // =================================================
    // ONLINE STATUS
    // =================================================

    if (organizationId) {
      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
      }

      const userSockets = onlineUsers.get(userId);

      const wasOffline = userSockets.size === 0;

      userSockets.add(socket.id);

      // Only notify organization when the FIRST socket connects.
      if (wasOffline) {
        socket
          .to(`organization:${organizationId}`)
          .emit("user:online", {
            userId,
            anonymousId,
          });
      }
    }

    // =================================================
    // SEND PRIVATE MESSAGE
    // =================================================

    socket.on("chat:send", (data, callback) => {
      const receiverId = Number(data?.receiverId);
      const message = String(data?.message || "").trim();

      // -----------------------------------------------
      // BASIC VALIDATION
      // -----------------------------------------------

      if (!Number.isInteger(receiverId) || receiverId <= 0) {
        return callback?.({
          success: false,
          message: "Valid receiver is required",
        });
      }

      if (!message) {
        return callback?.({
          success: false,
          message: "Message cannot be empty",
        });
      }

      if (message.length > 500) {
        return callback?.({
          success: false,
          message: "Message cannot exceed 500 characters",
        });
      }

      if (!organizationId) {
        return callback?.({
          success: false,
          message: "Organization session required",
        });
      }

      if (receiverId === userId) {
        return callback?.({
          success: false,
          message: "You cannot send a message to yourself",
        });
      }

      // =================================================
      // VERIFY SENDER MEMBERSHIP
      // =================================================

      const membershipQuery = `
        SELECT role, approval_status
        FROM organization_members
        WHERE user_id = ?
          AND organization_id = ?
        LIMIT 1
      `;

      db.query(
        membershipQuery,
        [userId, organizationId],
        (membershipErr, membershipRows) => {
          if (membershipErr) {
            console.error(
              "Chat membership verification failed:",
              membershipErr
            );

            return callback?.({
              success: false,
              message: "Database error",
            });
          }

          if (membershipRows.length === 0) {
            return callback?.({
              success: false,
              message:
                "You are not a member of this organization",
            });
          }

          const membership = membershipRows[0];

          if (
            membership.approval_status !== "approved"
          ) {
            return callback?.({
              success: false,
              message: "Membership is not approved",
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
                  "Chat suspension check failed:",
                  suspensionErr
                );

                return callback?.({
                  success: false,
                  message: "Database error",
                });
              }

              if (suspensions.length > 0) {
                const suspension = suspensions[0];

                // FIXED:
                // Check whether current time is BEFORE suspension expiry.
                if (
                  suspension.suspension_until &&
                  new Date() <
                    new Date(suspension.suspension_until)
                ) {
                  return callback?.({
                    success: false,
                    message:
                      "You are currently suspended and cannot send messages",
                  });
                }
              }

              // =================================================
              // SAVE MESSAGE
              // =================================================

              const saveMessage = (
                senderAnonymousIdForRow
              ) => {
                const insertQuery = `
                  INSERT INTO private_messages
                  (
                    organization_id,
                    sender_id,
                    receiver_id,
                    sender_anonymous_id,
                    message
                  )
                  VALUES (?, ?, ?, ?, ?)
                `;

                db.query(
                  insertQuery,
                  [
                    organizationId,
                    userId,
                    receiverId,
                    senderAnonymousIdForRow,
                    message,
                  ],
                  (insertErr, result) => {
                    if (insertErr) {
                      console.error(
                        "Message save failed:",
                        insertErr
                      );

                      return callback?.({
                        success: false,
                        message: "Failed to save message",
                      });
                    }

                    const chatMessage = {
                      id: result.insertId,

                      senderId: userId,
                      receiverId,

                      organizationId,

                      senderAnonymousId:
                        senderAnonymousIdForRow,

                      message,

                      createdAt: new Date(),
                    };

                    // -----------------------------------------
                    // SEND TO RECEIVER
                    // -----------------------------------------

                    io.to(`user:${receiverId}`).emit(
                      "chat:message",
                      chatMessage
                    );

                    // -----------------------------------------
                    // SEND BACK TO SENDER
                    // -----------------------------------------

                    socket.emit(
                      "chat:message",
                      chatMessage
                    );

                    // -----------------------------------------
                    // CALLBACK
                    // -----------------------------------------

                    callback?.({
                      success: true,
                      message: chatMessage,
                    });
                  }
                );
              };

              // =================================================
              // DETERMINE SENDER PRIVILEGE
              // =================================================

              if (membership.role === "admin") {
                return proceedWithPrivilege(true);
              }

              const authorityCheckQuery = `
                SELECT id
                FROM verified_authorities
                WHERE user_id = ?
                  AND organization_id = ?
                  AND is_active = TRUE
                LIMIT 1
              `;

              db.query(
                authorityCheckQuery,
                [userId, organizationId],
                (authErr, authRows) => {
                  if (authErr) {
                    console.error(
                      "Sender authority check failed:",
                      authErr
                    );

                    return callback?.({
                      success: false,
                      message: "Database error",
                    });
                  }

                  proceedWithPrivilege(
                    authRows.length > 0
                  );
                }
              );

              // =================================================
              // PRIVILEGE HANDLER
              // =================================================

              function proceedWithPrivilege(
                senderIsPrivileged
              ) {
                // =================================================
                // ADMIN / AUTHORITY -> MEMBER
                // =================================================

                if (senderIsPrivileged) {
                  const memberCheckQuery = `
                    SELECT id
                    FROM organization_members
                    WHERE user_id = ?
                      AND organization_id = ?
                      AND approval_status = 'approved'
                    LIMIT 1
                  `;

                  db.query(
                    memberCheckQuery,
                    [receiverId, organizationId],
                    (checkErr, rows) => {
                      if (checkErr) {
                        console.error(
                          "Receiver membership check failed:",
                          checkErr
                        );

                        return callback?.({
                          success: false,
                          message: "Database error",
                        });
                      }

                      if (rows.length === 0) {
                        return callback?.({
                          success: false,
                          message:
                            "This member is not part of your organization",
                        });
                      }

                      // -----------------------------------------
                      // FIND MEMBER'S EXISTING ANONYMOUS ID
                      // -----------------------------------------

                      const lastAnonymousQuery = `
                        SELECT sender_anonymous_id
                        FROM private_messages
                        WHERE organization_id = ?
                          AND (
                            sender_id = ?
                            OR receiver_id = ?
                          )
                          AND sender_anonymous_id IS NOT NULL
                          AND sender_anonymous_id != ''
                        ORDER BY created_at DESC
                        LIMIT 1
                      `;

                      db.query(
                        lastAnonymousQuery,
                        [
                          organizationId,
                          receiverId,
                          receiverId,
                        ],
                        (anonErr, anonRows) => {
                          if (anonErr) {
                            console.error(
                              "Anonymous ID lookup failed:",
                              anonErr
                            );

                            return callback?.({
                              success: false,
                              message: "Database error",
                            });
                          }

                          if (anonRows.length === 0) {
                            return callback?.({
                              success: false,
                              message:
                                "This member has not started a conversation with you yet",
                            });
                          }

                          const memberAnonymousId =
                            anonRows[0]
                              .sender_anonymous_id;

                          saveMessage(
                            memberAnonymousId
                          );
                        }
                      );
                    }
                  );

                  return;
                }

                // =================================================
                // NORMAL MEMBER -> AUTHORITY / ADMIN
                // =================================================

                const authorityQuery = `
                  SELECT id
                  FROM verified_authorities
                  WHERE user_id = ?
                    AND organization_id = ?
                    AND is_active = TRUE

                  UNION

                  SELECT id
                  FROM organization_members
                  WHERE user_id = ?
                    AND organization_id = ?
                    AND role = 'admin'
                    AND approval_status = 'approved'

                  LIMIT 1
                `;

                db.query(
                  authorityQuery,
                  [
                    receiverId,
                    organizationId,
                    receiverId,
                    organizationId,
                  ],
                  (authorityErr, authorityRows) => {
                    if (authorityErr) {
                      console.error(
                        "Authority verification failed:",
                        authorityErr
                      );

                      return callback?.({
                        success: false,
                        message: "Database error",
                      });
                    }

                    if (authorityRows.length === 0) {
                      return callback?.({
                        success: false,
                        message:
                          "Private chat is only available with verified authorities",
                      });
                    }

                    // Normal member uses their own
                    // session anonymous identity.
                    saveMessage(anonymousId);
                  }
                );
              }
            }
          );
        }
      );
    });

    // =====================================================
    // DELETE PRIVATE MESSAGE
    // =====================================================

    socket.on("chat:delete", (data, callback) => {
      const messageId = Number(data?.messageId);

      if (
        !Number.isInteger(messageId) ||
        messageId <= 0
      ) {
        return callback?.({
          success: false,
          message: "Valid message ID is required",
        });
      }

      if (!organizationId) {
        return callback?.({
          success: false,
          message: "Organization session required",
        });
      }

      // =================================================
      // FIND MESSAGE
      // Only sender can delete.
      // =================================================

      const selectQuery = `
        SELECT
          id,
          sender_id,
          receiver_id
        FROM private_messages
        WHERE id = ?
          AND sender_id = ?
          AND organization_id = ?
        LIMIT 1
      `;

      db.query(
        selectQuery,
        [
          messageId,
          userId,
          organizationId,
        ],
        (selectErr, rows) => {
          if (selectErr) {
            console.error(
              "Message delete lookup failed:",
              selectErr
            );

            return callback?.({
              success: false,
              message: "Database error",
            });
          }

          if (rows.length === 0) {
            return callback?.({
              success: false,
              message:
                "Message not found or you do not have permission to delete it",
            });
          }

          const receiverId = rows[0].receiver_id;

          // =================================================
          // DELETE MESSAGE
          // =================================================

          const deleteQuery = `
            DELETE FROM private_messages
            WHERE id = ?
              AND sender_id = ?
              AND organization_id = ?
          `;

          db.query(
            deleteQuery,
            [
              messageId,
              userId,
              organizationId,
            ],
            (deleteErr, result) => {
              if (deleteErr) {
                console.error(
                  "Message delete failed:",
                  deleteErr
                );

                return callback?.({
                  success: false,
                  message: "Failed to delete message",
                });
              }

              if (result.affectedRows === 0) {
                return callback?.({
                  success: false,
                  message:
                    "Message not found or you do not have permission to delete it",
                });
              }

              const payload = {
                id: messageId,
                senderId: userId,
                receiverId,
              };

              // ---------------------------------------------
              // NOTIFY RECEIVER
              // ---------------------------------------------

              io.to(`user:${receiverId}`).emit(
                "chat:message_deleted",
                payload
              );

              // ---------------------------------------------
              // NOTIFY SENDER
              // ---------------------------------------------

              socket.emit(
                "chat:message_deleted",
                payload
              );

              callback?.({
                success: true,
              });
            }
          );
        }
      );
    });

    // =====================================================
    // DISCONNECT
    // =====================================================

    socket.on("disconnect", () => {
      console.log(
        `Socket disconnected: user ${userId}`
      );

      if (!organizationId) {
        return;
      }

      const userSockets = onlineUsers.get(userId);

      if (!userSockets) {
        return;
      }

      userSockets.delete(socket.id);

      // User is offline ONLY when last socket disconnects.
      if (userSockets.size === 0) {
        onlineUsers.delete(userId);

        socket
          .to(`organization:${organizationId}`)
          .emit("user:offline", {
            userId,
            anonymousId,
          });
      }
    });
  });
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = initializeSocket;
module.exports.getIO = getIO;