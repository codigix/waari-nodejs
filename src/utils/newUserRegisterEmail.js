const nodemailer = require('nodemailer');

class NewUserRegisterEmail {
    constructor(details) {
        this.details = details;
    }

    async sendEmail() {
        const transporter = nodemailer.createTransport({
            service: 'your_email_service', // e.g., 'gmail'
            auth: {
                user: 'your_email@example.com',
                pass: 'your_email_password',
            },
        });

        const mailOptions = {
            from: 'your_email@example.com',
            to: this.details.email, // recipient's email
            subject: 'New User Added to the System',
            html: `
                <h1>Welcome to the System</h1>
                <p>Hello ${this.details.name},</p>
                <p>You have been successfully added to the system.</p>
            `,
        };

        try {
            const info = await transporter.sendMail(mailOptions);
            console.log('Email sent: ' + info.response);
        } catch (error) {
            console.error('Error sending email:', error);
        }
    }
}

module.exports = NewUserRegisterEmail;