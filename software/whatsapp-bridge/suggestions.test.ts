import assert from "node:assert/strict";
import { test } from "node:test";
import { createSuggestions } from "./suggestions.ts";
import type { Sug } from "./sugerir.ts";

const suggestion: Sug = { text: "Hola", tone: "amable", emo: "alegre" };

function setup(overrides: Partial<Parameters<typeof createSuggestions>[0]> = {}) {
  const calls: string[] = [];
  const events: Record<string, unknown>[] = [];
  const dependencies: Parameters<typeof createSuggestions>[0] = {
    getContact: (id) => id === "c1" ? { phone: "+123", name: "Ana", relation: "amiga" } : undefined,
    getLines: () => [{ dir: "in", text: "¿Vienes?" }],
    lastId: () => "m1",
    enabled: true,
    expandInitials: async () => { calls.push("initials"); return [suggestion]; },
    suggestReplies: async (_name, _relation, _lines, extra) => { calls.push(`replies:${extra}`); return [suggestion]; },
    agenteChat: async () => { calls.push("agent"); return []; },
    emit: (event) => events.push(event),
    logError: (message) => calls.push(message),
    ...overrides,
  };
  return { suggestions: createSuggestions(dependencies), calls, events };
}

test("uses the agent first, falls back to replies, and caches by last message", async () => {
  const { suggestions, calls } = setup();

  assert.deepEqual(await suggestions.suggestFor("c1"), [suggestion]);
  assert.deepEqual(await suggestions.suggestFor("c1"), [suggestion]);
  assert.deepEqual(calls, ["agent", "replies:"]);
});

test("coalesces concurrent work and emits prefetched suggestions with the captured key", async () => {
  let resolveAgent!: (result: Sug[]) => void;
  const { suggestions, calls, events } = setup({
    agenteChat: () => new Promise((resolve) => { calls.push("agent"); resolveAgent = resolve; }),
  });

  suggestions.prefetch("c1");
  const pending = suggestions.suggestFor("c1");
  resolveAgent([suggestion]);
  assert.deepEqual(await pending, [suggestion]);
  await Promise.resolve();
  assert.deepEqual(calls, ["agent"]);
  assert.deepEqual(events, [{ type: "suggest", contactId: "c1", key: "m1", suggestions: [suggestion] }]);
});

test("uses initials directly and ignores missing contacts or disabled suggestions", async () => {
  const disabled = setup({ enabled: false });
  assert.deepEqual(await disabled.suggestions.suggestFor("c1"), []);
  assert.deepEqual(await disabled.suggestions.suggestFor("missing"), []);

  const enabled = setup();
  assert.deepEqual(await enabled.suggestions.suggestFor("c1", "h"), [suggestion]);
  assert.deepEqual(enabled.calls, ["initials"]);
});
