#!/usr/bin/env node
/* sync-demo.mjs · espelha esta pasta no repo PÚBLICO de deploy e dá push.
 *
 * Por que existe: a entrega vive em dois lugares de propósito. Este workspace é
 * o espelho versionado, e `github.com/haestare/adzhub-harness` é o repo dedicado
 * que o Railway lê (Root Directory `web`). Sem este script, mexer no NEXO aqui
 * não muda a demo que o avaliador abre.
 *
 * ⚠️ NUNCA apagar `package.json` e `server.js` da RAIZ do repo de deploy: eles só
 * existem lá (foram criados para o Railway detectar Node) e um espelho cego os
 * removeria, o que quebraria o build se o Root Directory voltar a ser a raiz.
 *
 * Uso:
 *   node build/sync-demo.mjs            # só sincroniza se algo mudou
 *   node build/sync-demo.mjs --check    # diz o que faria, sem commitar
 *   node build/sync-demo.mjs -m "texto" # mensagem de commit própria
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const REPO = "https://github.com/haestare/adzhub-harness";
const CLONE = process.env.ADZHUB_DEPLOY_DIR || path.join(os.homedir(), "adzhub-harness-deploy");
const SRC = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const IGNORAR = new Set([".git", "node_modules", ".DS_Store"]);
const SO_DO_DEPLOY = ["package.json", "server.js"]; // existem só no repo de deploy

const args = process.argv.slice(2);
const CHECK = args.includes("--check");
const msgIdx = args.findIndex((a) => a === "-m" || a === "--message");
const MSG = msgIdx >= 0 ? args[msgIdx + 1] : null;

const git = (cwd, ...a) => execFileSync("git", a, { cwd, encoding: "utf8" }).trim();
const log = (...a) => console.log(...a);

function copiar(de, para) {
  fs.mkdirSync(para, { recursive: true });
  for (const nome of fs.readdirSync(de)) {
    if (IGNORAR.has(nome)) continue;
    const o = path.join(de, nome), d = path.join(para, nome);
    const st = fs.statSync(o);
    if (st.isDirectory()) copiar(o, d);
    else fs.copyFileSync(o, d);
  }
}

// remove no destino o que não existe mais na origem (menos o que é só do deploy)
function limpar(destino, origem, raiz = true) {
  for (const nome of fs.readdirSync(destino)) {
    if (IGNORAR.has(nome)) continue;
    if (raiz && SO_DO_DEPLOY.includes(nome)) continue;
    const d = path.join(destino, nome), o = path.join(origem, nome);
    if (!fs.existsSync(o)) { fs.rmSync(d, { recursive: true, force: true }); continue; }
    if (fs.statSync(d).isDirectory()) limpar(d, o, false);
  }
}

// 1. garante o clone
if (!fs.existsSync(path.join(CLONE, ".git"))) {
  if (CHECK) { log("[check] clonaria", REPO, "em", CLONE); process.exit(0); }
  log("clonando", REPO, "->", CLONE);
  execFileSync("git", ["clone", REPO, CLONE], { stdio: "inherit" });
} else {
  git(CLONE, "fetch", "origin", "main");
  git(CLONE, "reset", "--hard", "origin/main"); // o workspace é a fonte da verdade
}

// 2. espelha
copiar(SRC, CLONE);
limpar(CLONE, SRC);

// 3. só commita se mudou de fato
const sujo = git(CLONE, "status", "--porcelain");
if (!sujo) { log("demo já está sincronizada, nada a fazer"); process.exit(0); }
log("mudanças a subir:\n" + sujo);
if (CHECK) { log("[check] pararia aqui, sem commitar"); process.exit(0); }

git(CLONE, "add", "-A");
execFileSync("git", ["-c", "user.email=rafaelyran4@gmail.com", "-c", "user.name=Rafael Yran Azevedo",
  "commit", "-q", "-m", MSG || "Atualiza a demo a partir do workspace"], { cwd: CLONE });

// 4. push com backoff (rede é o que mais falha aqui)
let ok = false;
for (let i = 0; i < 4 && !ok; i++) {
  try { execFileSync("git", ["push", "origin", "main"], { cwd: CLONE, stdio: "inherit" }); ok = true; }
  catch { const s = 2 ** (i + 1); log(`push falhou, nova tentativa em ${s}s`); execFileSync("sleep", [String(s)]); }
}
if (!ok) { console.error("push falhou depois de 4 tentativas"); process.exit(1); }
log("demo sincronizada:", git(CLONE, "log", "--oneline", "-1"));
