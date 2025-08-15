// models/EnquiryGroupTour.js
const db = require("../db"); // MySQL connection pool

const EnquiryGroupTour = {
  async getAll() {
    const [rows] = await db.query("SELECT * FROM enquirygrouptour");
    return rows;
  },

  async findById(id) {
    const [rows] = await db.query("SELECT * FROM enquirygrouptour WHERE id = ?", [id]);
    return rows[0] || null;
  },

  async create(data) {
    const [result] = await db.query("INSERT INTO enquirygrouptour SET ?", data);
    return result.insertId;
  },

  async update(id, data) {
    const [result] = await db.query("UPDATE enquirygrouptour SET ? WHERE id = ?", [data, id]);
    return result.affectedRows > 0;
  },

  async delete(id) {
    const [result] = await db.query("DELETE FROM enquirygrouptour WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }
};

module.exports = EnquiryGroupTour;
