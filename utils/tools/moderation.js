import { block_user, unblock_user, get_blocked as brain_get_blocked } from "../brain.js";

async function block({ rawLine, params }) {
    const match = rawLine.match(/^block\s*\(\s*([^,]+)(?:,\s*(.*))?\);$/);
    if (match) {
        const identifier = match[1].trim();
        const reason = match[2] ? match[2].trim() : "No reason provided";
        block_user(identifier, reason);
    } else if (params[0]) {
        block_user(params[0].trim(), params[1] ? params.slice(1).join(",").trim() : "No reason provided");
    }
}

async function unblock({ params }) {
    if (params[0]) {
        unblock_user(params[0].trim());
    }
}

async function get_blocked() {
    const blocked = brain_get_blocked();
    if (blocked.length === 0) return "No one is currently blocked.";
    const lines = blocked.map(x => typeof x === "string" ? x : `${x.identifier} (Reason: ${x.reason})`);
    return `Currently blocked:\n${lines.join("\n")}`;
}

export { block, unblock, get_blocked };