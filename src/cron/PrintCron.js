// printCron.js - Supabase version
require("dotenv").config();
const path = require("path");
const fs = require("fs");
const pdf = require("pdf-creator-node");
const handlebars = require("handlebars");
const { createClient } = require("@supabase/supabase-js");

// Supabase connection
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function printCron() {
    try {
        // 1. Get all unprinted group tours
        const { data: groupTours, error: groupToursError } = await supabase
            .from("grouptours")
            .select("*")
            .is("printUrl", null)
            .eq("groupTourProcess", 1);

        if (groupToursError) throw groupToursError;
        if (!groupTours.length) {
            console.log("No group tours to print");
            return;
        }

        for (const gt of groupTours) {
            // 2. Fetch all related data
            const { data: grouptoursdata } = await supabase
                .from("grouptours")
                .select("*")
                .eq("groupTourId", gt.groupTourId)
                .single();

            const { data: countryData } = await supabase
                .from("countries")
                .select("countryName")
                .eq("countryId", gt.groupTourId)
                .single();
            const countryName = countryData?.countryName || "";

            const { data: cities } = await supabase
                .from("grouptourscity")
                .select("cities(citiesName)")
                .eq("groupTourId", gt.groupTourId);

            const { data: skeletonItinerary } = await supabase
                .from("grouptourskeletonitinerary")
                .select("*")
                .eq("groupTourId", gt.groupTourId);

            const { data: detailedItinerary } = await supabase
                .from("grouptourdetailitinerary")
                .select("*")
                .eq("groupTourId", gt.groupTourId);

            const { data: inclusions } = await supabase
                .from("inclusions")
                .select("*")
                .eq("groupTourId", gt.groupTourId);

            const { data: exclusions } = await supabase
                .from("exclusions")
                .select("*")
                .eq("groupTourId", gt.groupTourId);

            const { data: tourPrice } = await supabase
                .from("grouptourpricediscount")
                .select("*, dropdownroomsharing(*)")
                .eq("groupTourId", gt.groupTourId);

            const { data: flightDetails } = await supabase
                .from("grouptourflight")
                .select("*")
                .eq("groupTourId", gt.groupTourId);

            const { data: trainDetails } = await supabase
                .from("grouptourtrain")
                .select("*")
                .eq("groupTourId", gt.groupTourId);

            const { data: notes } = await supabase
                .from("grouptourdetails")
                .select("*")
                .eq("groupTourId", gt.groupTourId);

            const { data: d2d } = await supabase
                .from("grouptourd2dtime")
                .select("*")
                .eq("groupTourId", gt.groupTourId)
                .single();

            const { data: similarTours } = await supabase
                .from("grouptours")
                .select("*")
                .ilike("tourCode", `%${gt.tourCode}`)
                .gte("endDate", gt.endDate);

            // 3. Prepare data for template
            const data = {
                grouptoursdata,
                cities: cities?.map(c => c.cities) || [],
                detailedItinerary,
                inclusions,
                exclusions,
                tourPrice,
                flightDetails,
                trainDetails,
                skeletonItinerary,
                citiesCount: cities?.length || 0,
                countryName,
                notes,
                d2d,
                similarTours
            };

            // 4. Load HTML template
            const templatePath = path.join(__dirname, "../views/print-template.html");
            const htmlTemplate = fs.readFileSync(templatePath, "utf8");
            const compiledTemplate = handlebars.compile(htmlTemplate);
            const html = compiledTemplate(data);

            // 5. PDF options
            const pdfOptions = {
                format: "A4",
                orientation: "portrait",
                border: "10mm"
            };

            // 6. Generate PDF in temp file
            const tempFilePath = path.join(__dirname, `${grouptoursdata.tourName}_print_${Date.now()}.pdf`);
            await pdf.create({ html, data, path: tempFilePath, type: "" }, pdfOptions);

            // 7. Upload PDF to Supabase Storage
            const fileBuffer = fs.readFileSync(tempFilePath);
            const fileName = `${gt.groupTourId}_${Date.now()}.pdf`;
            const { error: uploadError } = await supabase.storage
                .from("prints") // make sure bucket "prints" exists
                .upload(fileName, fileBuffer, {
                    contentType: "application/pdf",
                    upsert: true
                });

            fs.unlinkSync(tempFilePath); // remove local temp file

            if (uploadError) throw uploadError;

            // 8. Get public URL
            const { data: publicUrlData } = supabase.storage
                .from("prints")
                .getPublicUrl(fileName);

            const printUrl = publicUrlData.publicUrl;

            // 9. Update DB with print URL
            const { error: updateError } = await supabase
                .from("grouptours")
                .update({ printUrl })
                .eq("groupTourId", gt.groupTourId);

            if (updateError) throw updateError;
        }

        console.log("✅ Group tour print PDFs created & uploaded to Supabase Storage");
    } catch (err) {
        console.error("❌ Error:", err.message);
    }
}

module.exports = printCron;
