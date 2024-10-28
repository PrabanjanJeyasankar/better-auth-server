const path = require('path')
const fs = require('fs')
const { transporter } = require('../config/smtpconfig')

const sendOtpThroughEmail = (to, otp) => {
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
    sendOtpThroughEmail,
}
