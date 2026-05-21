import path from "path";
import { BRAIN, io } from "./helpers.js";

const BLOCKED_FILE = path.join(BRAIN, "blocked.json");

export function get_blocked() {
    return io.readJSON(BLOCKED_FILE, []);
}

export function block_user(identifier) {
    const bl = get_blocked();
    if (!bl.includes(identifier)) {
        bl.push(identifier);
        io.writeJSON(BLOCKED_FILE, bl);
    }
}

export function unblock_user(identifier) {
    const bl = get_blocked();
    io.writeJSON(BLOCKED_FILE, bl.filter(x => x !== identifier));
}

export function is_blocked(id, tag, username) {
    const bl = get_blocked();
    return bl.includes(id) || bl.includes(tag) || bl.includes(username);
}
