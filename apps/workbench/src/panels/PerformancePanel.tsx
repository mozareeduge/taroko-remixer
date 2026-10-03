import { useState, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { recordEvent } from "../store/runtimeSlice.js";
import { captureTake, clearTakes, removeTake } from "../store/takesSlice.js";
import { appendSurfaceLine, clearSurface } from "../store/surfaceSlice.js";
import { generateEvent } from "@taroko/core";
import type { TarokoEvent, LineEvent, RunState } from "@taroko/schema";

export function PerformancePanel() {
  const dispatch = useAppDispatch();
  const project = useAppSelector((s) => s.project.present);
  const runState = useAppSelector((s) => s.runtime.runState);
  const takes = useAppSelector((s) => s.takes.takes);
  // Store-backed Surface history
  const surfaceLines = useAppSelector((s) => s.surface.lines);

  // Cue: private audition state — never written to Surface or Takes
  const [cueEvent, setCueEvent] = useState<TarokoEvent | null>(null);
  const cueQueueRef = useRef<RunState["queue"]>([...runState.queue]);

  // Surface: the committed event shown in UNMIX, persists across Cue clicks
  const [surfaceEvent, setSurfaceEvent] = useState<TarokoEvent | null>(null);
  const surfaceQueueRef = useRef<RunState["queue"]>([...runState.queue]);

  // Build a safe queue filtered to known devices
  function safeQueue(queue: RunState["queue"]): RunState["queue"] {
    const knownIds = new Set(project.lineDevices.map((d) => d.id));
    return queue.filter(
      (entry) => entry.type !== "device" || !entry.deviceId || knownIds.has(entry.deviceId),
    );
  }

  // CUE — private audition: previews next event WITHOUT committing to Surface or advancing tick
  function doCueAudition() {
    const state: Partial<RunState> = { ...runState, queue: safeQueue(cueQueueRef.current) };
    const ev = generateEvent(project, state);
    cueQueueRef.current = state.queue ?? [];
    setCueEvent(ev);
  }

  // SURFACE — committed generation: advances tick, appends to store-backed Surface history
  function doSurfaceGenerate() {
    const state: Partial<RunState> = { ...runState, queue: safeQueue(surfaceQueueRef.current) };
    const ev = generateEvent(project, state);
    surfaceQueueRef.current = state.queue ?? [];
    dispatch(recordEvent(ev));
    setSurfaceEvent(ev);
    if (ev.type === "line" && ev.surface) {
      dispatch(appendSurfaceLine(ev.surface));
    }
  }

  function doCaptureTake() {
    if (!surfaceEvent || surfaceEvent.type !== "line") return;
    const ev = surfaceEvent as LineEvent;
    dispatch(captureTake({
      id: `take_${Date.now()}`,
      tick: ev.tick,
      surface: ev.surface,
      trace: ev.trace,
      deviceName: ev.deviceName,
      route: ev.route,
    }));
  }

  const cueLineEvent = cueEvent?.type === "line" ? (cueEvent as LineEvent) : null;
  const surfaceLineEvent = surfaceEvent?.type === "line" ? (surfaceEvent as LineEvent) : null;

  return (
    <div className="tr-panel tr-panel--performance">
      <div className="tr-panel__main">

        {/* CUE — private audition; never writes to Surface */}
        <section className="tr-perf__section" aria-labelledby="cue-head">
          <div id="cue-head" className="tr-panel__section-head">CUE</div>
          <div className="tr-cue">
            <button
              className="tr-btn tr-btn--primary tr-cue__generate"
              onClick={doCueAudition}
              aria-label="Generate next event"
            >
              Audition ▶
            </button>
            {cueEvent && (
              <div
                className={["tr-cue__output", cueEvent.type === "breath" ? "tr-cue__output--breath" : ""].filter(Boolean).join(" ")}
                aria-live="polite"
                aria-atomic="true"
              >
                {cueEvent.type === "breath" ? (
                  <span className="tr-cue__breath" role="status">— breath —</span>
                ) : cueLineEvent ? (
                  <p className="tr-cue__line">{cueLineEvent.surface}</p>
                ) : null}
              </div>
            )}
          </div>
        </section>

        {/* SURFACE — store-backed history; has its own generate action */}
        <section className="tr-perf__section" aria-labelledby="surface-head">
          <div id="surface-head" className="tr-panel__section-head">
            SURFACE
            <button
              className="tr-btn tr-btn--ghost tr-btn--sm"
              onClick={() => dispatch(clearSurface())}
              aria-label="Clear surface history"
            >
              Clear
            </button>
          </div>
          <div className="tr-surface__controls">
            <button
              className="tr-btn tr-btn--secondary tr-surface__generate"
              onClick={doSurfaceGenerate}
              aria-label="Surface: generate and record next event"
            >
              Generate ▶
            </button>
          </div>
          <div className="tr-surface" aria-live="polite" aria-label="Surface output stream">
            {surfaceLines.length === 0 ? (
              <p className="tr-panel__empty">Generate events to see surface output.</p>
            ) : (
              surfaceLines.map((line: string, i: number) => (
                <p key={i} className="tr-surface__line">{line}</p>
              ))
            )}
          </div>
        </section>

        {/* UNMIX — provenance for most recent Surface event */}
        {surfaceLineEvent && (
          <section className="tr-perf__section" aria-labelledby="unmix-head">
            <div id="unmix-head" className="tr-panel__section-head">
              UNMIX
              <button
                className="tr-btn tr-btn--ghost tr-btn--sm"
                onClick={doCaptureTake}
                aria-label="Capture current event as a Take"
              >
                Capture Take
              </button>
            </div>
            <table className="tr-table tr-table--unmix" aria-label="Event trace">
              <tbody>
                <tr className="tr-table__row">
                  <th scope="row" className="tr-table__th tr-table__th--label">Device</th>
                  <td className="tr-table__td">{surfaceLineEvent.deviceName}</td>
                </tr>
                <tr className="tr-table__row">
                  <th scope="row" className="tr-table__th tr-table__th--label">Route</th>
                  <td className="tr-table__td">{surfaceLineEvent.route}</td>
                </tr>
                {surfaceLineEvent.consumedInputs.map((ci) => (
                  <tr key={ci.slot} className="tr-table__row">
                    <th scope="row" className="tr-table__th tr-table__th--label">{ci.slot} / {ci.tray}</th>
                    <td className="tr-table__td">
                      {ci.sourceLiteral}
                      {ci.direct && <span className="tr-badge tr-badge--direct">direct</span>}
                      {ci.derived && <span className="tr-badge tr-badge--derived">derived</span>}
                    </td>
                  </tr>
                ))}
                {surfaceLineEvent.trigger && (
                  <tr className="tr-table__row">
                    <th scope="row" className="tr-table__th tr-table__th--label">Trigger</th>
                    <td className="tr-table__td">
                      {surfaceLineEvent.trigger.name} → {surfaceLineEvent.trigger.type}: {surfaceLineEvent.trigger.text}
                    </td>
                  </tr>
                )}
                <tr className="tr-table__row">
                  <th scope="row" className="tr-table__th tr-table__th--label">Surface</th>
                  <td className="tr-table__td tr-table__td--surface">{surfaceLineEvent.surface}</td>
                </tr>
              </tbody>
            </table>
          </section>
        )}

        {/* TAKES — store-backed; persists across panel navigation */}
        {takes.length > 0 && (
          <section className="tr-perf__section" aria-labelledby="takes-head">
            <div id="takes-head" className="tr-panel__section-head">
              TAKES
              <button
                className="tr-btn tr-btn--ghost tr-btn--sm"
                aria-label="Clear all takes"
                onClick={() => dispatch(clearTakes())}
              >
                Clear all
              </button>
            </div>
            <ul className="tr-takes" aria-label="Captured takes">
              {takes.map((take) => (
                <li key={take.id} className="tr-take">
                  <span className="tr-take__tick" aria-label={`Tick ${take.tick}`}>#{take.tick}</span>
                  <p className="tr-take__surface">{take.surface}</p>
                  <button
                    className="tr-btn tr-btn--ghost tr-btn--xs"
                    onClick={() => dispatch(removeTake(take.id))}
                    aria-label={`Remove take ${take.tick}`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
