// Repo guard (run: npm run check:repo). Exits 1 on any violation: one lockfile, pinned Prisma, no migrations reachable from install/build hooks, engines and packageManager set.
import fs from "node:fs"; import path from "node:path";
const root = path.resolve(process.argv[2] ?? ".");
const read = (f) => JSON.parse(fs.readFileSync(path.join(root, f), "utf8"));
const errs = [];
const pkg = read("package.json");
const scripts = pkg.scripts ?? {};

// 1. exactly one lockfile, and it is package-lock.json
const locks = ["package-lock.json", "bun.lock", "bun.lockb", "yarn.lock", "pnpm-lock.yaml", "npm-shrinkwrap.json"].filter((f) => fs.existsSync(path.join(root, f)));
if (locks.length !== 1 || locks[0] !== "package-lock.json") errs.push(`Lockfiles must be exactly [package-lock.json], found [${locks.join(", ")}]`);

// 2. prisma and @prisma/client: identical, exact in package.json and in the lockfile
const pv = pkg.devDependencies?.prisma ?? pkg.dependencies?.prisma, cv = pkg.dependencies?.["@prisma/client"] ?? pkg.devDependencies?.["@prisma/client"];
if (!/^\d+\.\d+\.\d+$/.test(pv ?? "") || pv !== cv) errs.push(`prisma (${pv}) and @prisma/client (${cv}) must be the same exact version`);
if (locks.includes("package-lock.json")) {
  const l = read("package-lock.json").packages ?? {};
  const a = l["node_modules/prisma"]?.version, b = l["node_modules/@prisma/client"]?.version;
  if (a !== b || a !== pv) errs.push(`lockfile resolves prisma ${a} / @prisma/client ${b}, package.json pins ${pv}`);
}

// 3. no migrate / db push reachable from install or build hooks (follows `npm run x` one level at a time)
const BAD = /prisma\s+(migrate|db\s+push|db\s+execute)|db:push|db:migrate|db:reset|--accept-data-loss/;
const HOOKS = ["preinstall", "install", "postinstall", "prepare", "prepublish", "prebuild", "build", "postbuild", "vercel-build", "prevercel-build", "postvercel-build"];
const expand = (name, seen = new Set()) => {
  if (seen.has(name) || !scripts[name]) return "";
  seen.add(name);
  let s = scripts[name];
  for (const m of scripts[name].matchAll(/(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?([\w:-]+)/g)) s += " ; " + expand(m[1], seen);
  return s;
};
for (const h of HOOKS) if (BAD.test(expand(h))) errs.push(`script "${h}" can reach migrate/db push: ${scripts[h]}`);
for (const [n, s] of Object.entries(scripts)) if (/--accept-data-loss/.test(s)) errs.push(`script "${n}" uses --accept-data-loss`);

// 4. vercel.json must not override commands with migrations
if (fs.existsSync(path.join(root, "vercel.json"))) {
  const v = read("vercel.json");
  for (const k of ["buildCommand", "installCommand", "ignoreCommand", "devCommand"]) if (v[k] && BAD.test(v[k])) errs.push(`vercel.json ${k} reaches migrate/db push`);
}

// 5. engines + packageManager present; start must not need Bun
if (!pkg.engines?.node) errs.push("engines.node missing");
if (!/^npm@\d+\.\d+\.\d+$/.test(pkg.packageManager ?? "")) errs.push("packageManager must be npm@x.y.z");
if (/\bbun\b/.test(scripts.start ?? "")) errs.push('"start" depends on Bun');

if (errs.length) { console.error("check-repo FAILED:\n - " + errs.join("\n - ")); process.exit(1); }
console.log("check-repo OK");
