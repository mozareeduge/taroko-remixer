import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { mutateProject } from "../store/projectSlice.js";
import type { SelectionTarget } from "../store/types.js";
import type { TarokoProject } from "@taroko/schema";
import type { AppDispatch } from "../store/store.js";
import {
  updateTokenLiteral, setTokenWeight, setTokenLockedLiteral,
  updateDeviceName, updateDeviceDescription, toggleDeviceEnabled,
  updateRouteTemplate, setRouteWeight,
  updateStanzaName, toggleStanzaEnabled,
  updateSceneName, toggleSceneEnabled, setSceneChance,
  updateTriggerName, setTriggerChance, setTriggerCondition, setTriggerAction,
  setBankLabel,
} from "../store/commands.js";

type NonNullTarget = Exclude<SelectionTarget, null>;

function InspectorBody({
  primary,
  project,
  dispatch,
}: {
  primary: NonNullTarget;
  project: TarokoProject;
  dispatch: AppDispatch;
}) {
  if (primary.type === "bank") {
    const meta = project.materials.bankMeta[primary.bankName];
    const count = project.materials.trays[primary.bankName]?.length ?? 0;
    return (
      <div className="tr-inspector__fields">
        <label className="tr-inspector__label">Label</label>
        <input
          className="tr-input"
          defaultValue={meta?.label ?? primary.bankName}
          onBlur={(e) => dispatch(mutateProject(setBankLabel(project, primary.bankName, e.target.value)))}
          aria-label="Bank label"
        />
        <label className="tr-inspector__label">Role</label>
        <div className="tr-inspector__value">{meta?.role ?? "literal"}</div>
        <label className="tr-inspector__label">Samples</label>
        <div className="tr-inspector__value">{count}</div>
        <label className="tr-inspector__label">Description</label>
        <div className="tr-inspector__value">{meta?.desc ?? "—"}</div>
      </div>
    );
  }

  if (primary.type === "token") {
    const tok = project.materials.trays[primary.bankName]?.find((t) => t.id === primary.tokenId);
    if (!tok) return <div className="tr-inspector__value">Sample not found</div>;
    return (
      <div className="tr-inspector__fields">
        <label className="tr-inspector__label">Literal</label>
        <input
          className="tr-input"
          defaultValue={tok.literal}
          key={tok.id + "-literal"}
          onBlur={(e) => dispatch(mutateProject(updateTokenLiteral(project, primary.bankName, tok.id, e.target.value)))}
          aria-label="Sample literal"
        />
        <label className="tr-inspector__label">Weight</label>
        <input
          className="tr-input tr-input--num"
          type="number"
          defaultValue={tok.weight}
          key={tok.id + "-weight"}
          min={0}
          max={999}
          onBlur={(e) => dispatch(mutateProject(setTokenWeight(project, primary.bankName, tok.id, Number(e.target.value))))}
          aria-label="Sample weight"
        />
        <label className="tr-inspector__label">Role</label>
        <div className="tr-inspector__value">{tok.role}</div>
        <label className="tr-inspector__label">Lock literal</label>
        <input
          type="checkbox"
          checked={tok.lockedLiteral}
          onChange={(e) => dispatch(mutateProject(setTokenLockedLiteral(project, primary.bankName, tok.id, e.target.checked)))}
          aria-label="Lock literal"
        />
      </div>
    );
  }

  if (primary.type === "device") {
    const dev = project.lineDevices.find((d) => d.id === primary.deviceId);
    if (!dev) return <div className="tr-inspector__value">Device not found</div>;
    return (
      <div className="tr-inspector__fields">
        <label className="tr-inspector__label">Name</label>
        <input
          className="tr-input"
          defaultValue={dev.name}
          key={dev.id + "-name"}
          onBlur={(e) => dispatch(mutateProject(updateDeviceName(project, dev.id, e.target.value)))}
          aria-label="Device name"
        />
        <label className="tr-inspector__label">Enabled</label>
        <input
          type="checkbox"
          checked={dev.enabled}
          onChange={() => dispatch(mutateProject(toggleDeviceEnabled(project, dev.id)))}
          aria-label="Device enabled"
        />
        <label className="tr-inspector__label">Description</label>
        <textarea
          className="tr-input tr-input--textarea"
          defaultValue={dev.description}
          key={dev.id + "-desc"}
          rows={3}
          onBlur={(e) => dispatch(mutateProject(updateDeviceDescription(project, dev.id, e.target.value)))}
          aria-label="Device description"
        />
      </div>
    );
  }

  if (primary.type === "route") {
    const dev = project.lineDevices.find((d) => d.id === primary.deviceId);
    const rt = dev?.routes.find((r) => r.id === primary.routeId);
    if (!rt || !dev) return <div className="tr-inspector__value">Route not found</div>;
    const slots = dev.inputs.map((i) => `{${i.slot}:literal}`).join(", ");
    return (
      <div className="tr-inspector__fields">
        <label className="tr-inspector__label">Route</label>
        <div className="tr-inspector__value">{rt.name}</div>
        <label className="tr-inspector__label">Weight</label>
        <input
          className="tr-input tr-input--num"
          type="number"
          defaultValue={rt.weight}
          key={rt.id + "-weight"}
          min={0}
          max={999}
          onBlur={(e) => dispatch(mutateProject(setRouteWeight(project, dev.id, rt.id, Number(e.target.value))))}
          aria-label="Route weight"
        />
        <label className="tr-inspector__label">Template</label>
        <textarea
          className="tr-input tr-input--textarea"
          defaultValue={rt.template}
          key={rt.id + "-template"}
          rows={4}
          onBlur={(e) => dispatch(mutateProject(updateRouteTemplate(project, dev.id, rt.id, e.target.value)))}
          aria-label="Route template"
          spellCheck={false}
        />
        <div className="tr-inspector__hint">Slots: {slots || "none"}</div>
      </div>
    );
  }

  if (primary.type === "stanza") {
    const st = project.stanzaPatterns.find((s) => s.id === primary.stanzaId);
    if (!st) return <div className="tr-inspector__value">Pattern not found</div>;
    return (
      <div className="tr-inspector__fields">
        <label className="tr-inspector__label">Name</label>
        <input
          className="tr-input"
          defaultValue={st.name}
          key={st.id + "-name"}
          onBlur={(e) => dispatch(mutateProject(updateStanzaName(project, st.id, e.target.value)))}
          aria-label="Pattern name"
        />
        <label className="tr-inspector__label">Enabled</label>
        <input
          type="checkbox"
          checked={st.enabled}
          onChange={() => dispatch(mutateProject(toggleStanzaEnabled(project, st.id)))}
          aria-label="Pattern enabled"
        />
        <label className="tr-inspector__label">Slots</label>
        <div className="tr-inspector__value">{st.slots.length}</div>
      </div>
    );
  }

  if (primary.type === "scene") {
    const sc = project.flowScenes.find((s) => s.id === primary.sceneId);
    if (!sc) return <div className="tr-inspector__value">Scene not found</div>;
    return (
      <div className="tr-inspector__fields">
        <label className="tr-inspector__label">Name</label>
        <input
          className="tr-input"
          defaultValue={sc.name}
          key={sc.id + "-name"}
          onBlur={(e) => dispatch(mutateProject(updateSceneName(project, sc.id, e.target.value)))}
          aria-label="Scene name"
        />
        <label className="tr-inspector__label">Enabled</label>
        <input
          type="checkbox"
          checked={sc.enabled}
          onChange={() => dispatch(mutateProject(toggleSceneEnabled(project, sc.id)))}
          aria-label="Scene enabled"
        />
        <label className="tr-inspector__label">Chance</label>
        <input
          className="tr-input tr-input--num"
          type="number"
          defaultValue={sc.chance}
          key={sc.id + "-chance"}
          min={0}
          max={100}
          onBlur={(e) => dispatch(mutateProject(setSceneChance(project, sc.id, Number(e.target.value))))}
          aria-label="Scene chance"
        />
        <label className="tr-inspector__label">Mode</label>
        <div className="tr-inspector__value">{sc.mode}</div>
      </div>
    );
  }

  if (primary.type === "trigger") {
    const tr = project.triggers.find((t) => t.id === primary.triggerId);
    if (!tr) return <div className="tr-inspector__value">Trigger not found</div>;
    const banks = Object.keys(project.materials.trays);
    return (
      <div className="tr-inspector__fields">
        <label className="tr-inspector__label">Name</label>
        <input
          className="tr-input"
          defaultValue={tr.name}
          key={tr.id + "-name"}
          onBlur={(e) => dispatch(mutateProject(updateTriggerName(project, tr.id, e.target.value)))}
          aria-label="Trigger name"
        />
        <label className="tr-inspector__label">Chance</label>
        <input
          className="tr-input tr-input--num"
          type="number"
          defaultValue={tr.chance}
          key={tr.id + "-chance"}
          min={0}
          max={100}
          onBlur={(e) => dispatch(mutateProject(setTriggerChance(project, tr.id, Number(e.target.value))))}
          aria-label="Trigger chance"
        />
        <label className="tr-inspector__label">WHEN bank</label>
        <select
          className="tr-select"
          value={tr.condition.tray}
          onChange={(e) => dispatch(mutateProject(setTriggerCondition(project, tr.id, e.target.value, tr.condition.term)))}
          aria-label="Trigger condition bank"
        >
          {banks.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <label className="tr-inspector__label">WHEN term</label>
        <input
          className="tr-input"
          defaultValue={tr.condition.term}
          key={tr.id + "-term"}
          placeholder="blank = any"
          onBlur={(e) => dispatch(mutateProject(setTriggerCondition(project, tr.id, tr.condition.tray, e.target.value)))}
          aria-label="Trigger condition term"
        />
        <label className="tr-inspector__label">THEN action</label>
        <select
          className="tr-select"
          value={tr.action.type}
          onChange={(e) => dispatch(mutateProject(setTriggerAction(project, tr.id, e.target.value as "append" | "prepend" | "replace", tr.action.text)))}
          aria-label="Trigger action type"
        >
          <option value="append">append</option>
          <option value="prepend">prepend</option>
          <option value="replace">replace</option>
        </select>
        <label className="tr-inspector__label">THEN text</label>
        <input
          className="tr-input"
          defaultValue={tr.action.text}
          key={tr.id + "-action-text"}
          onBlur={(e) => dispatch(mutateProject(setTriggerAction(project, tr.id, tr.action.type, e.target.value)))}
          aria-label="Trigger action text"
        />
      </div>
    );
  }

  return null;
}

export function Inspector() {
  const dispatch = useAppDispatch();
  const project = useAppSelector((s) => s.project.present);
  const primary = useAppSelector((s) => s.selection.primary);
  const inspectorOpen = useAppSelector((s) => s.editor.inspectorOpen);

  return (
    <aside
      className={inspectorOpen ? "tr-inspector tr-inspector--open" : "tr-inspector"}
      aria-label="Inspector"
      aria-hidden={!inspectorOpen}
    >
      {primary ? (
        <div className="tr-inspector__content">
          <div className="tr-inspector__type">{primary.type.toUpperCase()}</div>
          <InspectorBody primary={primary} project={project} dispatch={dispatch} />
        </div>
      ) : (
        <div className="tr-inspector__empty">
          <span className="tr-inspector__hint">Select an item to inspect</span>
        </div>
      )}
    </aside>
  );
}
