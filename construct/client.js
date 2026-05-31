import { Client, GatewayIntentBits, Events, Partials } from "discord.js";
import { AIClient } from "../utils/ai.js";
import { getPrompts } from "../utils/prompts.js";
import { AnswerInterpreter } from "../utils/answerInterpreter.js";
import { getSkillFile, getAllSkills } from "../utils/skills.js";

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const MODEL = "deepseek-v4-flash";

const langTool = {
    tool: {
        type: "function",
        function: {
            name: "execute_commands",
            description: "Execute a block of commands to interact with memory and discord internals. Read the lang.md prompt for details.",
            parameters: {
                type: "object",
                properties: {
                    commands: {
                        type: "string",
                        description: "The block of commands written in the custom language. Each command must end with a semicolon."
                    }
                },
                required: ["commands"]
            }
        }
    },
    call: async (args, context) => {
        const interpreter = new AnswerInterpreter(context.client, args.commands, context.message);
        return await interpreter.handleInput();
    }
};

const skillTool = {
    tool: {
        type: "function",
        function: {
            name: "get_skill_file",
            description: "Get the full markdown content for a named skill prompt.",
            parameters: {
                type: "object",
                properties: {
                    skillName: {
                        type: "string",
                        description: "The skill filename without the .md extension."
                    }
                },
                required: ["skillName"]
            }
        }
    },
    call: async (args) => {
        return getSkillFile(args.skillName);
    }
};

const skillListTool = {
    tool: {
        type: "function",
        function: {
            name: "get_all_skills",
            description: "List all available skill prompt names and their contents.",
            parameters: {
                type: "object",
                properties: {},
                required: []
            }
        }
    },
    call: async () => {
        return getAllSkills();
    }
};

const prompts = getPrompts();
const ai = new AIClient(DEEPSEEK_API_KEY, MODEL, [langTool, skillTool, skillListTool], prompts.sysprompt + "\n\n" + prompts.lang);

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel]
});

export { client as discordClient, ai as aiClient, DISCORD_TOKEN as discordToken}