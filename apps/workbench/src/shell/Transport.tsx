import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { start, stop, pause } from "../store/runtimeSlice.js";
import { toggleInspector } from "../store/editorSlice.js";
import { StatusLamp } from "@taroko/ui";

export function Transport() {
  const dispatch = useAppDispatch();
  const status = useAppSelector((s) => s.runtime.status);
  const title = useAppSelector((s) => s.project.present.project.title);
  const isDirty = useAppSelector((s) => s.project.isDirty);
  const inspectorOpen = useAppSelector((s) => s.editor.inspectorOpen);

  return (
    <header className="tr-transport" role="banner">
      <div className="tr-transport__title">
        <h1 className="tr-transport__app-name">TAROKO REMIXER</h1>
        <StatusLamp state={isDirty ? "warn" : "off"} label={isDirty ? "unsaved" : "saved"} />
        <span className="tr-transport__name">{title || "Untitled"}</span>
      </div>

      <div className="tr-transport__controls" role="group" aria-label="Playback controls">
        <button
          className="tr-transport__btn"
          onClick={() => dispatch(status === "running" ? pause() : start())}
          aria-label={status === "running" ? "Pause" : "Play"}
          aria-pressed={status === "running"}
        >
          {status === "running" ? "■■" : "▶"}
        </button>
        <button
          className="tr-transport__btn"
          onClick={() => dispatch(stop())}
          aria-label="Stop"
          disabled={status === "stopped"}
        >
          ◼
        </button>
      </div>

      <div className="tr-transport__status">
        <span className="tr-transport__status-label">{status.toUpperCase()}</span>
        <button
          className="tr-transport__toggle"
          onClick={() => dispatch(toggleInspector())}
          aria-label={inspectorOpen ? "Hide inspector" : "Show inspector"}
          aria-pressed={inspectorOpen}
          title="Inspector"
        >
          ⊞
        </button>
      </div>
    </header>
  );
}
