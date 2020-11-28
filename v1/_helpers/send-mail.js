const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');
const sgTransport = require('nodemailer-sendgrid-transport');

module.exports = class sendEmail {
    constructor(toEmail, toName, subject, message, url) {
        this.to = toEmail;
        this.subject = `${subject} - City Striders Store`;
        this.firstName = toName;
        this.message = message;
        this.url = url;
        this.from = `City Striders - <${process.env.EMAIL_FROM}>`;
    }

    newTransport() {
        if (process.env.NODE_ENV === 'production') {
            // Sendgrid
            return nodemailer.createTransport(sgTransport({
                // services: 'SendGrid',
                auth: {
                    api_key: process.env.SENDGRID_API_KEY
                }
            }));
        }

        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            },
            tls: {
                rejectUnauthorized: false
            }
        });
    }

    //Send the actual email
    async send(template) {

        // 1 ) Render The HTML based on a pub template
        const html = pug.renderFile(`${__dirname}/../../views/email/${template}.pug`, {
            firstName: this.firstName,
            url: this.url,
            subject: this.subject,
            message: this.message
        });

        // 2) Define email options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject: this.subject,
            html,
            text: htmlToText.fromString(html)
        };

        // 3) Create a transport and send email
        await this.newTransport().sendMail(mailOptions);
    }

    // senEmail
    async sendEmail() {
        await this.send('new-email');
    }

}