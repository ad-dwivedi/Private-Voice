require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

const db = require("./db");

const {
  JWT_SECRET,
  verifyAuth,
} = require("./middleware/authMiddleware");

const initializeSocket = require("./socket/socket");
const { startCleanupSchedule } = require("./utils/cleanup");

// =====================================================
// APP
// =====================================================

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

initializeSocket(io);

const PORT =
  process.env.PORT || 5000;

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());

// =====================================================
// ROUTES
// =====================================================

const communityRoutes = require("./routes/community");
const complaintsRoutes = require("./routes/complaints");
const suggestionsRoutes = require("./routes/suggestions");
const pollsRoutes = require("./routes/polls");
const announcementsRoutes = require("./routes/announcements");
const authoritiesRoutes = require("./routes/authorities");
const notificationsRoutes = require("./routes/notifications");
const chatRoutes = require("./routes/chat");

app.use("/api/community", communityRoutes);
app.use("/api/complaints", complaintsRoutes);
app.use("/api/suggestions", suggestionsRoutes);
app.use("/api/polls", pollsRoutes);
app.use("/api/announcements", announcementsRoutes);
app.use("/api/authorities", authoritiesRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/chat", chatRoutes);

// =====================================================
// HOME
// =====================================================

app.get("/", (req, res) => {
  res.status(200).send("PrivateVoice Backend is running...");
});

app.get("/api/test", (req, res) => {
  res.status(200).json({ message: "API route is working" });
});

// =====================================================
// REGISTER
// =====================================================

app.post("/api/auth/register", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const cleanName = String(fullName).trim();
    const cleanEmail = String(email).trim().toLowerCase();

    if (cleanName.length < 2) {
      return res.status(400).json({ message: "Please enter a valid full name" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const checkQuery = `SELECT id FROM users WHERE email = ? LIMIT 1`;

    db.query(checkQuery, [cleanEmail], async (err, results) => {
      if (err) {
        console.error("Registration check failed.");
        return res.status(500).json({ message: "Database error" });
      }

      if (results.length > 0) {
        return res.status(409).json({ message: "Email already registered" });
      }

      try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const insertQuery = `INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)`;

        db.query(insertQuery, [cleanName, cleanEmail, hashedPassword], (insertErr, result) => {
          if (insertErr) {
            console.error("Registration failed.");
            return res.status(500).json({ message: "Failed to create account" });
          }

          const token = jwt.sign(
            { id: result.insertId, email: cleanEmail },
            JWT_SECRET,
            { expiresIn: "7d" }
          );

          return res.status(201).json({
            message: "Account created successfully",
            token,
            userId: result.insertId,
          });
        });
      } catch (error) {
        return res.status(500).json({ message: "Server error" });
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

// =====================================================
// LOGIN
// =====================================================

app.post("/api/auth/login", (req, res) => {
  const { email, password, organizationCode } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const cleanEmail = String(email).trim().toLowerCase();

  const userQuery = `SELECT * FROM users WHERE email = ? LIMIT 1`;

  db.query(userQuery, [cleanEmail], async (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = results[0];

    try {
      const isPasswordCorrect = await bcrypt.compare(password, user.password);

      if (!isPasswordCorrect) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (!organizationCode) {
        const token = jwt.sign(
          { id: user.id, email: user.email },
          JWT_SECRET,
          { expiresIn: "7d" }
        );

        return res.status(200).json({
          message: "Login successful",
          token,
          user: { id: user.id },
        });
      }

      const cleanCode = String(organizationCode).trim().toUpperCase();

      const organizationQuery = `SELECT * FROM organizations WHERE code = ? LIMIT 1`;

      db.query(organizationQuery, [cleanCode], (orgErr, organizations) => {
        if (orgErr) {
          return res.status(500).json({ message: "Database error" });
        }

        if (organizations.length === 0) {
          return res.status(404).json({ message: "Invalid organization code" });
        }

        const organization = organizations[0];

        const memberQuery = `
          SELECT * FROM organization_members
          WHERE organization_id = ? AND user_id = ?
          LIMIT 1
        `;

        db.query(memberQuery, [organization.id, user.id], (memberErr, members) => {
          if (memberErr) {
            return res.status(500).json({ message: "Database error" });
          }

          if (members.length === 0) {
            return res.status(403).json({
              message: "You have not requested to join this organization yet.",
              status: "not_member",
            });
          }

          const membership = members[0];

          if (membership.approval_status === "pending") {
            return res.status(403).json({
              message: "Your join request is pending admin approval.",
              status: "pending",
              organization: {
                id: organization.id,
                name: organization.name,
                description: organization.description,
                code: organization.code,
                role: membership.role,
                approvalStatus: membership.approval_status,
              },
            });
          }

          if (membership.approval_status === "rejected") {
            return res.status(403).json({
              message: "Your request to join this organization was rejected.",
              status: "rejected",
              organization: {
                id: organization.id,
                name: organization.name,
                description: organization.description,
                code: organization.code,
                role: membership.role,
                approvalStatus: membership.approval_status,
              },
            });
          }

          const responseUser = { id: user.id };

          if (membership.role === "admin") {
            responseUser.fullName = user.full_name;
          }

          const sessionAnonymousId =
            "Anonymous #" + Math.floor(100000 + Math.random() * 900000);

          const token = jwt.sign(
            {
              id: user.id,
              email: user.email,
              organizationId: organization.id,
              role: membership.role,
              sessionAnonymousId,
            },
            JWT_SECRET,
            { expiresIn: "7d" }
          );

          return res.status(200).json({
            message: "Login successful",
            token,
            sessionAnonymousId,
            user: responseUser,
            organization: {
              id: organization.id,
              name: organization.name,
              description: organization.description,
              code: organization.code,
              role: membership.role,
              approvalStatus: membership.approval_status,
            },
          });
        });
      });
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });
});

// =====================================================
// CHECK ORGANIZATION
// =====================================================

app.get("/api/organizations/check", (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ message: "Organization code is required" });
  }

  const cleanCode = String(code).trim().toUpperCase();

  const query = `SELECT id, name, description, code FROM organizations WHERE code = ? LIMIT 1`;

  db.query(query, [cleanCode], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Invalid organization code" });
    }

    return res.status(200).json({
      message: "Organization found",
      organization: results[0],
    });
  });
});

// =====================================================
// CREATE ORGANIZATION
// =====================================================

app.post("/api/organizations/create", verifyAuth, (req, res) => {
  const { name, description } = req.body;
  const userId = req.user.id;

  if (!name) {
    return res.status(400).json({ message: "Organization name is required" });
  }

  const cleanName = String(name).trim();
  const cleanDescription = description ? String(description).trim() : null;

  if (!cleanName) {
    return res.status(400).json({ message: "Organization name is required" });
  }

  const userCheckQuery = `SELECT id FROM users WHERE id = ? LIMIT 1`;

  db.query(userCheckQuery, [userId], (userErr, users) => {
    if (userErr) {
      return res.status(500).json({ message: "Database error while verifying user" });
    }

    if (users.length === 0) {
      return res.status(404).json({ message: "User does not exist" });
    }

    const createOrganization = () => {
      const organizationCode =
        "PV-" + Math.random().toString(36).substring(2, 7).toUpperCase();

      const codeCheckQuery = `SELECT id FROM organizations WHERE code = ? LIMIT 1`;

      db.query(codeCheckQuery, [organizationCode], (codeErr, existing) => {
        if (codeErr) {
          return res.status(500).json({ message: "Database error" });
        }

        if (existing.length > 0) {
          return createOrganization();
        }

        const organizationQuery = `
          INSERT INTO organizations (name, description, code, created_by)
          VALUES (?, ?, ?, ?)
        `;

        db.query(
          organizationQuery,
          [cleanName, cleanDescription, organizationCode, userId],
          (orgErr, result) => {
            if (orgErr) {
              return res.status(500).json({ message: "Failed to create organization" });
            }

            const organizationId = result.insertId;

            const memberQuery = `
              INSERT INTO organization_members
              (organization_id, user_id, role, approval_status)
              VALUES (?, ?, 'admin', 'approved')
            `;

            db.query(memberQuery, [organizationId, userId], (memberErr) => {
              if (memberErr) {
                db.query(`DELETE FROM organizations WHERE id = ?`, [organizationId], () => {});
                return res.status(500).json({ message: "Organization created but admin setup failed" });
              }

              return res.status(201).json({
                message: "Organization created successfully",
                organization: {
                  id: organizationId,
                  name: cleanName,
                  description: cleanDescription,
                  code: organizationCode,
                  createdBy: userId,
                  role: "admin",
                  approvalStatus: "approved",
                },
              });
            });
          }
        );
      });
    };

    createOrganization();
  });
});

// =====================================================
// JOIN ORGANIZATION
// =====================================================

app.post("/api/organizations/join", verifyAuth, (req, res) => {
  const { organizationCode } = req.body;
  const userId = req.user.id;

  if (!organizationCode) {
    return res.status(400).json({ message: "Organization code is required" });
  }

  const cleanCode = String(organizationCode).trim().toUpperCase();

  const organizationQuery = `SELECT * FROM organizations WHERE code = ? LIMIT 1`;

  db.query(organizationQuery, [cleanCode], (orgErr, organizations) => {
    if (orgErr) {
      return res.status(500).json({ message: "Database error" });
    }

    if (organizations.length === 0) {
      return res.status(404).json({ message: "Invalid organization code" });
    }

    const organization = organizations[0];

    const existingQuery = `
      SELECT * FROM organization_members
      WHERE organization_id = ? AND user_id = ?
      LIMIT 1
    `;

    db.query(existingQuery, [organization.id, userId], (existingErr, existingMembers) => {
      if (existingErr) {
        return res.status(500).json({ message: "Database error" });
      }

      if (existingMembers.length > 0) {
        const membership = existingMembers[0];

        if (membership.approval_status === "approved") {
          return res.status(409).json({
            message: "You are already an approved member of this organization.",
            status: "approved",
          });
        }

        if (membership.approval_status === "pending") {
          return res.status(409).json({
            message: "Your join request is already pending.",
            status: "pending",
          });
        }

        if (membership.approval_status === "rejected") {
          return res.status(409).json({
            message: "Your previous join request was rejected.",
            status: "rejected",
          });
        }
      }

      const joinQuery = `
        INSERT INTO organization_members
        (organization_id, user_id, role, approval_status)
        VALUES (?, ?, 'member', 'pending')
      `;

      db.query(joinQuery, [organization.id, userId], (joinErr, result) => {
        if (joinErr) {
          return res.status(500).json({ message: "Failed to send join request" });
        }

        return res.status(201).json({
          message: "Join request sent successfully. Waiting for admin approval.",
          request: {
            id: result.insertId,
            organizationId: organization.id,
            organizationName: organization.name,
            organizationCode: organization.code,
            userId,
            role: "member",
            approvalStatus: "pending",
          },
        });
      });
    });
  });
});

// =====================================================
// GET MY MEMBERSHIP
// =====================================================

app.get("/api/organizations/membership", verifyAuth, (req, res) => {
  const { code } = req.query;
  const userId = req.user.id;

  if (!code) {
    return res.status(400).json({ message: "Organization code is required" });
  }

  const cleanCode = String(code).trim().toUpperCase();

  const query = `
    SELECT
      om.id, om.organization_id, om.user_id, om.role, om.approval_status, om.joined_at,
      o.name AS organization_name, o.description AS organization_description, o.code AS organization_code
    FROM organization_members om
    INNER JOIN organizations o ON om.organization_id = o.id
    WHERE om.user_id = ? AND o.code = ?
    LIMIT 1
  `;

  db.query(query, [userId, cleanCode], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "No membership request found", status: "not_member" });
    }

    const membership = results[0];

    return res.status(200).json({
      message: "Membership found",
      membership: {
        id: membership.id,
        organizationId: membership.organization_id,
        organizationName: membership.organization_name,
        organizationDescription: membership.organization_description,
        organizationCode: membership.organization_code,
        userId: membership.user_id,
        role: membership.role,
        approvalStatus: membership.approval_status,
        joinedAt: membership.joined_at,
      },
    });
  });
});

// =====================================================
// ADMIN - PENDING REQUESTS
// =====================================================

app.get("/api/admin/organizations/:organizationId/requests", verifyAuth, (req, res) => {
  const organizationId = Number(req.params.organizationId);
  const adminId = req.user.id;

  if (!Number.isInteger(organizationId)) {
    return res.status(400).json({ message: "Invalid organization ID" });
  }

  const adminCheckQuery = `
    SELECT id FROM organization_members
    WHERE organization_id = ? AND user_id = ? AND role = 'admin' AND approval_status = 'approved'
    LIMIT 1
  `;

  db.query(adminCheckQuery, [organizationId, adminId], (adminErr, admins) => {
    if (adminErr) {
      return res.status(500).json({ message: "Database error" });
    }

    if (admins.length === 0) {
      return res.status(403).json({ message: "Only organization admin can view requests" });
    }

    const requestQuery = `
      SELECT om.id AS request_id, om.user_id, om.role, om.approval_status, om.joined_at,
      u.full_name, u.email
      FROM organization_members om
      INNER JOIN users u ON om.user_id = u.id
      WHERE om.organization_id = ? AND om.approval_status = 'pending'
      ORDER BY om.joined_at ASC
    `;

    db.query(requestQuery, [organizationId], (requestErr, requests) => {
      if (requestErr) {
        return res.status(500).json({ message: "Database error" });
      }

      return res.status(200).json({
        message: "Pending requests fetched successfully",
        requests,
      });
    });
  });
});

// =====================================================
// ADMIN - APPROVE
// =====================================================

app.patch("/api/admin/requests/:requestId/approve", verifyAuth, (req, res) => {
  const requestId = Number(req.params.requestId);
  const adminId = req.user.id;

  if (!Number.isInteger(requestId)) {
    return res.status(400).json({ message: "Invalid request ID" });
  }

  const requestQuery = `
    SELECT id, organization_id, user_id, approval_status
    FROM organization_members WHERE id = ? LIMIT 1
  `;

  db.query(requestQuery, [requestId], (requestErr, requests) => {
    if (requestErr) {
      return res.status(500).json({ message: "Database error" });
    }

    if (requests.length === 0) {
      return res.status(404).json({ message: "Join request not found" });
    }

    const request = requests[0];

    const adminCheckQuery = `
      SELECT id FROM organization_members
      WHERE organization_id = ? AND user_id = ? AND role = 'admin' AND approval_status = 'approved'
      LIMIT 1
    `;

    db.query(adminCheckQuery, [request.organization_id, adminId], (adminErr, admins) => {
      if (adminErr) {
        return res.status(500).json({ message: "Database error" });
      }

      if (admins.length === 0) {
        return res.status(403).json({ message: "Only organization admin can approve requests" });
      }

      if (request.approval_status !== "pending") {
        return res.status(409).json({ message: `Request is already ${request.approval_status}` });
      }

      const updateQuery = `UPDATE organization_members SET approval_status = 'approved' WHERE id = ?`;

      db.query(updateQuery, [requestId], (updateErr) => {
        if (updateErr) {
          return res.status(500).json({ message: "Failed to approve request" });
        }

        return res.status(200).json({
          message: "Join request approved successfully",
          requestId,
          userId: request.user_id,
          organizationId: request.organization_id,
          approvalStatus: "approved",
        });
      });
    });
  });
});

// =====================================================
// ADMIN - REJECT
// =====================================================

app.patch("/api/admin/requests/:requestId/reject", verifyAuth, (req, res) => {
  const requestId = Number(req.params.requestId);
  const adminId = req.user.id;

  if (!Number.isInteger(requestId)) {
    return res.status(400).json({ message: "Invalid request ID" });
  }

  const requestQuery = `
    SELECT id, organization_id, user_id, approval_status
    FROM organization_members WHERE id = ? LIMIT 1
  `;

  db.query(requestQuery, [requestId], (requestErr, requests) => {
    if (requestErr) {
      return res.status(500).json({ message: "Database error" });
    }

    if (requests.length === 0) {
      return res.status(404).json({ message: "Join request not found" });
    }

    const request = requests[0];

    const adminCheckQuery = `
      SELECT id FROM organization_members
      WHERE organization_id = ? AND user_id = ? AND role = 'admin' AND approval_status = 'approved'
      LIMIT 1
    `;

    db.query(adminCheckQuery, [request.organization_id, adminId], (adminErr, admins) => {
      if (adminErr) {
        return res.status(500).json({ message: "Database error" });
      }

      if (admins.length === 0) {
        return res.status(403).json({ message: "Only organization admin can reject requests" });
      }

      if (request.approval_status !== "pending") {
        return res.status(409).json({ message: `Request is already ${request.approval_status}` });
      }

      const updateQuery = `UPDATE organization_members SET approval_status = 'rejected' WHERE id = ?`;

      db.query(updateQuery, [requestId], (updateErr) => {
        if (updateErr) {
          return res.status(500).json({ message: "Failed to reject request" });
        }

        return res.status(200).json({
          message: "Join request rejected successfully",
          requestId,
          userId: request.user_id,
          organizationId: request.organization_id,
          approvalStatus: "rejected",
        });
      });
    });
  });
});

// =====================================================
// ADMIN - MEMBERS
// =====================================================

app.get("/api/admin/organizations/:organizationId/members", verifyAuth, (req, res) => {
  const organizationId = Number(req.params.organizationId);
  const adminId = req.user.id;

  if (!Number.isInteger(organizationId)) {
    return res.status(400).json({ message: "Invalid organization ID" });
  }

  const adminCheckQuery = `
    SELECT id FROM organization_members
    WHERE organization_id = ? AND user_id = ? AND role = 'admin' AND approval_status = 'approved'
    LIMIT 1
  `;

  db.query(adminCheckQuery, [organizationId, adminId], (adminErr, admins) => {
    if (adminErr) {
      return res.status(500).json({ message: "Database error" });
    }

    if (admins.length === 0) {
      return res.status(403).json({ message: "Only organization admin can view members" });
    }

    const membersQuery = `
      SELECT om.id AS membership_id, om.user_id, om.role, om.approval_status, om.joined_at,
      u.full_name, u.email
      FROM organization_members om
      INNER JOIN users u ON om.user_id = u.id
      WHERE om.organization_id = ? AND om.approval_status = 'approved'
      ORDER BY om.joined_at ASC
    `;

    db.query(membersQuery, [organizationId], (membersErr, members) => {
      if (membersErr) {
        return res.status(500).json({ message: "Database error" });
      }

      return res.status(200).json({
        message: "Organization members fetched successfully",
        members,
      });
    });
  });
});

// =====================================================
// 404
// =====================================================

app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);

  res.status(404).json({
    message: "API route not found",
    method: req.method,
    path: req.originalUrl,
  });
});

// =====================================================
// GLOBAL ERROR
// =====================================================

app.use((err, req, res, next) => {
  console.error("Unhandled server error.");
  res.status(500).json({ message: "Internal server error" });
});

// =====================================================
// START
// =====================================================

server.listen(PORT, () => {
  console.log("");
  console.log("==========================================");
  console.log("PrivateVoice Backend Started");
  console.log("==========================================");
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Socket.IO running on http://localhost:${PORT}`);
  console.log(`API test: http://localhost:${PORT}/api/test`);
  console.log("==========================================");
  console.log("");

  // Start the 48-hour retention cleanup job.
  startCleanupSchedule();
});