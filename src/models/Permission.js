// models/Permission.js
const db = require("../db"); // MySQL connection pool

const Permission = {
  async getAll() {
    const [rows] = await db.query("SELECT * FROM permission");
    return rows;
  },

  async findById(id) {
    const [rows] = await db.query("SELECT * FROM permission WHERE id = ?", [id]);
    return rows[0] || null;
  },

  async create(data) {
    const [result] = await db.query("INSERT INTO permission SET ?", data);
    return result.insertId;
  },

  async update(id, data) {
    const [result] = await db.query("UPDATE permission SET ? WHERE id = ?", [data, id]);
    return result.affectedRows > 0;
  },

  async delete(id) {
    const [result] = await db.query("DELETE FROM permission WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }
};

module.exports = Permission;
