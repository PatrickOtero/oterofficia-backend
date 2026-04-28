import { UserProfile, UserRecord } from "./auth.types";

export const toUserProfile = (user: UserRecord): UserProfile => ({
  avatarUrl: user.avatarUrl,
  birthDate: user.birthDate,
  createdAt: user.createdAt,
  email: user.email,
  emailVerifiedAt: user.emailVerifiedAt,
  id: user.id,
  name: user.name,
  role: user.role,
  updatedAt: user.updatedAt,
});
