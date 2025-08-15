// preTourCronCt.js (Supabase Version)
import cron from "node-cron";
import axios from "axios";
import dayjs from "dayjs";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

// Supabase connection
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Service role for full read access
);

// Cron job - runs every day at 00:00
cron.schedule("0 0 * * *", async () => {
  console.log("🚀 Running PreTourCronCt job...");

  try {
    // 1. Fetch enquiry details for tours in process
    const { data: enquiryDetails, error: enquiryError } = await supabase
      .from("enquirycustomtours")
      .select("*")
      .eq("enquiryProcess", 2);

    if (enquiryError) throw enquiryError;

    for (const enquiry of enquiryDetails) {
      const tourStartDate = dayjs(enquiry.startDate);
      const tenDaysBefore = tourStartDate.subtract(10, "day").format("YYYY-MM-DD");
      const currentDate = dayjs().format("YYYY-MM-DD");

      if (currentDate === tenDaysBefore) {
        // 2. Get family head details
        const { data: familyHeadDetails, error: familyError } = await supabase
          .from("customtourdiscountdetails")
          .select("*")
          .eq("enquiryCustomId", enquiry.enquiryCustomId);

        if (familyError) throw familyError;

        for (const family of familyHeadDetails) {
          // 3. Check family head cancel status
          const { data: cancelCheck, error: cancelError } = await supabase
            .from("customtourguestdetails")
            .select("*")
            .eq("enquiryDetailCustomId", family.enquiryDetailCustomId)
            .eq("isCancel", 0)
            .limit(1);

          if (cancelError) throw cancelError;

          if (cancelCheck.length > 0) {
            const messageData = {
              countryCode: "+91",
              phoneNumber: family.phoneNo || "",
              callbackData: "some text here",
              type: "Template",
              template: {
                name: "ten_days_prior_message",
                languageCode: "en",
                bodyValues: [family.billingName, enquiry.groupName],
              },
            };

            try {
              await axios.post("https://api.interakt.ai/v1/public/message/", messageData, {
                headers: {
                  "Content-Type": "application/json",
                  Authorization:
                    "Basic eTBPQnZHN2dSd3lvVW1HdXlqS2o5Y3FlNG9uQXQ2b3R0UkNLYjlDRmU3Zzo=",
                },
              });
              console.log(`✅ Message sent to ${family.phoneNo}`);
            } catch (err) {
              console.error(`❌ Failed to send message to ${family.phoneNo}:`, err.message);
            }
          }
        }
      }
    }

    console.log("✅ Messages sent successfully");
  } catch (error) {
    console.error("❌ An error occurred:", error.message);
  }
});
