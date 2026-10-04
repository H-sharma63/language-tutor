import { homedir } from "os";
import { join } from "path";
import { mkdirSync } from "fs";

export function appDataDir(): string {
  const base = process.env.APPDATA || join(homedir(), ".local", "share");
  const dir = join(base, "language-tutor");
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function configDir(): string {
  return appDataDir();
}

export function dataDir(): string {
  return appDataDir();
}