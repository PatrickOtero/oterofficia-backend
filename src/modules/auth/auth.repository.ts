import { injectable } from "tsyringe";
import { getDataSource } from "../../shared/infra/database/data-source";
import { UserActionTokenEntity } from "../../shared/infra/database/entities/UserActionTokenEntity";
import { UserSessionEntity } from "../../shared/infra/database/entities/UserSessionEntity";
import { UserEntity } from "../../shared/infra/database/entities/UserEntity";
import { normalizeUploadUrl } from "../uploads/upload-url";
import {
  CreateSessionInput,
  CreateUserActionTokenInput,
  CreateUserInput,
  IAuthRepository,
  UpdateUserInput,
} from "./auth.repository.interface";
import {
  AuthenticatedSessionUser,
  SessionRecord,
  UserActionTokenRecord,
  UserProfile,
  UserRecord,
} from "./auth.types";

const toIso = (value?: Date | null) => (value ? value.toISOString() : null);

const mapUserEntity = (user: UserEntity): UserRecord => ({
  avatarUrl: normalizeUploadUrl(user.avatarUrl ?? null),
  birthDate: user.birthDate ?? null,
  createdAt: user.createdAt.toISOString(),
  email: user.email,
  emailVerifiedAt: toIso(user.emailVerifiedAt),
  id: user.id,
  name: user.name,
  passwordHash: user.passwordHash,
  role: user.role,
  updatedAt: user.updatedAt.toISOString(),
});

const mapUserProfile = (user: UserEntity): UserProfile => ({
  avatarUrl: normalizeUploadUrl(user.avatarUrl ?? null),
  birthDate: user.birthDate ?? null,
  createdAt: user.createdAt.toISOString(),
  email: user.email,
  emailVerifiedAt: toIso(user.emailVerifiedAt),
  id: user.id,
  name: user.name,
  role: user.role,
  updatedAt: user.updatedAt.toISOString(),
});

const mapSessionEntity = (
  session: UserSessionEntity
): { session: SessionRecord; user: AuthenticatedSessionUser } => ({
  session: {
    createdAt: session.createdAt.toISOString(),
    expiresAt: session.expiresAt.toISOString(),
    id: session.id,
    tokenHash: session.tokenHash,
    userId: session.userId,
  },
  user: {
    email: session.user.email,
    id: session.user.id,
    name: session.user.name,
    role: session.user.role,
  },
});

const mapActionTokenEntity = (token: UserActionTokenEntity): UserActionTokenRecord => ({
  consumedAt: toIso(token.consumedAt),
  createdAt: token.createdAt.toISOString(),
  expiresAt: token.expiresAt.toISOString(),
  id: token.id,
  payload: token.payload ?? null,
  tokenHash: token.tokenHash,
  type: token.type as UserActionTokenRecord["type"],
  userId: token.userId,
});

@injectable()
export class AuthRepository implements IAuthRepository {
  public async createActionToken(input: CreateUserActionTokenInput) {
    const dataSource = await getDataSource();
    const repository = dataSource.getRepository(UserActionTokenEntity);

    const token = repository.create({
      consumedAt: null,
      createdAt: new Date(),
      expiresAt: input.expiresAt,
      id: input.id,
      payload: input.payload ?? null,
      tokenHash: input.tokenHash,
      type: input.type,
      userId: input.userId,
    });

    const savedToken = await repository.save(token);
    return mapActionTokenEntity(savedToken);
  }

  public async createSession(input: CreateSessionInput) {
    const dataSource = await getDataSource();

    await dataSource.getRepository(UserSessionEntity).save({
      createdAt: new Date(),
      expiresAt: input.expiresAt,
      id: input.id,
      tokenHash: input.tokenHash,
      userId: input.userId,
    });
  }

  public async createUser(input: CreateUserInput) {
    const dataSource = await getDataSource();
    const userRepository = dataSource.getRepository(UserEntity);

    await userRepository.save({
      avatarUrl: input.avatarUrl ?? null,
      birthDate: input.birthDate ? input.birthDate.toISOString().slice(0, 10) : null,
      createdAt: new Date(),
      email: input.email,
      emailVerifiedAt: input.emailVerifiedAt ?? null,
      id: input.id,
      name: input.name,
      passwordHash: input.passwordHash,
      role: input.role,
      updatedAt: new Date(),
    });

    return this.findUserById(input.id);
  }

  public async deleteActiveTokensByUserAndType(userId: string, type: UserActionTokenRecord["type"]) {
    const dataSource = await getDataSource();

    await dataSource
      .getRepository(UserActionTokenEntity)
      .createQueryBuilder()
      .delete()
      .from(UserActionTokenEntity)
      .where("user_id = :userId", { userId })
      .andWhere("type = :type", { type })
      .andWhere("consumed_at IS NULL")
      .execute();
  }

  public async deleteSessionByTokenHash(tokenHash: string) {
    const dataSource = await getDataSource();
    await dataSource.getRepository(UserSessionEntity).delete({ tokenHash });
  }

  public async deleteUser(userId: string) {
    const dataSource = await getDataSource();
    await dataSource.getRepository(UserEntity).delete({ id: userId });
  }

  public async findActionTokenByHash(type: UserActionTokenRecord["type"], tokenHash: string) {
    const dataSource = await getDataSource();
    const token = await dataSource.getRepository(UserActionTokenEntity).findOne({
      where: {
        tokenHash,
        type,
      },
    });

    return token ? mapActionTokenEntity(token) : null;
  }

  public async findSessionByTokenHash(tokenHash: string) {
    const dataSource = await getDataSource();
    const session = await dataSource.getRepository(UserSessionEntity).findOne({
      relations: {
        user: true,
      },
      where: {
        tokenHash,
      },
    });

    return session ? mapSessionEntity(session) : null;
  }

  public async findUserByEmail(email: string) {
    const dataSource = await getDataSource();
    const user = await dataSource
      .getRepository(UserEntity)
      .createQueryBuilder("user")
      .where("LOWER(user.email) = :email", { email: email.toLowerCase() })
      .getOne();

    return user ? mapUserEntity(user) : null;
  }

  public async findUserById(userId: string) {
    const dataSource = await getDataSource();
    const user = await dataSource.getRepository(UserEntity).findOne({
      where: {
        id: userId,
      },
    });

    return user ? mapUserEntity(user) : null;
  }

  public async getUserProfileById(userId: string) {
    const dataSource = await getDataSource();
    const user = await dataSource.getRepository(UserEntity).findOne({
      where: {
        id: userId,
      },
    });

    return user ? mapUserProfile(user) : null;
  }

  public async markActionTokenConsumed(tokenId: string) {
    const dataSource = await getDataSource();
    await dataSource.getRepository(UserActionTokenEntity).update(
      { id: tokenId },
      {
        consumedAt: new Date(),
      }
    );
  }

  public async updateUser(input: UpdateUserInput) {
    const dataSource = await getDataSource();
    const repository = dataSource.getRepository(UserEntity);
    const existingUser = await repository.findOne({
      where: {
        id: input.id,
      },
    });

    if (!existingUser) {
      return null;
    }

    await repository.update(
      { id: input.id },
      {
        avatarUrl: input.avatarUrl !== undefined ? input.avatarUrl : existingUser.avatarUrl,
        birthDate:
          input.birthDate !== undefined
            ? input.birthDate
              ? input.birthDate.toISOString().slice(0, 10)
              : null
            : existingUser.birthDate,
        email: input.email ?? existingUser.email,
        emailVerifiedAt:
          input.emailVerifiedAt !== undefined ? input.emailVerifiedAt : existingUser.emailVerifiedAt,
        name: input.name ?? existingUser.name,
        passwordHash: input.passwordHash ?? existingUser.passwordHash,
        role: input.role ?? existingUser.role,
        updatedAt: new Date(),
      }
    );

    return this.findUserById(input.id);
  }

  public async updateUserRole(userId: UserRecord["id"], role: UserRecord["role"]) {
    await this.updateUser({
      id: userId,
      role,
    });
  }
}
