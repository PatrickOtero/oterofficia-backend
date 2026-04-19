import { AppError } from "../../../src/core/errors/AppError";
import { AuthRepositoryInMemory } from "../../../src/modules/auth/repositories/in-memory/AuthRepositoryInMemory";
import { AuthService } from "../../../src/modules/auth/auth.service";

describe("AuthService", () => {
  let authRepository: AuthRepositoryInMemory;
  let authService: AuthService;
  let mailerMock: { sendMail: jest.Mock };
  let uploadServiceMock: { deleteFile: jest.Mock; uploadFile: jest.Mock };

  beforeEach(() => {
    authRepository = new AuthRepositoryInMemory();
    mailerMock = {
      sendMail: jest.fn().mockResolvedValue(undefined),
    };
    uploadServiceMock = {
      deleteFile: jest.fn().mockResolvedValue(undefined),
      uploadFile: jest.fn().mockResolvedValue({
        fallbackUsed: false,
        fileName: "avatar.png",
        folder: "avatars",
        key: "avatars/avatar.png",
        mimeType: "image/png",
        size: 10,
        source: "cloudflare",
      }),
    };
    authService = new AuthService(authRepository, mailerMock as any, uploadServiceMock as any);
    process.env.ADMIN_EMAIL = "admin@oterofficia.com";
  });

  it("registers a user and requests email verification", async () => {
    const response = await authService.register({
      email: "patrick@oterofficia.com",
      name: "Patrick",
      password: "super-secret",
    });

    expect(response.requiresEmailVerification).toBe(true);
    expect(authRepository.users).toHaveLength(1);
    expect(authRepository.tokens).toHaveLength(1);
    expect(mailerMock.sendMail).toHaveBeenCalledTimes(1);
  });

  it("rejects duplicate emails on register", async () => {
    await authService.register({
      email: "patrick@oterofficia.com",
      name: "Patrick",
      password: "super-secret",
    });

    await expect(
      authService.register({
        email: "patrick@oterofficia.com",
        name: "Patrick 2",
        password: "another-secret",
      })
    ).rejects.toMatchObject<AppError>({
      code: "email_in_use",
      statusCode: 409,
    });
  });

  it("authenticates an existing verified user", async () => {
    await authService.register({
      email: "patrick@oterofficia.com",
      name: "Patrick",
      password: "super-secret",
    });

    const createdUser = authRepository.users[0];
    await authRepository.updateUser({
      emailVerifiedAt: new Date(),
      id: createdUser.id,
    });

    const response = await authService.login({
      email: "patrick@oterofficia.com",
      password: "super-secret",
    });

    expect(response.user.name).toBe("Patrick");
    expect(response.token).toEqual(expect.any(String));
  });

  it("prevents login before email verification", async () => {
    await authService.register({
      email: "patrick@oterofficia.com",
      name: "Patrick",
      password: "super-secret",
    });

    await expect(
      authService.login({
        email: "patrick@oterofficia.com",
        password: "super-secret",
      })
    ).rejects.toMatchObject<AppError>({
      code: "email_not_verified",
      statusCode: 403,
    });
  });
});
