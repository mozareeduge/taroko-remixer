import { useState, useRef, useEffect, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { recordEvent, start, pause, stop } from "../store/runtimeSlice.js";
import { captureTake, clearTakes, removeTake } from "../store/takesSlice.js";
import {
  appendSurfaceRecord, clearSurface, selectLine, setFollowActive,
} from "../store/surfaceSlice.js";
import type { SurfaceRecord } from "../store/surfaceSlice.js";
import { generateEvent } from "@taroke/core";
import type { TarokeEvent, LineEvent, RunState } from "@taroke/schema";

export function PerformancePanel() {
  const dispatch = useAppDispatch();
  const project = useAppSelector((s) => s.project.present);
  const runState = useAppSelector((s) => s.runtime.runState);
  const status = useAppSelector((s) => s.runtime.status);
  const takes = useAppSelector((s) => s.takes.takes);
  const records = useAppSelector((s) => s.surface.records);
  const selectedIndex = useAppSelector((s) => s.surface.selectedIndex);
  const followActive = useAppSelector((s) => s.surface.followActive);

  const [cueEvent, setCueEvent] = useState<TarokeEvent | null>(null);
  const cueQueueRef = useRef<RunState["queue"]>([...runState.queue]);
  const surfaceQueueRef = useRef<RunState["queue"]>([...runState.queue]);
  const surfaceListRef = useRef<HTMLOListElement>(null);
  const [monitorOpen, setMonitorOpen] = useState(false);
  const [takeAnnotations, setTakeAnnotations] = useState<Record<string, string>>({});

  function safeQueue(queue: RunState["queue"]): RunState["queue"] {
    const knownIds = new Set(project.lineDevices.map((d) => d.id));
    return queue.filter(
      (entry) => entry.type !== "device" || !entry.deviceId || knownIds.has(entry.deviceId),
    );
  }

  const retention = project.surface?.retention ?? 28;

  const doSurfaceGenerate = useCallback(() => {
    const state: Partial<RunState> = { ...runState, queue: safeQueue(surfaceQueueRef.current) };
    const ev = generateEvent(project, state);
    surfaceQueueRef.current = state.queue ?? [];
    dispatch(recordEvent(ev));
    if (ev.type === "line") {
      const le = ev as LineEvent;
      const rec: SurfaceRecord = {
        id: le.id,
        tick: le.tick,
        surface: le.surface,
        ...(le.deviceName ? { deviceName: le.deviceName } : {}),
        ...(le.route ? { route: le.route } : {}),
        ...(le.trace ? { trace: le.trace } : {}),
        ...(le.consumedInputs ? {
          consumedInputs: le.consumedInputs.map((ci) => ({
            slot: ci.slot,
            tray: ci.tray,
            sourceLiteral: ci.sourceLiteral,
            ...(ci.direct !== undefined ? { direct: ci.direct } : {}),
            ...(ci.derived !== undefined ? { derived: ci.derived } : {}),
          })),
        } : {}),
        ...(le.trigger ? {
          trigger: { name: le.trigger.name ?? "", type: le.trigger.type, text: le.trigger.text ?? "" },
        } : {}),
      };
      dispatch(appendSurfaceRecord(rec));
      // Auto-select the newly generated record so UNMIX appears immediately
      const nextIndex = records.length >= retention ? retention - 1 : records.length;
      dispatch(selectLine(nextIndex));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, runState, dispatch, records.length, retention]);

  function doCueAudition() {
    const state: Partial<RunState> = { ...runState, queue: safeQueue(cueQueueRef.current) };
    const ev = generateEvent(project, state);
    cueQueueRef.current = state.queue ?? [];
    setCueEvent(ev);
  }

  // Timed playback: generate one event per surface.speedMs when running
  const speedMs = project.surface?.speedMs ?? 1200;
  useEffect(() => {
    if (status !== "running") return;
    const id = setInterval(doSurfaceGenerate, speedMs);
    return () => clearInterval(id);
  }, [status, speedMs, doSurfaceGenerate]);

  // Auto-scroll to bottom when follow is active and new records arrive
  useEffect(() => {
    if (!followActive || !surfaceListRef.current) return;
    surfaceListRef.current.scrollTop = surfaceListRef.current.scrollHeight;
  }, [records.length, followActive]);

  function handleSurfaceScroll() {
    const el = surfaceListRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    if (!atBottom && followActive) dispatch(setFollowActive(false));
  }

  function doCaptureTake(rec: SurfaceRecord) {
    dispatch(captureTake({
      id: `take_${Date.now()}_${rec.tick}`,
      tick: rec.tick,
      surface: rec.surface,
      trace: rec.trace ?? "",
      deviceName: rec.deviceName ?? "",
      route: rec.route ?? "",
    }));
  }

  const cueLineEvent = cueEvent?.type === "line" ? (cueEvent as LineEvent) : null;
  const selectedRecord = selectedIndex !== null ? (records[selectedIndex] ?? null) : null;

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
            <div className="tr-panel__section-actions">
              <button
                className="tr-btn tr-btn--secondary tr-surface__generate"
                onClick={doSurfaceGenerate}
                aria-label="Surface: generate and record next event"
              >
                Generate ▶
              </button>
              <button
                className="tr-btn tr-btn--ghost tr-btn--sm"
                onClick={() => dispatch(clearSurface())}
                aria-label="Clear surface history"
              >
                Clear
              </button>
            </div>
          </div>
          {!followActive && (
            <div className="tr-surface__follow-bar">
              <button
                className="tr-btn tr-btn--ghost tr-btn--sm"
                onClick={() => { dispatch(setFollowActive(true)); }}
                aria-label="Resume follow"
              >
                Resume follow ↓
              </button>
            </div>
          )}
          <ol
            className="tr-surface"
            aria-label="Surface output stream"
            aria-live="polite"
            ref={surfaceListRef}
            onScroll={handleSurfaceScroll}
          >
            {records.length === 0 ? (
              <li className="tr-panel__empty" role="listitem">Generate events to see surface output.</li>
            ) : (
              records.map((rec, i) => (
                <li
                  key={rec.id}
                  className={["tr-surface__line", selectedIndex === i ? "tr-surface__line--selected" : ""].filter(Boolean).join(" ")}
                  onClick={() => dispatch(selectLine(selectedIndex === i ? null : i))}
                  aria-selected={selectedIndex === i}
                  role="option"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); dispatch(selectLine(selectedIndex === i ? null : i)); } }}
                >
                  {rec.surface}
                </li>
              ))
            )}
          </ol>
        </section>

        {/* MONITOR — collapsible runtime snapshot */}
        <section className="tr-perf__section" aria-labelledby="monitor-head">
          <div id="monitor-head" className="tr-panel__section-head">
            MONITOR
            <button
              className="tr-btn tr-btn--ghost tr-btn--sm"
              aria-controls="tr-monitor-body"
              aria-expanded={monitorOpen}
              onClick={() => setMonitorOpen((o) => !o)}
              aria-label={monitorOpen ? "Collapse monitor" : "Expand monitor"}
            >
              {monitorOpen ? "▲" : "▼"}
            </button>
          </div>
          {monitorOpen && (
            <div id="tr-monitor-body" className="tr-monitor">
              <table className="tr-table tr-table--monitor" aria-label="Runtime monitor">
                <tbody>
                  <tr className="tr-table__row">
                    <th scope="row" className="tr-table__th tr-table__th--label">Tick</th>
                    <td className="tr-table__td">{runState.tick}</td>
                  </tr>
                  <tr className="tr-table__row">
                    <th scope="row" className="tr-table__th tr-table__th--label">Status</th>
                    <td className="tr-table__td">{status}</td>
                  </tr>
                  <tr className="tr-table__row">
                    <th scope="row" className="tr-table__th tr-table__th--label">Scene</th>
                    <td className="tr-table__td">{runState.currentScene ?? "—"}</td>
                  </tr>
                  <tr className="tr-table__row">
                    <th scope="row" className="tr-table__th tr-table__th--label">Pattern</th>
                    <td className="tr-table__td">{runState.currentStanza ?? "—"}</td>
                  </tr>
                  <tr className="tr-table__row">
                    <th scope="row" className="tr-table__th tr-table__th--label">Queue</th>
                    <td className="tr-table__td">{runState.queue?.length ?? 0} events</td>
                  </tr>
                  <tr className="tr-table__row">
                    <th scope="row" className="tr-table__th tr-table__th--label">Follow</th>
                    <td className="tr-table__td">{followActive ? "active" : "suspended"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* UNMIX — provenance for selected Surface record */}
        {selectedRecord && (
          <section className="tr-perf__section" aria-labelledby="unmix-head">
            <div id="unmix-head" className="tr-panel__section-head">
              UNMIX
              <button
                className="tr-btn tr-btn--ghost tr-btn--sm"
                onClick={() => doCaptureTake(selectedRecord)}
                aria-label="Capture current event as a Take"
              >
                Capture Take
              </button>
            </div>
            <table className="tr-table tr-table--unmix" aria-label="Event trace">
              <tbody>
                <tr className="tr-table__row">
                  <th scope="row" className="tr-table__th tr-table__th--label">Tick</th>
                  <td className="tr-table__td">{selectedRecord.tick}</td>
                </tr>
                {selectedRecord.deviceName && (
                  <tr className="tr-table__row">
                    <th scope="row" className="tr-table__th tr-table__th--label">Device</th>
                    <td className="tr-table__td">{selectedRecord.deviceName}</td>
                  </tr>
                )}
                {selectedRecord.route && (
                  <tr className="tr-table__row">
                    <th scope="row" className="tr-table__th tr-table__th--label">Route</th>
                    <td className="tr-table__td">{selectedRecord.route}</td>
                  </tr>
                )}
                {selectedRecord.consumedInputs?.map((ci) => (
                  <tr key={ci.slot} className="tr-table__row">
                    <th scope="row" className="tr-table__th tr-table__th--label">{ci.slot} / {ci.tray}</th>
                    <td className="tr-table__td">
                      {ci.sourceLiteral}
                      {ci.direct && <span className="tr-badge tr-badge--direct"> direct</span>}
                      {ci.derived && <span className="tr-badge tr-badge--derived"> derived</span>}
                    </td>
                  </tr>
                ))}
                {selectedRecord.trigger && (
                  <tr className="tr-table__row">
                    <th scope="row" className="tr-table__th tr-table__th--label">Trigger</th>
                    <td className="tr-table__td">
                      {selectedRecord.trigger.name} → {selectedRecord.trigger.type}: {selectedRecord.trigger.text}
                    </td>
                  </tr>
                )}
                <tr className="tr-table__row">
                  <th scope="row" className="tr-table__th tr-table__th--label">Surface</th>
                  <td className="tr-table__td tr-table__td--surface">{selectedRecord.surface}</td>
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
                  <input
                    className="tr-input tr-input--sm tr-take__annotation"
                    placeholder="Annotate…"
                    value={takeAnnotations[take.id] ?? ""}
                    onChange={(e) => setTakeAnnotations((prev) => ({ ...prev, [take.id]: e.target.value }))}
                    aria-label={`Annotation for take ${take.tick}`}
                  />
                  <button
                    className="tr-btn tr-btn--ghost tr-btn--xs"
                    onClick={() => dispatch(removeTake(take.id))}
                    aria-label={`Remove take ${take.tick}`}
                  >
                    Remove
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
