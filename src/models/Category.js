// models/Category.js
const db = require("../db"); // our MySQL connection pool

const Category = {
  async getAll() {
    const [rows] = await db.query("SELECT * FROM categories");
    return rows;
  },

  async findById(id) {
    const [rows] = await db.query("SELECT * FROM categories WHERE id = ?", [id]);
    return rows[0] || null;
  },

  async create(data) {
    const [result] = await db.query("INSERT INTO categories SET ?", data);
    return result.insertId;
  },

  async update(id, data) {
    const [result] = await db.query("UPDATE categories SET ? WHERE id = ?", [data, id]);
    return result.affectedRows > 0;
  },

  async delete(id) {
    const [result] = await db.query("DELETE FROM categories WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }
};

module.exports = Category;
