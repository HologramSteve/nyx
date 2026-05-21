import fs from "fs";
import path from "path";
import { NOTES, io } from "./helpers.js";

const md = n => n.endsWith(".md") ? n : `${n}.md`;

export function add_note(filename, content) {
    const p = path.join(NOTES, md(filename));
    io.write(p, content);
    return p;
}

export function get_note(filename) {
    return io.read(path.join(NOTES, md(filename)));
}

export function list_notes() {
    if (!fs.existsSync(NOTES)) return [];
    return fs.readdirSync(NOTES).filter(f => f.endsWith(".md")).map(f => ({
        name: f,
        content: io.read(path.join(NOTES, f)),
    }));
}

export function delete_note(filename) {
    const p = path.join(NOTES, md(filename));
    if (fs.existsSync(p)) fs.unlinkSync(p);
}

export function clear_notes() {
    if (!fs.existsSync(NOTES)) return;
    fs.readdirSync(NOTES).forEach(f => fs.unlinkSync(path.join(NOTES, f)));
}
