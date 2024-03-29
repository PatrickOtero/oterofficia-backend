import { Request, Response } from "express";
import knex from "../connection";

const getProjects = async (req: Request, res: Response) => {
    try {
        const allProjects = await knex("projects");

        if (!allProjects.length) {
            return res.status(404).json({ message: "Não há projetos no banco de dados"})
        }

        return res.status(200).json(allProjects)

    } catch ( error: any ) {
        return res.status(400).json({ message: error.message})
    }
}

const createProject = async (req: Request, res: Response) => {
    const { image_url, project_name, project_desc, frontend_url, backend_url, video_url } = req.body

    if ( !image_url || !project_name || !project_desc) {
        return res.status(400).json({ message: "Por favor, um projeto precisa ter pelo menos uma imagem, um nome e uma descrição."})
    }

    try {
        const isImageRepeated = await knex("projects").where("image_url", "=", image_url).first()

        const isNameRepeated = await knex("projects").where("project_name", "=", project_name).first()

        if (isImageRepeated || isNameRepeated) {
            return res.status(400).json({ message: "Já existe um projeto com esta imagem e com este nome"})
        }

        await knex("projects").insert({ image_url, project_name, project_desc, frontend_url, backend_url, video_url
        })

        return res.status(201).json({ message: "O projeto foi criado com sucesso"})

    } catch (error: any) {
        return res.status(400).json({ message: error.message})
    }

}

const editProject = async (req: Request, res: Response) => {
    const { image_url, project_name, project_desc, frontend_url, backend_url, video_url } = req.body

    const { projectId } = req.params;

    if ( !image_url || !project_name || !project_desc) {
        return res.status(400).json({ message: "Por favor, um projeto precisa ter pelo menos uma imagem, um nome e uma descrição."})
    }

    try {
        const projectExists = await knex("projects").where("id", "=", projectId).first()

        if (!projectExists) {
            return res.status(404).json({ message: "Nâo existe nenhum projeto com este id"})
        }

        const isImageRepeated = await knex("projects").where("image_url", "=", image_url).whereNot("id", "=", projectId).first()

        const isNameRepeated = await knex("projects").where("project_name", "=", project_name).whereNot("id", "=", projectId).first()

        if (isImageRepeated || isNameRepeated) {
            return res.status(400).json({ message: "Já existe um projeto com esta imagem e com este nome"})
        }

        await knex("projects").update({ image_url, project_name, project_desc, frontend_url, backend_url, video_url
        }).where("id", "=", projectId)

        return res.status(200).json({ message: "As informações foram editadas com sucesso"})

    } catch (error: any) {
        return res.status(400).json({ message: error.message})
    }

}

const deleteProject = async (req: Request, res: Response) => {
    const { projectId } = req.params
    try {
        const projectExists = await knex("projects").where("id", "=", projectId).first()

        if (!projectExists) {
            return res.status(404).json({ message: "Nâo existe nenhum projeto com este id"})
        }
        
        await knex("projects").where("id", "=", projectId).delete()

        return res.status(200).json({message: "Projeto excluído com sucesso."})

    } catch ( error: any ) {
        return res.status(400).json({ message: error.message})
    }
}

export { getProjects, createProject, editProject, deleteProject }