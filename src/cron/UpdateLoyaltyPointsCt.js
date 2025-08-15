// updateLoyaltyPointsCt.js
const mysql = require('mysql2/promise');
const axios = require('axios');
const dayjs = require('dayjs');

(async () => {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'YOUR_DB_NAME'
  });

  try {
    await connection.beginTransaction();

    const [enquiryDetails] = await connection.execute(
      `SELECT * FROM enquirycustomtours WHERE enquiryProcess = 2`
    );

    for (const enqDetail of enquiryDetails) {
      const tourEndDate = dayjs(enqDetail.endDate);
      const currentDate = dayjs();
      const differenceDays = currentDate.diff(tourEndDate, 'day');

      if (differenceDays === 1) {
        const [familyHeads] = await connection.execute(
          `SELECT * FROM customtourenquirydetails WHERE enquiryCustomId = ? AND isLoyaltyPointSend = 0`,
          [enqDetail.enquiryCustomId]
        );

        const [[guestRef]] = await connection.execute(
          `SELECT * FROM users WHERE guestId = ?`,
          [enqDetail.guestRefId]
        );

        for (const head of familyHeads) {
          const [[discountDetails]] = await connection.execute(
            `SELECT * FROM customtourdiscountdetails WHERE enquiryDetailCustomId = ?`,
            [head.enquiryDetailCustomId]
          );

          const [[headDetails]] = await connection.execute(
            `SELECT * FROM users WHERE guestId = ?`,
            [head.guestId]
          );

          const [[tourCountObj]] = await connection.execute(
            `SELECT COUNT(*) AS cnt FROM customtourguestdetails WHERE guestId = ? AND isCancel = 0`,
            [head.guestId]
          );

          const [[tourCountGtObj]] = await connection.execute(
            `SELECT COUNT(*) AS cnt FROM grouptourguestdetails WHERE guestId = ? AND isCancel = 0`,
            [head.guestId]
          );

          const [[isNotCancelObj]] = await connection.execute(
            `SELECT EXISTS(SELECT 1 FROM customtourguestdetails WHERE guestId = ? AND isCancel = 0) AS existsFlag`,
            [head.guestId]
          );

          if (isNotCancelObj.existsFlag) {
            let loyaltyPoint = 0;
            if (tourCountObj.cnt > 1 || tourCountGtObj.cnt > 0) {
              const [[card]] = await connection.execute(
                `SELECT * FROM cardtype WHERE cardId = ?`,
                [headDetails.cardId]
              );
              loyaltyPoint = (discountDetails.discountPrice * card.selfLoyalPt) / 100;
            } else {
              loyaltyPoint = (discountDetails.discountPrice * 1) / 100;
            }

            await connection.execute(
              `INSERT INTO loyaltypoints (loyaltyPoint, description, userId, isGroupCustom, descType, enquiryId)
               VALUES (?, 'self', ?, 2, 3, ?)`,
              [loyaltyPoint, headDetails.userId, enqDetail.enquiryCustomId]
            );

            await connection.execute(
              `UPDATE customtourenquirydetails SET isLoyaltyPointSend = 1 WHERE enquiryDetailCustomId = ?`,
              [head.enquiryDetailCustomId]
            );

            await connection.query(`CALL UpdateCardId(?)`, [headDetails.guestId]);

            // Send WhatsApp
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

        // Referral points
        const [guestsDetails] = await connection.execute(
          `SELECT * FROM customtourguestdetails WHERE enquiryCustomId = ? AND isCancel = 0`,
          [enqDetail.enquiryCustomId]
        );

        for (const guest of guestsDetails) {
          const [[guestCountObj]] = await connection.execute(
            `SELECT COUNT(*) AS cnt FROM customtourguestdetails WHERE guestId = ? AND isCancel = 0`,
            [guest.guestId]
          );

          const [[guestGroupCountObj]] = await connection.execute(
            `SELECT COUNT(*) AS cnt FROM grouptourguestdetails WHERE guestId = ? AND isCancel = 0`,
            [guest.guestId]
          );

          if (guestCountObj.cnt === 1 && guestGroupCountObj.cnt === 0) {
            if (guestRef && enqDetail.guestRefId === guestRef.guestId && enqDetail.guestRefId !== guest.guestId) {
              const [[card]] = await connection.execute(
                `SELECT * FROM cardtype WHERE cardId = ?`,
                [guestRef.cardId]
              );

              const refPoint = (guest.roomShareType * card.referredLoyalPt) / 100;

              await connection.execute(
                `INSERT INTO loyaltypoints (loyaltyPoint, description, userId, isGroupCustom, descType, enquiryId)
                 VALUES (?, 'referral', ?, 2, 4, ?)`,
                [refPoint, guestRef.userId, enqDetail.enquiryCustomId]
              );

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

              await connection.query(`CALL UpdateCardIdByReferral(?)`, [guestRef.userId]);
            }
          }
        }
      }
    }

    await connection.commit();
    console.log('Loyalty Points for Custom Tour Family Head Given Successfully');

  } catch (err) {
    await connection.rollback();
    console.error('Error occurred:', err.message);
  } finally {
    await connection.end();
  }
})();
