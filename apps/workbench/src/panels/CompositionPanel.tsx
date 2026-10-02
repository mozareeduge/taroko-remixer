import { useState, useCallback, useRef, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { mutateProject } from "../store/projectSlice.js";
import { selectStanza, selectScene } from "../store/selectionSlice.js";
import {
  addStanzaPattern, removeStanzaPattern, toggleStanzaEnabled,
  addStanzaSlot, removeStanzaSlot, reorderStanzaSlots, setSlotChance, setSlotRepeat,
  addFlowScene, removeFlowScene, toggleSceneEnabled, setSceneChance,
} from "../store/commands.js";
import { uid } from "@taroko/core";
import type { StanzaSlot } from "@taroko/schema";

export function CompositionPanel() {
  const dispatch = useAppDispatch();
  const project = useAppSelector((s) => s.project.present);
  const primary = useAppSelector((s) => s.selection.primary);

  const stanzas = project.stanzaPatterns ?? [];
  const scenes = project.flowScenes ?? [];
  const devices = project.lineDevices ?? [];

  const activeStanzaId = primary?.type === "stanza" ? primary.stanzaId : stanzas[0]?.id ?? null;
  const activeStanza = stanzas.find((s) => s.id === activeStanzaId) ?? null;

  const [newStanzaName, setNewStanzaName] = useState("");
  const [newSceneName, setNewSceneName] = useState("");

  // ── HTML5 pointer drag state ──────────────────────────────────────────────────
  const [dragFromIdx, setDragFromIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // ── Keyboard pickup/move/drop state ──────────────────────────────────────────
  // When pickedUpId is set, the slot is "in the air"; localOrder is the preview.
  const [pickedUpId, setPickedUpId] = useState<string | null>(null);
  const [localOrder, setLocalOrder] = useState<string[] | null>(null);

  // ── Touch drag state ──────────────────────────────────────────────────────────
  const [touchDragId, setTouchDragId] = useState<string | null>(null);
  const [touchOverId, setTouchOverId] = useState<string | null>(null);
  const slotsListRef = useRef<HTMLDivElement>(null);

  // Attach a non-passive touchmove listener so preventDefault() actually works on
  // iOS/Chrome — React synthetic events are passive by default and silently ignore it.
  useEffect(() => {
    const el = slotsListRef.current;
    if (!el) return;
    function handleNativeTouchMove(e: TouchEvent) {
      if (touchDragId) e.preventDefault();
    }
    el.addEventListener("touchmove", handleNativeTouchMove, { passive: false });
    return () => el.removeEventListener("touchmove", handleNativeTouchMove);
  }, [touchDragId]);

  function doAddStanza() {
    const name = newStanzaName.trim();
    if (!name) return;
    const stanza = {
      id: uid("st"),
      name,
      enabled: true,
      description: "",
      slots: [],
    };
    dispatch(mutateProject(addStanzaPattern(project, stanza)));
    setNewStanzaName("");
  }

  function doAddScene() {
    if (!newSceneName.trim() || !activeStanzaId) return;
    const scene = {
      id: uid("sc"),
      name: newSceneName.trim(),
      stanzaId: activeStanzaId,
      enabled: true,
      chance: 100,
      mode: "loop",
    };
    dispatch(mutateProject(addFlowScene(project, scene)));
    setNewSceneName("");
  }

  function doAddBreathSlot() {
    if (!activeStanzaId) return;
    dispatch(mutateProject(addStanzaSlot(project, activeStanzaId, { id: uid("slot"), type: "breath", label: "BREATH", repeat: "once", chance: 100 })));
  }

  function doAddDeviceSlot(deviceId: string, deviceName: string) {
    if (!activeStanzaId) return;
    dispatch(mutateProject(addStanzaSlot(project, activeStanzaId, { id: uid("slot"), type: "device", deviceId, label: deviceName, repeat: "once", chance: 100 })));
  }

  // ── Pointer drag handlers ─────────────────────────────────────────────────────

  function onDragStart(i: number) {
    setDragFromIdx(i);
    cancelPickup();
  }

  function onDragOver(e: React.DragEvent, i: number) {
    e.preventDefault();
    setDragOverIdx(i);
  }

  function onDrop(e: React.DragEvent, i: number) {
    e.preventDefault();
    if (dragFromIdx === null || dragFromIdx === i || !activeStanza) {
      setDragFromIdx(null);
      setDragOverIdx(null);
      return;
    }
    const ids = activeStanza.slots.map((s) => s.id);
    const moved = ids[dragFromIdx];
    if (!moved) { setDragFromIdx(null); setDragOverIdx(null); return; }
    ids.splice(dragFromIdx, 1);
    ids.splice(i, 0, moved);
    dispatch(mutateProject(reorderStanzaSlots(project, activeStanza.id, ids)));
    setDragFromIdx(null);
    setDragOverIdx(null);
  }

  function onDragEnd() {
    setDragFromIdx(null);
    setDragOverIdx(null);
  }

  // ── Touch drag handlers ───────────────────────────────────────────────────────

  function onTouchStart(slotId: string) {
    cancelPickup();
    setTouchDragId(slotId);
    setTouchOverId(null);
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!touchDragId) return;
    const touch = e.touches[0];
    if (!touch) return;
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const row = el?.closest("[data-slot-id]");
    const overId = row?.getAttribute("data-slot-id") ?? null;
    setTouchOverId(overId !== touchDragId ? overId : null);
  }

  function onTouchEnd() {
    if (touchDragId && touchOverId && activeStanza) {
      const ids = activeStanza.slots.map((s) => s.id);
      const fromIdx = ids.indexOf(touchDragId);
      const toIdx = ids.indexOf(touchOverId);
      if (fromIdx >= 0 && toIdx >= 0 && fromIdx !== toIdx) {
        ids.splice(fromIdx, 1);
        ids.splice(toIdx, 0, touchDragId);
        dispatch(mutateProject(reorderStanzaSlots(project, activeStanza.id, ids)));
      }
    }
    setTouchDragId(null);
    setTouchOverId(null);
  }

  // OS-level cancel (call, notification, system gesture) — never commit; only clear state.
  function onTouchCancel() {
    setTouchDragId(null);
    setTouchOverId(null);
  }

  // ── Keyboard pickup/move/drop handlers ───────────────────────────────────────

  function startPickup(slotId: string) {
    if (!activeStanza) return;
    setPickedUpId(slotId);
    setLocalOrder(activeStanza.slots.map((s) => s.id));
  }

  function movePickedUp(delta: number) {
    if (!pickedUpId || !localOrder) return;
    const idx = localOrder.indexOf(pickedUpId);
    const newIdx = idx + delta;
    if (newIdx < 0 || newIdx >= localOrder.length) return;
    const next = [...localOrder];
    next.splice(idx, 1);
    next.splice(newIdx, 0, pickedUpId);
    setLocalOrder(next);
  }

  function commitPickup() {
    if (!pickedUpId || !localOrder || !activeStanza) { cancelPickup(); return; }
    dispatch(mutateProject(reorderStanzaSlots(project, activeStanza.id, localOrder)));
    setPickedUpId(null);
    setLocalOrder(null);
  }

  function cancelPickup() {
    setPickedUpId(null);
    setLocalOrder(null);
  }

  const handleDragHandleKeyDown = useCallback(
    (e: React.KeyboardEvent, slotId: string) => {
      if (pickedUpId === null) {
        if (e.key === " ") { e.preventDefault(); startPickup(slotId); }
        return;
      }
      if (pickedUpId !== slotId) return; // Only the picked-up handle reacts
      if (e.key === "ArrowUp")   { e.preventDefault(); movePickedUp(-1); }
      if (e.key === "ArrowDown") { e.preventDefault(); movePickedUp(1); }
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); commitPickup(); }
      if (e.key === "Escape")    { e.preventDefault(); cancelPickup(); }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pickedUpId, localOrder, activeStanza, project],
  );

  // Display order: use localOrder during keyboard pickup, otherwise follow Redux
  const displaySlots: StanzaSlot[] = activeStanza
    ? localOrder
      ? localOrder.map((id) => activeStanza.slots.find((s) => s.id === id)!).filter(Boolean)
      : activeStanza.slots
    : [];

  return (
    <div className="tr-panel tr-panel--composition">
      <div className="tr-panel__sidebar">
        <div className="tr-panel__section-head">PATTERNS</div>
        <ul className="tr-list" role="list">
          {stanzas.map((st) => (
            <li key={st.id} className="tr-list__item">
              <button
                className={["tr-list__btn", activeStanzaId === st.id ? "tr-list__btn--active" : ""].filter(Boolean).join(" ")}
                onClick={() => dispatch(selectStanza(st.id))}
                aria-current={activeStanzaId === st.id ? "true" : undefined}
              >
                <span className="tr-list__label">{st.name}</span>
                <span className={["tr-list__badge", st.enabled ? "tr-list__badge--on" : "tr-list__badge--off"].join(" ")}>
                  {st.enabled ? "ON" : "OFF"}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="tr-panel__add-row">
          <input
            className="tr-input tr-input--sm"
            placeholder="Pattern name"
            value={newStanzaName}
            onChange={(e) => setNewStanzaName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") doAddStanza(); }}
            aria-label="New pattern name"
          />
          <button className="tr-btn tr-btn--ghost" onClick={doAddStanza}>+ Pattern</button>
        </div>
      </div>

      <div className="tr-panel__main">
        {activeStanza ? (
          <>
            <div className="tr-panel__section-head">
              {activeStanza.name}
              <button
                className="tr-btn tr-btn--ghost tr-btn--sm"
                onClick={() => dispatch(mutateProject(toggleStanzaEnabled(project, activeStanza.id)))}
                aria-label={`${activeStanza.enabled ? "Disable" : "Enable"} ${activeStanza.name}`}
              >
                {activeStanza.enabled ? "Enabled" : "Disabled"}
              </button>
              <button
                className="tr-btn tr-btn--ghost tr-btn--sm"
                onClick={() => dispatch(mutateProject(removeStanzaPattern(project, activeStanza.id)))}
                aria-label={`Remove ${activeStanza.name}`}
              >
                Remove
              </button>
            </div>

            <div className="tr-panel__subsection-head">SLOTS</div>
            <div
              className="tr-slots"
              role="list"
              aria-label="Pattern slots"
              ref={slotsListRef}
            >
              {displaySlots.map((slot, i) => {
                const realIdx = activeStanza.slots.findIndex((s) => s.id === slot.id);
                const isPickedUp = pickedUpId === slot.id;

                function moveSlot(delta: number) {
                  const ids = activeStanza!.slots.map((s) => s.id);
                  const newIdx = realIdx + delta;
                  if (newIdx < 0 || newIdx >= ids.length) return;
                  ids.splice(realIdx, 1);
                  ids.splice(newIdx, 0, slot.id);
                  dispatch(mutateProject(reorderStanzaSlots(project, activeStanza!.id, ids)));
                }

                const isTouchOver = touchOverId === slot.id;
                return (
                  <div
                    key={slot.id}
                    role="listitem"
                    data-slot-id={slot.id}
                    className={[
                      "tr-slot",
                      dragFromIdx === i ? "tr-slot--dragging" : "",
                      dragOverIdx === i ? "tr-slot--drag-over" : "",
                      isPickedUp ? "tr-slot--picked-up" : "",
                      touchDragId === slot.id ? "tr-slot--dragging" : "",
                      isTouchOver ? "tr-slot--drag-over" : "",
                    ].filter(Boolean).join(" ")}
                    draggable
                    onDragStart={() => onDragStart(i)}
                    onDragOver={(e) => onDragOver(e, i)}
                    onDrop={(e) => onDrop(e, i)}
                    onDragEnd={onDragEnd}
                    aria-grabbed={isPickedUp ? true : undefined}
                  >
                    {/* Drag handle — keyboard pickup entry point + touch drag */}
                    <button
                      className="tr-btn tr-btn--icon tr-slot__drag-handle"
                      aria-label={
                        isPickedUp
                          ? `Slot ${slot.label} picked up — use arrow keys to move, Space to drop, Escape to cancel`
                          : `Reorder slot ${slot.label} — press Space to pick up`
                      }
                      aria-pressed={isPickedUp}
                      onKeyDown={(e) => handleDragHandleKeyDown(e, slot.id)}
                      onTouchStart={() => onTouchStart(slot.id)}
                      onTouchMove={onTouchMove}
                      onTouchEnd={onTouchEnd}
                      onTouchCancel={onTouchCancel}
                      tabIndex={0}
                    >
                      ⣿
                    </button>
                    <span className="tr-slot__index">{i + 1}</span>
                    <span className="tr-slot__type">{slot.type === "breath" ? "BREATH" : slot.label}</span>
                    <input
                      type="number"
                      className="tr-input tr-input--num"
                      value={slot.chance}
                      min={0}
                      max={100}
                      onChange={(e) => dispatch(mutateProject(setSlotChance(project, activeStanza!.id, slot.id, Number(e.target.value))))}
                      aria-label={`Chance for slot ${slot.label}`}
                    />
                    <span className="tr-slot__pct" aria-hidden="true">%</span>
                    <select
                      className="tr-select tr-select--sm"
                      value={slot.repeat}
                      onChange={(e) => dispatch(mutateProject(setSlotRepeat(project, activeStanza!.id, slot.id, e.target.value as "once" | "loop")))}
                      aria-label={`Repeat for slot ${slot.label}`}
                    >
                      <option value="once">once</option>
                      <option value="loop">loop</option>
                    </select>
                    <div className="tr-reorder" role="group" aria-label={`Reorder slot ${slot.label}`}>
                      <button
                        className="tr-btn tr-btn--icon"
                        aria-label={`Move slot ${slot.label} to start`}
                        disabled={realIdx === 0}
                        onClick={() => {
                          const ids = activeStanza!.slots.map((s) => s.id);
                          ids.splice(realIdx, 1);
                          ids.unshift(slot.id);
                          dispatch(mutateProject(reorderStanzaSlots(project, activeStanza!.id, ids)));
                        }}
                      >⇈</button>
                      <button
                        className="tr-btn tr-btn--icon"
                        aria-label={`Move slot ${slot.label} up`}
                        disabled={realIdx === 0}
                        onClick={() => moveSlot(-1)}
                      >↑</button>
                      <button
                        className="tr-btn tr-btn--icon"
                        aria-label={`Move slot ${slot.label} down`}
                        disabled={realIdx === activeStanza!.slots.length - 1}
                        onClick={() => moveSlot(1)}
                      >↓</button>
                      <button
                        className="tr-btn tr-btn--icon"
                        aria-label={`Move slot ${slot.label} to end`}
                        disabled={realIdx === activeStanza!.slots.length - 1}
                        onClick={() => {
                          const ids = activeStanza!.slots.map((s) => s.id);
                          ids.splice(realIdx, 1);
                          ids.push(slot.id);
                          dispatch(mutateProject(reorderStanzaSlots(project, activeStanza!.id, ids)));
                        }}
                      >⇊</button>
                    </div>
                    <button
                      className="tr-btn tr-btn--icon"
                      aria-label={`Remove slot ${slot.label}`}
                      onClick={() => dispatch(mutateProject(removeStanzaSlot(project, activeStanza!.id, slot.id)))}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="tr-slots__actions">
              <button className="tr-btn tr-btn--ghost" onClick={doAddBreathSlot}>+ Breath</button>
              {devices.map((dev) => (
                <button
                  key={dev.id}
                  className="tr-btn tr-btn--ghost"
                  onClick={() => doAddDeviceSlot(dev.id, dev.name)}
                >
                  + {dev.name}
                </button>
              ))}
            </div>

            <div className="tr-panel__subsection-head">SCENES</div>
            <div className="tr-scenes">
              {scenes.filter((sc) => sc.stanzaId === activeStanza.id).map((sc) => (
                <div
                  key={sc.id}
                  className={["tr-scene", primary?.type === "scene" && primary.sceneId === sc.id ? "tr-scene--selected" : ""].filter(Boolean).join(" ")}
                >
                  <button
                    className="tr-btn tr-btn--ghost tr-scene__select-btn"
                    aria-pressed={primary?.type === "scene" && primary.sceneId === sc.id}
                    onClick={() => dispatch(selectScene(sc.id))}
                  >
                    <span className="tr-scene__name">{sc.name}</span>
                  </button>
                  <input
                    type="number"
                    className="tr-input tr-input--num"
                    value={sc.chance}
                    min={0}
                    max={100}
                    onChange={(e) => dispatch(mutateProject(setSceneChance(project, sc.id, Number(e.target.value))))}
                    aria-label={`Chance for scene ${sc.name}`}
                  />
                  <span className="tr-scene__mode">{sc.mode}</span>
                  <button
                    className={["tr-btn tr-btn--ghost tr-btn--sm", sc.enabled ? "" : "tr-btn--dim"].filter(Boolean).join(" ")}
                    onClick={() => dispatch(mutateProject(toggleSceneEnabled(project, sc.id)))}
                  >
                    {sc.enabled ? "ON" : "OFF"}
                  </button>
                  <button
                    className="tr-btn tr-btn--icon"
                    aria-label={`Remove scene ${sc.name}`}
                    onClick={() => dispatch(mutateProject(removeFlowScene(project, sc.id)))}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <div className="tr-panel__add-row">
                <input
                  className="tr-input tr-input--sm"
                  placeholder="Scene name"
                  value={newSceneName}
                  onChange={(e) => setNewSceneName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") doAddScene(); }}
                  aria-label="New scene name"
                />
                <button className="tr-btn tr-btn--ghost" onClick={doAddScene}>+ Scene</button>
              </div>
            </div>
          </>
        ) : (
          <p className="tr-panel__empty">Select a pattern to view its slots.</p>
        )}
      </div>
    </div>
  );
}
