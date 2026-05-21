import "dotenv/config";
import { AIClient } from "./ai.js"
import * as readline from "node:readline/promises";

const API_KEY = process.env.DEEPSEEK_API_KEY;
const MODEL = "deepseek-v4-flash";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function createTool(name, description, parameters, executionFn) {
    return {
        tool: {
            type: "function",
            function: {
                name,
                description,
                parameters
            }
        },
        call: executionFn
    };
}

const myTools = [
    createTool(
        "get_weather",
        "Get the current weather in a given location",
        {
            type: "object",
            properties: {
                location: {
                    type: "string",
                    description: "The city, e.g. San Francisco",
                },
            },
            required: ["location"],
        },
        async (args) => {
            console.log(`[Tool Executed]: get_weather called for ${args.location}`);
            return `The weather in ${args.location} is currently 72 degrees and sunny.`;
        }
    )
];

const client = new AIClient(API_KEY, MODEL, myTools, "You are a helpful assistant. Use tools when asked about the weather.");

console.log("=== AI Chat (type 'exit' to quit, 'stats' for token usage) ===\n");

async function chatLoop() {
    while (true) {
        const input = await rl.question("You: ");
        const trimmed = input.trim();

        if (trimmed.toLowerCase() === "exit") break;

        if (trimmed.toLowerCase() === "stats") {
            const last = client.history.length;
            const total = client.history.reduce((sum, m) => sum + m.content.length, 0);
            console.log(`  Messages in history: ${last}`);
            console.log(`  Total chars in history: ${total}`);
            continue;
        }

        const result = await client.chat(trimmed);

        console.log(`\nAI: ${result.content}`);
        console.log(`[tokens: ${result.usage.tokens_in}→${result.usage.tokens_out}, total: ${result.usage.tokens_total}]\n`);
    }

    rl.close();
    console.log("\nBye!");
}

chatLoop().catch(console.error);
