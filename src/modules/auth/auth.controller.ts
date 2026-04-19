import { Request, Response } from "express";
import { container } from "tsyringe";
import { parseLoginPayload, parseRegisterPayload } from "./auth.schemas";
import { AuthService } from "./auth.service";

export class AuthController {
  public getProfile = async (req: Request, res: Response) => res.status(200).json({ user: req.user });

  public login = async (req: Request, res: Response) => {
    const payload = parseLoginPayload(req.body);
    const authPayload = await container.resolve(AuthService).login(payload);

    return res.status(200).json(authPayload);
  };

  public logout = async (req: Request, res: Response) => {
    if (req.sessionToken) {
      await container.resolve(AuthService).logout(req.sessionToken);
    }

    return res.status(204).send();
  };

  public register = async (req: Request, res: Response) => {
    const payload = parseRegisterPayload(req.body);
    const authPayload = await container.resolve(AuthService).register(payload);

    return res.status(201).json(authPayload);
  };
}
