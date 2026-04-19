import { Request, Response } from "express";
import { container } from "tsyringe";
import { parseContactPayload } from "./contact.schemas";
import { ContactService } from "./contact.service";

export class ContactController {
  public sendEmail = async (req: Request, res: Response) => {
    const payload = parseContactPayload(req.body);
    const response = await container.resolve(ContactService).sendEmail(payload);

    return res.status(200).json(response);
  };
}
