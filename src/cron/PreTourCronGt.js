import cron from "node-cron";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";

// Supabase connection
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // use service role key for backend scripts
);

async function preTourCronGt() {
  try {
    // Fetch enquiry details for tours in process
    const { data: enquiryDetails, error: enquiryErr } = await supabase
      .from("enquirygrouptours")
      .select("*")
      .eq("enquiryProcess", 2);

    if (enquiryErr) throw enquiryErr;

    for (const enquiryDetail of enquiryDetails) {
      // Fetch group tour details
      const { data: groupTours, error: groupTourErr } = await supabase
        .from("grouptours")
        .select("*")
        .eq("groupTourId", enquiryDetail.groupTourId)
        .limit(1);

      if (groupTourErr) throw groupTourErr;
      if (!groupTours.length) continue;

      const groupTour = groupTours[0];

      const tourStartDate = new Date(groupTour.startDate);
      const tenDaysBefore = new Date(tourStartDate);
      tenDaysBefore.setDate(tourStartDate.getDate() - 10);

      const currentDate = new Date().toISOString().split("T")[0];
      const targetDate = tenDaysBefore.toISOString().split("T")[0];

      if (currentDate === targetDate) {
        // Get family head details
        const { data: familyHeadDetails, error: famErr } = await supabase
          .from("grouptourdiscountdetails")
          .select("*")
          .eq("enquiryGroupId", enquiryDetail.enquiryGroupId);

        if (famErr) throw famErr;

        for (const familyHeadDetail of familyHeadDetails) {
          // Check if family head cancel or not
          const { data: cancelTour, error: cancelErr } = await supabase
            .from("grouptourguestdetails")
            .select("*")
            .eq("familyHeadGtId", familyHeadDetail.familyHeadGtId)
            .eq("isCancel", 0)
            .limit(1);

          if (cancelErr) throw cancelErr;

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
              console.log(`Message sent to ${familyHeadDetail.phoneNo}`);
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

// Schedule the cron job to run daily at 10 AM
cron.schedule("0 10 * * *", preTourCronGt);

export default preTourCronGt;
