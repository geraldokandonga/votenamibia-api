const nodemailer = require("nodemailer");
const pug = require("pug");
const htmlToText = require("html-to-text");
const sgTransport = require("nodemailer-sendgrid-transport");

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(" ")[0];
    this.url = url;
    this.from = `Vote Namibia <${process.env.EMAIL_FROM}>`;
    this.appName = "Vote Namibia";
  }

  newTransport() {
    if (process.env.NODE_ENV === "production") {
      // Sendgrid
      return nodemailer.createTransport(
        sgTransport({
          // services: 'SendGrid',
          auth: {
            api_key: process.env.SENDGRID_API_KEY
          }
        })
      );
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
  async send(template, subject) {
    // 1 ) Render The HTML based on a pub template
    const html = pug.renderFile(
      `${__dirname}/../../views/email/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject
      }
    );

    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.fromString(html)
    };

    // 3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  // WELCOME
  async sendWelcome() {
    await this.send("welcome", "Welcome to the Vote Namibia Family!");
  }

  // RESET PASSWORD
  async sendPasswordReset() {
    await this.send(
      "passwordReset",
      "Your password token (valid for only 10 minutes.)"
    );
  }

  // PASSWORD CHANGED
  async sendPasswordChanged() {
    await this.send("passwordChanged", "Your Vote Namibia password was reset");
  }

  // ACCOUNT CONFIRMATION
  async sendEmailVerification() {
    await this.send("activation", "[Vote Namibia] Verify Email");
  }

  // VERIFIED
  async sendEmailVerified() {
    await this.send("emailVerified", "[Vote Namibia] Email Verified");
  }
};
