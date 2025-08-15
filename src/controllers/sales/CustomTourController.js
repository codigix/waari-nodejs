// src/controllers/sales/CustomTourController.js
// Simple, robust controller that uses supabase if available.

const { supabase } = require('../../database/supabaseClient'); // adapt path if needed

module.exports = {
  getCustomTours: async (req, res) => {
    try {
      // If supabase client exists, try to use it; otherwise return sample data.
      if (supabase) {
        const { data, error } = await supabase
          .from('customtours')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        return res.json({ success: true, data });
      } else {
        return res.json({ success: true, data: [{ id: 1, name: 'Sample Custom Tour' }] });
      }
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  createCustomTour: async (req, res) => {
    try {
      const payload = req.body;
      if (supabase) {
        const { data, error } = await supabase
          .from('customtours')
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
