// src/routes/enquiryReport.routes.js
const express = require("express");
const router = express.Router();
const EnquiryReportController = require("../controllers/admin/EnquiryReportController");

// POST ATP Enquiry Report
router.post("/atp-enquiry-report", (req, res) =>
    EnquiryReportController.atpEnqReport(req, res)
);

module.exports = router;
