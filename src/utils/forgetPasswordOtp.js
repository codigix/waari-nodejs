const nodemailer = require('nodemailer');

class ForgetPasswordOtp {
    constructor(otp, user) {
        this.otp = otp;
        this.user = user;
    }

    async sendEmail() {
        // Configure the transporter
        const transporter = nodemailer.createTransport({
            service: 'your-email-service', // e.g., 'gmail'
            auth: {
                user: 'your-email@example.com', // Your email
                pass: 'your-email-password', // Your email password
            },
        });

        // Email options
        const mailOptions = {
            from: 'your-email@example.com', // Sender address
            to: this.user.email, // Recipient's email
            subject: 'Forget Password OTP',
            html: `
                <p>Dear ${this.user.name},</p>
                <p>Your OTP for password reset is: <strong>${this.otp}</strong></p>
                <p>If you did not request this, please ignore this email.</p>
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

module.exports = ForgetPasswordOtp;