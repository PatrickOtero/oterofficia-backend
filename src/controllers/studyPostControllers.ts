import { Request, Response } from "express";
import knex from "../connection";

const createStudyPost = async (req: Request, res: Response) => {
    const { title, content } = req.body

    if ( !title || !content ) {
        return res.status(400).json({ message: "Ambos os campos são obrigatórios"})
    }

    try {
        await knex("studyposts").insert({
            title,
            content
        })
        return res.status(201).json({ message: "Postagem criada com sucesso"})
    } catch (error: any) {
        return res.status(400).json({ message: error.message})
    }
}

export { createStudyPost }