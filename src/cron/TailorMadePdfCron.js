// tailormadePdfCronSupabase.js
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import ejs from 'ejs';

// Supabase connection
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key for server-side
);

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

    // Get all tailorMade records without pdfUrl
    const { data: tailorMadeData, error: err1 } = await supabase
      .from('tailormades')
      .select('*')
      .is('pdfUrl', null);

    if (err1) throw err1;

    for (let gt of tailorMadeData) {
      const { data: tailormadesdata } = await supabase
        .from('tailormades')
        .select('*')
        .eq('tailorMadeId', gt.tailorMadeId)
        .single();

      const { data: countryRow } = await supabase
        .from('countries')
        .select('countryName')
        .eq('countryId', tailormadesdata.countryId)
        .single();

      const { data: cities } = await supabase
        .from('tailormadecity')
        .select('citiesName: cities (citiesName)')
        .eq('tailorMadeId', gt.tailorMadeId);

      const { data: detailedItinerary } = await supabase
        .from('tailormadedetailitinerary')
        .select('*')
        .eq('tailorMadeId', gt.tailorMadeId);

      const { data: inclusions } = await supabase
        .from('tailormadeinclusions')
        .select('*')
        .eq('tailorMadeId', gt.tailorMadeId);

      const { data: exclusions } = await supabase
        .from('tailormadeexclusions')
        .select('*')
        .eq('tailorMadeId', gt.tailorMadeId);

      const { data: tourPrice } = await supabase
        .from('tailormadepricediscount')
        .select('*')
        .eq('tailorMadeId', gt.tailorMadeId);

      const { data: flightDetails } = await supabase
        .from('tailormadeflight')
        .select('*')
        .eq('tailorMadeId', gt.tailorMadeId);

      const { data: trainDetails } = await supabase
        .from('tailormadetrain')
        .select('*')
        .eq('tailorMadeId', gt.tailorMadeId);

      const { data: d2d } = await supabase
        .from('tailormaded2dtime')
        .select('*')
        .eq('tailorMadeId', gt.tailorMadeId)
        .single();

      const { data: similarTours } = await supabase
        .from('tailormades')
        .select('*')
        .ilike('tourCode', `%${gt.tourCode}`)
        .gte('endDate', gt.endDate);

      const modifiedItinerary = await modifyItineraryDescriptions(detailedItinerary);

      const data = {
        tailormadesdata,
        cities: cities.map(c => ({ citiesName: c.citiesName })),
        detailedItinerary: modifiedItinerary,
        inclusions,
        exclusions,
        tourPrice,
        flightDetails,
        trainDetails,
        citiesCount: cities.length,
        countryName: countryRow?.countryName || '',
        d2d,
        similarTours,
        // Images
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

      // Render EJS
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
        format: 'A4',
        printBackground: true
      });

      await browser.close();

      const pdfUrl = `/public/tailorpdf/${filename}`;
      await supabase
        .from('tailormades')
        .update({ pdfUrl })
        .eq('tailorMadeId', tailormadesdata.tailorMadeId);

      console.log(`Generated PDF: ${filename}`);
    }

    console.log('✅ Tailor Made PDFs created successfully.');
    process.exit();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

run();
