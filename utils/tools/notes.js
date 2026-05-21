import { 
    add_note as brain_add_note, 
    delete_note as brain_delete_note, 
    clear_notes as brain_clear_notes,
    get_note as brain_get_note,
    list_notes as brain_list_notes
} from "../brain.js";

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

async function get_note({ params }) {
    if (params[0]) {
        const content = brain_get_note(params[0].trim());
        return content ? `Note '${params[0]}':\n${content}` : `Note '${params[0]}' not found.`;
    }
    return "Please specify a topic.";
}

async function get_notes() {
    const notes = brain_list_notes(); // returns [{name: "...", content: "..."}, ...]
    if (!notes || notes.length === 0) return "No notes found.";
    return `Available notes topics: ${notes.map(n => n.name.replace(".md", "")).join(", ")}`;
}

export { add_note, delete_note, clear_notes, get_note, get_notes };