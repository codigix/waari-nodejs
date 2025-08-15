import cron from "node-cron";
import mysql from "mysql2/promise";
import axios from "axios";

// Create DB connection pool
const db = mysql.createPool({
  host: "localhost",      // change as per your DB
  user: "root",
  password: "",
  database: "your_database"
});

async function preTourCronGt() {
  try {
    // Fetch enquiry details for tours in process
    const [enquiryDetails] = await db.query(
      "SELECT * FROM enquirygrouptours WHERE enquiryProcess = ?",
      [2]
    );

    for (const enquiryDetail of enquiryDetails) {
      // Fetch group tour details
      const [groupTours] = await db.query(
        "SELECT * FROM grouptours WHERE groupTourId = ? LIMIT 1",
        [enquiryDetail.groupTourId]
      );

      if (!groupTours.length) continue;
      const groupTour = groupTours[0];

      const tourStartDate = new Date(groupTour.startDate);
      const tenDaysBefore = new Date(tourStartDate);
      tenDaysBefore.setDate(tourStartDate.getDate() - 10);

      const currentDate = new Date().toISOString().split("T")[0];
      const targetDate = tenDaysBefore.toISOString().split("T")[0];

      if (currentDate === targetDate) {
        // Get family head details
        const [familyHeadDetails] = await db.query(
          "SELECT * FROM grouptourdiscountdetails WHERE enquiryGroupId = ?",
          [enquiryDetail.enquiryGroupId]
        );

        for (const familyHeadDetail of familyHeadDetails) {
          // Check if family head cancel or not
          const [cancelTour] = await db.query(
            "SELECT * FROM grouptourguestdetails WHERE familyHeadGtId = ? AND isCancel = 0 LIMIT 1",
            [familyHeadDetail.familyHeadGtId]
          );

          if (cancelTour.length > 0) {
            const messageData = {
              countryCode: "+91",
              phoneNumber: familyHeadDetail.phoneNo || "",
              callbackData: "some text here",
              type: "Template",
              template: {
                name: "ten_days_prior_message",
                languageCode: "en",
                bodyValues: [
                  familyHeadDetail.billingName,
                  groupTour.tourName
                ]
              }
            };

            try {
              await axios.post(
                "https://api.interakt.ai/v1/public/message/",
                messageData,
                {
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Basic eTBPQnZHN2dSd3lvVW1HdXlqS2o5Y3FlNG9uQXQ2b3R0UkNLYjlDRmU3Zzo="
                  }
                }
              );
            } catch (err) {
              console.error("Error sending WhatsApp message:", err.message);
            }
          }
        }
      }
    }

    console.log("Ten days prior messages sent successfully");
  } catch (err) {
    console.error("An error occurred:", err.message);
  }
}

// Schedule the cron job to run daily at 10 AM (adjust as needed)
cron.schedule("0 10 * * *", preTourCronGt);

export default preTourCronGt;
