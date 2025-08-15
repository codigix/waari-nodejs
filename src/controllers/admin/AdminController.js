// const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

// Connect to Supabase
const supabase = require("../../database/supabaseClient");
// ✅ Admin login
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const { data: admin, error } = await supabase
            .from("admins")
            .select("*")
            .eq("email", email)
            .eq("password", password) // ⚠️ For production: hash & compare instead
            .single();

        if (error || !admin) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        res.json({ message: "Login successful", admin });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ✅ Add tour code
const tourCode = async (req, res) => {
    try {
        const { tourCodeName, tourCodeImage } = req.body;

        const { data, error } = await supabase
            .from("tour_codes")
            .insert([{ name: tourCodeName, image: tourCodeImage }])
            .select();

        if (error) throw error;

        res.json({ message: "Tour code added", data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ✅ View sales data
const viewSalesData = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("sales")
            .select("*");

        if (error) throw error;

        res.json({ sales: data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ✅ Delete tour type
const deleteTourType = async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from("tour_types")
            .delete()
            .eq("id", id);

        if (error) throw error;

        res.json({ message: "Tour type deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    adminLogin,
    tourCode,
    viewSalesData,
    deleteTourType
};
