// commands/predepartureCron.js

import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import puppeteer from "puppeteer"; // For HTML-to-PDF
import ejs from "ejs"; // To render HTML template like Laravel's Blade

// Database connection
const db = await mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "your_db_name"
});

export async function predepartureCron() {
  try {
    // Create directory if not exists
    const pdfDirectory = path.join(process.cwd(), "public", "predeparture");
    if (!fs.existsSync(pdfDirectory)) {
      fs.mkdirSync(pdfDirectory, { recursive: true });
    }

    // Fetch group tours where predepartureUrl is NULL
    const [groupTours] = await db.query(
      `SELECT * FROM grouptours WHERE predepartureUrl IS NULL AND groupTourProcess = 1`
    );

    for (let gt of groupTours) {
      const [[grouptoursdata]] = await db.query(
        `SELECT * FROM grouptours WHERE groupTourId = ?`,
        [gt.groupTourId]
      );

      const [[country]] = await db.query(
        `SELECT countryName FROM countries WHERE countryId = ?`,
        [gt.groupTourId] // NOTE: check this, seems like it should be `countryId` from group tour
      );

      const [cities] = await db.query(
        `SELECT citiesName FROM grouptourscity 
         JOIN cities ON grouptourscity.cityId = cities.citiesId
         WHERE groupTourId = ?`,
        [gt.groupTourId]
      );

      const [skeletonItinerary] = await db.query(
        `SELECT * FROM grouptourskeletonitinerary WHERE groupTourId = ?`,
        [gt.groupTourId]
      );

      const [detailedItinerary] = await db.query(
        `SELECT * FROM grouptourdetailitinerary WHERE groupTourId = ?`,
        [gt.groupTourId]
      );

      const [inclusions] = await db.query(
        `SELECT * FROM inclusions WHERE groupTourId = ?`,
        [gt.groupTourId]
      );

      const [exclusions] = await db.query(
        `SELECT * FROM exclusions WHERE groupTourId = ?`,
        [gt.groupTourId]
      );

      const [tourPrice] = await db.query(
        `SELECT * FROM grouptourpricediscount
         JOIN dropdownroomsharing ON grouptourpricediscount.roomShareId = dropdownroomsharing.roomShareId
         WHERE grouptourpricediscount.groupTourId = ?`,
        [gt.groupTourId]
      );

      const [flightDetails] = await db.query(
        `SELECT * FROM grouptourflight WHERE groupTourId = ?`,
        [gt.groupTourId]
      );

      const [trainDetails] = await db.query(
        `SELECT * FROM grouptourtrain WHERE groupTourId = ?`,
        [gt.groupTourId]
      );

      const [[d2d]] = await db.query(
        `SELECT * FROM grouptourd2dtime WHERE groupTourId = ?`,
        [gt.groupTourId]
      );

      const citiesCount = cities.length;

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
        citiesCount,
        countryName: country?.countryName || "",
        d2d
      };

      // Render HTML from template (like Blade)
      const html = await ejs.renderFile(
        path.join(process.cwd(), "views", "predeparture.ejs"),
        data
      );

      // Generate PDF
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });

      const fileName = `${grouptoursdata.tourName}_predeparture_${Date.now()}.pdf`;
      const filePath = path.join(pdfDirectory, fileName);

      await page.pdf({ path: filePath, format: "A4" });
      await browser.close();

      const predepartureUrl = `/public/predeparture/${fileName}`;

      // Update database
      await db.query(
        `UPDATE grouptours SET predepartureUrl = ? WHERE groupTourId = ?`,
        [predepartureUrl, grouptoursdata.groupTourId]
      );

      console.log(`PDF generated for Group Tour ID: ${gt.groupTourId}`);
    }

    console.log("Group tour predeparture PDFs updated successfully.");
  } catch (err) {
    console.error("Error:", err.message);
  }
}

// Run if file is executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  predepartureCron();
}
