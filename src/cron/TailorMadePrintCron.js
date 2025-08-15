// commands/tailorMadePrintCron.js

import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import puppeteer from 'puppeteer';
import ejs from 'ejs';

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'your_db_name'
};

async function tailorMadePrintCron() {
  let connection;

  try {
    // Connect to DB
    connection = await mysql.createConnection(dbConfig);

    // Ensure directory exists
    const pdfDirectory = path.join(process.cwd(), 'public', 'tailormadeprint');
    if (!fs.existsSync(pdfDirectory)) {
      fs.mkdirSync(pdfDirectory, { recursive: true });
    }

    // Fetch tailorMade data without printUrl
    const [tailorMadeData] = await connection.execute(
      `SELECT * FROM tailormades WHERE printUrl IS NULL`
    );

    for (const gt of tailorMadeData) {
      // Fetch related data
      const [[tailormadesdata]] = await connection.execute(
        `SELECT * FROM tailormades WHERE tailorMadeId = ?`,
        [gt.tailorMadeId]
      );

      const [[{ countryName } = {}]] = await connection.execute(
        `SELECT countryName FROM countries WHERE countryId = ?`,
        [gt.tailorMadeId] // double-check: is this supposed to be countryId or tailorMadeId?
      );

      const [cities] = await connection.execute(`
        SELECT citiesName
        FROM tailormadecity
        JOIN cities ON tailormadecity.cityId = cities.citiesId
        WHERE tailorMadeId = ?`, [gt.tailorMadeId]
      );

      const [detailedItinerary] = await connection.execute(
        `SELECT * FROM tailormadedetailitinerary WHERE tailorMadeId = ?`,
        [gt.tailorMadeId]
      );

      const [inclusions] = await connection.execute(
        `SELECT * FROM tailormadeinclusions WHERE tailorMadeId = ?`,
        [gt.tailorMadeId]
      );

      const [exclusions] = await connection.execute(
        `SELECT * FROM tailormadeexclusions WHERE tailorMadeId = ?`,
        [gt.tailorMadeId]
      );

      const [tourPrice] = await connection.execute(
        `SELECT * FROM tailormadepricediscount WHERE tailorMadeId = ?`,
        [gt.tailorMadeId]
      );

      const [flightDetails] = await connection.execute(
        `SELECT * FROM tailormadeflight WHERE tailorMadeId = ?`,
        [gt.tailorMadeId]
      );

      const [trainDetails] = await connection.execute(
        `SELECT * FROM tailormadetrain WHERE tailorMadeId = ?`,
        [gt.tailorMadeId]
      );

      const [notes] = await connection.execute(
        `SELECT * FROM tailormadedetails WHERE tailorMadeId = ?`,
        [gt.tailorMadeId]
      );

      const [[d2d]] = await connection.execute(
        `SELECT * FROM tailormaded2dtime WHERE tailorMadeId = ?`,
        [gt.tailorMadeId]
      );

      const [similarTours] = await connection.execute(
        `SELECT * FROM tailormades
         WHERE tourCode LIKE ? AND endDate >= ?`,
        [`%${gt.tourCode}`, gt.endDate]
      );

      // Prepare data for PDF
      const data = {
        tailormadesdata,
        cities,
        citiesCount: cities.length,
        countryName,
        detailedItinerary,
        inclusions,
        exclusions,
        tourPrice,
        flightDetails,
        trainDetails,
        notes,
        d2d,
        similarTours
      };

      // Render HTML with EJS template (similar to Blade)
      const templatePath = path.join(process.cwd(), 'views', 'tailormadeprint.ejs');
      const html = await ejs.renderFile(templatePath, data);

      // Generate PDF with Puppeteer
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const printName = `${tailormadesdata.tourName}_tailormadeprint${Date.now()}.pdf`;
      const pdfPath = path.join(pdfDirectory, printName);

      await page.pdf({ path: pdfPath, format: 'A4' });
      await browser.close();

      // Save PDF URL in DB
      const printUrl = `/public/tailormadeprint/${printName}`;
      await connection.execute(
        `UPDATE tailormades SET printUrl = ? WHERE tailorMadeId = ?`,
        [printUrl, tailormadesdata.tailorMadeId]
      );

      console.log(`PDF created for tailorMadeId ${gt.tailorMadeId}`);
    }

    console.log('Tailor made print PDF generation completed.');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    if (connection) await connection.end();
  }
}

export default tailorMadePrintCron;
