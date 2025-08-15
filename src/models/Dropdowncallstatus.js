// models/DropdownCallStatus.js
const db = require("../db"); // MySQL connection pool

const DropdownCallStatus = {
  async getAll() {
    const [rows] = await db.query("SELECT * FROM dropdowncallstatus");
    return rows;
  },

  async findById(id) {
    const [rows] = await db.query("SELECT * FROM dropdowncallstatus WHERE id = ?", [id]);
    return rows[0] || null;
  },

  async create(data) {
    const [result] = await db.query("INSERT INTO dropdowncallstatus SET ?", data);
    return result.insertId;
  },

  async update(id, data) {
    const [result] = await db.query("UPDATE dropdowncallstatus SET ? WHERE id = ?", [data, id]);
    return result.affectedRows > 0;
  },

  async delete(id) {
    const [result] = await db.query("DELETE FROM dropdowncallstatus WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }
};

module.exports = DropdownCallStatus;
