// Run on YOUR computer: node scripts/admin-setup.mjs
// Prints three values to paste into Cloudflare (Workers > Settings > Variables and Secrets, type "Secret").
// Nothing is sent anywhere. Do not paste the output into chat or commit it.
import { createInterface } from "node:readline";
import { webcrypto as c } from "node:crypto";

const hex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const b32 = (b) => { let bits = 0, v = 0, o = ""; for (const x of b) { v = (v << 8) | x; bits += 8; while (bits >= 5) { o += B32[(v >>> (bits - 5)) & 31]; bits -= 5; } } return bits ? o + B32[(v << (5 - bits)) & 31] : o; };

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((r) => rl.question(q, r));
const email = (await ask("Your admin email (same as in Cloudflare Access): ")).trim();
const pw = await ask("Choose a password (16+ characters; it will be visible while typing): ");
rl.close();
if (pw.length < 16) { console.error("Password must be at least 16 characters."); process.exit(1); }

const salt = c.getRandomValues(new Uint8Array(16));
const key = await c.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveBits"]);
const bits = await c.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 100000 }, key, 256);
const totp = b32(c.getRandomValues(new Uint8Array(20)));
console.log("\nADMIN_PASSWORD_HASH  =", `pbkdf2$100000$${hex(salt)}$${hex(bits)}`);
console.log("ADMIN_TOTP_SECRET    =", totp);
console.log("ADMIN_SESSION_SECRET =", hex(c.getRandomValues(new Uint8Array(32))));
console.log("\nAdd the TOTP secret to an authenticator app (Google Authenticator, Authy, 1Password) by entering it manually:");
console.log(`otpauth://totp/BeigeLeads%20Admin:${encodeURIComponent(email)}?secret=${totp}&issuer=BeigeLeads%20Admin`);
