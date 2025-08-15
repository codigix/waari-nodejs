// commands/tailorMadePrintCron.js

import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import ejs from 'ejs';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Service Role Key for R/W operations
);

async function tailorMadePrintCron() {
  try {
    // Ensure directory exists (local save before upload)
    const pdfDirectory = path.join(process.cwd(), 'public', 'tailormadeprint');
    if (!fs.existsSync(pdfDirectory)) {
      fs.mkdirSync(pdfDirectory, { recursive: true });
    }

    // Fetch tailorMade data without printUrl
    const { data: tailorMadeData, error: fetchError } = await supabase
      .from('tailormades')
      .select('*')
      .is('printUrl', null);

    if (fetchError) throw fetchError;

    for (const gt of tailorMadeData) {
      // Fetch related data
      const { data: tailormadesdata } = await supabase
        .from('tailormades')
        .select('*')
        .eq('tailorMadeId', gt.tailorMadeId)
        .single();

      const { data: countryData } = await supabase
        .from('countries')
        .select('countryName')
        .eq('countryId', gt.countryId) // Assuming countryId exists in tailorMades
        .single();

      const countryName = countryData?.countryName || '';

      const { data: cities } = await supabase
        .from('tailormadecity')
        .select('citiesName:cities(citiesName)')
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

      const { data: notes } = await supabase
        .from('tailormadedetails')
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

      // Prepare data for PDF
      const data = {
        tailormadesdata,
        cities: cities?.map(c => c.citiesName) || [],
        citiesCount: cities?.length || 0,
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

      // Render HTML with EJS template
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

      // Upload to Supabase Storage
      const fileBuffer = fs.readFileSync(pdfPath);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('tailormade-pdfs') // Your bucket name
        .upload(printName, fileBuffer, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase
        .storage
        .from('tailormade-pdfs')
        .getPublicUrl(printName);

      // Save PDF URL in DB
      await supabase
        .from('tailormades')
        .update({ printUrl: publicUrlData.publicUrl })
        .eq('tailorMadeId', tailormadesdata.tailorMadeId);

      console.log(`PDF created for tailorMadeId ${gt.tailorMadeId}`);
    }

    console.log('Tailor made print PDF generation completed.');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

export default tailorMadePrintCron;
