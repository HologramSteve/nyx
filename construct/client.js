import { Client, GatewayIntentBits, Events } from "discord.js";
import { AIClient } from "../utils/ai.js";
import { getPrompts } from "../utils/prompts.js";

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const MODEL = "deepseek-v4-flash";

const prompts = getPrompts();
const ai = new AIClient(DEEPSEEK_API_KEY, MODEL, [], prompts.sysprompt);

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ] 
});

export { client as discordClient, ai as aiClient, DISCORD_TOKEN as discordToken}