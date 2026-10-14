import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { setActivePinia, createPinia } from "pinia";

const run = vi.fn(async () => ({ content: '{"ok":true}' }));
mockNuxtImport("useApprenticeTools", () => () => ({ run }));

const message = (content: any[], stop_reason = "end_turn") =>
  ({
    content,
    stop_reason,
    usage: { input_tokens: 10, output_tokens: 5 },
  }) as any;

function fakeClient(replies: any[]) {
  const calls: any[] = [];

  return {
    calls,
    client: () => ({
      stream(params: any) {
        // structuredClone rejects reactive proxies.
        calls.push(JSON.parse(JSON.stringify(params)));
        const reply = replies.shift();

        return {
          on: () => {},
          finalMessage: () =>
            reply instanceof Error
              ? Promise.reject(reply)
              : Promise.resolve(reply),
          abort: () => {},
        };
      },
    }),
  };
}

describe("useApprentice", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    localStorage.setItem("quartz-apprentice-key", "sk-test");
    useApprentice("deck-1").clear();
    run.mockClear();
  });

  it("runs tool calls, sends all results back in one message, then stops", async () => {
    const { client, calls } = fakeClient([
      message(
        [
          { type: "tool_use", id: "t1", name: "get_deck", input: {} },
          { type: "tool_use", id: "t2", name: "add_slide", input: {} },
        ],
        "tool_use",
      ),
      message([{ type: "text", text: "Done" }]),
    ]);
    const apprentice = useApprentice("deck-1", client);

    await apprentice.send("make a deck");

    expect(run).toHaveBeenCalledTimes(2);
    const results = calls[1].messages.at(-1).content;
    expect(results.map((r: any) => r.tool_use_id)).toEqual(["t1", "t2"]);
    expect(apprentice.messages.value.at(-1)?.content).toEqual([
      { type: "text", text: "Done" },
    ]);
  });

  it("runs no tools on a refusal and keeps the history valid", async () => {
    const { client, calls } = fakeClient([
      message(
        [{ type: "tool_use", id: "t1", name: "add_slide", input: {} }],
        "refusal",
      ),
      message([{ type: "text", text: "ok" }]),
    ]);
    const apprentice = useApprentice("deck-1", client);

    await apprentice.send("x");
    await apprentice.send("y");

    expect(run).not.toHaveBeenCalled();
    const sent = calls[1].messages;
    const used = sent
      .flatMap((m: any) => (Array.isArray(m.content) ? m.content : []))
      .filter((b: any) => b.type === "tool_use");
    const answered = sent
      .flatMap((m: any) => (Array.isArray(m.content) ? m.content : []))
      .filter((b: any) => b.type === "tool_result");
    expect(used.map((b: any) => b.id)).toEqual(
      answered.map((b: any) => b.tool_use_id),
    );
    expect(answered[0].is_error).toBe(true);
  });

  it("stops before the next tool when stop() is called", async () => {
    const { client } = fakeClient([
      message(
        [
          { type: "tool_use", id: "t1", name: "add_slide", input: {} },
          { type: "tool_use", id: "t2", name: "add_slide", input: {} },
        ],
        "tool_use",
      ),
    ]);
    const apprentice = useApprentice("deck-1", client);
    run.mockImplementationOnce(async () => {
      apprentice.stop();
      return { content: "{}" };
    });

    await apprentice.send("x");

    expect(run).toHaveBeenCalledTimes(1);
    expect(apprentice.busy.value).toBe(false);
    expect(
      (apprentice.messages.value.at(-1)?.content as any[]).at(-1),
    ).toMatchObject({
      tool_use_id: "t2",
      content: "stopped by the user",
      is_error: true,
    });
  });

  it("shows an error and applies nothing when the request fails", async () => {
    const { client } = fakeClient([new Error("bad key")]);
    const apprentice = useApprentice("deck-1", client);

    await apprentice.send("x");

    expect(run).not.toHaveBeenCalled();
    expect(apprentice.error.value).toContain("bad key");
  });

  it("keeps the conversation per deck in localStorage", async () => {
    const { client } = fakeClient([message([{ type: "text", text: "hi" }])]);

    await useApprentice("deck-1", client).send("hello");

    expect(
      JSON.parse(localStorage.getItem("quartz-apprentice:deck-1")!),
    ).toHaveLength(2);
  });

  it("shares one running turn across every caller for a deck", async () => {
    let finish!: (reply: any) => void;
    const stream = vi.fn(() => ({
      on: () => {},
      finalMessage: () => new Promise<any>((r) => (finish = r)),
      abort: () => {},
    }));
    const first = useApprentice("deck-1", () => ({ stream }));
    const second = useApprentice("deck-1", () => ({ stream }));

    const sending = first.send("x");
    await second.send("y");

    expect(second.busy.value).toBe(true);
    expect(stream).toHaveBeenCalledTimes(1);

    finish(message([{ type: "text", text: "ok" }]));
    await sending;

    expect(second.busy.value).toBe(false);
  });

  it("keeps slide images out of storage but sends them within the turn", async () => {
    run.mockImplementationOnce(
      async () =>
        ({
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/png",
                data: "QUJDRA==",
              },
            },
          ],
        }) as any,
    );
    const { client, calls } = fakeClient([
      message(
        [{ type: "tool_use", id: "t1", name: "look", input: { slide: "s" } }],
        "tool_use",
      ),
      message([{ type: "text", text: "Looks fine" }]),
    ]);

    await useApprentice("deck-1", client).send("check it");

    expect(JSON.stringify(calls[1].messages)).toContain("QUJDRA==");
    const stored = localStorage.getItem("quartz-apprentice:deck-1")!;
    expect(stored).not.toContain("QUJDRA==");
    expect(stored).toContain("[slide image shown earlier]");
  });

  it("says why on an empty refusal and keeps the next request valid", async () => {
    const { client, calls } = fakeClient([
      {
        ...message([], "refusal"),
        stop_details: { category: null, explanation: "Not allowed." },
      },
      message([{ type: "text", text: "ok" }]),
    ]);
    const apprentice = useApprentice("deck-1", client);

    await apprentice.send("x");

    expect(apprentice.notice.value).toBe(
      "Claude declined this request. Not allowed.",
    );
    const stored = JSON.parse(
      localStorage.getItem("quartz-apprentice:deck-1")!,
    );
    expect(stored.every((m: any) => m.content.length)).toBe(true);

    await apprentice.send("y");

    expect(calls[1].messages.every((m: any) => m.content.length)).toBe(true);
    expect(calls[1].messages.map((m: any) => m.role)).toEqual([
      "user",
      "assistant",
      "user",
    ]);
    expect(apprentice.notice.value).toBeNull();
  });

  it("says when the reply was cut off", async () => {
    const { client } = fakeClient([
      message([{ type: "text", text: "Half" }], "max_tokens"),
    ]);
    const apprentice = useApprentice("deck-1", client);

    await apprentice.send("x");

    expect(apprentice.notice.value).toBe("The reply was cut off.");
  });
});
