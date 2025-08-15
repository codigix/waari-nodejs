// remainingBillingGtCron.js
import cron from "node-cron";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";

// 🔹 Supabase connection
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // service key for backend cron jobs
);

// 🔹 Run every day at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("Running Remaining Billing GT Cron...");

  try {
    // 1️⃣ Get enquiries with process = 2
    const { data: enquiryDetails, error: enquiryError } = await supabase
      .from("enquirygrouptours")
      .select("*")
      .eq("enquiryProcess", 2);

    if (enquiryError) throw enquiryError;

    for (const enquiry of enquiryDetails) {
      // 2️⃣ Get group tour details
      const { data: groupTour, error: groupTourError } = await supabase
        .from("grouptours")
        .select("*")
        .eq("groupTourId", enquiry.groupTourId)
        .single();

      if (groupTourError || !groupTour?.startDate) continue;

      const tourStartDate = new Date(groupTour.startDate);
      const fortyDaysBefore = new Date(tourStartDate);
      fortyDaysBefore.setDate(fortyDaysBefore.getDate() - 40);

      const todayStr = new Date().toISOString().split("T")[0];
      const fortyDaysStr = fortyDaysBefore.toISOString().split("T")[0];

      // 3️⃣ If date matches, process family heads
      if (todayStr === fortyDaysStr) {
        const { data: familyHeads, error: familyError } = await supabase
          .from("grouptourdiscountdetails")
          .select("*")
          .eq("enquiryGroupId", enquiry.enquiryGroupId);

        if (familyError) continue;

        for (const familyHead of familyHeads) {
          // 4️⃣ Check if not cancelled
          const { data: notCancelled, error: cancelError } = await supabase
            .from("grouptourguestdetails")
            .select("*")
            .eq("familyHeadGtId", familyHead.familyHeadGtId)
            .eq("isCancel", 0)
            .limit(1);

          if (cancelError || notCancelled.length === 0) continue;

          // 5️⃣ Get last payment balance
          const { data: lastPayment, error: paymentError } = await supabase
            .from("grouptourpaymentdetails")
            .select("balance")
            .eq("enquiryGroupId", enquiry.enquiryGroupId)
            .eq("familyHeadGtId", familyHead.familyHeadGtId)
            .order("created_at", { ascending: false })
            .limit(1);

          if (paymentError) continue;

          const balance = lastPayment.length ? lastPayment[0].balance : 0;

          // 6️⃣ Send WhatsApp message if balance remains
          if (balance !== 0) {
            const messageData = {
              countryCode: "+91",
              phoneNumber: familyHead.phoneNo || "",
              callbackData: "some text here",
              type: "Template",
              template: {
                name: "remaining_billing_tour_message",
                languageCode: "en",
                bodyValues: [familyHead.billingName, balance, groupTour.tourName]
              }
            };

            try {
              await axios.post(
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
              console.log(`✅ Message sent to ${familyHead.billingName}`);
            } catch (err) {
              console.error(`❌ Failed to send message to ${familyHead.billingName}`, err.message);
            }
          }
        }
      }
    }

    console.log("✅ Remaining Billing Messages sent successfully");
  } catch (err) {
    console.error("❌ Error in cron job:", err.message);
  }
});
