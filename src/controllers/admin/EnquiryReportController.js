// controllers/EnquiryReportController.js
const supabase = require("../../database/supabaseClient"); // your Supabase client instance
const CommonController = require('../CommonController');
const moment = require('moment');

class EnquiryReportController {

    // ATP Enquiry Report
    async atpEnqReport(req, res) {
        try {
            const tokenData = await CommonController.checkToken(req.header('token'), [274]);
            if (tokenData?.isJsonResponse) {
                return res.status(tokenData.status).json(tokenData.body);
            }

            const { month, year, perPage } = req.body;
            if (!month || !year) {
                return res.status(400).json({ message: 'month and year are required' });
            }

            const pageSize = perPage || 10;
            const page = parseInt(req.body.page) || 1;
            const offset = (page - 1) * pageSize;

            // Get paginated enquiries
            const { data: monthEnqsData, error: monthEnqsError } = await supabase
                .from('enquiries')
                .select('*')
                .eq('createdBy', tokenData.userId)
                .filter('EXTRACT(MONTH FROM startDate)', 'eq', month)
                .filter('EXTRACT(YEAR FROM startDate)', 'eq', year)
                .range(offset, offset + pageSize - 1);

            if (monthEnqsError) throw monthEnqsError;

            let monthEnqDataArray = [];
            for (const value of monthEnqsData) {
                // Group Tour
                const { data: enqGtData } = await supabase
                    .from('enquirygrouptours')
                    .select(`
                        *,
                        grouptours(tourName, startDate, days, night, adults, child, enquiryProcess, closureReason),
                        dropdownenquiryreference(enquiryReferName)
                    `)
                    .eq('enquiryId', value.uniqueId)
                    .single();

                // Custom Tour
                const { data: enqCtData } = await supabase
                    .from('enquirycustomtours')
                    .select(`
                        *,
                        users(userName),
                        dropdownenquiryreference(enquiryReferName)
                    `)
                    .eq('enquiryId', value.uniqueId)
                    .single();

                if (enqGtData) {
                    monthEnqDataArray.push({
                        guestName: `${enqGtData.firstName} ${enqGtData.lastName}`,
                        travelType: 'Group',
                        tourName: enqGtData.grouptours?.tourName,
                        travelDate: enqGtData.grouptours?.startDate,
                        duration: (enqGtData.grouptours?.days || 0) + (enqGtData.grouptours?.night || 0),
                        pax: (enqGtData.grouptours?.adults || 0) + (enqGtData.grouptours?.child || 0),
                        enquiryReferName: enqGtData.dropdownenquiryreference?.enquiryReferName,
                        opsConsultant: '',
                        enquiryProcess: enqGtData.grouptours?.enquiryProcess,
                        enquiryProcessDescription: '1-ongoing , 2-Confirmed ,3-Closed',
                        closureReason: enqGtData.grouptours?.closureReason || ''
                    });
                } else if (enqCtData) {
                    monthEnqDataArray.push({
                        guestName: `${enqCtData.firstName} ${enqCtData.lastName}`,
                        travelType: 'Tailor-Made',
                        tourName: enqCtData.groupName,
                        travelDate: enqCtData.startDate,
                        duration: (enqCtData.days || 0) + (enqCtData.nights || 0),
                        pax: (enqCtData.adults || 0) + (enqCtData.child || 0),
                        enquiryReferName: enqCtData.dropdownenquiryreference?.enquiryReferName,
                        opsConsultant: enqCtData.users?.userName,
                        enquiryProcess: enqCtData.enquiryProcess,
                        enquiryProcessDescription: '1-Ongoing ,2-Confirmed, 3-Closed',
                        closureReason: enqCtData.closureReason || ''
                    });
                }
            }

            // Count enquiries by tourType
            const { data: enquiryCounts, error: enquiryCountsError } = await supabase
                .from('enquiries')
                .select('tourType, enquiryProcess', { count: 'exact' })
                .eq('createdBy', tokenData.userId)
                .filter('EXTRACT(MONTH FROM startDate)', 'eq', month)
                .filter('EXTRACT(YEAR FROM startDate)', 'eq', year)
                .in('tourType', [1, 2]);

            if (enquiryCountsError) throw enquiryCountsError;

            let allEnquiries = {};
            let totals = { total: 0, onGoing: 0, confirmed: 0, closed: 0 };
            const tourTypeNames = { 1: 'Group Journey', 2: 'Tailor-Made Journey' };

            enquiryCounts.forEach(ec => {
                const name = tourTypeNames[ec.tourType];
                if (!allEnquiries[name]) {
                    allEnquiries[name] = { total: 0, onGoing: 0, confirmed: 0, closed: 0 };
                }
                allEnquiries[name].total++;
                if (ec.enquiryProcess === 1) allEnquiries[name].onGoing++;
                if (ec.enquiryProcess === 2) allEnquiries[name].confirmed++;
                if (ec.enquiryProcess === 3) allEnquiries[name].closed++;
            });

            for (const key in allEnquiries) {
                const e = allEnquiries[key];
                e.conversionRate = e.total ? (e.confirmed / e.total) * 100 : 0;
                totals.total += e.total;
                totals.onGoing += e.onGoing;
                totals.confirmed += e.confirmed;
                totals.closed += e.closed;
            }
            totals.conversionRate = totals.total ? (totals.confirmed / totals.total) * 100 : 0;
            allEnquiries.total = totals;

            // Total count
            const { count: totalCount } = await supabase
                .from('enquiries')
                .select('*', { count: 'exact', head: true })
                .eq('createdBy', tokenData.userId)
                .filter('EXTRACT(MONTH FROM startDate)', 'eq', month)
                .filter('EXTRACT(YEAR FROM startDate)', 'eq', year);

            return res.status(200).json({
                data: monthEnqDataArray,
                allEnquiries,
                total: totalCount || 0,
                currentPage: page,
                perPage: pageSize
            });

        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    }
}

module.exports = new EnquiryReportController();
