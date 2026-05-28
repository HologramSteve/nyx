# discord-agent

A Discord bot that replies to messages with an AI backend. It uses `discord.js` for the bot connection, `openai` against the DeepSeek API, and local markdown files under `prompts/` and `brain/` to shape behavior and store memory.

## What it does

- Listens for Discord messages in servers and DMs.
- Sends user messages to the AI model with local conversation context.
- Supports a small command language for memory, todos, notes, moderation, and Discord actions.
- Stores conversation and memory data in the `brain/` folder.

## Self deploy

1. Install Node.js 18 or newer.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the project root:

   ```env
   DISCORD_TOKEN=your_discord_bot_token
   DEEPSEEK_API_KEY=your_deepseek_api_key
   ```

4. In the Discord Developer Portal, enable the bot intents it needs:
   - Message Content Intent must be enabled.
   - The bot needs access to the servers or DMs where you want it to reply.

5. Start the bot:

   ```bash
   node index.js
   ```

## Notes

- The bot model is configured in `construct/client.js`.
- Prompt text is loaded from the markdown files in `prompts/`.
- If you want to change behavior, edit `prompts/sysprompt.md` and `prompts/lang.md`.

## Environment

- `DISCORD_TOKEN`: Discord bot token.
- `DEEPSEEK_API_KEY`: API key for the DeepSeek-compatible OpenAI endpoint.