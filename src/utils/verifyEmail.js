const nodemailer = require('nodemailer');

class VerifyEmail {
    constructor(otp) {
        this.otp = otp;
    }

    async sendEmail(toEmail) {
        // Configure the transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail', // You can use other services like 'yahoo', 'outlook', etc.
            auth: {
                user: 'your-email@gmail.com', // Replace with your email
                pass: 'your-email-password', // Replace with your email password or app-specific password
            },
        });

        // Email options
        const mailOptions = {
            from: 'your-email@gmail.com', // Replace with your email
            to: toEmail,
            subject: 'Verify Email',
            html: `
                <p>Thank you for registering. Please use the following OTP to verify your email:</p>
                <h3>${this.otp}</h3>
            `,
        };

        // Send the email
        try {
            const info = await transporter.sendMail(mailOptions);
            console.log('Email sent: ' + info.response);
        } catch (error) {
            console.error('Error sending email:', error);
        }
    }
}

module.exports = VerifyEmail;