import type { TarokoProject, ProjectNote, TarokoEvent } from "@taroko/schema";
import { uid, clone } from "./utils.js";

export function addOrUpdateNote(
  project: TarokoProject,
  event: TarokoEvent,
  status = "repair",
  text = "",
): ProjectNote {
  project.notes = project.notes ?? [];
  let n = project.notes.find((x) => x.eventId === event.id);
  if (!n) {
    const lineEvent = event.type === "line" ? event : null;
    n = {
      id: uid("note"),
      eventId: event.id,
      status,
      note: text,
      surface: event.surface,
      event: clone(event),
      linkedTokenIds: lineEvent
        ? Object.values(lineEvent.selectedTokens ?? {})
            .filter(Boolean)
            .map((t) => t!.id)
        : [],
      linkedDeviceId: lineEvent?.deviceId ?? "",
      linkedStanzaId: lineEvent?.stanzaId ?? "",
      updatedAt: new Date().toISOString(),
    };
    project.notes.push(n);
  } else {
    n.status = status;
    n.note = text ?? n.note;
    n.event = clone(event);
    n.surface = event.surface;
    n.updatedAt = new Date().toISOString();
  }
  return n;
}
