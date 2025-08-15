// src/controllers/TourController.js
const supabase = require('../database/supabaseClient');

class TourController {
    // Add Tour
    async addTour(req, res) {
        const { tourName, tourCode, tourType, tourPrice, departureType, departureCity, destination, startDate, endDate, duration, days, night, seats, meal, mealType, manager } = req.body;

        if (!tourName || !tourCode || !tourType || !tourPrice) {
            return res.status(422).json({ message: 'Required fields missing' });
        }

        try {
            const { error } = await supabase.from('tours').insert([{
                tourName,
                tourCode,
                tourType,
                tourPrice,
                departureType,
                departureCity,
                destination,
                startDate,
                endDate,
                duration,
                days,
                night,
                seats,
                meal,
                mealType,
                manager
            }]);

            if (error) throw error;
            return res.status(200).json({ message: 'Tour added successfully' });
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    }

    // Enquiry Form
    async enquiry(req, res) {
        const { guestName, contactNo, tourName, email, paxNo, adult, child, duration } = req.body;
        if (!guestName || !contactNo || !tourName || !email) {
            return res.status(422).json({ message: 'Required fields missing' });
        }

        try {
            const { error } = await supabase.from('enquiry').insert([req.body]);
            if (error) throw error;
            return res.status(200).json({ message: 'Enquiry added successfully' });
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    }

    // Booking Tour
    async bookings(req, res) {
        const { enquiryId } = req.body;
        if (!enquiryId) {
            return res.status(422).json({ message: 'Enquiry ID is required' });
        }

        try {
            const { data: enquiry, error: enquiryError } = await supabase
                .from('enquiry')
                .select('*')
                .eq('enquiryId', enquiryId)
                .single();

            if (enquiryError || !enquiry) {
                return res.status(404).json({ message: 'Enquiry not found' });
            }

            const { data: tour, error: tourError } = await supabase
                .from('tours')
                .select('*')
                .eq('tourName', enquiry.tourName)
                .single();

            if (tourError || !tour) {
                return res.status(404).json({ message: 'Tour not found' });
            }

            await supabase.from('guestdetails').insert([{
                name: enquiry.guestName,
                contactNo: enquiry.contactNo,
                enquiryId
            }]);

            await supabase.from('bookings').insert([{
                tourName: enquiry.tourName,
                tourCode: tour.tourCode,
                paxNo: req.body.paxNo,
                destination: req.body.destination
            }]);

            return res.status(200).json({ message: 'Booking created successfully' });
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    }
}

module.exports = new TourController();
