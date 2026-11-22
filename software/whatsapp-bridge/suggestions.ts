import type { Line, Sug } from "./sugerir.ts";

type Contact = { phone: string; name: string; relation: string };
type SuggestionDependencies = {
  getContact: (contactId: string) => Contact | undefined;
  getLines: (contactId: string) => Line[];
  lastId: (contactId: string) => string;
  enabled: boolean;
  expandInitials: (name: string, relation: string, lines: Line[], initials: string) => Promise<Sug[]>;
  suggestReplies: (name: string, relation: string, lines: Line[], extra: string) => Promise<Sug[]>;
  agenteChat: (phone: string, name: string, lines: Line[]) => Promise<Sug[]>;
  emit: (event: Record<string, unknown>) => void;
  logError: (message: string) => void;
};

export function createSuggestions({
  getContact, getLines, lastId, enabled, expandInitials, suggestReplies, agenteChat, emit, logError,
}: SuggestionDependencies) {
  const cache = new Map<string, { at: number; list: Sug[] }>();
  const busy = new Map<string, Promise<Sug[]>>();

  function suggestFor(contactId: string, initials = "", extra = ""): Promise<Sug[]> {
    const contact = getContact(contactId);
    if (!contact || !enabled) return Promise.resolve([]);
    const key = `${contactId}|${lastId(contactId)}|${initials}|${extra}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < 10 * 60_000) return Promise.resolve(hit.list);
    if (busy.has(key)) return busy.get(key)!;

    const replies = () => extra
      ? suggestReplies(contact.name, contact.relation, getLines(contactId), extra)
      : agenteChat(contact.phone, contact.name, getLines(contactId))
        .then((list) => list.length ? list : suggestReplies(contact.name, contact.relation, getLines(contactId), extra));
    const promise = (initials
      ? expandInitials(contact.name, contact.relation, getLines(contactId), initials)
      : replies())
      .then((list) => {
        if (list.length) cache.set(key, { at: Date.now(), list });
        if (cache.size > 200) cache.delete(cache.keys().next().value!);
        return list;
      })
      .catch((error: any) => {
        logError(`[sugerir] sin respuesta de Claude (${error.message})`);
        return [] as Sug[];
      })
      .finally(() => busy.delete(key));
    busy.set(key, promise);
    return promise;
  }

  function prefetch(contactId: string) {
    const key = lastId(contactId);
    suggestFor(contactId).then((list) => {
      if (list.length) emit({ type: "suggest", contactId, key, suggestions: list });
    });
  }

  return { suggestFor, prefetch };
}
