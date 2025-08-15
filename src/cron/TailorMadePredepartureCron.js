// tailormadePredepartureCron.js
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const ejs = require('ejs');
const PdfPrinter = require('pdfmake');

async function runCron() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'your_db_name'
    });

    try {
        const pdfDirectory = path.join(__dirname, 'public/tailormadepredeparture');
        if (!fs.existsSync(pdfDirectory)) {
            fs.mkdirSync(pdfDirectory, { recursive: true });
        }

        const [tailorMadeList] = await connection.execute(
            `SELECT * FROM tailormades WHERE predepartureUrl IS NULL`
        );

        for (const tm of tailorMadeList) {
            // Fetch related data
            const [tailormadesdata] = await connection.execute(
                `SELECT * FROM tailormades WHERE tailorMadeId = ?`,
                [tm.tailorMadeId]
            );
            const [countryName] = await connection.execute(
                `SELECT countryName FROM countries WHERE countryId = ?`,
                [tm.tailorMadeId]
            );
            const [cities] = await connection.execute(
                `SELECT citiesName FROM tailormadecity 
                 JOIN cities ON tailormadecity.cityId = cities.citiesId
                 WHERE tailorMadeId = ?`,
                [tm.tailorMadeId]
            );
            const [detailedItinerary] = await connection.execute(
                `SELECT * FROM tailormadedetailitinerary WHERE tailorMadeId = ?`,
                [tm.tailorMadeId]
            );
            const [inclusions] = await connection.execute(
                `SELECT * FROM tailormadeinclusions WHERE tailorMadeId = ?`,
                [tm.tailorMadeId]
            );
            const [exclusions] = await connection.execute(
                `SELECT * FROM tailormadeexclusions WHERE tailorMadeId = ?`,
                [tm.tailorMadeId]
            );
            const [tourPrice] = await connection.execute(
                `SELECT * FROM tailormadepricediscount WHERE tailorMadeId = ?`,
                [tm.tailorMadeId]
            );
            const [flightDetails] = await connection.execute(
                `SELECT * FROM tailormadeflight WHERE tailorMadeId = ?`,
                [tm.tailorMadeId]
            );
            const [trainDetails] = await connection.execute(
                `SELECT * FROM tailormadetrain WHERE tailorMadeId = ?`,
                [tm.tailorMadeId]
            );
            const [d2d] = await connection.execute(
                `SELECT * FROM tailormaded2dtime WHERE tailorMadeId = ?`,
                [tm.tailorMadeId]
            );

            const data = {
                tailormadesdata: tailormadesdata[0],
                cities,
                detailedItinerary,
                inclusions,
                exclusions,
                tourPrice,
                flightDetails,
                trainDetails,
                citiesCount: cities.length,
                countryName: countryName.length ? countryName[0].countryName : '',
                d2d: d2d[0],
                logopre: path.join(__dirname, 'public/images/logopre.webp')
            };

            // Render HTML from EJS
            const html = await ejs.renderFile(path.join(__dirname, 'views/tailormadepredeparture.ejs'), data);

            // PDF creation using pdfmake
            const fonts = {
                Jost: {
                    normal: path.join(__dirname, 'fonts/Jost-Regular.ttf'),
                    light: path.join(__dirname, 'fonts/Jost-Light.ttf')
                },
                Playfair: {
                    normal: path.join(__dirname, 'fonts/PlayfairDisplay-Regular.ttf')
                }
            };
            const printer = new PdfPrinter(fonts);

            const docDefinition = {
                pageSize: { width: 229.99 * 2.835, height: 410.11 * 2.835 }, // mm → pt
                pageMargins: [0, 0, 0, 0],
                content: [{ text: html, style: 'default' }],
                defaultStyle: { font: 'Jost' }
            };

            const pdfDoc = printer.createPdfKitDocument(docDefinition);
            const fileName = `${tailormadesdata[0].tourName}_tailormadepredeparture${Date.now()}.pdf`;
            const filePath = path.join(pdfDirectory, fileName);

            pdfDoc.pipe(fs.createWriteStream(filePath));
            pdfDoc.end();

            // Update DB
            const predepartureUrl = `/public/tailormadepredeparture/${fileName}`;
            await connection.execute(
                `UPDATE tailormades SET predepartureUrl = ? WHERE tailorMadeId = ?`,
                [predepartureUrl, tm.tailorMadeId]
            );
        }

        console.log("Tailor made updated");
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await connection.end();
    }
}

runCron();
