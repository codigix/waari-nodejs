// models/GroupTour.js
const db = require("../db"); // MySQL connection pool

const GroupTour = {
  async getAll() {
    const [rows] = await db.query("SELECT * FROM grouptour");
    return rows;
  },

  async findById(id) {
    const [rows] = await db.query("SELECT * FROM grouptour WHERE id = ?", [id]);
    return rows[0] || null;
  },

  async create(data) {
    const [result] = await db.query("INSERT INTO grouptour SET ?", data);
    return result.insertId;
  },

  async update(id, data) {
    const [result] = await db.query("UPDATE grouptour SET ? WHERE id = ?", [data, id]);
    return result.affectedRows > 0;
  },

  async delete(id) {
    const [result] = await db.query("DELETE FROM grouptour WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }
};

module.exports = GroupTour;