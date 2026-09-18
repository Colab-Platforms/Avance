import { prisma } from "../../database/prisma";
import { AppError } from "../../common/errors/AppError";
import { comparePassword } from "../../common/utils/password";
import { signToken } from "../../common/utils/jwt";
import { LoginInput } from "./auth.validation";

export async function login({ email, password }: LoginInput) {
  const admin = await prisma.admin.findUnique({ where: { email } });

  if (!admin) {
    throw new AppError(401, "Invalid email or password");
  }

  const isValid = await comparePassword(password, admin.passwordHash);

  if (!isValid) {
    throw new AppError(401, "Invalid email or password");
  }

  const token = signToken({ sub: admin.id, email: admin.email });

  return { token, admin: { id: admin.id, email: admin.email } };
}
