const bcrypt = require("bcrypt");
require("dotenv").config();
const supabase = require("../../database/supabaseClient");

/**
 * Admin Login
 */
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log("Login attempt:", email);

        const { data: admin, error } = await supabase
            .from("users")
            .select("*")
            .eq("email", email.toLowerCase())
            .single();

        if (error) {
            console.error("Supabase error:", error.message);
            return res.status(401).json({ error: "Invalid email or password" });
        }

        if (!admin) {
            console.log("No user found with email:", email);
            return res.status(401).json({ error: "Invalid email or password" });
        }

        console.log("DB user found:", admin);

        const passwordMatch = await bcrypt.compare(password, admin.password);
        if (!passwordMatch) {
            console.log("Password mismatch for:", email);
            return res.status(401).json({ error: "Invalid email or password" });
        }

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

/**
 * Add Tour Code
 */
const tourCode = async (req, res) => {
    try {
        const { tourCodeName, tourCodeImage } = req.body;

        if (!tourCodeName || !tourCodeImage) {
            return res.status(400).json({ message: "tourCodeName and tourCodeImage are required" });
        }

        const { data, error } = await supabase
            .from("tour_codes")
            .insert([{ name: tourCodeName, image: tourCodeImage }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ message: "Tour code added", data });
    } catch (err) {
        console.error("Add tour code error:", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * View Sales Data
 */
const viewSalesData = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("sales")
            .select("*")
            .order("created_at", { ascending: false }); // ✅ order latest first

        if (error) throw error;

        res.status(200).json({ sales: data });
    } catch (err) {
        console.error("View sales error:", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Delete Tour Type
 */
const deleteTourType = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: "Tour type ID is required" });
        }

        const { data, error } = await supabase
            .from("tour_types")
            .delete()
            .eq("id", id)
            .select();

        if (error) throw error;

        if (!data || data.length === 0) {
            return res.status(404).json({ message: "Tour type not found" });
        }

        res.status(200).json({ message: "Tour type deleted successfully", deleted: data });
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
