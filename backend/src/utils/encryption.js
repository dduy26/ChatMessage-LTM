const crypto = require("crypto");

// Format: enc:v1:<base64(iv[12] + tag[16] + ciphertext)>
const PREFIX = "enc:v1:";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getKey() {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("Missing ENCRYPTION_KEY in environment");
  }
  // User can provide any length; we derive a stable 32-byte key for AES-256-GCM.
  return crypto.createHash("sha256").update(String(raw), "utf8").digest();
}

function isEncrypted(value) {
  return typeof value === "string" && value.startsWith(PREFIX);
}

function encryptText(plainText) {
  if (plainText == null) return plainText;
  const text = String(plainText);
  if (text.length === 0) return "";
  if (isEncrypted(text)) return text; // avoid double-encryption

  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  const payload = Buffer.concat([iv, tag, ciphertext]).toString("base64");
  return `${PREFIX}${payload}`;
}

function decryptText(value) {
  if (value == null) return value;
  const text = String(value);
  if (!isEncrypted(text)) return text; // backward-compatible with old plaintext rows

  const payloadB64 = text.slice(PREFIX.length);
  const payload = Buffer.from(payloadB64, "base64");
  if (payload.length < IV_LENGTH + TAG_LENGTH) {
    throw new Error("Invalid encrypted payload");
  }

  const iv = payload.subarray(0, IV_LENGTH);
  const tag = payload.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = payload.subarray(IV_LENGTH + TAG_LENGTH);

  const key = getKey();
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plain.toString("utf8");
}

module.exports = {
  encryptText,
  decryptText,
  isEncrypted,
};

