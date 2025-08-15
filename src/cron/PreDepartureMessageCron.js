// preDepartureMessageCron.js (Supabase version)
import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import dotenv from "dotenv";
import cron from "node-cron";
import path from "path";

dotenv.config();

// Supabase connection
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function preDepartureMessageCron() {
  try {
    // 1. Fetch enquiry details for tours in process
    const { data: enquiryDetails, error: enquiryError } = await supabase
      .from("enquirygrouptours")
      .select("*")
      .eq("enquiryProcess", 2);

    if (enquiryError) throw enquiryError;

    for (let enquiry of enquiryDetails) {
      // 2. Get group tour details
      const { data: groupTourResult, error: groupTourError } = await supabase
        .from("grouptours")
        .select("*")
        .eq("groupTourId", enquiry.groupTourId)
        .limit(1);

      if (groupTourError) throw groupTourError;
      if (!groupTourResult.length) continue;

      const groupTour = groupTourResult[0];

      // 3. Calculate 7 days before start date
      const tourStartDate = new Date(groupTour.startDate);
      const oneDayBefore = new Date(tourStartDate);
      oneDayBefore.setDate(tourStartDate.getDate() - 7);

      const currentDate = new Date().toISOString().split("T")[0];
      const targetDate = oneDayBefore.toISOString().split("T")[0];

      if (currentDate !== targetDate) continue;

      // 4. Get family head details
      const { data: familyHeads, error: familyHeadsError } = await supabase
        .from("grouptourdiscountdetails")
        .select("*")
        .eq("enquiryGroupId", enquiry.enquiryGroupId);

      if (familyHeadsError) throw familyHeadsError;

      for (let familyHead of familyHeads) {
        // Check if not cancelled
        const { data: isNotCancelled, error: cancelError } = await supabase
          .from("grouptourguestdetails")
          .select("*")
          .eq("familyHeadGtId", familyHead.familyHeadGtId)
          .eq("isCancel", 0)
          .limit(1);

        if (cancelError) throw cancelError;
        if (!isNotCancelled.length) continue;

        // File name
        let fileName = path.basename(groupTour.pdfUrl).substring(0, 30);
        const pdfPath = `${process.env.APP_LOCAL_URL}${groupTour.pdfUrl}`;

        // WhatsApp message data
        const messageData = {
          countryCode: "+91",
          phoneNumber: familyHead.phoneNo || "",
          callbackData: "some text here",
          type: "Template",
          template: {
            name: "predeparture_message_7_days",
            languageCode: "en",
            headerValues: [pdfPath],
            fileName: fileName,
            bodyValues: [familyHead.billingName, groupTour.tourName],
          },
        };

        // 5. Send via Interakt API
        try {
          await axios.post("https://api.interakt.ai/v1/public/message/", messageData, {
            headers: {
              "Content-Type": "application/json",
              Authorization:
                "Basic eTBPQnZHN2dSd3lvVW1HdXlqS2o5Y3FlNG9uQXQ2b3R0UkNLYjlDRmU3Zzo=",
            },
          });
          console.log(`✅ Message sent to ${familyHead.billingName}`);
        } catch (apiErr) {
          console.error(`❌ Failed for ${familyHead.billingName}:`, apiErr.message);
        }
      }
    }

    console.log("✅ Pre-departure messages processed successfully");
  } catch (err) {
    console.error("❌ Cron job error:", err.message);
  }
}

// Schedule every day at 10 AM
cron.schedule("0 10 * * *", () => {
  console.log("🚀 Running Pre-departure Message Cron...");
  preDepartureMessageCron();
});
