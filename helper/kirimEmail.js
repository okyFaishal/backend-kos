require("dotenv").config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL,
    pass: process.env.PASS
  }
})

const kirim = (email, subject, html) => {
  const options = {
    from: "'kos' <no-reply@gmail.com>",
    to: email,
    subject,
    html
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
