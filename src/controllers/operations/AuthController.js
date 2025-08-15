const supabase = require("../../database/supabaseClient");

// ===== Auth functions =====
exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    const { data, error } = await supabase.from("users").insert([{ email, password }]);
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data, error } = await supabase.from("users").select("*").eq("email", email).limit(1);
    if (error) throw error;
    if (!data || data.length === 0 || data[0].password !== password)
      return res.status(401).json({ message: "Invalid credentials" });

    // For simplicity, returning user object
    res.json({ user: data[0], token: "dummy-token" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.logout = (req, res) => {
  res.json({ message: "Logged out successfully" });
};

exports.getProfile = async (req, res) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token missing" });

    const { data, error } = await supabase.from("users").select("*").eq("token", token).limit(1);
    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ message: "User not found" });

    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
