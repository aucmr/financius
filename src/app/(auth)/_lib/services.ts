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

export type ChangeUserPasswordInput = {
  userId: string;
  currentPassword: string;
  newPassword: string;
};

export type PasswordChangeResult =
  | { ok: true; message: string }
  | {
      ok: false;
      message: string;
      field?: "currentPassword" | "newPassword";
    };

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

export async function changeUserPassword(
  input: ChangeUserPasswordInput,
  repository: AuthUserRepository,
  passwordService: PasswordService,
): Promise<PasswordChangeResult> {
  const user = await repository.findById(input.userId);

  if (!user) {
    return {
      ok: false,
      message: "Não foi possível localizar sua conta. Entre novamente.",
    };
  }

  const isCurrentPasswordValid = await passwordService.verify(
    input.currentPassword,
    user.passwordHash,
  );

  if (!isCurrentPasswordValid) {
    return {
      ok: false,
      message: "A senha atual está incorreta.",
      field: "currentPassword",
    };
  }

  if (input.currentPassword === input.newPassword) {
    return {
      ok: false,
      message: "A nova senha deve ser diferente da senha atual.",
      field: "newPassword",
    };
  }

  const passwordHash = await passwordService.hash(input.newPassword);
  const updated = await repository.replacePasswordHash(
    user.id,
    user.passwordHash,
    passwordHash,
  );

  if (!updated) {
    return {
      ok: false,
      message:
        "A senha foi alterada em outra operação. Confira a senha atual e tente novamente.",
      field: "currentPassword",
    };
  }

  return { ok: true, message: "Senha alterada com sucesso." };
}
