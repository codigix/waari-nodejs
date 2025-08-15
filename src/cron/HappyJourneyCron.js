// happyJourneyCron.js

import mysql from "mysql2/promise";
import axios from "axios";
import cron from "node-cron";

// Database connection
const db = await mysql.createPool({
  host: "localhost",
  user: "root",
  password: "your_password",
  database: "your_database",
});

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

// Main job logic
async function runHappyJourneyJob() {
  try {
    // Get tours in process
    const [enquiryDetails] = await db.query(
      `SELECT * FROM enquirygrouptours WHERE enquiryProcess = 2`
    );

    for (const enquiryDetail of enquiryDetails) {
      // Get group tour details
      const [groupTours] = await db.query(
        `SELECT * FROM grouptours WHERE groupTourId = ? LIMIT 1`,
        [enquiryDetail.groupTourId]
      );
      if (groupTours.length === 0) continue;

      const groupTour = groupTours[0];

      // Calculate one day before start date
      const tourStartDate = new Date(groupTour.startDate);
      const oneDayBefore = new Date(tourStartDate);
      oneDayBefore.setDate(tourStartDate.getDate() - 1);

      const today = new Date();
      const todayFormatted = today.toISOString().split("T")[0];
      const oneDayBeforeFormatted = oneDayBefore.toISOString().split("T")[0];

      // Check if today is one day before start
      if (todayFormatted === oneDayBeforeFormatted) {
        // Get family head details
        const [familyHeadDetails] = await db.query(
          `SELECT * FROM grouptourdiscountdetails WHERE enquiryGroupId = ?`,
          [enquiryDetail.enquiryGroupId]
        );

        for (const familyHeadDetail of familyHeadDetails) {
          // Check if not cancelled
          const [guestDetails] = await db.query(
            `SELECT * FROM grouptourguestdetails 
             WHERE familyHeadGtId = ? AND isCancel = 0 LIMIT 1`,
            [familyHeadDetail.familyHeadGtId]
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
                  groupTour.tourName,
                ],
              },
            };

            await sendWhatsAppMessage(messageData);
          }
        }
      }
    }

    console.log("✅ Happy Journey Messages sent successfully");
  } catch (err) {
    console.error("❌ Error in HappyJourneyCron:", err.message);
  }
}

// Schedule job to run daily at 10 AM
cron.schedule("0 10 * * *", runHappyJourneyJob);

// For immediate test run
// runHappyJourneyJob();
