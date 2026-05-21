import { add_note as brain_add_note, delete_note as brain_delete_note, clear_notes as brain_clear_notes } from "../brain.js";

async function add_note({ rawLine, params }) {
    // We parse from rawLine because the content might contain commas, 
    // which the default AnswerInterpreter splits on.
    const match = rawLine.match(/^add_note\s*\(\s*([^,]+)\s*,\s*(.*)\);$/);
    
    if (match) {
        const filename = match[1].trim();
        const content = match[2].trim();
        brain_add_note(filename, content);
    } else if (params[0]) {
        // Fallback in case they only provided a filename with no content
        brain_add_note(params[0], "");
    }
}

async function delete_note({ params }) {
    if (params[0]) {
        brain_delete_note(params[0]);
    }
}

async function clear_notes() {
    brain_clear_notes();
}

export { add_note, delete_note, clear_notes };