import fs from "fs";
import path from "path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const BRAIN = path.resolve(__dirname, "..", "..", "brain");
export const CONVOS = path.join(BRAIN, "convos");
export const NOTES = path.join(BRAIN, "notes");
export const TODOS = path.join(BRAIN, "todos");
export const MAX_CONVO = 50;

[CONVOS, NOTES, TODOS].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

export const io = {
    readJSON: (p, fb = null) => { try { return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf-8")) : fb; } catch { return fb; } },
    writeJSON: (p, d) => fs.writeFileSync(p, JSON.stringify(d, null, 2), "utf-8"),
    read: (p) => { try { return fs.existsSync(p) ? fs.readFileSync(p, "utf-8") : null; } catch { return null; } },
    write: (p, c) => fs.writeFileSync(p, c, "utf-8"),
};
