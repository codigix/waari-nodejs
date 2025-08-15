// tailormadePrintCron.js
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import puppeteer from 'puppeteer';
import ejs from 'ejs';
import dotenv from 'dotenv';

dotenv.config();

// DB Connection
const db = await mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10
});

async function runTailorMadePrintCron() {
  try {
    const pdfDirectory = path.join(process.cwd(), 'public', 'tailormadeprint');
    if (!fs.existsSync(pdfDirectory)) {
      fs.mkdirSync(pdfDirectory, { recursive: true });
    }

    // Get all tailorMade entries without printUrl
    const [tailorMadeData] = await db.query(
      `SELECT * FROM tailormades WHERE printUrl IS NULL`
    );

    for (const gt of tailorMadeData) {
      // Fetch related data
      const [[tailormadesdata]] = await db.query(
        `SELECT * FROM tailormades WHERE tailorMadeId = ?`,
        [gt.tailorMadeId]
      );

      const [[countryNameRow]] = await db.query(
        `SELECT countryName FROM countries WHERE countryId = ?`,
        [gt.tailorMadeId]
      );
      const countryName = countryNameRow?.countryName || '';

      const [cities] = await db.query(
        `SELECT citiesName FROM tailormadecity
         JOIN cities ON tailormadecity.cityId = cities.citiesId
         WHERE tailorMadeId = ?`,
        [gt.tailorMadeId]
      );
      const citiesCount = cities.length;

      const [detailedItinerary] = await db.query(
        `SELECT * FROM tailormadedetailitinerary WHERE tailorMadeId = ?`,
        [gt.tailorMadeId]
      );

      const [inclusions] = await db.query(
        `SELECT * FROM tailormadeinclusions WHERE tailorMadeId = ?`,
        [gt.tailorMadeId]
      );

      const [exclusions] = await db.query(
        `SELECT * FROM tailormadeexclusions WHERE tailorMadeId = ?`,
        [gt.tailorMadeId]
      );

      const [tourPrice] = await db.query(
        `SELECT * FROM tailormadepricediscount WHERE tailorMadeId = ?`,
        [gt.tailorMadeId]
      );

      const [flightDetails] = await db.query(
        `SELECT * FROM tailormadeflight WHERE tailorMadeId = ?`,
        [gt.tailorMadeId]
      );

      const [trainDetails] = await db.query(
        `SELECT * FROM tailormadetrain WHERE tailorMadeId = ?`,
        [gt.tailorMadeId]
      );

      const [notes] = await db.query(
        `SELECT * FROM tailormadedetails WHERE tailorMadeId = ?`,
        [gt.tailorMadeId]
      );

      const [[d2d]] = await db.query(
        `SELECT * FROM tailormaded2dtime WHERE tailorMadeId = ?`,
        [gt.tailorMadeId]
      );

      const [similarTours] = await db.query(
        `SELECT * FROM tailormades WHERE tourCode LIKE ? AND endDate >= ?`,
        [`%${gt.tourCode}`, gt.endDate]
      );

      const data = {
        tailormadesdata,
        cities,
        detailedItinerary,
        inclusions,
        exclusions,
        tourPrice,
        flightDetails,
        trainDetails,
        citiesCount,
        countryName,
        notes,
        d2d,
        similarTours
      };

      // Render HTML from template
      const html = await ejs.renderFile(path.join(process.cwd(), 'views', 'tailormadeprint.ejs'), data);

      // Generate PDF
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const printname = `${tailormadesdata.tourName}_tailormadeprint${Date.now()}.pdf`;
      const pdfPath = path.join(pdfDirectory, printname);

      await page.pdf({ path: pdfPath, format: 'A4' });
      await browser.close();

      const printUrl = `/public/tailormadeprint/${printname}`;

      // Update DB with new PDF path
      await db.query(
        `UPDATE tailormades SET printUrl = ? WHERE tailorMadeId = ?`,
        [printUrl, gt.tailorMadeId]
      );
    }

    console.log('Tailor made print PDF created');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the cron
runTailorMadePrintCron();
