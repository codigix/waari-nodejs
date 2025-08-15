// feedbackReqGtCron.js
import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import cron from "node-cron";
import "dotenv/config"; // loads variables from .env

// Supabase connection
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Send WhatsApp Message
async function sendWhatsAppMessage(messageData) {
  try {
    const response = await axios.post(
      "https://api.interakt.ai/v1/public/message/",
      messageData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${process.env.INTERAKT_API_KEY}`,
        },
      }
    );
    console.log("✅ WhatsApp sent:", response.data);
  } catch (error) {
    console.error("❌ WhatsApp error:", error.message);
  }
}

// Main Job
async function runFeedbackJob() {
  try {
    // Get enquiry details
    const { data: enquiryDetails, error: enquiryError } = await supabase
      .from("enquirygrouptours")
      .select("*")
      .eq("enquiryProcess", 2);

    if (enquiryError) throw enquiryError;

    for (const enquiryDetail of enquiryDetails) {
      // Get group tour details
      const { data: groupTours, error: groupError } = await supabase
        .from("grouptours")
        .select("*")
        .eq("groupTourId", enquiryDetail.groupTourId)
        .limit(1);

      if (groupError) throw groupError;
      if (!groupTours || groupTours.length === 0) continue;

      const groupTour = groupTours[0];

      // Calculate days difference
      const tourEndDate = new Date(groupTour.endDate);
      const currentDate = new Date();
      const differenceDays = Math.floor(
        (currentDate - tourEndDate) / (1000 * 60 * 60 * 24)
      );

      if (differenceDays === 2) {
        // Get family head details
        const { data: familyHeadDetails, error: familyError } = await supabase
          .from("grouptourdiscountdetails")
          .select("*")
          .eq("enquiryGroupId", enquiryDetail.enquiryGroupId);

        if (familyError) throw familyError;

        for (const familyHeadDetail of familyHeadDetails) {
          // Check if tour not cancelled
          const { data: guestDetails, error: guestError } = await supabase
            .from("grouptourguestdetails")
            .select("*")
            .eq("familyHeadGtId", familyHeadDetail.familyHeadGtId)
            .eq("isCancel", 0)
            .limit(1);

          if (guestError) throw guestError;

          if (guestDetails.length > 0) {
            const messageData = {
              countryCode: "+91",
              phoneNumber: familyHeadDetail.phoneNo || "",
              callbackData: "some text here",
              type: "Template",
              template: {
                name: "feedback_request_form",
                languageCode: "en",
                bodyValues: [
                  familyHeadDetail.billingName,
                  groupTour.tourName,
                  `${process.env.APP_URL}/feedback-form`,
                ],
              },
            };

            await sendWhatsAppMessage(messageData);
          }
        }
      }
    }

    console.log("✅ Messages sent successfully");
  } catch (err) {
    console.error("❌ Error in job:", err.message);
  }
}

// Run every day at 10 AM
cron.schedule("0 10 * * *", runFeedbackJob);

// For testing:
// runFeedbackJob();
