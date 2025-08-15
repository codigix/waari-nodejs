// happyJourneyCron.js

import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import cron from "node-cron";

// Supabase connection
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Send WhatsApp message
async function sendWhatsAppMessage(messageData) {
  try {
    const response = await axios.post(
      "https://api.interakt.ai/v1/public/message/",
      messageData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Basic eTBPQnZHN2dSd3lvVW1HdXlqS2o5Y3FlNG9uQXQ2b3R0UkNLYjlDRmU3Zzo=",
        },
      }
    );
    console.log("✅ WhatsApp sent:", response.data);
  } catch (error) {
    console.error("❌ WhatsApp send error:", error.message);
  }
}

// Main job
async function runHappyJourneyJob() {
  try {
    // Get enquiries with process = 2
    const { data: enquiryDetails, error: enquiryError } = await supabase
      .from("enquirygrouptours")
      .select("*")
      .eq("enquiryProcess", 2);

    if (enquiryError) throw enquiryError;

    for (const enquiryDetail of enquiryDetails) {
      // Get group tour
      const { data: groupTours, error: groupTourError } = await supabase
        .from("grouptours")
        .select("*")
        .eq("groupTourId", enquiryDetail.groupTourId)
        .limit(1);

      if (groupTourError) throw groupTourError;
      if (!groupTours || groupTours.length === 0) continue;

      const groupTour = groupTours[0];

      // One day before start
      const tourStartDate = new Date(groupTour.startDate);
      const oneDayBefore = new Date(tourStartDate);
      oneDayBefore.setDate(tourStartDate.getDate() - 1);

      const today = new Date();
      const todayFormatted = today.toISOString().split("T")[0];
      const oneDayBeforeFormatted = oneDayBefore.toISOString().split("T")[0];

      if (todayFormatted === oneDayBeforeFormatted) {
        // Get family head
        const { data: familyHeadDetails, error: familyError } = await supabase
          .from("grouptourdiscountdetails")
          .select("*")
          .eq("enquiryGroupId", enquiryDetail.enquiryGroupId);

        if (familyError) throw familyError;

        for (const familyHeadDetail of familyHeadDetails) {
          // Check guest not cancelled
          const { data: guestDetails, error: guestError } = await supabase
            .from("grouptourguestdetails")
            .select("*")
            .eq("familyHeadGtId", familyHeadDetail.familyHeadGtId)
            .eq("isCancel", 0)
            .limit(1);

          if (guestError) throw guestError;
          if (!guestDetails || guestDetails.length === 0) continue;

          const messageData = {
            countryCode: "+91",
            phoneNumber: familyHeadDetail.phoneNo || "",
            callbackData: "some text here",
            type: "Template",
            template: {
              name: "happy_journey_message_e6",
              languageCode: "en",
              bodyValues: [
                familyHeadDetail.billingName,
                groupTour.tourName,
              ],
            },
          };

          await sendWhatsAppMessage(messageData);
        }
      }
    }

    console.log("✅ Happy Journey Messages sent successfully");
  } catch (err) {
    console.error("❌ Error in HappyJourneyCron:", err.message);
  }
}

// Run every day at 10 AM
cron.schedule("0 10 * * *", runHappyJourneyJob);

// Uncomment to test now
// runHappyJourneyJob();
