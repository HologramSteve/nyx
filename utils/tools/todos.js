import { add_todo as brain_add_todo, delete_todo as brain_delete_todo, clear_todos as brain_clear_todos } from "../brain.js";

async function add_todo({ rawLine, params }) {
    const match = rawLine.match(/^add_todo\s*\(\s*(.*)\);$/);
    
    if (match) {
        const task = match[1].trim();
        brain_add_todo(task);
    } else if (params[0]) {
        brain_add_todo(params[0]);
    }
}

async function delete_todo({ params }) {
    if (params[0]) {
        brain_delete_todo(params[0]);
    }
}

async function clear_todos() {
    brain_clear_todos();
}

export { add_todo, delete_todo, clear_todos };