/* 
this system will get 2 things:
- a discord.js client class
- an array of strings

the strings:
will contain a custom language for the AI to use to interact with the world (discord, memory, etc) instead of 100 tools flooding input tokens and costing us a fortune.
see docs (will be used in prompt) in prompts/lang.md

we will use a class which stores the client and the language, and has helper functions to interpret the language and call the client accordingly. this will be used in the message handler to interpret the AI's response and make it interact with discord.
*/

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AnswerInterpreter {
    static toolsPromise = null;

    static async loadTools() {
        if (this.toolsPromise) return this.toolsPromise;

        this.toolsPromise = (async () => {
            const toolsDir = path.join(__dirname, "tools");
            let entries = [];

            try {
                entries = await fs.readdir(toolsDir, { withFileTypes: true });
            } catch (error) {
                console.log("Tools directory not found:", error?.message || error);
                return {};
            }

            const tools = {};
            for (const entry of entries) {
                if (!entry.isFile()) continue;
                if (!entry.name.endsWith(".js")) continue;
                if (entry.name === "index.js") continue;

                const moduleUrl = pathToFileURL(path.join(toolsDir, entry.name)).href;
                const mod = await import(moduleUrl);

                for (const [name, exported] of Object.entries(mod)) {
                    if (typeof exported === "function") tools[name] = exported;
                }
            }

            return tools;
        })();

        return this.toolsPromise;
    }
    constructor(discordClient, rawText, message = null) {
        this.client = discordClient;
        this.message = message;
        this.lines = rawText.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    }

    async handleInput() {
        const tools = await AnswerInterpreter.loadTools();
        const results = [];
        let ignored = false;
        
        for (const line of this.lines) {
            const result = await this.handleLine(line, tools);
            if (result) results.push(result);
            if (result?.ended) {
                ignored = true;
                break;
            }
        }
        
        return results;
    }

    async handleLine(line, tools) {
        // Auto-fill missing semicolon
        if (!line.endsWith(";")) {
            line += ";";
        }

        // Parse: function_name(param1, param2, ...);
        const match = line.match(/^(\w+)\(([^)]*)\);$/);
        if (!match) return null;

        const fn = match[1];
        const params = match[2] ? match[2].split(",").map(p => p.trim()).filter(p => p) : [];
        const tool = tools[fn];

        if (!tool) {
            console.log(`Unknown command: ${fn}`);
            return null;
        }

        console.log("Executed: " + fn);
        console.log(params)
        console.log("Tool call supply:", {
            fn,
            params,
            rawLine: line
        });
        const result = await tool({
            client: this.client,
            message: this.message,
            params,
            rawLine: line
        });

        console.log("Tool call result:", {
            fn,
            result
        });

        if (result?.ended) return result;
        return { fn, params, result };
    }
}

export { AnswerInterpreter };