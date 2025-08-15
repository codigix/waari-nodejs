// commands/predepartureCron.js
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import ejs from "ejs";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function predepartureCron() {
  try {
    const pdfDirectory = path.join(process.cwd(), "public", "predeparture");
    if (!fs.existsSync(pdfDirectory)) {
      fs.mkdirSync(pdfDirectory, { recursive: true });
    }

    const { data: groupTours, error } = await supabase
      .from("grouptours")
      .select("*")
      .is("predepartureUrl", null)
      .eq("groupTourProcess", 1);

    if (error) throw error;

    for (let gt of groupTours) {
      const { data: grouptoursdata } = await supabase
        .from("grouptours")
        .select("*")
        .eq("groupTourId", gt.groupTourId)
        .single();

      const { data: country } = await supabase
        .from("countries")
        .select("countryName")
        .eq("countryId", grouptoursdata.countryId)
        .single();

      const { data: cities } = await supabase
        .from("grouptourscity")
        .select("cities:citiesId(citiesName)")
        .eq("groupTourId", gt.groupTourId);

      // fetch other related tables similarly...

      const html = await ejs.renderFile(
        path.join(process.cwd(), "views", "predeparture.ejs"),
        {
          grouptoursdata,
          cities,
          countryName: country?.countryName || "",
          // other fetched data here...
        }
      );

      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });

      const fileName = `${grouptoursdata.tourName}_predeparture_${Date.now()}.pdf`;
      const filePath = path.join(pdfDirectory, fileName);

      await page.pdf({ path: filePath, format: "A4" });
      await browser.close();

      const predepartureUrl = `/public/predeparture/${fileName}`;

      await supabase
        .from("grouptours")
        .update({ predepartureUrl })
        .eq("groupTourId", grouptoursdata.groupTourId);

      console.log(`✅ PDF generated for Group Tour ID: ${gt.groupTourId}`);
    }

    console.log("🎯 Predeparture PDFs updated successfully.");
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  predepartureCron();
}
