const fs = require('fs');
const path = require('path');
const dayjs = require('dayjs');
const { toWords } = require('number-to-words');
const ejs = require('ejs');
const puppeteer = require('puppeteer');
const axios = require('axios');
const supabase = require('../../database/supabaseClient');
const CommonController = require('../CommonController');

// Helper functions
async function paginate(query, page = 1, perPage = 10) {
  const offset = (page - 1) * perPage;
  
  const { data, count, error } = await query
    .range(offset, offset + perPage - 1);
  
  if (error) throw error;

  const total = count || data.length;
  const lastPage = Math.ceil(total / perPage) || 1;

  return {
    data,
    pagination: {
      total,
      perPage,
      currentPage: page,
      lastPage,
      nextPage: page < lastPage ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
    },
  };
}

async function renderPdfFromEjs(templatePath, data, outputPath) {
  const html = await ejs.renderFile(templatePath, data, { async: true });
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.emulateMediaType('screen');
    await page.pdf({ path: outputPath, format: 'A4', printBackground: true });
  } finally {
    await browser.close();
  }
}

class AccountController {
  // Account login
  async accountLogin(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: ['email and password required'] });
      }

      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !user) return res.status(422).json({ message: 'Invalid email' });

      const bcrypt = require('bcryptjs');
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return res.status(422).json({ message: 'Invalid password' });

      const token = `${Math.floor(Math.random() * 900000) + 100000}${Date.now()}`;
      
      await supabase
        .from('users')
        .update({ token })
        .eq('userId', user.userId);

      return res.status(200).json({
        message: 'Accounts logged in successfully',
        token,
        roleId: user.roleId,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: err.message });
    }
  }

  // Confirmed payments listing
  async confirmPayList(req, res) {
    try {
      const tokenData = await CommonController.checkToken(req.headers.token, [48]);
      if (tokenData?.error) return res.status(401).json(tokenData);

      const {
        travelStartDate,
        travelEndDate,
        tourName,
        guestName,
        perPage = 10,
        page = 1,
      } = req.query;

      let query = supabase
        .from('grouptourpaymentdetails')
        .select(`
          *,
          grouptourdiscountdetails:groupDisId(*),
          enquirygrouptours:enquiryGroupId(*, grouptours:groupTourId(*)),
          grouptourfamilyheaddetails:familyHeadGtId(*)
        `)
        .eq('status', 1)
        .order('created_at', { ascending: false });

      if (travelStartDate && travelEndDate) {
        const start = dayjs(travelStartDate).startOf('day').toISOString();
        const end = dayjs(travelEndDate).endOf('day').toISOString();
        query = query.gte('enquirygrouptours.grouptours.startDate', start)
                     .lte('enquirygrouptours.grouptours.endDate', end);
      } else if (travelStartDate) {
        const start = dayjs(travelStartDate).startOf('day').toISOString();
        query = query.gte('enquirygrouptours.grouptours.startDate', start);
      } else if (travelEndDate) {
        const end = dayjs(travelEndDate).endOf('day').toISOString();
        query = query.lte('enquirygrouptours.grouptours.endDate', end);
      }

      if (tourName) {
        query = query.ilike('enquirygrouptours.grouptours.tourName', `%${tourName}%`);
      }

      if (guestName) {
        query = query.or(`firstName.ilike.%${guestName}%,lastName.ilike.%${guestName}%`);
      }

      const result = await paginate(query, parseInt(page, 10), parseInt(perPage, 10));

      const data = result.data.map((row) => ({
        enquiryGroupId: row.enquiryGroupId,
        familyHeadGtId: row.familyHeadGtId,
        uniqueEnqueryId: String(row.enquirygrouptours?.enquiryId).padStart(4, '0'),
        enqDate: row.enquirygrouptours?.created_at ? dayjs(row.enquirygrouptours.created_at).format('DD-MM-YYYY') : null,
        tourName: row.enquirygrouptours?.grouptours?.tourName,
        startDate: row.enquirygrouptours?.grouptours?.startDate ? dayjs(row.enquirygrouptours.grouptours.startDate).format('DD-MM-YYYY') : null,
        endDate: row.enquirygrouptours?.grouptours?.endDate ? dayjs(row.enquirygrouptours.grouptours.endDate).format('DD-MM-YYYY') : null,
        guestName: `${row.grouptourfamilyheaddetails?.firstName} ${row.grouptourfamilyheaddetails?.lastName}`,
        contact: row.grouptourfamilyheaddetails?.contact,
        tourPrice: row.grouptourdiscountdetails?.tourPrice,
        discount: row.grouptourdiscountdetails?.additionalDis,
        discounted: row.grouptourdiscountdetails?.discountPrice,
        gst: row.grouptourdiscountdetails?.gst,
        tcs: row.grouptourdiscountdetails?.tcs,
        grand: row.grouptourdiscountdetails?.grandTotal,
        advancePayment: row.advancePayment,
        balance: row.balance,
        groupPaymentDetailId: row.groupPaymentDetailId,
      }));

      return res.status(200).json({
        data,
        ...result.pagination,
        nextPageUrl: result.pagination.nextPage,
        previousPageUrl: result.pagination.prevPage,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: err.message });
    }
  }

  // Other controller methods...
}

// Export as instance
module.exports = new AccountController();