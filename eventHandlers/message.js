async function handleMessage(message, ai) {
    // Ignore messages from bots (including ourselves)
    if (message.author.bot) return;
    console.log(`[${message.author.tag}]: ${message.content}`);

    try {
        await message.channel.sendTyping();

        // generate full prompt

        const reply = await ai.chat("(this message has been sent by user " + message.author.tag + ", with user id " + message.author.id + " and display name " + message.author.displayName + "): " + message.content);

        await message.reply(reply.content + "\n-# Tokens (in/out): " + reply.usage.tokens_in + "/" + reply.usage.tokens_out + "\n-# Speed: " + reply.speed);
    } catch (error) {
        console.error("Error AI response:", error);
    }
}

export { handleMessage }