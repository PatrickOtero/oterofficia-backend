import { pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";
import { AppError } from "../errors/AppError";

const HASH_ALGORITHM = "pbkdf2_sha512";
const DIGEST = "sha512";
const ITERATIONS = 120000;
const KEY_LENGTH = 64;

export const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");

  return `${HASH_ALGORITHM}$${ITERATIONS}$${salt}$${hash}`;
};

export const verifyPassword = (password: string, storedHash: string) => {
  const [algorithm, iterationsValue, salt, hash] = storedHash.split("$");

  if (algorithm !== HASH_ALGORITHM || !iterationsValue || !salt || !hash) {
    throw new AppError("O hash de senha armazenado está inválido.", 500, "invalid_password_hash");
  }

  const iterations = Number(iterationsValue);
  const candidateHash = Uint8Array.from(
    pbkdf2Sync(password, salt, iterations, KEY_LENGTH, DIGEST)
  );
  const knownHash = Uint8Array.from(Buffer.from(hash, "hex"));

  if (knownHash.length !== candidateHash.length) {
    return false;
  }

  return timingSafeEqual(knownHash, candidateHash);
};
