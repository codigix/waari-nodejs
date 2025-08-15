// models/Userdetail.js
const db = require("../db");

const Userdetail = {
  async getAll() {
    const [rows] = await db.query("SELECT * FROM userdetails");
    return rows;
  },

  async findById(id) {
    const [rows] = await db.query("SELECT * FROM userdetails WHERE id = ?", [id]);
    return rows[0] || null;
  },

  async create(data) {
    const [result] = await db.query("INSERT INTO userdetails SET ?", data);
    return result.insertId;
  },

  async update(id, data) {
    const [result] = await db.query("UPDATE userdetails SET ? WHERE id = ?", [data, id]);
    return result.affectedRows > 0;
  },

  async delete(id) {
    const [result] = await db.query("DELETE FROM userdetails WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }
};

module.exports = Userdetail;
