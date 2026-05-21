import fs from "fs";
import path from "path";
import { TODOS, io } from "./helpers.js";

const md = n => n.endsWith(".md") ? n : `${n}.md`;

export function add_todo(filename, content) {
    const p = path.join(TODOS, md(filename));
    io.write(p, content);
    return p;
}

export function get_todo(filename) {
    return io.read(path.join(TODOS, md(filename)));
}

export function list_todos() {
    if (!fs.existsSync(TODOS)) return [];
    return fs.readdirSync(TODOS).filter(f => f.endsWith(".md")).map(f => ({
        name: f,
        content: io.read(path.join(TODOS, f)),
    }));
}

export function delete_todo(filename) {
    const p = path.join(TODOS, md(filename));
    if (fs.existsSync(p)) fs.unlinkSync(p);
}

export function clear_todos() {
    if (!fs.existsSync(TODOS)) return;
    fs.readdirSync(TODOS).forEach(f => fs.unlinkSync(path.join(TODOS, f)));
}
