const supabase = require("../../database/supabaseClient");

// ===== Tour functions =====
exports.listTours = async (req, res) => {
  try {
    const { data, error } = await supabase.from("customTours").select("*");
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createTour = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Tour name is required" });

    const { data, error } = await supabase.from("customTours").insert([{ name }]);
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateTour = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Tour name is required" });

    const { data, error } = await supabase.from("customTours").update({ name }).eq("id", id);
    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ message: "Tour not found" });

    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("customTours").delete().eq("id", id);
    if (error) throw error;

    res.json({ message: "Tour deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
