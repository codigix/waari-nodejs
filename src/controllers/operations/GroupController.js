const supabase = require("../../database/supabaseClient");

// ===== Group functions =====
exports.listGroups = async (req, res) => {
  try {
    const { data, error } = await supabase.from("groups").select("*");
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createGroup = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Group name is required" });

    const { data, error } = await supabase.from("groups").insert([{ name }]);
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Group name is required" });

    const { data, error } = await supabase.from("groups").update({ name }).eq("id", id);
    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ message: "Group not found" });

    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("groups").delete().eq("id", id);
    if (error) throw error;

    res.json({ message: "Group deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
