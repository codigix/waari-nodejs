// happyJourneyCron.js
import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import cron from "node-cron";

// Supabase connection
const supabase = createClient(
  "https://YOUR_PROJECT.supabase.co",
  "YOUR_ANON_KEY"
);

// Function to send WhatsApp message
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

async function runHappyJourneyJob() {
  try {
    const { data: enquiryDetails, error: enquiryErr } = await supabase
      .from("enquirygrouptours")
      .select("*")
      .eq("enquiryProcess", 2);

    if (enquiryErr) throw enquiryErr;

    for (const enquiryDetail of enquiryDetails) {
      const { data: groupTours, error: groupErr } = await supabase
        .from("grouptours")
        .select("*")
        .eq("groupTourId", enquiryDetail.groupTourId)
        .limit(1);

      if (groupErr) throw groupErr;
      if (!groupTours || groupTours.length === 0) continue;

      const groupTour = groupTours[0];
      const tourStartDate = new Date(groupTour.startDate);
      const oneDayBefore = new Date(tourStartDate);
      oneDayBefore.setDate(tourStartDate.getDate() - 1);

      const today = new Date().toISOString().split("T")[0];
      const oneDayBeforeFormatted = oneDayBefore.toISOString().split("T")[0];

      if (today === oneDayBeforeFormatted) {
        const { data: familyHeads, error: familyErr } = await supabase
          .from("grouptourdiscountdetails")
          .select("*")
          .eq("enquiryGroupId", enquiryDetail.enquiryGroupId);

        if (familyErr) throw familyErr;

        for (const familyHead of familyHeads) {
          const { data: guestDetails, error: guestErr } = await supabase
            .from("grouptourguestdetails")
            .select("*")
            .eq("familyHeadGtId", familyHead.familyHeadGtId)
            .eq("isCancel", 0)
            .limit(1);

          if (guestErr) throw guestErr;

          if (guestDetails.length > 0) {
            const messageData = {
              countryCode: "+91",
              phoneNumber: familyHead.phoneNo || "",
              callbackData: "some text here",
              type: "Template",
              template: {
                name: "happy_journey_message_e6",
                languageCode: "en",
                bodyValues: [familyHead.billingName, groupTour.tourName],
              },
            };
            await sendWhatsAppMessage(messageData);
          }
        }
      }
    }

    console.log("✅ Group Tour Happy Journey Messages sent successfully");
  } catch (err) {
    console.error("❌ Error in HappyJourneyCron:", err.message);
  }
}

// Run every day at 10 AM
cron.schedule("0 10 * * *", runHappyJourneyJob);

// Uncomment for testing
// runHappyJourneyJob();
