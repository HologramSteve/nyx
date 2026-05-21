import path from "path";
import { BRAIN, io } from "./helpers.js";

const SERVER_FILE = path.join(BRAIN, "serverid.txt");

export function checkAndUpdateServer(guildName, guildId) {
    const newContext = guildName ? `${guildName} (${guildId})` : "Direct Message";
    const currentContext = io.read(SERVER_FILE) || "";
    
    if (newContext !== currentContext.trim()) {
        io.write(SERVER_FILE, newContext);
        return true;
    }
    return false;
}
