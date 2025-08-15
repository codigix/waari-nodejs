// remainingBillingCtCron_supabase.js

import cron from "node-cron";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";

// ✅ Supabase connection
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // service role for full DB access
);

// ✅ Cron job schedule: Run daily at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("Running Remaining Billing CT Cron (Supabase)...");

  try {
    // 1. Fetch enquiry details for tours in process
    const { data: enquiries, error: enquiriesError } = await supabase
      .from("enquirycustomtours")
      .select("*")
      .eq("enquiryProcess", 2);

    if (enquiriesError) throw enquiriesError;

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
        const { data: familyHeads, error: familyError } = await supabase
          .from("customtourdiscountdetails")
          .select("*")
          .eq("enquiryCustomId", enquiry.enquiryCustomId);

        if (familyError) throw familyError;

        for (const head of familyHeads) {
          // 4. Check if not cancelled
          const { data: notCancelled, error: cancelError } = await supabase
            .from("customtourguestdetails")
            .select("*")
            .eq("enquiryDetailCustomId", head.enquiryDetailCustomId)
            .eq("isCancel", 0)
            .limit(1);

          if (cancelError) throw cancelError;

          if (notCancelled.length > 0) {
            // 5. Get last payment balance
            const { data: payment, error: paymentError } = await supabase
              .from("customtourpaymentdetails")
              .select("balance")
              .eq("enquiryCustomId", enquiry.enquiryCustomId)
              .eq("enquiryDetailCustomId", head.enquiryDetailCustomId)
              .order("created_at", { ascending: false })
              .limit(1);

            if (paymentError) throw paymentError;

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

    console.log("✅ Remaining Billing Messages sent successfully (Supabase)");
  } catch (error) {
    console.error("❌ Error in cron job (Supabase):", error.message);
  }
});
