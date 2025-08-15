const dayjs = require("dayjs");
const { toWords } = require("number-to-words");
const CommonController = require("../CommonController"); // fixed path
const supabase = require("../../database/supabaseClient");
// AccCTController
class AccCTController {
    // Confirmed payment listing custom tour
    async confirmPayListCT(req, res) {
        try {
            const tokenData = await CommonController.checkToken(req.headers.token, [55]);
            if (tokenData.error) return res.status(401).json(tokenData);

            const { startDate, endDate, guestName, perPage, page } = req.query;
            const pageSize = perPage ? parseInt(perPage) : 10;
            const currentPage = page ? parseInt(page) : 1;
            const from = (currentPage - 1) * pageSize;

            let { data: allResults, error } = await supabase
                .from("customtourpaymentdetails")
                .select(`
                    *,
                    customtourdiscountdetails(*),
                    enquirycustomtours(*),
                    customtourenquirydetails(*)
                `)
                .eq("status", 1)
                .order("created_at", { foreignTable: "enquirycustomtours", ascending: false });

            if (error) return res.status(500).json({ message: error.message });

            // Filters
            allResults = allResults.filter(row => {
                let pass = true;
                if (startDate) pass = pass && new Date(row.startDate) >= new Date(dayjs(startDate).startOf("day").format());
                if (endDate) pass = pass && new Date(row.endDate) <= new Date(dayjs(endDate).endOf("day").format());
                if (guestName) {
                    const fullName = `${row.customtourenquirydetails.firstName} ${row.customtourenquirydetails.lastName}`.toLowerCase();
                    pass = pass && fullName.includes(guestName.toLowerCase());
                }
                return pass;
            });

            const paginatedResults = allResults.slice(from, from + pageSize);

            const data = paginatedResults.map(row => ({
                enquiryCustomId: row.enquiryCustomId,
                uniqueEnqueryId: row.enquiryId.toString().padStart(4, "0"),
                groupName: row.enquirycustomtours.groupName,
                contactName: `${row.customtourenquirydetails.firstName} ${row.customtourenquirydetails.lastName}`,
                contact: row.contact,
                startDate: dayjs(row.startDate).format("DD-MM-YYYY"),
                endDate: dayjs(row.endDate).format("DD-MM-YYYY"),
                tourPrice: row.tourPrice,
                additionalDis: row.customtourdiscountdetails.additionalDis,
                discountPrice: row.discountPrice,
                gst: row.gst,
                tcs: row.tcs,
                grandTotal: row.grandTotal,
                advancePayment: row.advancePayment,
                balance: row.balance,
                dueDate: row.payDate,
                customPayDetailId: row.customPayDetailId,
                enquiryDetailCustomId: row.enquiryDetailCustomId
            }));

            return res.status(200).json({
                data,
                total: allResults.length,
                currentPage,
                perPage: pageSize,
                nextPageUrl: currentPage * pageSize < allResults.length ? currentPage + 1 : null,
                previousPageUrl: currentPage > 1 ? currentPage - 1 : null,
                lastPage: Math.ceil(allResults.length / pageSize)
            });

        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: err.message });
        }
    }
}

module.exports = new AccCTController();
