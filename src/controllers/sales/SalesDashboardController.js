// src/controllers/sales/SalesDashboardController.js
const CommonController = require('../CommonController');
const { supabase } = require('../../database/supabaseClient');
const moment = require('moment');

class SalesDashboardController {
  // route uses viewDashboard
  async viewDashboard(req, res) {
    try {
      const token = req.headers['token'] || req.headers['authorization'];
      const tokenData = await CommonController.checkToken(token, [1, 2, 3, 4]);
      if (!tokenData || tokenData instanceof Error) return res.status(401).json({ message: 'Invalid Token' });

      const userId = tokenData.userId;

      const countRows = async (table, match = {}) => {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true }).match(match);
        if (error) throw error;
        return count || 0;
      };

      const loyaltyBooking =
        (await countRows('enquirygrouptours', { enquiryReferId: 8, createdBy: userId, enquiryProcess: 2 })) +
        (await countRows('enquirycustomtours', { enquiryReferId: 8, createdBy: userId, enquiryProcess: 2 }));

      const welcomeBooking =
        (await countRows('enquirygrouptours', { createdBy: userId, enquiryProcess: 2 })) +
        (await countRows('enquirycustomtours', { createdBy: userId, enquiryProcess: 2 }));

      const totalBookings = loyaltyBooking + welcomeBooking;

      let referralRate = 0;
      if (totalBookings > 0) {
        const referrals =
          (await countRows('enquirygrouptours', { enquiryReferId: 9, createdBy: userId, enquiryProcess: 2 })) +
          (await countRows('enquirycustomtours', { enquiryReferId: 9, createdBy: userId, enquiryProcess: 2 }));
        referralRate = (referrals / totalBookings) * 100;
      }

      // Guests with DOB or marriage date today
      const { data: guests, error: guestsError } = await supabase
        .from('users')
        .select('userName, dob, contact, marriageDate')
        .eq('createdBy', userId);

      if (guestsError) throw guestsError;

      const todayMonth = moment().month() + 1;
      const todayDay = moment().date();

      const guestsWithDOBArray = (guests || []).filter(guest => {
        const dobMatch = guest.dob && moment(guest.dob).month() + 1 === todayMonth && moment(guest.dob).date() === todayDay;
        const marriageMatch = guest.marriageDate && moment(guest.marriageDate).month() + 1 === todayMonth && moment(guest.marriageDate).date() === todayDay;
        return dobMatch || marriageMatch;
      });

      return res.json({
        guestsWithDOB: guestsWithDOBArray,
        loyaltyBooking,
        welcomeBooking,
        referralRate: Math.round(referralRate * 100) / 100
      });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
}

module.exports = new SalesDashboardController();
