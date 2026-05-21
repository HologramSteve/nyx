/* 
this system will get 2 things:
- a discord.js client class
- an array of strings

the strings:
will contain a custom language for the AI to use to interact with the world (discord, memory, etc) instead of 100 tools flooding input tokens and costing us a fortune.
see docs (will be used in prompt) in prompts/lang.md

we will use a class which stores the client and the language, and has helper functions to interpret the language and call the client accordingly. this will be used in the message handler to interpret the AI's response and make it interact with discord.
*/

class AnswerInterpreter {
    constructor(discordClient, rawText, message = null) {
        this.client = discordClient;
        this.message = message;
        this.lines = rawText.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    }

    handleInput() {
        const results = [];
        for (const line of this.lines) {
            const result = this.handleLine(line);
            if (result) results.push(result);
            if (result?.ended) break;
        }
        return results;
    }

    handleLine(line) {
        // Parse: function_name(param1, param2, ...);
        const match = line.match(/^(\w+)\(([^)]*)\);$/);
        if (!match) return null;

        const fn = match[1];
        const params = match[2] ? match[2].split(",").map(p => p.trim()).filter(p => p) : [];

        console.log("Executed: " + fn)
        switch (fn) {
            case "reply":
                if (this.message) {
                    this.message.reply(params[0] || "").catch(() => {});
                }
                break;
            case "end":
                return { ended: true };
            default:
                console.log(`Unknown command: ${fn}`);
        }

        return { fn, params };
    }
}

export { AnswerInterpreter };