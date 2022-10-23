const nodemailer = require('nodemailer')
const handlebars = require('nodemailer-express-handlebars')

const transporter = nodemailer.createTransport({
  host: process.env.NODEMAILER_HOST || process.env.MAIL_SERVER_HOST,
  port: process.env.NODEMAILER_PORT || process.env.MAIL_SERVER_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.NODEMAILER_USER || process.env.MAIL_SERVER_USER,
    pass: process.env.NODEMAILER_PASS || process.env.MAIL_SERVER_PASS,
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