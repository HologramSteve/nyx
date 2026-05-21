import { discordClient } from "../construct/client.js";
import { AnswerInterpreter } from "../utils/answerInterpreter.js";

async function handleMessage(message, ai) {
    // Ignore messages from bots (including ourselves)
    if (message.author.bot) return;
    console.log(`[${message.author.tag}]: ${message.content}`);

    try {
        await message.channel.sendTyping();

        const reply = await ai.chat("(this message has been sent by user " + message.author.tag + ", with user id " + message.author.id + " and display name " + message.author.displayName + "): " + message.content);

        console.log(reply.content);

        const interpreter = new AnswerInterpreter(discordClient, reply.content, message);
        const results = interpreter.handleInput();

        // If the AI didn't use any valid language commands, fall back to plain reply
        if (!results || results.length === 0) {
            let footer = "\n-# Tokens (in/out): " + reply.usage.tokens_in + "/" + reply.usage.tokens_out + "\n-# Duration: " + reply.duration;
            let fullMessage = reply.content + footer;

            if (fullMessage.length > 2000) {
                console.log("Hit message limit. Full length: " + fullMessage.length);
                let maxContentLen = 2000 - footer.length - 50;
                if (maxContentLen < 0) maxContentLen = 0;
                reply.content = reply.content.substring(0, maxContentLen) + "\n*... [truncated]*";
                fullMessage = reply.content + footer;
                console.log("Truncated message: " + fullMessage.length);
            }

            if (fullMessage.length > 2000) {
                fullMessage = fullMessage.substring(0, 1997) + "...";
            }

            await message.reply(fullMessage);
        }
    } catch (error) {
        console.error("Error AI response:", error);
    }
}

export { handleMessage }