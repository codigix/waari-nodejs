// models/Lists.js
const db = require("../db"); // MySQL connection pool

const Lists = {
  async getAll() {
    const [rows] = await db.query("SELECT * FROM lists");
    return rows;
  },

  async findById(id) {
    const [rows] = await db.query("SELECT * FROM lists WHERE id = ?", [id]);
    return rows[0] || null;
  },

  async create(data) {
    const [result] = await db.query("INSERT INTO lists SET ?", data);
    return result.insertId;
  },

  async update(id, data) {
    const [result] = await db.query("UPDATE lists SET ? WHERE id = ?", [data, id]);
    return result.affectedRows > 0;
  },

  async delete(id) {
    const [result] = await db.query("DELETE FROM lists WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }
};

module.exports = Lists;