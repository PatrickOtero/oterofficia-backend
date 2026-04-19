import { container } from "tsyringe";
import { AuthService } from "../../modules/auth/auth.service";

export const ensureAdminAccount = () => container.resolve(AuthService).ensureAdminAccount();
