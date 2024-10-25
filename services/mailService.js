const nodemailer = require('nodemailer')
const dotenv = require('dotenv')
const path = require('path')
const fs = require('fs')

dotenv.config()

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
})

const sendOtpEmail = (to, otp) => {
    const templatePath = path.join(__dirname, '../templates/otpTemplate.html')
    let htmlContent = fs.readFileSync(templatePath, 'utf8')

    htmlContent = htmlContent.replace('${otp}', otp)

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject: 'Your OTP Code',
        html: htmlContent,
        attachments: [
            {
                filename: 'image.png',
                path: path.join(
                    __dirname,
                    '../assets/images/otpMailImage/image.png'
                ),
                cid: 'image1',
            },
        ],
    }

    return transporter.sendMail(mailOptions)
}

module.exports = {
    sendOtpEmail,
}
