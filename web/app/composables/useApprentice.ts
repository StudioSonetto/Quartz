import type Anthropic from "@anthropic-ai/sdk";

type Stream = {
  on(event: "text", cb: (text: string) => void): unknown;
  finalMessage(): Promise<Anthropic.Message>;
  abort(): void;
};

export type ApprenticeClient = {
  stream(params: Record<string, unknown>): Stream;
};

// Lazy, to keep the SDK out of the editor bundle.
const realClient = async (apiKey: string): Promise<ApprenticeClient> => {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const anthropic = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  return {
    stream: (params) =>
      anthropic.beta.messages.stream({
        ...params,
        betas: [
          "server-side-fallback-2026-07-01",
          "thinking-binding-controls-2026-08-01",
        ],
        fallbacks: "default",
        thinking: {
          type: "adaptive",
          block_binding: { prefix_mismatch_behavior: "drop_block" },
        },
      } as any) as unknown as Stream,
  };
};

const describeError = (err: any) =>
  err?.status === 401
    ? "That API key was rejected. Check it in the Anthropic console."
    : err?.status === 429
      ? "Rate limited by Anthropic. Wait a moment and try again."
      : err?.status
        ? `Anthropic error ${err.status}: ${err.message}`
        : (err?.message ?? "Something went wrong.");

const answerUnrun = (
  content: Anthropic.MessageParam["content"],
  done: Anthropic.ToolResultBlockParam[],
  why: string,
): Anthropic.ToolResultBlockParam[] =>
  (typeof content === "string" ? [] : content).flatMap((block) =>
    block.type === "tool_use" && !done.some((r) => r.tool_use_id === block.id)
      ? [
          {
            type: "tool_result" as const,
            tool_use_id: block.id,
            content: why,
            is_error: true,
          },
        ]
      : [],
  );

const IMAGE_STUB = "[slide image shown earlier]";

// Stored images would fill localStorage.
const withoutImages = (
  messages: Anthropic.MessageParam[],
): Anthropic.MessageParam[] =>
  messages.map((m) =>
    typeof m.content === "string"
      ? m
      : {
          ...m,
          content: m.content.map((block) =>
            block.type === "tool_result" &&
            Array.isArray(block.content) &&
            block.content.some((c) => c.type === "image")
              ? { ...block, content: IMAGE_STUB }
              : block,
          ),
        },
  );

const noticeFor = (
  reply: Anthropic.Message & {
    stop_details?: { explanation?: string | null } | null;
  },
) =>
  reply.stop_reason === "refusal"
    ? ["Claude declined this request.", reply.stop_details?.explanation]
        .filter(Boolean)
        .join(" ")
    : reply.stop_reason === "max_tokens"
      ? "The reply was cut off."
      : null;

function createApprentice(deckId: string) {
  const key = useLocalStorage("quartz-apprentice-key", "");
  const model = useLocalStorage("quartz-apprentice-model", "claude-opus-5-5");
  const messages = useLocalStorage<Anthropic.MessageParam[]>(
    `quartz-apprentice:${deckId}`,
    [],
  );
  const busy = ref(false);
  const error = ref<string | null>(null);
  const notice = ref<string | null>(null);
  const streaming = ref("");
  const usage = ref({ input: 0, output: 0 });
  const tools = useApprenticeTools(deckId);
  const history = useHistoryStore();

  let stopped = false;
  let current: Stream | null = null;

  function stop() {
    stopped = true;
    current?.abort();
  }

  async function send(
    text: string,
    client?: (key: string) => ApprenticeClient | Promise<ApprenticeClient>,
  ) {
    if (busy.value || !key.value) return;

    busy.value = true;
    stopped = false;
    error.value = null;
    notice.value = null;
    usage.value = { input: 0, output: 0 };

    // A tab closed mid-turn leaves unanswered tool calls, which the API rejects.
    const dangling =
      messages.value.at(-1)?.role === "assistant"
        ? answerUnrun(
            messages.value.at(-1)!.content,
            [],
            "not run: the page was closed",
          )
        : [];
    const turn: Anthropic.MessageParam[] = [
      ...messages.value,
      { role: "user", content: [...dangling, { type: "text", text }] },
    ];
    const push = (message: Anthropic.MessageParam) => {
      turn.push(message);
      messages.value = withoutImages(turn);
    };

    messages.value = withoutImages(turn);

    const system = apprenticeSystem();
    const close = history.begin("Apprentice");

    try {
      const api = await (client ?? realClient)(key.value);

      while (!stopped) {
        streaming.value = "";
        current = api.stream({
          model: model.value,
          max_tokens: 64000,
          system,
          tools: APPRENTICE_TOOLS,
          cache_control: { type: "ephemeral" },
          messages: turn,
        });
        current.on("text", (delta) => (streaming.value += delta));

        const reply = await current.finalMessage();

        usage.value.input +=
          reply.usage.input_tokens +
          (reply.usage.cache_read_input_tokens ?? 0) +
          (reply.usage.cache_creation_input_tokens ?? 0);
        usage.value.output += reply.usage.output_tokens;
        notice.value = noticeFor(reply);
        // The API rejects an empty assistant message.
        push({
          role: "assistant",
          content: reply.content.length
            ? reply.content
            : [{ type: "text", text: "[no reply]" }],
        });

        // A refusal can cut a tool call short: answer it, never run it.
        if (reply.stop_reason !== "tool_use") {
          const unanswered = answerUnrun(
            reply.content,
            [],
            `not run: the reply ended with ${reply.stop_reason}`,
          );

          if (unanswered.length) push({ role: "user", content: unanswered });

          break;
        }

        const results: Anthropic.ToolResultBlockParam[] = [];

        for (const block of reply.content) {
          if (block.type !== "tool_use" || stopped) continue;

          const out = await tools.run(
            block.name,
            block.input as Record<string, any>,
          );

          results.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: out.content,
            ...(out.isError && { is_error: true }),
          });
        }

        results.push(
          ...answerUnrun(reply.content, results, "stopped by the user"),
        );

        push({ role: "user", content: results });
      }
    } catch (err) {
      if (!stopped) error.value = describeError(err);
    } finally {
      close();
      current = null;
      streaming.value = "";
      busy.value = false;
    }
  }

  const clear = () => (messages.value = []);

  return {
    key,
    model,
    messages,
    busy,
    error,
    notice,
    streaming,
    usage,
    send,
    stop,
    clear,
  };
}

// One per deck in a detached scope, so a turn outlives the panel and a remount rejoins it.
const apprentices = new Map<string, ReturnType<typeof createApprentice>>();

export function useApprentice(
  deckId: string,
  client?: (key: string) => ApprenticeClient | Promise<ApprenticeClient>,
) {
  if (!apprentices.has(deckId))
    apprentices.set(
      deckId,
      effectScope(true).run(() => createApprentice(deckId))!,
    );

  const apprentice = apprentices.get(deckId)!;

  return {
    ...apprentice,
    send: (text: string) => apprentice.send(text, client),
  };
}

export const stopApprentice = (deckId: string) =>
  apprentices.get(deckId)?.stop();
