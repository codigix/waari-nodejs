// feedbackReqGtCron.js

import mysql from "mysql2/promise";
import axios from "axios";
import cron from "node-cron";

// DB Connection
const db = await mysql.createPool({
  host: "localhost",
  user: "root",
  password: "your_password",
  database: "your_database",
});

// Send WhatsApp Message
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
    console.error("❌ WhatsApp error:", error.message);
  }
}

// Main Job
async function runFeedbackJob() {
  try {
    // Get enquiry details
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

      // Calculate days difference
      const tourEndDate = new Date(groupTour.endDate);
      const currentDate = new Date();
      const differenceDays = Math.floor(
        (currentDate - tourEndDate) / (1000 * 60 * 60 * 24)
      );

      if (differenceDays === 2) {
        // Get family head details
        const [familyHeadDetails] = await db.query(
          `SELECT * FROM grouptourdiscountdetails WHERE enquiryGroupId = ?`,
          [enquiryDetail.enquiryGroupId]
        );

        for (const familyHeadDetail of familyHeadDetails) {
          // Check if tour not cancelled
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
                name: "feedback_request_form",
                languageCode: "en",
                bodyValues: [
                  familyHeadDetail.billingName,
                  groupTour.tourName,
                  `${process.env.APP_URL || "https://yourdomain.com"}/feedback-form`,
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

// Uncomment to run immediately for testing
// runFeedbackJob();
