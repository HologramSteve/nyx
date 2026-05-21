import { discordClient } from "../construct/client.js";
import { AnswerInterpreter } from "../utils/answerInterpreter.js";
import { getPrompts } from "../utils/prompts.js";
import { formatDiscordReply } from "../utils/formatters.js";
import { is_blocked } from "../utils/brain.js";
const prompts = getPrompts();
async function handleMessage(message, ai) {
    // Ignore messages from bots (including ourselves)
    if (message.author.bot) return;

    // Ignore blocked users
    if (is_blocked(message.author.id, message.author.tag, message.author.username)) {
        console.log(`[BLOCKED] ignored message from ${message.author.tag}`);
        return;
    }

    console.log(`[${message.author.tag}]: ${message.content}`);

    let typingInterval = null;
    try {
        await message.channel.sendTyping();
        typingInterval = setInterval(() => {
            message.channel.sendTyping().catch(() => {});
        }, 8000);

        const reply = await ai.chat(prompts.lang + "(this message has been sent by user " + message.author.tag + ", with user id " + message.author.id + " and display name " + message.author.displayName + "): " + message.content);

        console.log(reply.content);

        const interpreter = new AnswerInterpreter(discordClient, reply.content, message);
        const results = await interpreter.handleInput();
        const ended = results?.some(r => r?.ended);
        if (ended && typingInterval) {
            clearInterval(typingInterval);
            typingInterval = null;
        }

        // If the AI didn't use any valid language commands, fall back to plain reply
        if (!results || results.length === 0) {
            const fullMessage = formatDiscordReply(reply);
            await message.reply(fullMessage);
        }
    } catch (error) {
        console.error("Error AI response:", error);
    } finally {
        if (typingInterval) clearInterval(typingInterval);
    }
}

export { handleMessage }