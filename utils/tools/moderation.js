import { block_user, unblock_user } from "../brain.js";

async function block({ params }) {
    if (params[0]) {
        block_user(params[0].trim());
    }
}

async function unblock({ params }) {
    if (params[0]) {
        unblock_user(params[0].trim());
    }
}

export { block, unblock };