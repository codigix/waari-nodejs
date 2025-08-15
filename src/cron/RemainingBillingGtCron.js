// remainingBillingGtCron.js
import cron from "node-cron";
import knex from "knex";
import axios from "axios";

// DB connection
const db = knex({
  client: "mysql2",
  connection: {
    host: "127.0.0.1",
    user: "root",
    password: "",
    database: "your_db_name",
  },
});

// Run every day at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("Running Remaining Billing GT Cron...");
  try {
    const enquiryDetails = await db("enquirygrouptours").where("enquiryProcess", 2);

    for (const enquiry of enquiryDetails) {
      const groupTour = await db("grouptours").where("groupTourId", enquiry.groupTourId).first();

      if (!groupTour || !groupTour.startDate) continue;

      const tourStartDate = new Date(groupTour.startDate);
      const fortyDaysBefore = new Date(tourStartDate);
      fortyDaysBefore.setDate(fortyDaysBefore.getDate() - 40);

      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      const fortyDaysStr = fortyDaysBefore.toISOString().split("T")[0];

      if (todayStr === fortyDaysStr) {
        const familyHeads = await db("grouptourdiscountdetails").where("enquiryGroupId", enquiry.enquiryGroupId);

        for (const familyHead of familyHeads) {
          const familyHeadCancelTour = await db("grouptourguestdetails")
            .where("familyHeadGtId", familyHead.familyHeadGtId)
            .where("isCancel", 0)
            .first();

          if (familyHeadCancelTour) {
            const familyHeadBalance = await db("grouptourpaymentdetails")
              .where("enquiryGroupId", enquiry.enquiryGroupId)
              .where("familyHeadGtId", familyHead.familyHeadGtId)
              .orderBy("created_at", "desc")
              .first()
              .then(row => row ? row.balance : null);

            if (familyHeadBalance !== 0 && familyHeadBalance !== null) {
              const messageData = {
                countryCode: "+91",
                phoneNumber: familyHead.phoneNo || "",
                callbackData: "some text here",
                type: "Template",
                template: {
                  name: "remaining_billing_tour_message",
                  languageCode: "en",
                  bodyValues: [
                    familyHead.billingName,
                    familyHeadBalance,
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
                console.log(`Message sent to ${familyHead.billingName}`);
              } catch (err) {
                console.error("Error sending message:", err.message);
              }
            }
          }
        }
      }
    }
    console.log("Remaining Billing Messages sent successfully");
  } catch (err) {
    console.error("Error in cron job:", err.message);
  }
});
