const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

//creamos una clase

module.exports = class Email {
    constructor(user, url) {
        this.to = user.email;
        this.firstName = user.name.split(' ')[0];
        this.url = url;
        this.from = `Natours <${process.env.EMAIL_FROM}>`
    };

    newTransport() {
        if (process.env.NODE_ENV === 'production') {
            // enviar por sendgrid
            return nodemailer.createTransport({
                service: 'SendGrid',
                auth: {
                    user: process.env.SENDGRID_USERNAME,
                    pass: process.env.SENDGRID_TOKEN
                }
            })
        }
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    };

    async send(template, subject) {
        // 1) Render HTML basado en un template de pug
        const html = pug.renderFile(`${__dirname}/../views/emails/${template}.pug`, {
            firstName: this.firstName,
            url: this.url,
            subject
        });

        // 2) Definir las opciones de email.
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: htmlToText.fromString(html)
        };

        // 3) Crear el transportador y enviar el email.
        await this.newTransport().sendMail(mailOptions);
    }

    async sendWelcome() {
        await this.send('welcome', 'Welcome to the Natours Family!')
    };

    async passwordReset() {
        await this.send('passwordReset', 'Your password reset token (only valid 10 minutes).')
    }
}



