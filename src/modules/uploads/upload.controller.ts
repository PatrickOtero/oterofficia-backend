import { Request, Response } from "express";
import { container } from "tsyringe";
import { UploadService } from "./upload.service";
import {
  parseUploadDeleteInput,
  parseUploadFile,
  parseUploadFolder,
  parseUploadKeyFromParams,
} from "./upload.schemas";

const resolvePublicBaseUrl = (req: Request) => {
  if (process.env.PUBLIC_API_URL) {
    return process.env.PUBLIC_API_URL.replace(/\/+$/, "");
  }

  const forwardedProtocol = req.header("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedHost = req.header("x-forwarded-host")?.split(",")[0]?.trim();
  const protocol = forwardedProtocol || req.protocol;
  const host = forwardedHost || req.get("host");

  return `${protocol}://${host}`;
};

export class UploadController {
  public create = async (req: Request, res: Response) => {
    const service = container.resolve(UploadService);
    const file = parseUploadFile(req.file);
    const folder = parseUploadFolder(req.body.folder ?? req.query.folder);
    const asset = await service.uploadFile(file, folder);

    return res.status(201).json({
      ...asset,
      url: `${resolvePublicBaseUrl(req)}/uploads/${asset.key}`,
    });
  };

  public delete = async (req: Request, res: Response) => {
    const service = container.resolve(UploadService);
    const { key } = parseUploadDeleteInput(req.body);
    const response = await service.deleteFile(key);

    return res.status(200).json(response);
  };

  public show = async (req: Request, res: Response) => {
    const service = container.resolve(UploadService);
    const key = parseUploadKeyFromParams(req.params.folder, req.params.fileName);
    const file = await service.getFile(key);

    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("Content-Length", String(file.contentLength));

    if (file.mimeType) {
      res.contentType(file.mimeType);
    }

    return res.status(200).send(file.buffer);
  };
}
