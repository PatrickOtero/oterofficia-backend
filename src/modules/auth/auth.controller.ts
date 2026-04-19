import { Request, Response } from "express";
import { container } from "tsyringe";
import { AppError } from "../../core/errors/AppError";
import {
  parseChangePasswordPayload,
  parseDeletionRequestPayload,
  parseEmailChangePayload,
  parseEmailPayload,
  parseLoginPayload,
  parseRegisterPayload,
  parseResetPasswordPayload,
  parseTokenPayload,
  parseUpdateProfilePayload,
} from "./auth.schemas";
import { AuthService } from "./auth.service";

const parseAvatarFile = (file?: Express.Multer.File) => {
  if (!file) {
    throw new AppError("Selecione uma imagem para prosseguir.", 400, "validation_error");
  }

  if (!file.mimetype?.startsWith("image/")) {
    throw new AppError("O avatar precisa ser uma imagem valida.", 400, "validation_error");
  }

  return {
    buffer: file.buffer,
    mimeType: file.mimetype,
    originalName: file.originalname,
    size: file.size,
  };
};

export class AuthController {
  public changePassword = async (req: Request, res: Response) => {
    const payload = parseChangePasswordPayload(req.body);
    const response = await container.resolve(AuthService).changePassword(req.user!.id, payload);

    return res.status(200).json(response);
  };

  public confirmAccountDeletion = async (req: Request, res: Response) => {
    const payload = parseTokenPayload(req.body);
    const response = await container.resolve(AuthService).confirmAccountDeletion(payload.token);

    return res.status(200).json(response);
  };

  public confirmEmailChange = async (req: Request, res: Response) => {
    const payload = parseTokenPayload(req.body);
    const response = await container.resolve(AuthService).confirmEmailChange(payload.token);

    return res.status(200).json(response);
  };

  public getProfile = async (req: Request, res: Response) => {
    const user = await container.resolve(AuthService).getCurrentUser(req.user!.id);
    return res.status(200).json({ user });
  };

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
    const response = await container.resolve(AuthService).register(payload);

    return res.status(201).json(response);
  };

  public requestAccountDeletion = async (req: Request, res: Response) => {
    const payload = parseDeletionRequestPayload(req.body);
    const response = await container.resolve(AuthService).requestAccountDeletion(req.user!.id, payload.password);

    return res.status(200).json(response);
  };

  public requestEmailChange = async (req: Request, res: Response) => {
    const payload = parseEmailChangePayload(req.body);
    const response = await container.resolve(AuthService).requestEmailChange(req.user!.id, payload.nextEmail);

    return res.status(200).json(response);
  };

  public requestPasswordReset = async (req: Request, res: Response) => {
    const payload = parseEmailPayload(req.body);
    const response = await container.resolve(AuthService).requestPasswordReset(payload.email);

    return res.status(200).json(response);
  };

  public resendVerificationEmail = async (req: Request, res: Response) => {
    const payload = parseEmailPayload(req.body);
    const response = await container.resolve(AuthService).resendVerificationEmail(payload.email);

    return res.status(200).json(response);
  };

  public resetPassword = async (req: Request, res: Response) => {
    const payload = parseResetPasswordPayload(req.body);
    const response = await container.resolve(AuthService).resetPassword(payload.token, payload.password);

    return res.status(200).json(response);
  };

  public updateProfile = async (req: Request, res: Response) => {
    const payload = parseUpdateProfilePayload(req.body);
    const response = await container.resolve(AuthService).updateProfile(req.user!.id, payload);

    return res.status(200).json(response);
  };

  public uploadAvatar = async (req: Request, res: Response) => {
    const file = parseAvatarFile(req.file);
    const response = await container.resolve(AuthService).uploadAvatar(req.user!.id, file);

    return res.status(200).json(response);
  };

  public verifyEmail = async (req: Request, res: Response) => {
    const payload = parseTokenPayload(req.body);
    const response = await container.resolve(AuthService).verifyEmail(payload.token);

    return res.status(200).json(response);
  };
}
