# [Project AIRI](https://github.com/moeru-ai/airi) Web AI Realtime Voice Chat Demo

> [!NOTE]
>
> This project is part of (and also associate to) the [Project AIRI](https://github.com/moeru-ai/airi), we aim to build a LLM-driven VTuber like [Neuro-sama](https://www.youtube.com/@Neurosama) (subscribe if you didn't!) if you are interested in, please do give it a try on [live demo](https://airi.moeru.ai).
>
> Who are we?
>
> We are a group of currently non-funded talented people made up with computer scientists, experts in multi-modal fields, designers, product managers, and popular open source contributors who loves the goal of where we are heading now.

Demos:

- [VAD](https://proj-airi-apps-vad.netlify.app)
- [VAD + ASR](https://proj-airi-apps-vad-asr.netlify.app)
- [VAD + ASR + LLM Chat](https://proj-airi-apps-vad-asr-chat.netlify.app)
- [VAD + ASR + LLM Chat + TTS](https://proj-airi-apps-vad-asr-chat-tts.netlify.app)

## Development

```shell
pnpm i
```

```shell
pnpm -F @proj-airi/vad-asr-chat dev
```

## Other examples about AI / Model inference from Project AIRI

- [WebAI Examples](https://github.com/proj-airi/webai-examples): WebGPU, and use of AI models inside Web Browsers (you could think of it as a type-safe and UI improved version of [🤗 Transformers.js' example repository](https://github.com/huggingface/transformers.js-examples))
- [🤗 candle Examples](https://github.com/proj-airi/candle-examples): Examples of using [🤗 candle](https://github.com/huggingface/candle) for inference AI models in Rust, you could think of it as an alternative and more transformers like library than [Burn Examples (this repository)].
- [Burn Examples](https://github.com/proj-airi/burn-examples): Examples of using [Burn.dev](https://burn.dev) for inference AI models in Rust, you could think of it as an alternative and more advanced library than [🤗 candle Examples].

## Other side projects born from [Project AIRI](https://github.com/moeru-ai/airi)

- [Awesome AI VTuber](https://github.com/proj-airi/awesome-ai-vtuber): A curated list of AI VTubers and related projects
- [`unspeech`](https://github.com/moeru-ai/unspeech): Universal endpoint proxy server for `/audio/transcriptions` and `/audio/speech`, like LiteLLM but for any ASR and TTS
- [`hfup`](https://github.com/moeru-ai/hfup): tools to help on deploying, bundling to HuggingFace Spaces
- [`xsai-transformers`](https://github.com/moeru-ai/xsai-transformers): Experimental [🤗 Transformers.js](https://github.com/huggingface/transformers.js) provider for [xsAI](https://github.com/moeru-ai/xsai).
- [WebAI: Realtime Voice Chat](https://github.com/proj-airi/webai-realtime-voice-chat): Full example of implementing ChatGPT's realtime voice from scratch with VAD + STT + LLM + TTS.
- [`@proj-airi/drizzle-duckdb-wasm`](https://github.com/moeru-ai/airi/tree/main/packages/drizzle-duckdb-wasm/README.md): Drizzle ORM driver for DuckDB WASM
- [`@proj-airi/duckdb-wasm`](https://github.com/moeru-ai/airi/tree/main/packages/duckdb-wasm/README.md): Easy to use wrapper for `@duckdb/duckdb-wasm`
- [Airi Factorio](https://github.com/moeru-ai/airi-factorio): Allow Airi to play Factorio
- [Factorio RCON API](https://github.com/nekomeowww/factorio-rcon-api): RESTful API wrapper for Factorio headless server console
- [`autorio`](https://github.com/moeru-ai/airi-factorio/tree/main/packages/autorio): Factorio automation library
- [`tstl-plugin-reload-factorio-mod`](https://github.com/moeru-ai/airi-factorio/tree/main/packages/tstl-plugin-reload-factorio-mod): Reload Factorio mod when developing
- [Velin](https://github.com/luoling8192/velin): Use Vue SFC and Markdown to write easy to manage stateful prompts for LLM
- [`demodel`](https://github.com/moeru-ai/demodel): Easily boost the speed of pulling your models and datasets from various of inference runtimes.
- [`inventory`](https://github.com/moeru-ai/inventory): Centralized model catalog and default provider configurations backend service
- [MCP Launcher](https://github.com/moeru-ai/mcp-launcher): Easy to use MCP builder & launcher for all possible MCP servers, just like Ollama for models!
- [🥺 SAD](https://github.com/moeru-ai/sad): Documentation and notes for self-host and browser running LLMs.
