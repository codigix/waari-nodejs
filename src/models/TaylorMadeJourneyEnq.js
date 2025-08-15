// models/TaylorMadeJourneyEnq.js
const db = require("../db"); // MySQL connection pool

const TaylorMadeJourneyEnq = {
  async getAll() {
    const [rows] = await db.query("SELECT * FROM taylor_made_journey_enq");
    return rows;
  },

  async findById(id) {
    const [rows] = await db.query(
      "SELECT * FROM taylor_made_journey_enq WHERE id = ?",
      [id]
    );
    return rows[0] || null;
  },

  async create(data) {
    const [result] = await db.query("INSERT INTO taylor_made_journey_enq SET ?", data);
    return result.insertId;
  },

  async update(id, data) {
    const [result] = await db.query(
      "UPDATE taylor_made_journey_enq SET ? WHERE id = ?",
      [data, id]
    );
    return result.affectedRows > 0;
  },

  async delete(id) {
    const [result] = await db.query(
      "DELETE FROM taylor_made_journey_enq WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  }
};

module.exports = TaylorMadeJourneyEnq;
