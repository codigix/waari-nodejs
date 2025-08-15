// src/controllers/sales/TailorMadeController.js
const { checkToken } = require('../CommonController');
const { supabase } = require('../../database/supabaseClient');
const { validationResult } = require('express-validator');
const moment = require('moment');

class TailorMadeController {
  // GET /tailor-made
  async viewTailorMade(req, res) {
    try {
      const token = req.headers['token'] || req.headers['authorization'];
      const tokenData = await checkToken(token, [348]);
      if (!tokenData || tokenData instanceof Error) return res.status(401).json({ message: 'Invalid token' });

      let query = supabase.from('tailormades').select('*, tourtype(tourTypeName)').order('created_at', { ascending: false });

      // filters (safe checks)
      if (req.query.tourName) query = query.ilike('tourName', `%${req.query.tourName}%`);
      if (req.query.departureTypeId) query = query.eq('departureTypeId', req.query.departureTypeId);

      // pagination
      const perPage = parseInt(req.query.perPage, 10) || 10;
      const page = parseInt(req.query.page, 10) || 1;
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;

      const { data, error, count } = await query.range(from, to).select('*', { count: 'exact' });
      if (error) throw error;

      const items = (data || []).map(item => ({
        tailorMadeId: item.tailorMadeId,
        tourName: item.tourName,
        tourCode: item.tourCode,
        tourTypeName: item.tourtype?.tourTypeName,
        startDate: item.startDate ? moment(item.startDate).format('DD-MM-YYYY') : null,
        endDate: item.endDate ? moment(item.endDate).format('DD-MM-YYYY') : null,
        duration: `${item.days || 0}D-${item.night || 0}N`
      }));

      return res.json({
        data: items,
        total: count || items.length,
        currentPage: page,
        perPage,
        lastPage: Math.ceil((count || items.length) / perPage)
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: err.message || 'Internal Server Error' });
    }
  }

  // POST /tailor-made/details (body: { tailorMadeId })
  async viewDetailsTailorMade(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ message: errors.array() });

      const { tailorMadeId } = req.body;
      if (!tailorMadeId) return res.status(400).json({ message: 'tailorMadeId is required' });

      const { data } = await supabase.from('tailormades').select('*').eq('tailorMadeId', tailorMadeId).single();
      if (!data) return res.status(404).json({ message: 'Not found' });

      // fetch related tables (safely)
      const cityId = (await supabase.from('tailormadecity').select('cities(citiesId, citiesName)').eq('tailorMadeId', tailorMadeId)).data || [];
      const tourPrice = (await supabase.from('tailormadepricediscount').select('*').eq('tailorMadeId', tailorMadeId)).data || [];
      const detailedItinerary = (await supabase.from('tailormadedetailitinerary').select('*').eq('tailorMadeId', tailorMadeId)).data || [];
      const trainDetails = (await supabase.from('tailormadetrain').select('*').eq('tailorMadeId', tailorMadeId)).data || [];
      const flightDetails = (await supabase.from('tailormadeflight').select('*').eq('tailorMadeId', tailorMadeId)).data || [];
      const inclusions = (await supabase.from('tailormadeinclusions').select('*').eq('tailorMadeId', tailorMadeId)).data || [];
      const exclusions = (await supabase.from('tailormadeexclusions').select('*').eq('tailorMadeId', tailorMadeId)).data || [];
      const notes = (await supabase.from('tailormadedetails').select('*').eq('tailorMadeId', tailorMadeId)).data || [];
      const visaDocuments = (await supabase.from('tailormadevisadocumentsgt').select('*').eq('tailorMadeId', tailorMadeId)).data || [];
      const itineraryImages = (await supabase.from('tailormadeitineraryimages').select('*').eq('tailorMadeId', tailorMadeId)).data || [];

      return res.json({
        detailTailorMade: data,
        cityId,
        tourPrice,
        detailedItinerary,
        trainDetails,
        flightDetails,
        inclusions,
        exclusions,
        notes,
        visaDocuments,
        itineraryImages
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: err.message || 'Internal Server Error' });
    }
  }

  // POST /tailor-made (create)
  async createTailorMade(req, res) {
    try {
      const payload = req.body;
      const { data, error } = await supabase.from('tailormades').insert([payload]).select().single();
      if (error) throw error;
      return res.status(201).json({ success: true, data });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new TailorMadeController();
