// src/controllers/sales/GroupTourController.js
const { supabase } = require('../../database/supabaseClient');

module.exports = {
  getGroupTours: async (req, res) => {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('grouptours')
          .select('groupTourId, tourName, tourCode, startDate, endDate')
          .order('startDate', { ascending: true })
          .limit(100);

        if (error) throw error;
        return res.json({ success: true, data });
      } else {
        return res.json({ success: true, data: [] });
      }
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  createGroupTour: async (req, res) => {
    try {
      const payload = req.body;
      if (supabase) {
        const { data, error } = await supabase
          .from('grouptours')
          .insert([payload])
          .select()
          .single();

        if (error) throw error;
        return res.status(201).json({ success: true, data });
      } else {
        return res.status(201).json({ success: true, data: payload });
      }
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
};
