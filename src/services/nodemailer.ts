const nodemailer = require('nodemailer')
const handlebars = require('nodemailer-express-handlebars')

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_SERVER_HOST || process.env.NODEMAILER_HOST,
  port: process.env.MAIL_SERVER_PORT || process.env.NODEMAILER_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.MAIL_SERVER_USER || process.env.NODEMAILER_USER,
    pass: process.env.MAIL_SERVER_PASS || process.env.NODEMAILER_PASS,
  },
})

transporter.use(
  'compile',
  handlebars({
    viewEngine: {
      extname: '.handlebars',
      defaultLayout: false,
    },
    viewPath: 'src/views/',
  }),
)

export default transporter