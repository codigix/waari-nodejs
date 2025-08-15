// src/controllers/sales/SalesController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { supabase } = require('../../database/supabaseClient'); // adapt if your path differs
const CommonController = require('../CommonController');

module.exports = {
  // login: expects { email, password } body
  salesLogin: async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

      if (!supabase) return res.status(500).json({ message: 'Database client not configured' });

      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const isValid = await bcrypt.compare(password, user.password || '');
      if (!isValid) return res.status(401).json({ message: 'Invalid email or password' });

      if (user.status !== 1) return res.status(403).json({ message: 'Account is deactivated' });

      const token = jwt.sign({ userId: user.userId, roleId: user.roleId }, process.env.JWT_SECRET || 'change-me', { expiresIn: '1d' });

      await supabase
        .from('users')
        .update({ token })
        .eq('userId', user.userId);

      return res.json({ message: 'Sales logged in successfully', token, roleId: user.roleId });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  // get sales list (simple)
  getSalesList: async (req, res) => {
    try {
      if (!supabase) return res.json({ data: [] });
      const { data, error } = await supabase.from('users').select('userId, userName, email, contact').eq('roleId', 2).limit(200);
      if (error) throw error;
      return res.json({ data });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  // profile view (uses CommonController.checkToken)
  salesProfile: async (req, res) => {
    try {
      const token = req.headers['token'] || req.headers['authorization'];
      const tokenData = await CommonController.checkToken(token, [1, 2]);

      if (!tokenData || tokenData instanceof Error) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      const { data: sales } = await supabase.from('users').select('*').eq('userId', tokenData.userId).single();
      if (!sales) return res.status(404).json({ message: 'User not found' });

      const { data: salesInfo } = await supabase.from('salesdetails').select('*').eq('userId', tokenData.userId).maybeSingle();

      const response = {
        userName: sales.userName,
        email: sales.email,
        contact: sales.contact,
        address: sales.address,
        status: sales.status,
        roleId: sales.roleId,
        establishmentName: sales.establishmentName,
        establishmentTypeId: sales.establishmentTypeId,
        // merge details
        ...salesInfo
      };

      return res.json({ data: response });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  // edit profile
  editSalesProfile: async (req, res) => {
    try {
      const token = req.headers['token'] || req.headers['authorization'];
      const tokenData = await CommonController.checkToken(token, [2]);
      if (!tokenData || tokenData instanceof Error) return res.status(401).json({ message: 'Invalid token' });

      const updates = {
        userName: req.body.userName,
        contact: req.body.contact,
        address: req.body.address,
        establishmentName: req.body.establishmentName,
        establishmentTypeId: req.body.establishmentTypeId,
        adharCard: req.body.adharCard,
        adharNo: req.body.adharNo,
        pan: req.body.pan,
        panNo: req.body.panNo
      };

      await supabase.from('users').update(updates).eq('userId', tokenData.userId);

      const detailsData = {
        city: req.body.city,
        pincode: req.body.pincode,
        state: req.body.state,
        alternatePhone: req.body.alternatePhone,
        shopAct: req.body.shopAct,
        accName: req.body.accName,
        accNo: req.body.accNo,
        bankName: req.body.bankName,
        branch: req.body.branch,
        ifsc: req.body.ifsc,
        cheque: req.body.cheque,
        logo: req.body.logo
      };

      const { data: existing } = await supabase.from('salesdetails').select('*').eq('userId', tokenData.userId).maybeSingle();
      if (existing) {
        await supabase.from('salesdetails').update(detailsData).eq('userId', tokenData.userId);
      } else {
        await supabase.from('salesdetails').insert({ userId: tokenData.userId, ...detailsData });
      }

      return res.json({ message: 'Information Updated Successfully' });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
};
