require("dotenv").config();

const mysql = require("mysql2");

// =====================================================
// DATABASE CONNECTION
// =====================================================
//
// Credentials are read from environment variables (.env).
// Never hardcode credentials in source code.
//
// Create a .env file in the project root (and add it to
// .gitignore) based on .env.example, for example:
//
// DB_HOST=localhost
// DB_USER=root
// DB_PASSWORD=your_real_password_here
// DB_NAME=privatevoice_db
//
// =====================================================

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "privatevoice_db",
});

db.connect((err) => {
  if (err) {
    // Do not print connection details / credentials / raw error object.
    console.log("MySQL connection failed. Please check your database configuration.");
    return;
  }

  console.log("MySQL connected successfully!");
});

module.exports = db;