const bcrypt = require("bcrypt");
require("dotenv").config();
const supabase = require("../../database/supabaseClient");

// ✅ Admin Login
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 🔍 Fetch admin by email
        const { data: admin, error } = await supabase
            .from("admins")
            .select("*")
            .eq("email", email)
            .single();

        if (error || !admin) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // 🔐 Validate password using bcrypt
        const passwordMatch = await bcrypt.compare(password, admin.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // 🧼 Remove password before sending response
        const { password: _, ...adminData } = admin;

        res.status(200).json({
            message: "Login successful",
            admin: adminData,
        });
    } catch (err) {
        console.error("Login error:", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

// ✅ Add Tour Code
const tourCode = async (req, res) => {
    try {
        const { tourCodeName, tourCodeImage } = req.body;

        const { data, error } = await supabase
            .from("tour_codes")
            .insert([{ name: tourCodeName, image: tourCodeImage }])
            .select();

        if (error) {
            throw error;
        }

        res.status(200).json({ message: "Tour code added", data });
    } catch (err) {
        console.error("Add tour code error:", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

// ✅ View Sales Data
const viewSalesData = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("sales")
            .select("*");

        if (error) {
            throw error;
        }

        res.status(200).json({ sales: data });
    } catch (err) {
        console.error("View sales error:", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

// ✅ Delete Tour Type
const deleteTourType = async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from("tour_types")
            .delete()
            .eq("id", id);

        if (error) {
            throw error;
        }

        res.status(200).json({ message: "Tour type deleted successfully" });
    } catch (err) {
        console.error("Delete tour type error:", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

// 📦 Export all handlers
module.exports = {
    adminLogin,
    tourCode,
    viewSalesData,
    deleteTourType,
};
