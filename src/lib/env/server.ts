type NodeEnv = "development" | "test" | "production";

function parseNodeEnv(value: string | undefined): NodeEnv {
  if (value === "development" || value === "test" || value === "production") {
    return value;
  }

  return "development";
}

function parseOptionalString(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  return value.trim() ? value : undefined;
}

export const serverEnv = {
  NODE_ENV: parseNodeEnv(process.env.NODE_ENV),
  DATABASE_URL: parseOptionalString(process.env.DATABASE_URL),
  NEXTAUTH_SECRET: parseOptionalString(process.env.NEXTAUTH_SECRET),
};
