const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

class GeneratePdf {
  constructor(data) {
    this.data = data;
  }

  async handle() {
    try {
      const tourName = this.data.grouptoursdata.tourName;
      const groupTourId = this.data.grouptoursdata.groupTourId;

      // Generate predeparture PDF
      const predepartureFilename = `${tourName}_predeparture_${Date.now()}.pdf`;
      const predeparturePath = path.join(__dirname, '../../public/predeparture', predepartureFilename);

      const predepartureDoc = new PDFDocument();
      predepartureDoc.pipe(fs.createWriteStream(predeparturePath));
      predepartureDoc.text('Predeparture Content'); // Add your dynamic content here
      predepartureDoc.end();

      // Optionally, upload PDF to Supabase storage instead of keeping locally
      const fileBuffer = fs.readFileSync(predeparturePath);
      const { error: uploadError } = await supabase
        .storage
        .from('pdfs') // your Supabase storage bucket name
        .upload(`predeparture/${predepartureFilename}`, fileBuffer, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadError) throw new Error(uploadError.message);

      // Create public URL from Supabase storage
      const { data: publicUrlData } = supabase
        .storage
        .from('pdfs')
        .getPublicUrl(`predeparture/${predepartureFilename}`);

      const predepartureUrl = publicUrlData.publicUrl;

      // Update the database record
      const { error: updateError } = await supabase
        .from('grouptours')
        .update({ predepartureUrl })
        .eq('groupTourId', groupTourId);

      if (updateError) throw new Error(updateError.message);

      console.log('PDF generated and URL updated:', predepartureUrl);

    } catch (error) {
      console.error('Error generating PDF:', error.message);
    }
  }
}

module.exports = GeneratePdf;
