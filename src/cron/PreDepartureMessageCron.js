// preDepartureMessageCron.js
import mysql from "mysql2/promise";
import axios from "axios";
import dotenv from "dotenv";
import cron from "node-cron";
import path from "path";

dotenv.config();

// MySQL Connection
const db = await mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

async function preDepartureMessageCron() {
  try {
    // 1. Fetch enquiry details for tours in process
    const [enquiryDetails] = await db.query(
      "SELECT * FROM enquirygrouptours WHERE enquiryProcess = 2"
    );

    for (let enquiry of enquiryDetails) {
      // 2. Get group tour details
      const [groupTourResult] = await db.query(
        "SELECT * FROM grouptours WHERE groupTourId = ? LIMIT 1",
        [enquiry.groupTourId]
      );

      if (groupTourResult.length === 0) continue;

      const groupTour = groupTourResult[0];

      // 3. Calculate 7 days before start date
      const tourStartDate = new Date(groupTour.startDate);
      const oneDayBefore = new Date(tourStartDate);
      oneDayBefore.setDate(tourStartDate.getDate() - 7);

      const currentDate = new Date().toISOString().split("T")[0];
      const targetDate = oneDayBefore.toISOString().split("T")[0];

      if (currentDate !== targetDate) continue;

      // 4. Get family head details
      const [familyHeads] = await db.query(
        "SELECT * FROM grouptourdiscountdetails WHERE enquiryGroupId = ?",
        [enquiry.enquiryGroupId]
      );

      for (let familyHead of familyHeads) {
        // Check if not cancelled
        const [isNotCancelled] = await db.query(
          "SELECT * FROM grouptourguestdetails WHERE familyHeadGtId = ? AND isCancel = 0 LIMIT 1",
          [familyHead.familyHeadGtId]
        );

        if (isNotCancelled.length === 0) continue;

        // File name (max 30 chars, remove query string if present)
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
              "Authorization":
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

// Schedule it to run every day at 10 AM
cron.schedule("0 10 * * *", () => {
  console.log("🚀 Running Pre-departure Message Cron...");
  preDepartureMessageCron();
});

// For manual run (uncomment below line)
// preDepartureMessageCron();
