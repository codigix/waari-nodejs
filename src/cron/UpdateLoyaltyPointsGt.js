// tailormadePrintCron.js - Supabase version
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import ejs from 'ejs';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Create Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function runTailorMadePrintCron() {
  try {
    const pdfDirectory = path.join(process.cwd(), 'public', 'tailormadeprint');
    if (!fs.existsSync(pdfDirectory)) {
      fs.mkdirSync(pdfDirectory, { recursive: true });
    }

    // 1. Get all tailorMade entries without printUrl
    const { data: tailorMadeData, error: tmError } = await supabase
      .from('tailormades')
      .select('*')
      .is('printUrl', null);

    if (tmError) throw tmError;

    for (const gt of tailorMadeData) {
      // Fetch related data
      const { data: tailormadesdata } = await supabase
        .from('tailormades')
        .select('*')
        .eq('tailorMadeId', gt.tailorMadeId)
        .single();

      const { data: countryRow } = await supabase
        .from('countries')
        .select('countryName')
        .eq('countryId', gt.tailorMadeId) // NOTE: verify column
        .single();
      const countryName = countryRow?.countryName || '';

      const { data: cities } = await supabase
        .from('tailormadecity')
        .select('cities(citiesName)')
        .eq('tailorMadeId', gt.tailorMadeId);

      const citiesCount = cities?.length || 0;

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
        .like('tourCode', `%${gt.tourCode}`)
        .gte('endDate', gt.endDate);

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
      const html = await ejs.renderFile(
        path.join(process.cwd(), 'views', 'tailormadeprint.ejs'),
        data
      );

      // Generate PDF
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const printname = `${tailormadesdata.tourName}_tailormadeprint${Date.now()}.pdf`;
      const pdfPath = path.join(pdfDirectory, printname);

      await page.pdf({ path: pdfPath, format: 'A4' });
      await browser.close();

      const printUrl = `/public/tailormadeprint/${printname}`;

      // Update record with PDF URL
      await supabase
        .from('tailormades')
        .update({ printUrl })
        .eq('tailorMadeId', gt.tailorMadeId);
    }

    console.log('Tailor made print PDFs created');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the cron
runTailorMadePrintCron();
