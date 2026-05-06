import crypto from "crypto";

const FORMAT_PREFIX = "pbkdf2";
const DEFAULT_ITERATIONS = 210_000;
const KEY_LENGTH_BYTES = 32;
const DIGEST = "sha256";

export function isHashedPassword(value) {
  return typeof value === "string" && value.startsWith(`${FORMAT_PREFIX}$`);
}

export async function hashPassword(password, { iterations = DEFAULT_ITERATIONS } = {}) {
  if (typeof password !== "string" || password.length === 0) {
    return "";
  }

  const salt = crypto.randomBytes(16);
  const derivedKey = await pbkdf2Async(password, salt, iterations);

  return [
    FORMAT_PREFIX,
    String(iterations),
    salt.toString("base64"),
    derivedKey.toString("base64"),
  ].join("$");
}

export async function verifyPassword(password, stored) {
  if (typeof password !== "string" || password.length === 0) {
    return { ok: false, upgradedHash: null };
  }

  if (typeof stored !== "string" || stored.length === 0) {
    return { ok: false, upgradedHash: null };
  }

  if (!isHashedPassword(stored)) {
    const ok = stored === password;
    return { ok, upgradedHash: ok ? await hashPassword(password) : null };
  }

  const parsed = parseHash(stored);
  if (!parsed) {
    return { ok: false, upgradedHash: null };
  }

  const derivedKey = await pbkdf2Async(password, parsed.salt, parsed.iterations);
  const ok = timingSafeEqual(derivedKey, parsed.hash);

  return { ok, upgradedHash: null };
}

function parseHash(stored) {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== FORMAT_PREFIX) {
    return null;
  }

  const iterations = Number(parts[1]);
  if (!Number.isFinite(iterations) || iterations < 10_000) {
    return null;
  }

  try {
    const salt = Buffer.from(parts[2], "base64");
    const hash = Buffer.from(parts[3], "base64");
    if (salt.length < 8 || hash.length !== KEY_LENGTH_BYTES) {
      return null;
    }

    return { iterations, salt, hash };
  } catch {
    return null;
  }
}

function timingSafeEqual(a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b) || a.length !== b.length) {
    return false;
  }

  return crypto.timingSafeEqual(a, b);
}

function pbkdf2Async(password, salt, iterations) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, iterations, KEY_LENGTH_BYTES, DIGEST, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

