const mysql = require("mysql2");

// Return DATE and DATETIME columns as strings instead of JS Date objects.
// This prevents implicit timezone conversions when Date objects are serialized
// to ISO strings (which show UTC time and can shift hours).
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // Keep date/time values as returned by MySQL (strings) so frontend sees the
  // exact stored values (e.g. '2025-10-13 15:30:00').
  dateStrings: ['DATE', 'DATETIME'],
});

module.exports = db;