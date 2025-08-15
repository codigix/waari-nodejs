// tailormadePdfCron.js
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import ejs from 'ejs';

// MySQL connection
const db = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'your_db'
});

async function modifyItineraryDescriptions(detailedItinerary) {
  return detailedItinerary.map(itinerary => {
    const pattern = /<li[^>]*>(.*?)<\/li>/gi;
    const matches = [...itinerary.description.matchAll(pattern)].map(m => m[1]);

    if (!matches.length) {
      return { ...itinerary, description: itinerary.description };
    }

    let newDescription = '<table>';
    matches.forEach(item => {
      newDescription += `
        <tr>
          <td style="vertical-align: top;padding-right: 10px;padding-top: 20px;">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M4 8C6.20914 8 8 6.20914 8 4C8 1.79086 6.20914 0 4 0C1.79086 0 0 1.79086 0 4C0 6.20914 1.79086 8 4 8Z" fill="black"/>
            </svg>
          </td>
          <td style="font-size:30px;line-height:160%;vertical-align: top;">${item}</td>
        </tr>`;
    });
    newDescription += '</table>';

    return { ...itinerary, description: newDescription };
  });
}

async function run() {
  try {
    const pdfDir = path.join(process.cwd(), 'public', 'tailorpdf');
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }

    const [tailorMadeData] = await db.execute(`
      SELECT * FROM tailormades WHERE pdfUrl IS NULL
    `);

    for (let gt of tailorMadeData) {
      const [[tailormadesdata]] = await db.execute(
        'SELECT * FROM tailormades WHERE tailorMadeId = ?',
        [gt.tailorMadeId]
      );

      const [[{ countryName } = {}]] = await db.execute(
        'SELECT countryName FROM countries WHERE countryId = ?',
        [gt.tailorMadeId] // likely should be tailormadesdata.countryId
      );

      const [cities] = await db.execute(
        `SELECT citiesName
         FROM tailormadecity
         JOIN cities ON tailormadecity.cityId = cities.citiesId
         WHERE tailorMadeId = ?`,
        [gt.tailorMadeId]
      );

      const [detailedItinerary] = await db.execute(
        'SELECT * FROM tailormadedetailitinerary WHERE tailorMadeId = ?',
        [gt.tailorMadeId]
      );

      const [inclusions] = await db.execute(
        'SELECT * FROM tailormadeinclusions WHERE tailorMadeId = ?',
        [gt.tailorMadeId]
      );

      const [exclusions] = await db.execute(
        'SELECT * FROM tailormadeexclusions WHERE tailorMadeId = ?',
        [gt.tailorMadeId]
      );

      const [tourPrice] = await db.execute(
        'SELECT * FROM tailormadepricediscount WHERE tailorMadeId = ?',
        [gt.tailorMadeId]
      );

      const [flightDetails] = await db.execute(
        'SELECT * FROM tailormadeflight WHERE tailorMadeId = ?',
        [gt.tailorMadeId]
      );

      const [trainDetails] = await db.execute(
        'SELECT * FROM tailormadetrain WHERE tailorMadeId = ?',
        [gt.tailorMadeId]
      );

      const [[d2d]] = await db.execute(
        'SELECT * FROM tailormaded2dtime WHERE tailorMadeId = ?',
        [gt.tailorMadeId]
      );

      const [similarTours] = await db.execute(
        'SELECT * FROM tailormades WHERE tourCode LIKE ? AND endDate >= ?',
        [`%${gt.tourCode}`, gt.endDate]
      );

      const modifiedItinerary = await modifyItineraryDescriptions(detailedItinerary);

      const data = {
        tailormadesdata,
        cities,
        detailedItinerary: modifiedItinerary,
        inclusions,
        exclusions,
        tourPrice,
        flightDetails,
        trainDetails,
        citiesCount: cities.length,
        countryName,
        d2d,
        similarTours,
        // Images for template
        target011: path.join('public', 'images', 'target011.webp'),
        lineImg: path.join('public', 'images', 'Line3.svg'),
        day1: path.join('public', 'images', 'Day-11.jpg'),
        target015: path.join('public', 'images', 'target015.webp'),
        target010: path.join('public', 'images', 'target010.webp'),
        target012: path.join('public', 'images', 'target012.webp'),
        target013: path.join('public', 'images', 'target013.webp'),
        mainlogo: path.join('public', 'images', 'mainlogo.png'),
        target002: path.join('public', 'images', 'target002.webp'),
        target003: path.join('public', 'images', 'target003.webp'),
        target004: path.join('public', 'images', 'target004.webp'),
        overlay: path.join('public', 'images', 'overlay.webp'),
        target008: path.join('public', 'images', 'target008.webp'),
        logo16: path.join('public', 'images', 'logo16.webp'),
        logo11: path.join('public', 'images', 'govtOfIndia.jpeg'),
        logo15: path.join('public', 'images', 'logo15.webp'),
        logo13: path.join('public', 'images', 'logo13.webp'),
        logo14: path.join('public', 'images', 'logo14.webp'),
        logo12: path.join('public', 'images', 'logo12.webp')
      };

      // Render EJS template
      const html = await ejs.renderFile(
        path.join(process.cwd(), 'views', 'tailor_pdf_new.ejs'),
        data
      );

      // Generate PDF
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const filename = `${tailormadesdata.tourName}_tailorpdf_${Date.now()}.pdf`;
      const filePath = path.join(pdfDir, filename);

      await page.pdf({
        path: filePath,
        format: 'A4', // Or use custom size: { width: '229.99mm', height: '410.11mm' }
        printBackground: true
      });

      await browser.close();

      const pdfUrl = `/public/tailorpdf/${filename}`;
      await db.execute(
        'UPDATE tailormades SET pdfUrl = ? WHERE tailorMadeId = ?',
        [pdfUrl, tailormadesdata.tailorMadeId]
      );

      console.log(`Generated PDF: ${filename}`);
    }

    console.log('Tailor Made PDFs created successfully.');
    process.exit();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

run();
