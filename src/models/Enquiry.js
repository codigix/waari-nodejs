// models/Enquiry.js
const db = require("../db"); // MySQL connection pool

const Enquiry = {
  async getAll() {
    const [rows] = await db.query("SELECT * FROM enquiry");
    return rows;
  },

  async findById(id) {
    const [rows] = await db.query("SELECT * FROM enquiry WHERE id = ?", [id]);
    return rows[0] || null;
  },

  async create(data) {
    const [result] = await db.query("INSERT INTO enquiry SET ?", data);
    return result.insertId;
  },

  async update(id, data) {
    const [result] = await db.query("UPDATE enquiry SET ? WHERE id = ?", [data, id]);
    return result.affectedRows > 0;
  },

  async delete(id) {
    const [result] = await db.query("DELETE FROM enquiry WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }
};

module.exports = Enquiry;
