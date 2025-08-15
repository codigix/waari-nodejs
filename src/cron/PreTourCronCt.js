// preTourCronCt.js
import cron from "node-cron";
import mysql from "mysql2/promise";
import axios from "axios";
import dayjs from "dayjs";

// MySQL Connection
const db = await mysql.createPool({
  host: "localhost",
  user: "root",
  password: "your_password",
  database: "your_db_name",
});

// Cron job - runs every day at 00:00
cron.schedule("0 0 * * *", async () => {
  console.log("Running PreTourCronCt job...");

  try {
    // Fetch enquiry details for tours in process
    const [enquiryDetails] = await db.query(
      "SELECT * FROM enquirycustomtours WHERE enquiryProcess = ?",
      [2]
    );

    for (const enquiry of enquiryDetails) {
      const tourStartDate = dayjs(enquiry.startDate);
      const tenDaysBefore = tourStartDate.subtract(10, "day").format("YYYY-MM-DD");
      const currentDate = dayjs().format("YYYY-MM-DD");

      if (currentDate === tenDaysBefore) {
        // Get family head details
        const [familyHeadDetails] = await db.query(
          "SELECT * FROM customtourdiscountdetails WHERE enquiryCustomId = ?",
          [enquiry.enquiryCustomId]
        );

        for (const family of familyHeadDetails) {
          // Check family head cancel status
          const [cancelCheck] = await db.query(
            "SELECT * FROM customtourguestdetails WHERE enquiryDetailCustomId = ? AND isCancel = 0 LIMIT 1",
            [family.enquiryDetailCustomId]
          );

          if (cancelCheck.length > 0) {
            const messageData = {
              countryCode: "+91",
              phoneNumber: family.phoneNo || "",
              callbackData: "some text here",
              type: "Template",
              template: {
                name: "ten_days_prior_message",
                languageCode: "en",
                bodyValues: [family.billingName, enquiry.groupName],
              },
            };

            try {
              await axios.post("https://api.interakt.ai/v1/public/message/", messageData, {
                headers: {
                  "Content-Type": "application/json",
                  Authorization:
                    "Basic eTBPQnZHN2dSd3lvVW1HdXlqS2o5Y3FlNG9uQXQ2b3R0UkNLYjlDRmU3Zzo=",
                },
              });
              console.log(`Message sent to ${family.phoneNo}`);
            } catch (err) {
              console.error(`Failed to send message to ${family.phoneNo}:`, err.message);
            }
          }
        }
      }
    }

    console.log("Messages sent successfully");
  } catch (error) {
    console.error("An error occurred:", error.message);
  }
});
