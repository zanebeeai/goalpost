import { execFileSync } from "node:child_process";
import { chmodSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const envPath = resolve(root, ".env.local");
const templatePath = resolve(root, ".env.example");
const supabaseCli = resolve(
  root,
  "node_modules",
  "supabase",
  "dist",
  "supabase.js",
);

if (!existsSync(supabaseCli)) {
  throw new Error("Dependencies are missing. Run pnpm install first.");
}

const status = JSON.parse(
  execFileSync(process.execPath, [supabaseCli, "status", "--output", "json"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  }),
);

const values = {
  NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    status.PUBLISHABLE_KEY ?? status.ANON_KEY,
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  SUPABASE_SECRET_KEY: status.SECRET_KEY ?? status.SERVICE_ROLE_KEY,
};

if (Object.values(values).some((value) => !value)) {
  throw new Error("The local Supabase stack did not return all required keys.");
}

let contents = existsSync(envPath)
  ? readFileSync(envPath, "utf8")
  : readFileSync(templatePath, "utf8");

for (const [key, value] of Object.entries(values)) {
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, "m");
  contents = pattern.test(contents)
    ? contents.replace(pattern, line)
    : `${line}\n${contents}`;
}

writeFileSync(envPath, contents, { encoding: "utf8", mode: 0o600 });
if (process.platform !== "win32") chmodSync(envPath, 0o600);

console.log("Local Supabase environment written to ignored .env.local.");
