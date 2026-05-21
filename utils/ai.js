import OpenAI from "openai";

class AIClient {
    constructor(apiKey, model, tools = [], systemPrompt = null) {
        this.model = model
        this.history = [{role: "system", content: systemPrompt || "You are a helpful assistant."}]

        this.openai = new OpenAI({baseURL: "https://api.deepseek.com", apiKey: apiKey})
        this.tools = tools || [];
    }

    async chat(content, context = {}, remember=true, isSystem=false) {
        const startTime = performance.now();

        // determine the author for history logs
        let author = "user"
        if (isSystem) author = "system"

        // prepare history for request
        const userMsg = { role: author, content };
        
        if (remember) {
            this.history.push(userMsg);
        }

        const messages = remember ? this.history : [...this.history, userMsg];

        let completion = await this.openai.chat.completions.create({
            messages: messages,
            model: this.model,
            thinking: {"type": "disabled"}, // no thinking for now.
            // reasoning_effort: "high",
            stream: false, // fuck streaming (for now)
            ...(this.tools.length > 0 && { tools: this.tools.map(t => t.tool) })
        });

        let responseMessage = completion.choices[0].message;

        while (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
            if (remember) this.history.push(responseMessage);
            else messages.push(responseMessage);

            for (const toolCall of responseMessage.tool_calls) {
                const toolResult = await this.handleTool(toolCall, toolCall.function.arguments, context);
                const toolMsg = {
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult)
                };
                if (remember) this.history.push(toolMsg);
                else messages.push(toolMsg);
            }

            // Fetch secondary completion with tool results
            completion = await this.openai.chat.completions.create({
                messages: messages,
                model: this.model,
                thinking: {"type": "disabled"},
                stream: false,
                ...(this.tools.length > 0 && { tools: this.tools.map(t => t.tool) })
            });

            responseMessage = completion.choices[0].message;
        }

        // remember this chat by saving the final reply
        if (remember) {
            this.history.push(responseMessage);
        }

        const endTime = performance.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        const response = {
            content: responseMessage.content,
            usage: {
                tokens_in: completion.usage.prompt_tokens,
                tokens_out: completion.usage.completion_tokens,
                tokens_total: completion.usage.total_tokens,
                tokens_in_cached: completion.usage.prompt_cache_hit_tokens,
                tokens_in_uncached: completion.usage.prompt_cache_miss_tokens
            },
            duration: `${duration}s`,
            speed: duration > 0 ? `${(completion.usage.completion_tokens / duration).toFixed(2)} tokens/s` : "?"
        }
        
        return response;
    }

    async handleTool(toolCall, args, context) {
        const foundTool = this.tools.find(t => t.tool.function.name === toolCall.function.name);
        if (!foundTool) {
            console.error(`Tool ${toolCall.function.name} not found!`);
            return "Tool not found";
        }

        const result = await foundTool.call(JSON.parse(args), context);
        return result;
    }

    clearMemory() {
        const systemMsg = this.history[0];
        this.history = [systemMsg];
        console.log("aiClient | Memory cleared.");
    }
}

export { AIClient };