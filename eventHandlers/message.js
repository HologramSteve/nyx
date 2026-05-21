import { discordClient } from "../construct/client.js";
import { AnswerInterpreter } from "../utils/answerInterpreter.js";
import { getPrompts } from "../utils/prompts.js";
import { formatDiscordReply } from "../utils/formatters.js";
import { is_blocked, checkAndUpdateServer } from "../utils/brain.js";
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

        // check server id

        const guildName = message.guild ? message.guild.name : null;
        const guildId = message.guild ? message.guild.id : null;
        const isNewServerContext = checkAndUpdateServer(guildName, guildId);

        const locationStr = message.guild ? `Server: ${guildId}, Channel: ${message.channel.id}` : `DM Channel: ${message.channel.id}`;
        let contextPrefix = `(Location: ${locationStr} | this message has been sent by user ${message.author.tag}, with user id ${message.author.id} and display name ${message.author.displayName})`;
        if (isNewServerContext) {
            const serverInfo = message.guild ? `Server: ${guildName} (${guildId})` : "Direct Message";
            contextPrefix = `[NEW CONTEXT: Now chatting in ${serverInfo}] ` + contextPrefix;
        }

        const reply = await ai.chat(
            contextPrefix + ": " + message.content,
            { client: discordClient, message: message }
        );

        console.log(reply.content);

        // If the AI outputted any straight text, fall back to plain reply
        if (reply.content && reply.content.trim().length > 0) {
            const fullMessage = formatDiscordReply(reply);
            await message.reply(fullMessage).catch(() => {});
        }
    } catch (error) {
        console.error("Error AI response:", error);
    } finally {
        if (typingInterval) clearInterval(typingInterval);
    }
}

export { handleMessage }