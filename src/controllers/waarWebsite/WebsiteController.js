const supabase = require('../../database/supabaseClient'); // Supabase client
const moment = require('moment');

// Helper function for pagination
const paginate = (data, page, perPage) => {
    const offset = (page - 1) * perPage;
    const paginatedItems = data.slice(offset, offset + perPage);
    const totalPages = Math.ceil(data.length / perPage);

    return {
        data: paginatedItems,
        total: data.length,
        currentPage: page,
        perPage: perPage,
        lastPage: totalPages,
        nextPageUrl: page < totalPages ? `/api?page=${page + 1}` : null,
        previousPageUrl: page > 1 ? `/api?page=${page - 1}` : null,
    };
};

// =====================
// State List
// =====================
exports.getStateList = async (req, res) => {
    try {
        const { data: states, error } = await supabase
            .from('states')
            .select('*')
            .order('stateName', { ascending: true });

        if (error) throw error;

        const stateArray = states.map(state => ({
            stateId: state.stateId,
            countryId: state.countryId,
            stateName: state.stateName,
            image: state.image,
            description: state.description,
        }));

        res.status(200).json({ data: stateArray });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// =====================
// City Wise Tour List
// =====================
exports.getCityWiseTourList = async (req, res) => {
    try {
        const { cityId, countryId, tourTypeId, minDurationDays, maxDurationDays, travelMonth, perPage = 10, page = 1 } = req.query;

        let { data: tourList, error } = await supabase
            .from('grouptours')
            .select(`
                *,
                tourtype:tourtype(tourTypeId, tourTypeName),
                grouptourscity: gtc(*)
            `);

        if (error) throw error;

        // Filters
        tourList = tourList.filter(tour => {
            let pass = true;
            if (cityId) pass = pass && tour.grouptourscity?.some(c => c.cityId == cityId);
            else if (countryId) pass = pass && tour.countryId == countryId;

            if (tourTypeId) {
                const ids = tourTypeId.split(',');
                pass = pass && ids.includes(String(tour.tourTypeId));
            }

            if (minDurationDays && maxDurationDays) pass = pass && tour.days >= minDurationDays && tour.days <= maxDurationDays;

            if (travelMonth) {
                const numericMonth = moment(travelMonth, 'MMM').format('MM');
                pass = pass && moment(tour.startDate).format('MM') === numericMonth;
            }

            return pass;
        });

        const paginatedData = paginate(tourList, parseInt(page), parseInt(perPage));
        res.status(200).json(paginatedData);

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// =====================
// Contact Us
// =====================
exports.contactUs = async (req, res) => {
    try {
        const { fullName, phoneNo } = req.body;
        if (!fullName || !phoneNo) return res.status(422).json({ message: 'Full Name and Phone Number are required' });

        const { error } = await supabase.from('contactusers').insert([{ fullName, phoneNo }]);
        if (error) throw error;

        res.status(200).json({ message: 'Your request submitted successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// =====================
// Office Details List
// =====================
exports.getOfficeDetailsList = async (req, res) => {
    try {
        const { search = '', perPage = 10, page = 1 } = req.query;

        let { data: officeLists, error } = await supabase.from('officedetails').select('*');
        if (error) throw error;

        // Filter by search
        officeLists = officeLists.filter(office => {
            const str = `${office.cityName} ${office.address} ${office.contactNo} ${office.email}`.toLowerCase();
            return str.includes(search.toLowerCase());
        });

        const paginatedData = paginate(officeLists, parseInt(page), parseInt(perPage));
        res.status(200).json(paginatedData);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
