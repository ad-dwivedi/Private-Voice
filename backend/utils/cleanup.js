const db = require("../db");

// =====================================================
// AUTO-CLEANUP JOB
// =====================================================
//
// Permanently deletes records older than RETENTION_HOURS from
// the database. This runs on a timer inside the running Node
// process (no external cron/OS scheduler needed).
//
// Cascade behavior (already defined in the schema, verified
// against setup_db.js / setup_phase2_db.js):
// - community_posts -> comments, post_upvotes (ON DELETE CASCADE)
// - polls -> poll_options -> poll_votes (ON DELETE CASCADE)
// So deleting the parent row here is sufficient; children are
// removed automatically by MySQL.
// =====================================================

const RETENTION_HOURS = 48;

const TABLES = [
  { name: "complaints", column: "created_at" },
  { name: "suggestions", column: "created_at" },
  { name: "polls", column: "created_at" },
  { name: "community_posts", column: "created_at" },
  { name: "announcements", column: "created_at" },
  { name: "private_messages", column: "created_at" },
];

function purgeOldRecords() {
  TABLES.forEach(({ name, column }) => {
    const query = `DELETE FROM ?? WHERE ?? < (NOW() - INTERVAL ? HOUR)`;

    db.query(query, [name, column, RETENTION_HOURS], (err, result) => {
      if (err) {
        console.error(`Cleanup failed for table "${name}":`, err.message);
        return;
      }

      if (result.affectedRows > 0) {
        console.log(
          `Cleanup: removed ${result.affectedRows} row(s) older than ${RETENTION_HOURS}h from "${name}"`
        );
      }
    });
  });
}

function startCleanupSchedule() {
  // Run once immediately on startup, then every hour.
  purgeOldRecords();
  setInterval(purgeOldRecords, 60 * 60 * 1000);
}

module.exports = { startCleanupSchedule, purgeOldRecords };