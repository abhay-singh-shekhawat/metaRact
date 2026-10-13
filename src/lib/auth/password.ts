import "server-only";
import bcrypt from "bcryptjs";

const ROUNDS = 12;

/** Hash a plaintext admin password with bcrypt. Never store the input. */
export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, ROUNDS);
}

/** Constant-work-factor comparison of a plaintext candidate against a stored hash. */
export async function verifyPassword(
  plaintext: string,
  hash: string
): Promise<boolean> {
  if (!plaintext || !hash) return false;
  try {
    return await bcrypt.compare(plaintext, hash);
  } catch {
    return false;
  }
}
