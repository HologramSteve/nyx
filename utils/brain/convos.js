import fs from "fs";
import path from "path";
import { CONVOS, MAX_CONVO, io } from "./helpers.js";

const file = userId => path.join(CONVOS, `${userId}.json`);

export function get_user_convo(userId) {
    return io.readJSON(file(userId), []);
}

export function add_to_user_convo(userId, role, content) {
    const p = file(userId);
    const c = io.readJSON(p, []);
    c.push({ role, content, ts: Date.now() });
    if (c.length > MAX_CONVO) c.splice(0, c.length - MAX_CONVO);
    io.writeJSON(p, c);
    return c;
}

export function clear_user_convo(userId) {
    const p = file(userId);
    if (fs.existsSync(p)) fs.unlinkSync(p);
}
