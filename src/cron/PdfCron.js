// cron/pdfCron.js
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import ejs from "ejs";
import cron from "node-cron";

// Supabase connection
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // use service role for updates
);

async function generatePdfs() {
  try {
    // 1. Get active tours
    const { data: tours, error: toursError } = await supabase
      .from("group_tour_master")
      .select("*")
      .eq("isActive", 1);

    if (toursError) throw toursError;

    for (const tour of tours) {
      // 2. Get itinerary
      const { data: itinerary, error: itineraryError } = await supabase
        .from("grouptourdetailitinerary")
        .select("*")
        .eq("groupTourId", tour.groupTourId);

      if (itineraryError) throw itineraryError;

      // 3. Get group tour data
      const { data: groupTourData, error: groupTourError } = await supabase
        .from("group_tour_master")
        .select("*")
        .ilike("tourCode", `%${tour.tourCode}%`)
        .limit(1);

      if (groupTourError) throw groupTourError;
      if (!groupTourData.length) continue;
      const tourData = groupTourData[0];

      // 4. Get country name
      const { data: countryData, error: countryError } = await supabase
        .from("countries")
        .select("countryName")
        .eq("countryId", tourData.countryId)
        .limit(1);

      if (countryError) throw countryError;
      const countryName =
        countryData && countryData.length ? countryData[0].countryName : "";

      // 5. Render HTML from EJS template
      const templatePath = path.join(process.cwd(), "views", "pdfTemplate.ejs");
      const html = await ejs.renderFile(templatePath, {
        tour,
        tourData,
        itinerary,
        countryName,
      });

      // 6. Create PDF file
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

      // 7. Update Supabase record
      const pdfUrl = `/pdf/${filename}`;
      const { error: updateError } = await supabase
        .from("group_tour_master")
        .update({ pdfPath: pdfUrl })
        .eq("groupTourId", tourData.groupTourId);

      if (updateError) throw updateError;

      console.log(`✅ PDF generated for ${tourData.tourName}`);
    }
  } catch (error) {
    console.error("❌ Error generating PDFs:", error.message);
  }
}

// Schedule to run every midnight
cron.schedule("0 0 * * *", generatePdfs);

// Optional: run immediately for testing
// generatePdfs();
