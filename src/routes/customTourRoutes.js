const express = require("express");
const router = express.Router();
const customTourController = require("../controllers/sales/CustomTourController");
const groupTourController = require("../controllers/sales/GroupTourController");

router.get("/dropdown-hotel-cat", customTourController.ddHotelCat);
router.get("/dropdown-travel-mode", groupTourController.dropdownTravelMode); // fixed typo

module.exports = router;
