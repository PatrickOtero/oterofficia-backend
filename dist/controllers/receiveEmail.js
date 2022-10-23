"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.receiveEmail = void 0;
const nodemailer_1 = __importDefault(require("../services/nodemailer"));
const receiveEmail = (req, res) => {
    const { name, email, subject, emailContent } = req.body;
    if (!name || !email || !subject || !emailContent) {
        return res.status(400).json({ message: "Todos os campos são obrigatórios" });
    }
    const sendData = {
        from: email,
        to: "patrick.rocha.otero@gmail.com",
        subject: subject,
        template: 'receivingEmail',
        context: {
            name,
            emailContent,
        },
    };
    nodemailer_1.default.sendMail(sendData);
    return res.status(200).json({ message: "E-mail enviado com sucesso" });
};
exports.receiveEmail = receiveEmail;
