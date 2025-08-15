// tailormadePredepartureCron.js
import fs from 'fs';
import path from 'path';
import ejs from 'ejs';
import PdfPrinter from 'pdfmake';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function runCron() {
  try {
    const pdfDirectory = path.join(process.cwd(), 'public/tailormadepredeparture');
    if (!fs.existsSync(pdfDirectory)) {
      fs.mkdirSync(pdfDirectory, { recursive: true });
    }

    const { data: tailorMadeList, error: tmError } = await supabase
      .from('tailormades')
      .select('*')
      .is('predepartureUrl', null);

    if (tmError) throw tmError;

    for (const tm of tailorMadeList) {
      // Fetch related data
      const { data: tailormadesdata } = await supabase
        .from('tailormades')
        .select('*')
        .eq('tailorMadeId', tm.tailorMadeId);

      const { data: countryData } = await supabase
        .from('countries')
        .select('countryName')
        .eq('countryId', tm.tailorMadeId);

      const { data: cities } = await supabase
        .from('tailormadecity')
        .select('citiesName:cities(citiesName)')
        .eq('tailorMadeId', tm.tailorMadeId);

      const { data: detailedItinerary } = await supabase
        .from('tailormadedetailitinerary')
        .select('*')
        .eq('tailorMadeId', tm.tailorMadeId);

      const { data: inclusions } = await supabase
        .from('tailormadeinclusions')
        .select('*')
        .eq('tailorMadeId', tm.tailorMadeId);

      const { data: exclusions } = await supabase
        .from('tailormadeexclusions')
        .select('*')
        .eq('tailorMadeId', tm.tailorMadeId);

      const { data: tourPrice } = await supabase
        .from('tailormadepricediscount')
        .select('*')
        .eq('tailorMadeId', tm.tailorMadeId);

      const { data: flightDetails } = await supabase
        .from('tailormadeflight')
        .select('*')
        .eq('tailorMadeId', tm.tailorMadeId);

      const { data: trainDetails } = await supabase
        .from('tailormadetrain')
        .select('*')
        .eq('tailorMadeId', tm.tailorMadeId);

      const { data: d2d } = await supabase
        .from('tailormaded2dtime')
        .select('*')
        .eq('tailorMadeId', tm.tailorMadeId);

      const data = {
        tailormadesdata: tailormadesdata[0],
        cities: cities?.map(c => c.citiesName) || [],
        detailedItinerary,
        inclusions,
        exclusions,
        tourPrice,
        flightDetails,
        trainDetails,
        citiesCount: cities?.length || 0,
        countryName: countryData?.[0]?.countryName || '',
        d2d: d2d?.[0] || {},
        logopre: path.join(process.cwd(), 'public/images/logopre.webp')
      };

      // Render HTML
      const html = await ejs.renderFile(path.join(process.cwd(), 'views/tailormadepredeparture.ejs'), data);

      // PDF creation
      const fonts = {
        Jost: {
          normal: path.join(process.cwd(), 'fonts/Jost-Regular.ttf'),
          light: path.join(process.cwd(), 'fonts/Jost-Light.ttf')
        },
        Playfair: {
          normal: path.join(process.cwd(), 'fonts/PlayfairDisplay-Regular.ttf')
        }
      };
      const printer = new PdfPrinter(fonts);
      const docDefinition = {
        pageSize: { width: 229.99 * 2.835, height: 410.11 * 2.835 },
        pageMargins: [0, 0, 0, 0],
        content: [{ text: html, style: 'default' }],
        defaultStyle: { font: 'Jost' }
      };

      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const fileName = `${tailormadesdata[0].tourName}_tailormadepredeparture${Date.now()}.pdf`;
      const filePath = path.join(pdfDirectory, fileName);

      pdfDoc.pipe(fs.createWriteStream(filePath));
      pdfDoc.end();

      // Update Supabase
      const predepartureUrl = `/public/tailormadepredeparture/${fileName}`;
      await supabase
        .from('tailormades')
        .update({ predepartureUrl })
        .eq('tailorMadeId', tm.tailorMadeId);
    }

    console.log('Tailor made predeparture files updated.');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

runCron();
