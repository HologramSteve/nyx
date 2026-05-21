import path from "path";
import { BRAIN, io } from "./helpers.js";

const BLOCKED_FILE = path.join(BRAIN, "blocked.json");

export function get_blocked() {
    return io.readJSON(BLOCKED_FILE, []);
}

export function block_user(identifier, reason = "No reason provided") {
    const bl = get_blocked();
    const existing = bl.find(x => typeof x === "string" ? x === identifier : x.identifier === identifier);
    if (!existing) {
        bl.push({ identifier, reason });
        io.writeJSON(BLOCKED_FILE, bl);
    }
}

export function unblock_user(identifier) {
    const bl = get_blocked();
    io.writeJSON(BLOCKED_FILE, bl.filter(x => typeof x === "string" ? x !== identifier : x.identifier !== identifier));
}

export function is_blocked(id, tag, username) {
    const bl = get_blocked();
    return bl.some(x => {
        const ident = typeof x === "string" ? x : x.identifier;
        return ident === id || ident === tag || ident === username;
    });
}
