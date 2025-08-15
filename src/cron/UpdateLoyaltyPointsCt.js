// updateLoyaltyPointsCt_supabase.js
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import dayjs from 'dayjs';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Needs RLS bypass for inserts/updates
);

(async () => {
  try {
    // Step 1: Get enquirycustomtours where enquiryProcess = 2
    const { data: enquiryDetails, error: enqErr } = await supabase
      .from('enquirycustomtours')
      .select('*')
      .eq('enquiryProcess', 2);

    if (enqErr) throw enqErr;

    for (const enqDetail of enquiryDetails) {
      const tourEndDate = dayjs(enqDetail.endDate);
      const currentDate = dayjs();
      const differenceDays = currentDate.diff(tourEndDate, 'day');

      if (differenceDays === 1) {
        // Step 2: Get family heads
        const { data: familyHeads } = await supabase
          .from('customtourenquirydetails')
          .select('*')
          .eq('enquiryCustomId', enqDetail.enquiryCustomId)
          .eq('isLoyaltyPointSend', 0);

        // Step 3: Guest Ref
        const { data: guestRefArr } = await supabase
          .from('users')
          .select('*')
          .eq('guestId', enqDetail.guestRefId);
        const guestRef = guestRefArr?.[0];

        for (const head of familyHeads) {
          // Discount details
          const { data: discountDetailsArr } = await supabase
            .from('customtourdiscountdetails')
            .select('*')
            .eq('enquiryDetailCustomId', head.enquiryDetailCustomId);
          const discountDetails = discountDetailsArr?.[0];

          // Head details
          const { data: headDetailsArr } = await supabase
            .from('users')
            .select('*')
            .eq('guestId', head.guestId);
          const headDetails = headDetailsArr?.[0];

          // Tour counts
          const { count: tourCount } = await supabase
            .from('customtourguestdetails')
            .select('*', { count: 'exact', head: true })
            .eq('guestId', head.guestId)
            .eq('isCancel', 0);

          const { count: tourCountGt } = await supabase
            .from('grouptourguestdetails')
            .select('*', { count: 'exact', head: true })
            .eq('guestId', head.guestId)
            .eq('isCancel', 0);

          const loyaltyEligible = tourCount > 0; // Equivalent to existsFlag

          if (loyaltyEligible) {
            let loyaltyPoint = 0;
            if (tourCount > 1 || tourCountGt > 0) {
              const { data: cardArr } = await supabase
                .from('cardtype')
                .select('*')
                .eq('cardId', headDetails.cardId);
              const card = cardArr?.[0];
              loyaltyPoint = (discountDetails.discountPrice * card.selfLoyalPt) / 100;
            } else {
              loyaltyPoint = (discountDetails.discountPrice * 1) / 100;
            }

            // Insert loyalty points
            await supabase.from('loyaltypoints').insert({
              loyaltyPoint,
              description: 'self',
              userId: headDetails.userId,
              isGroupCustom: 2,
              descType: 3,
              enquiryId: enqDetail.enquiryCustomId
            });

            // Mark as sent
            await supabase
              .from('customtourenquirydetails')
              .update({ isLoyaltyPointSend: 1 })
              .eq('enquiryDetailCustomId', head.enquiryDetailCustomId);

            // Update card (replace with your Supabase function)
            await supabase.rpc('update_card_id', { guest_id: headDetails.guestId });

            // WhatsApp
            const jsonData = {
              countryCode: "+91",
              phoneNumber: discountDetails.phoneNo || '',
              callbackData: "some text here",
              type: "Template",
              template: {
                name: "received_loyalty_points_own_booking",
                languageCode: "en",
                bodyValues: [
                  `${headDetails.firstName} ${headDetails.lastName}`,
                  loyaltyPoint,
                  enqDetail.groupName
                ]
              }
            };

            await axios.post(
              'https://api.interakt.ai/v1/public/message/',
              jsonData,
              {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Basic eTBPQnZHN2dSd3lvVW1HdXlqS2o5Y3FlNG9uQXQ2b3R0UkNLYjlDRmU3Zzo='
                }
              }
            );
          }
        }

        // Step 4: Referral points
        const { data: guestsDetails } = await supabase
          .from('customtourguestdetails')
          .select('*')
          .eq('enquiryCustomId', enqDetail.enquiryCustomId)
          .eq('isCancel', 0);

        for (const guest of guestsDetails) {
          const { count: guestCount } = await supabase
            .from('customtourguestdetails')
            .select('*', { count: 'exact', head: true })
            .eq('guestId', guest.guestId)
            .eq('isCancel', 0);

          const { count: guestGroupCount } = await supabase
            .from('grouptourguestdetails')
            .select('*', { count: 'exact', head: true })
            .eq('guestId', guest.guestId)
            .eq('isCancel', 0);

          if (guestCount === 1 && guestGroupCount === 0) {
            if (guestRef && enqDetail.guestRefId === guestRef.guestId && enqDetail.guestRefId !== guest.guestId) {
              const { data: cardArr } = await supabase
                .from('cardtype')
                .select('*')
                .eq('cardId', guestRef.cardId);
              const card = cardArr?.[0];

              const refPoint = (guest.roomShareType * card.referredLoyalPt) / 100;

              await supabase.from('loyaltypoints').insert({
                loyaltyPoint: refPoint,
                description: 'referral',
                userId: guestRef.userId,
                isGroupCustom: 2,
                descType: 4,
                enquiryId: enqDetail.enquiryCustomId
              });

              const jsonData = {
                countryCode: "+91",
                phoneNumber: guestRef.contact || '',
                callbackData: "some text here",
                type: "Template",
                template: {
                  name: "guest_referral_points",
                  languageCode: "en",
                  bodyValues: [
                    `${guestRef.firstName} ${guestRef.lastName}`,
                    `${guest.firstName} ${guest.lastName}`,
                    refPoint,
                    enqDetail.groupName
                  ]
                }
              };

              await axios.post(
                'https://api.interakt.ai/v1/public/message/',
                jsonData,
                {
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic eTBPQnZHN2dSd3lvVW1HdXlqS2o5Y3FlNG9uQXQ2b3R0UkNLYjlDRmU3Zzo='
                  }
                }
              );

              await supabase.rpc('update_card_id_by_referral', { user_id: guestRef.userId });
            }
          }
        }
      }
    }

    console.log('✅ Loyalty Points for Custom Tour processed successfully');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
})();
