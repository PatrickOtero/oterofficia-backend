import { Request, Response } from "express";
import nodemailer from "../services/nodemailer"

const receiveEmail = (req: Request, res: Response) => {
    const { name, email, subject, emailContent } = req.body

    if (!name || !email || !subject || !emailContent) {
        return res.status(400).json({ message: "Todos os campos são obrigatórios"})
    }

    try {
        const sendData = {
            from: email,
            to: "patrick.rocha.otero@gmail.com",
            subject: subject,
            template: 'receivingEmail',
            context: {
                name,
                emailContent,
            },
        }
        nodemailer.sendMail(sendData)

        return res.status(200).json({ message: "E-mail enviado com sucesso"})
    } catch (error: any) {
        return res.status(400).json({ message: error.message})
    }
}

export { receiveEmail }