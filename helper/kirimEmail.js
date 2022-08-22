require("dotenv").config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL,
        pass: process.env.PASS
    }
})

const kirim = (email) => {
    const options = {
        from: "'Serova' <no-reply@gmail.com>",
        to: email,
        subject: "Lamaran Kerja",
        text: "oke",
        html: `<h3>Selamat datang</h3><br/>`
    };

    transporter.sendMail(options, (err, info) => {
        if (err) {
            console.log(err);
        }
        console.log(`Email terkirim ke ${email}`);
    })
}

module.exports = {
    kirim,
    transporter
};
