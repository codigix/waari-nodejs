import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import cron from "node-cron";
import "dotenv/config"; // to load .env

// Supabase connection
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Function to send WhatsApp message
async function sendWhatsAppMessage(messageData) {
  try {
    const response = await axios.post(
      "https://api.interakt.ai/v1/public/message/",
      messageData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${process.env.INTERAKT_API_KEY}`, // move key to env
        },
      }
    );
    console.log("WhatsApp API Response:", response.data);
  } catch (error) {
    console.error("Error sending WhatsApp:", error.message);
  }
}

// Main job logic
async function runFeedbackJob() {
  try {
    const { data: enquiryDetails, error: enquiryError } = await supabase
      .from("enquirycustomtours")
      .select("*")
      .eq("enquiryProcess", 2);

    if (enquiryError) throw enquiryError;

    for (const enquiryDetail of enquiryDetails) {
      const tourEndDate = new Date(enquiryDetail.endDate);
      const currentDate = new Date();
      const differenceDays = Math.floor(
        (currentDate - tourEndDate) / (1000 * 60 * 60 * 24)
      );

      if (differenceDays === 2) {
        const { data: familyHeadDetails, error: familyError } = await supabase
          .from("customtourdiscountdetails")
          .select("*")
          .eq("enquiryCustomId", enquiryDetail.enquiryCustomId);

        if (familyError) throw familyError;

        for (const familyHeadDetail of familyHeadDetails) {
          const { data: familyHeadCancelTour, error: cancelError } = await supabase
            .from("customtourguestdetails")
            .select("*")
            .eq("enquiryDetailCustomId", familyHeadDetail.enquiryDetailCustomId)
            .eq("isCancel", 0)
            .limit(1);

          if (cancelError) throw cancelError;

          if (familyHeadCancelTour.length > 0) {
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
                  enquiryDetail.groupName,
                  `${process.env.APP_URL}/feedback-form`,
                ],
              },
            };

            await sendWhatsAppMessage(messageData);
          }
        }
      }
    }

    console.log("Messages sent successfully");
  } catch (err) {
    console.error("An error occurred:", err.message);
  }
}

// Schedule job to run daily at 10 AM
cron.schedule("0 10 * * *", runFeedbackJob);

// For testing now
// runFeedbackJob();
