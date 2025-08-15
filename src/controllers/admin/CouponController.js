require('dotenv').config();
const supabase = require("../../database/supabaseClient");
const Joi = require('joi');
const moment = require('moment');



// ================== VALIDATION SCHEMAS ==================
const couponSchema = Joi.object({
  couponName: Joi.string().required(),
  fromDate: Joi.date().required(),
  toDate: Joi.date().required(),
  status: Joi.number().valid(0, 1).required(),
  discountType: Joi.number().valid(1, 2).required(),
  discountValue: Joi.number().required(),
  maxDiscount: Joi.number().when('discountType', { is: 2, then: Joi.required() }),
  isType: Joi.number().required()
});

const editCouponSchema = couponSchema.keys({
  couponId: Joi.number().required()
});

const statusSchema = Joi.object({
  couponId: Joi.number().required(),
  status: Joi.number().valid(0, 1).required()
});

const couponIdSchema = Joi.object({
  couponId: Joi.number().required()
});

const guestIdSchema = Joi.object({
  guestId: Joi.number().required()
});

// ================== CONTROLLER ==================
const couponController = {

  // ADD COUPON
  addCoupon: async (req, res) => {
    const { error } = couponSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details.map(e => e.message) });

    const { data, error: insertError } = await supabase
      .from('coupons')
      .insert([{
        couponName: req.body.couponName,
        fromDate: req.body.fromDate,
        toDate: req.body.toDate,
        status: req.body.status,
        discountType: req.body.discountType,
        discountValue: req.body.discountValue,
        maxDiscount: req.body.maxDiscount || null,
        isType: req.body.isType,
        couponType: 1
      }]);

    if (insertError) return res.status(500).json({ message: insertError.message });
    res.json({ message: 'Coupon added successfully' });
  },

  // LIST COUPONS
  couponsList: async (req, res) => {
    const perPage = parseInt(req.query.perPage) || 10;
    const page = parseInt(req.query.page) || 1;

    const { data: coupons, error: fetchError } = await supabase
      .from('coupons')
      .select('*', { count: 'exact' })
      .eq('couponType', 1)
      .order('created_at', { ascending: false })
      .range((page - 1) * perPage, page * perPage - 1);

    if (fetchError) return res.status(500).json({ message: fetchError.message });

    const couponsListArray = coupons.map(c => ({
      couponId: c.couponId,
      couponName: c.couponName,
      fromDate: c.fromDate,
      toDate: c.toDate,
      status: c.status,
      statusDescription: '1-active, 0-inactive',
      discountType: c.discountType,
      discountTypeDescription: '1-fixed amount, 2-percentage',
      discountValue: c.discountValue,
      maxDiscount: c.maxDiscount,
      isType: c.isType,
      isTypeDescription: '1-all users, 2-new users'
    }));

    res.json({
      data: couponsListArray,
      total: coupons.length,
      currentPage: page,
      perPage
    });
  },

  // EDIT COUPON
  editCouponInfo: async (req, res) => {
    const { error } = editCouponSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details.map(e => e.message) });

    const { error: updateError } = await supabase
      .from('coupons')
      .update({
        couponName: req.body.couponName,
        fromDate: req.body.fromDate,
        toDate: req.body.toDate,
        status: req.body.status,
        discountType: req.body.discountType,
        discountValue: req.body.discountValue,
        maxDiscount: req.body.maxDiscount || null,
        isType: req.body.isType
      })
      .eq('couponId', req.body.couponId);

    if (updateError) return res.status(500).json({ message: updateError.message });

    res.json({ message: 'Coupon updated successfully' });
  },

  // UPDATE STATUS
  updateStatusCoupon: async (req, res) => {
    const { error } = statusSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details.map(e => e.message) });

    const { error: statusError } = await supabase
      .from('coupons')
      .update({ status: req.body.status })
      .eq('couponId', req.body.couponId);

    if (statusError) return res.status(500).json({ message: statusError.message });

    res.json({ message: 'Coupon status updated successfully' });
  },

  // GET COUPON DATA
  couponData: async (req, res) => {
    const { error } = couponIdSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details.map(e => e.message) });

    const { data: coupon, error: fetchError } = await supabase
      .from('coupons')
      .select('*')
      .eq('couponId', req.body.couponId)
      .single();

    if (fetchError) return res.status(500).json({ message: fetchError.message });
    res.json({ data: coupon });
  },

  // ACTIVE COUPONS LIST
  activeCouponList: async (req, res) => {
    const { error } = guestIdSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details.map(e => e.message) });

    const { data: guest } = await supabase
      .from('users')
      .select('*')
      .eq('guestId', req.body.guestId)
      .single();

    let coupons = [];

    if (guest) {
      const { data: usedCoupons } = await supabase
        .from('couponusages')
        .select('couponId')
        .eq('guestId', req.body.guestId);

      const usedIds = usedCoupons?.map(u => u.couponId) || [];

      const { data } = await supabase
        .from('coupons')
        .select('*')
        .eq('isType', 1)
        .eq('status', 1)
        .not('couponId', 'in', `(${usedIds.join(',') || 'null'})`)
        .lte('fromDate', moment().format('YYYY-MM-DD'))
        .gte('toDate', moment().format('YYYY-MM-DD'));

      coupons = data || [];
    } else {
      const { data } = await supabase
        .from('coupons')
        .select('*')
        .eq('status', 1)
        .lte('fromDate', moment().format('YYYY-MM-DD'))
        .gte('toDate', moment().format('YYYY-MM-DD'));

      coupons = data || [];
    }

    res.json({ data: coupons });
  }
};

module.exports = couponController;
