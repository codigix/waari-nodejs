// feedbackReqCtCron.js

import mysql from "mysql2/promise";
import axios from "axios";
import cron from "node-cron";

// Database connection config
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
          Authorization: "Basic eTBPQnZHN2dSd3lvVW1HdXlqS2o5Y3FlNG9uQXQ2b3R0UkNLYjlDRmU3Zzo=",
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
    const [enquiryDetails] = await db.query(
      `SELECT * FROM enquirycustomtours WHERE enquiryProcess = 2`
    );

    for (const enquiryDetail of enquiryDetails) {
      const tourEndDate = new Date(enquiryDetail.endDate);
      const currentDate = new Date();
      const differenceDays = Math.floor(
        (currentDate - tourEndDate) / (1000 * 60 * 60 * 24)
      );

      if (differenceDays === 2) {
        const [familyHeadDetails] = await db.query(
          `SELECT * FROM customtourdiscountdetails WHERE enquiryCustomId = ?`,
          [enquiryDetail.enquiryCustomId]
        );

        for (const familyHeadDetail of familyHeadDetails) {
          const [familyHeadCancelTour] = await db.query(
            `SELECT * FROM customtourguestdetails 
             WHERE enquiryDetailCustomId = ? AND isCancel = 0 LIMIT 1`,
            [familyHeadDetail.enquiryDetailCustomId]
          );

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

// Schedule job to run daily at 10 AM (example)
cron.schedule("0 10 * * *", runFeedbackJob);

// For immediate test run
// runFeedbackJob();
