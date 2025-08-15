// cron/pdfCron.js
import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import ejs from "ejs";
import cron from "node-cron";

// Database connection
const db = await mysql.createPool({
  host: "localhost",
  user: "root",
  password: "password",
  database: "dbname",
});

// Function to fetch data and generate PDFs
async function generatePdfs() {
  try {
    // 1. Get active tours
    const [tours] = await db.query(`
      SELECT * FROM group_tour_master 
      WHERE isActive = 1
    `);

    for (const tour of tours) {
      // 2. Get detailed itinerary
      const [itinerary] = await db.query(
        "SELECT * FROM grouptourdetailitinerary WHERE groupTourId = ?",
        [tour.groupTourId]
      );

      // 3. Get group tour data
      const [groupTourData] = await db.query(
        `SELECT * FROM group_tour_master 
         WHERE tourCode LIKE ? LIMIT 1`,
        [`%${tour.tourCode}%`]
      );

      if (!groupTourData.length) continue;
      const tourData = groupTourData[0];

      // 4. Get country name
      const [country] = await db.query(
        "SELECT countryName FROM countries WHERE countryId = ? LIMIT 1",
        [tourData.countryId]
      );
      const countryName = country.length ? country[0].countryName : "";

      // 5. Render HTML from EJS template
      const templatePath = path.join(process.cwd(), "views", "pdfTemplate.ejs");
      const html = await ejs.renderFile(templatePath, {
        tour,
        tourData,
        itinerary,
        countryName,
      });

      // 6. Create PDF
      const pdfDir = path.join(process.cwd(), "public", "pdf");
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }

      const filename = `${tourData.tourName}_pdf_${Date.now()}.pdf`;
      const filePath = path.join(pdfDir, filename);

      const doc = new PDFDocument();
      doc.pipe(fs.createWriteStream(filePath));
      doc.text(html, { align: "left" });
      doc.end();

      // 7. Update DB
      const pdfUrl = `/pdf/${filename}`;
      await db.query(
        "UPDATE group_tour_master SET pdfPath = ? WHERE groupTourId = ?",
        [pdfUrl, tourData.groupTourId]
      );

      console.log(`✅ PDF generated for ${tourData.tourName}`);
    }
  } catch (error) {
    console.error("❌ Error generating PDFs:", error);
  }
}

// Run every day at midnight
cron.schedule("0 0 * * *", generatePdfs);
