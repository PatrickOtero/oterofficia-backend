import { AppError } from "../../../src/core/errors/AppError";
import { AuthRepositoryInMemory } from "../../../src/modules/auth/repositories/in-memory/AuthRepositoryInMemory";
import { AuthService } from "../../../src/modules/auth/auth.service";

describe("AuthService", () => {
  let authRepository: AuthRepositoryInMemory;
  let authService: AuthService;

  beforeEach(() => {
    authRepository = new AuthRepositoryInMemory();
    authService = new AuthService(authRepository);
    process.env.ADMIN_EMAIL = "admin@oterofficia.com";
  });

  it("registers a user and returns an authentication payload", async () => {
    const response = await authService.register({
      email: "patrick@oterofficia.com",
      name: "Patrick",
      password: "super-secret",
    });

    expect(response.user.email).toBe("patrick@oterofficia.com");
    expect(response.token).toEqual(expect.any(String));
    expect(authRepository.users).toHaveLength(1);
    expect(authRepository.sessions).toHaveLength(1);
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

  it("authenticates an existing user", async () => {
    await authService.register({
      email: "patrick@oterofficia.com",
      name: "Patrick",
      password: "super-secret",
    });

    const response = await authService.login({
      email: "patrick@oterofficia.com",
      password: "super-secret",
    });

    expect(response.user.name).toBe("Patrick");
    expect(response.token).toEqual(expect.any(String));
  });
});
