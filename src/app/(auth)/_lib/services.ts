import type {
  AuthUser,
  AuthUserRepository,
  CreateAuthUserInput,
} from "@/src/app/(auth)/_lib/repository";

type PasswordService = {
  hash: (password: string) => Promise<string>;
  verify: (password: string, passwordHash: string) => Promise<boolean>;
};

type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

type AuthenticateInput = {
  email: string;
  password: string;
};

type AuthActionResult = {
  ok: boolean;
  message: string;
  redirectTo?: string;
};

type AuthSuccessResult = AuthActionResult & {
  ok: true;
  user: AuthUser;
};

type AuthFailureResult = AuthActionResult & {
  ok: false;
};

export type AuthServiceResult = AuthSuccessResult | AuthFailureResult;

function unauthorizedResult(
  message = "Invalid email or password.",
): AuthFailureResult {
  return { ok: false, message };
}

export async function registerUser(
  input: RegisterInput,
  repository: AuthUserRepository,
  passwordService: PasswordService,
): Promise<AuthServiceResult> {
  const existing = await repository.findByEmail(input.email);

  if (existing) {
    return { ok: false, message: "An account with this email already exists." };
  }

  const passwordHash = await passwordService.hash(input.password);
  const createInput: CreateAuthUserInput = {
    name: input.name,
    email: input.email,
    passwordHash,
  };

  const user = await repository.create(createInput);
  return { ok: true, message: "Account created successfully.", user };
}

export async function authenticateUser(
  input: AuthenticateInput,
  repository: AuthUserRepository,
  passwordService: PasswordService,
): Promise<AuthServiceResult> {
  const user = await repository.findByEmail(input.email);

  if (!user) {
    return unauthorizedResult();
  }

  const isValidPassword = await passwordService.verify(
    input.password,
    user.passwordHash,
  );

  if (!isValidPassword) {
    return unauthorizedResult();
  }

  return { ok: true, message: "Signed in successfully.", user };
}
