// remainingBillingCtCron.js

import cron from "node-cron";
import mysql from "mysql2/promise";
import axios from "axios";

// ✅ MySQL DB Connection
const db = await mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "your_database_name"
});

// ✅ Cron job schedule: Run daily at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("Running Remaining Billing CT Cron...");

  try {
    // 1. Fetch enquiry details for tours in process
    const [enquiries] = await db.query(
      "SELECT * FROM enquirycustomtours WHERE enquiryProcess = 2"
    );

    for (const enquiry of enquiries) {
      // 2. Calculate date 40 days before startDate
      const tourStartDate = new Date(enquiry.startDate);
      const fortyDaysBefore = new Date(tourStartDate);
      fortyDaysBefore.setDate(tourStartDate.getDate() - 40);

      const today = new Date();
      const currentDate = today.toISOString().split("T")[0];
      const compareDate = fortyDaysBefore.toISOString().split("T")[0];

      if (currentDate === compareDate) {
        // 3. Retrieve family head details
        const [familyHeads] = await db.query(
          "SELECT * FROM customtourdiscountdetails WHERE enquiryCustomId = ?",
          [enquiry.enquiryCustomId]
        );

        for (const head of familyHeads) {
          // 4. Check if not cancelled
          const [notCancelled] = await db.query(
            "SELECT * FROM customtourguestdetails WHERE enquiryDetailCustomId = ? AND isCancel = 0 LIMIT 1",
            [head.enquiryDetailCustomId]
          );

          if (notCancelled.length > 0) {
            // 5. Get last payment balance
            const [payment] = await db.query(
              `SELECT balance FROM customtourpaymentdetails 
               WHERE enquiryCustomId = ? AND enquiryDetailCustomId = ? 
               ORDER BY created_at DESC LIMIT 1`,
              [enquiry.enquiryCustomId, head.enquiryDetailCustomId]
            );

            const balance = payment.length ? payment[0].balance : 0;

            if (balance !== 0) {
              // 6. Prepare WhatsApp message data
              const messageData = {
                countryCode: "+91",
                phoneNumber: head.phoneNo || "",
                callbackData: "some text here",
                type: "Template",
                template: {
                  name: "remaining_billing_tour_message",
                  languageCode: "en",
                  bodyValues: [
                    head.billingName,
                    balance,
                    enquiry.groupName
                  ]
                }
              };

              // 7. Send WhatsApp message via Interakt API
              try {
                const response = await axios.post(
                  "https://api.interakt.ai/v1/public/message/",
                  messageData,
                  {
                    headers: {
                      "Content-Type": "application/json",
                      Authorization:
                        "Basic eTBPQnZHN2dSd3lvVW1HdXlqS2o5Y3FlNG9uQXQ2b3R0UkNLYjlDRmU3Zzo="
                    }
                  }
                );
                console.log(`Message sent to ${head.phoneNo}:`, response.data);
              } catch (err) {
                console.error(`Failed to send message to ${head.phoneNo}`, err.message);
              }
            }
          }
        }
      }
    }

    console.log("✅ Remaining Billing Messages sent successfully");
  } catch (error) {
    console.error("❌ Error in cron job:", error.message);
  }
});
