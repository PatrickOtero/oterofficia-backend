import { getDataSource } from "../../shared/infra/database/data-source";
import { UserSessionEntity } from "../../shared/infra/database/entities/UserSessionEntity";
import { UserEntity } from "../../shared/infra/database/entities/UserEntity";
import { injectable } from "tsyringe";
import { CreateSessionInput, CreateUserInput, IAuthRepository, UpdateUserInput } from "./auth.repository.interface";
import { AuthenticatedSessionUser, SessionRecord, UserRecord } from "./auth.types";

const toIso = (value: Date) => value.toISOString();

const mapUserEntity = (user: UserEntity): UserRecord => ({
  createdAt: toIso(user.createdAt),
  email: user.email,
  id: user.id,
  name: user.name,
  passwordHash: user.passwordHash,
  role: user.role,
  updatedAt: toIso(user.updatedAt),
});

const mapSessionEntity = (
  session: UserSessionEntity
): { session: SessionRecord; user: AuthenticatedSessionUser } => ({
  session: {
    createdAt: toIso(session.createdAt),
    expiresAt: toIso(session.expiresAt),
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

@injectable()
export class AuthRepository implements IAuthRepository {
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
      createdAt: new Date(),
      email: input.email,
      id: input.id,
      name: input.name,
      passwordHash: input.passwordHash,
      role: input.role,
      updatedAt: new Date(),
    });

    return this.findUserById(input.id);
  }

  public async deleteSessionByTokenHash(tokenHash: string) {
    const dataSource = await getDataSource();

    await dataSource.getRepository(UserSessionEntity).delete({ tokenHash });
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

  public async updateUser(input: UpdateUserInput) {
    const dataSource = await getDataSource();

    await dataSource.getRepository(UserEntity).update(
      { id: input.id },
      {
        name: input.name,
        passwordHash: input.passwordHash,
        role: input.role,
        updatedAt: new Date(),
      }
    );
  }

  public async updateUserRole(userId: string, role: "admin" | "user") {
    const existingUser = await this.findUserById(userId);

    if (!existingUser) {
      return;
    }

    await this.updateUser({
      id: userId,
      name: existingUser.name,
      passwordHash: existingUser.passwordHash,
      role,
    });
  }
}
