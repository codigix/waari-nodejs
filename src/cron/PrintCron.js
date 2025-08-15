// printCron.js
const path = require("path");
const fs = require("fs");
const db = require("../config/db"); // Sequelize or mysql2 connection
const pdf = require("pdf-creator-node");
const handlebars = require("handlebars");

async function printCron() {
    try {
        const pdfDirectory = path.join(__dirname, "../public/print");
        if (!fs.existsSync(pdfDirectory)) {
            fs.mkdirSync(pdfDirectory, { recursive: true });
        }

        // Get all unprinted group tours
        const [groupTours] = await db.query(`
            SELECT * FROM grouptours
            WHERE printUrl IS NULL AND groupTourProcess = 1
        `);

        for (const gt of groupTours) {
            const [[grouptoursdata]] = await db.query(`
                SELECT * FROM grouptours WHERE groupTourId = ?
            `, [gt.groupTourId]);

            const [[{ countryName } = {}]] = await db.query(`
                SELECT countryName FROM countries WHERE countryId = ?
            `, [gt.groupTourId]);

            const [cities] = await db.query(`
                SELECT citiesName FROM grouptourscity
                JOIN cities ON grouptourscity.cityId = cities.citiesId
                WHERE groupTourId = ?
            `, [gt.groupTourId]);

            const [skeletonItinerary] = await db.query(`
                SELECT * FROM grouptourskeletonitinerary WHERE groupTourId = ?
            `, [gt.groupTourId]);

            const [detailedItinerary] = await db.query(`
                SELECT * FROM grouptourdetailitinerary WHERE groupTourId = ?
            `, [gt.groupTourId]);

            const [inclusions] = await db.query(`
                SELECT * FROM inclusions WHERE groupTourId = ?
            `, [gt.groupTourId]);

            const [exclusions] = await db.query(`
                SELECT * FROM exclusions WHERE groupTourId = ?
            `, [gt.groupTourId]);

            const [tourPrice] = await db.query(`
                SELECT * FROM grouptourpricediscount
                JOIN dropdownroomsharing
                ON grouptourpricediscount.roomShareId = dropdownroomsharing.roomShareId
                WHERE grouptourpricediscount.groupTourId = ?
            `, [gt.groupTourId]);

            const [flightDetails] = await db.query(`
                SELECT * FROM grouptourflight WHERE groupTourId = ?
            `, [gt.groupTourId]);

            const [trainDetails] = await db.query(`
                SELECT * FROM grouptourtrain WHERE groupTourId = ?
            `, [gt.groupTourId]);

            const [notes] = await db.query(`
                SELECT * FROM grouptourdetails WHERE groupTourId = ?
            `, [gt.groupTourId]);

            const [[d2d]] = await db.query(`
                SELECT * FROM grouptourd2dtime WHERE groupTourId = ?
            `, [gt.groupTourId]);

            const [similarTours] = await db.query(`
                SELECT * FROM grouptours
                WHERE tourCode LIKE ? AND endDate >= ?
            `, [`%${gt.tourCode}`, gt.endDate]);

            // Prepare data for template
            const data = {
                grouptoursdata,
                cities,
                detailedItinerary,
                inclusions,
                exclusions,
                tourPrice,
                flightDetails,
                trainDetails,
                skeletonItinerary,
                citiesCount: cities.length,
                countryName,
                notes,
                d2d,
                similarTours
            };

            // Load HTML template (similar to Laravel's print.blade.php)
            const templatePath = path.join(__dirname, "../views/print-template.html");
            const htmlTemplate = fs.readFileSync(templatePath, "utf8");
            const compiledTemplate = handlebars.compile(htmlTemplate);
            const html = compiledTemplate(data);

            // PDF options
            const pdfOptions = {
                format: "A4",
                orientation: "portrait",
                border: "10mm"
            };

            // PDF file name
            const printName = `${grouptoursdata.tourName}_print_${Date.now()}.pdf`;
            const filePath = path.join(pdfDirectory, printName);

            // Generate and save PDF
            await pdf.create({ html, data, path: filePath, type: "" }, pdfOptions);

            const printUrl = `/public/print/${printName}`;
            await db.query(`
                UPDATE grouptours
                SET printUrl = ?
                WHERE groupTourId = ?
            `, [printUrl, gt.groupTourId]);
        }

        console.log("Group tour print PDFs created");
    } catch (err) {
        console.error("Error:", err.message);
    }
}

module.exports = printCron;
