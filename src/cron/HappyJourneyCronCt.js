// happyJourneyCronCt.js

import mysql from "mysql2/promise";
import axios from "axios";
import cron from "node-cron";

// DB connection
const db = await mysql.createPool({
  host: "localhost",
  user: "root",
  password: "your_password",
  database: "your_database",
});

// Send WhatsApp message function
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

// Main job function
async function runHappyJourneyCtJob() {
  try {
    // Get custom tours in process
    const [enquiryDetails] = await db.query(
      `SELECT * FROM enquirycustomtours WHERE enquiryProcess = 2`
    );

    for (const enquiryDetail of enquiryDetails) {
      const tourStartDate = new Date(enquiryDetail.startDate);
      const oneDayBefore = new Date(tourStartDate);
      oneDayBefore.setDate(tourStartDate.getDate() - 1);

      const today = new Date();
      const todayFormatted = today.toISOString().split("T")[0];
      const oneDayBeforeFormatted = oneDayBefore.toISOString().split("T")[0];

      if (todayFormatted === oneDayBeforeFormatted) {
        // Get family head details
        const [familyHeadDetails] = await db.query(
          `SELECT * FROM customtourdiscountdetails WHERE enquiryCustomId = ?`,
          [enquiryDetail.enquiryCustomId]
        );

        for (const familyHeadDetail of familyHeadDetails) {
          // Check if not cancelled
          const [guestDetails] = await db.query(
            `SELECT * FROM customtourguestdetails 
             WHERE enquiryDetailCustomId = ? AND isCancel = 0 LIMIT 1`,
            [familyHeadDetail.enquiryDetailCustomId]
          );

          if (guestDetails.length > 0) {
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
                  enquiryDetail.groupName,
                ],
              },
            };

            await sendWhatsAppMessage(messageData);
          }
        }
      }
    }

    console.log("✅ Happy Journey (Custom Tour) Messages sent successfully");
  } catch (err) {
    console.error("❌ Error in HappyJourneyCronCt:", err.message);
  }
}

// Schedule job for daily run at 10 AM
cron.schedule("0 10 * * *", runHappyJourneyCtJob);

// For testing
// runHappyJourneyCtJob();
