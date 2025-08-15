
const supabase = require("../../database/supabaseClient");// Supabase client
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class SalesController {
    // Sales Login
    async salesLogin(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ message: 'Email and password are required' });
            }

            // Find sales user by email
            const { data: userData, error } = await supabase
                .from('sales')
                .select('*')
                .eq('email', email)
                .single();

            if (error || !userData) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            // Compare password
            const isMatch = await bcrypt.compare(password, userData.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            // Generate token
            const token = jwt.sign(
                { userId: userData.id, role: 'sales' },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            return res.status(200).json({
                message: 'Login successful',
                token,
                user: {
                    id: userData.id,
                    name: userData.name,
                    email: userData.email
                }
            });

        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    }

    // Sales Profile
    async salesProfile(req, res) {
        try {
            const token = req.header('token');
            if (!token) return res.status(401).json({ message: 'Token required' });

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const { data, error } = await supabase
                .from('sales')
                .select('*')
                .eq('id', decoded.userId)
                .single();

            if (error) throw error;

            return res.status(200).json(data);
        } catch (err) {
            return res.status(401).json({ message: err.message });
        }
    }

    // Edit Sales Profile
    async editSalesProfile(req, res) {
        try {
            const token = req.header('token');
            if (!token) return res.status(401).json({ message: 'Token required' });

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const updateData = {};
            if (req.body.phone) updateData.phone = req.body.phone;
            if (req.body.pincode) updateData.pincode = req.body.pincode;
            if (req.body.ifsc) updateData.ifsc = req.body.ifsc;

            const { data, error } = await supabase
                .from('sales')
                .update(updateData)
                .eq('id', decoded.userId)
                .select('*')
                .single();

            if (error) throw error;

            return res.status(200).json({ message: 'Profile updated successfully', data });
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    }
}

module.exports = new SalesController();
