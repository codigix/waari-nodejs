// models/Tour.js
const db = require("../db"); // MySQL connection pool

const Tour = {
  async getAll() {
    const [rows] = await db.query("SELECT * FROM tours");
    return rows;
  },

  async findById(id) {
    const [rows] = await db.query("SELECT * FROM tours WHERE id = ?", [id]);
    return rows[0] || null;
  },

  async create(data) {
    const [result] = await db.query("INSERT INTO tours SET ?", data);
    return result.insertId;
  },

  async update(id, data) {
    const [result] = await db.query("UPDATE tours SET ? WHERE id = ?", [data, id]);
    return result.affectedRows > 0;
  },

  async delete(id) {
    const [result] = await db.query("DELETE FROM tours WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }
};

module.exports = Tour;