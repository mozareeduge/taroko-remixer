import { useState, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { mutateProject } from "../store/projectSlice.js";
import { selectBank, selectToken } from "../store/selectionSlice.js";
import {
  addToken, removeToken, setTokenWeight, updateTokenLiteral,
  addBank, removeBank, reorderTokens, setTokenOverride,
} from "../store/commands.js";
import { formToken, KEEP_UNCHANGED_SENTINEL } from "@taroke/core";

// Forms available per bank role. Unknown roles fall back to ["literal"].
const ROLE_FORMS: Record<string, { key: string; label: string }[]> = {
  noun:      [{ key: "literal", label: "Literal" }, { key: "singular", label: "Singular" }, { key: "plural", label: "Plural" }],
  verb:      [{ key: "literal", label: "Literal" }, { key: "thirdSingular", label: "3rd singular" }, { key: "imperative", label: "Imperative" }],
  adjective: [{ key: "literal", label: "Literal" }],
  adverb:    [{ key: "literal", label: "Literal" }],
  mixed:     [{ key: "literal", label: "Literal" }],
};
const DEFAULT_FORMS = [{ key: "literal", label: "Literal" }];

export function MaterialsPanel() {
  const dispatch = useAppDispatch();
  const project = useAppSelector((s) => s.project.present);
  const primary = useAppSelector((s) => s.selection.primary);

  const banks = Object.keys(project.materials.trays);
  const activeBank =
    primary?.type === "bank" ? primary.bankName :
    primary?.type === "token" ? primary.bankName :
    banks[0] ?? null;

  const [newSample, setNewSample] = useState("");
  const [newBankKey, setNewBankKey] = useState("");
  const [newBankLabel, setNewBankLabel] = useState("");
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [bankSearch, setBankSearch] = useState("");
  const addRef = useRef<HTMLInputElement>(null);

  const tokens = activeBank ? (project.materials.trays[activeBank] ?? []) : [];
  const bankMeta = activeBank ? project.materials.bankMeta[activeBank] : null;
  const bankRole = bankMeta?.role ?? "literal";
  const totalWeight = tokens.reduce((s, t) => s + (t.weight || 0), 0);

  const selectedTokenId =
    primary?.type === "token" && primary.bankName === activeBank ? primary.tokenId : null;
  const selectedToken = tokens.find((t) => t.id === selectedTokenId) ?? null;
  const forms = ROLE_FORMS[bankRole] ?? DEFAULT_FORMS;

  function doAddSample() {
    if (!activeBank || !newSample.trim()) return;
    dispatch(mutateProject(addToken(project, activeBank, newSample)));
    setNewSample("");
    addRef.current?.focus();
  }

  function doAddBank() {
    const key = newBankKey.trim().toLowerCase().replace(/\s+/g, "_");
    if (!key || !newBankLabel.trim()) return;
    dispatch(mutateProject(addBank(project, key, newBankLabel.trim())));
    setNewBankKey("");
    setNewBankLabel("");
  }

  function moveToken(idx: number, to: number) {
    if (!activeBank) return;
    const ids = tokens.map((t) => t.id);
    const [moved] = ids.splice(idx, 1);
    ids.splice(to, 0, moved!);
    dispatch(mutateProject(reorderTokens(project, activeBank, ids)));
  }

  // Drag/drop reorder
  function onDragStart(i: number) { setDragFrom(i); }
  function onDragOver(e: React.DragEvent, i: number) { e.preventDefault(); setDragOver(i); }
  function onDrop(e: React.DragEvent, i: number) {
    e.preventDefault();
    if (dragFrom === null || dragFrom === i || !activeBank) { setDragFrom(null); setDragOver(null); return; }
    moveToken(dragFrom, i);
    setDragFrom(null);
    setDragOver(null);
  }
  function onDragEnd() { setDragFrom(null); setDragOver(null); }

  // Forms override helpers
  function getOverride(tokId: string, form: string): string {
    const ov = (project.forms?.overrides?.[tokId] as Record<string, string> | undefined) ?? {};
    const v = ov[form];
    return v === KEEP_UNCHANGED_SENTINEL ? "" : (v ?? "");
  }
  function isKept(tokId: string, form: string): boolean {
    const ov = (project.forms?.overrides?.[tokId] as Record<string, string> | undefined) ?? {};
    return ov[form] === KEEP_UNCHANGED_SENTINEL;
  }
  function toggleKeep(tokId: string, form: string, currently: boolean) {
    dispatch(mutateProject(setTokenOverride(project, tokId, form, currently ? "" : KEEP_UNCHANGED_SENTINEL)));
  }
  function setOverride(tokId: string, form: string, val: string) {
    dispatch(mutateProject(setTokenOverride(project, tokId, form, val)));
  }

  const bankSearchLower = bankSearch.toLowerCase();
  const visibleBanks = bankSearch
    ? banks.filter((b) => {
        const label = project.materials.bankMeta[b]?.label ?? b;
        return label.toLowerCase().includes(bankSearchLower) || b.toLowerCase().includes(bankSearchLower);
      })
    : banks;

  return (
    <div className="tr-panel tr-panel--materials">
      <div className="tr-panel__sidebar">
        <div className="tr-panel__section-head">BANKS</div>
        <div className="tr-panel__search-row">
          <input
            type="search"
            className="tr-input tr-input--sm tr-input--search"
            placeholder="Search banks…"
            value={bankSearch}
            onChange={(e) => setBankSearch(e.target.value)}
            aria-label="Search banks"
          />
        </div>
        <ul className="tr-list" role="list">
          {visibleBanks.map((b) => (
            <li key={b} className="tr-list__item">
              <button
                className={["tr-list__btn", activeBank === b ? "tr-list__btn--active" : ""].filter(Boolean).join(" ")}
                onClick={() => dispatch(selectBank(b))}
                aria-current={activeBank === b ? "true" : undefined}
              >
                <span className="tr-list__label">{project.materials.bankMeta[b]?.label ?? b.toUpperCase()}</span>
                <span className="tr-list__count">{project.materials.trays[b]?.length ?? 0}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="tr-panel__add-row">
          <input
            className="tr-input tr-input--sm"
            placeholder="key"
            value={newBankKey}
            onChange={(e) => setNewBankKey(e.target.value)}
            aria-label="New bank key"
          />
          <input
            className="tr-input tr-input--sm"
            placeholder="label"
            value={newBankLabel}
            onChange={(e) => setNewBankLabel(e.target.value)}
            aria-label="New bank label"
          />
          <button className="tr-btn tr-btn--ghost" onClick={doAddBank}>+ Bank</button>
        </div>
      </div>

      <div className="tr-panel__main">
        {activeBank ? (
          <>
            <div className="tr-panel__section-head">
              SAMPLES
              <span className="tr-panel__section-meta">{bankMeta?.label ?? activeBank.toUpperCase()} · {bankRole} · {tokens.length}</span>
            </div>
            <table className="tr-table">
              <thead>
                <tr>
                  <th scope="col" className="tr-table__th" aria-hidden="true"></th>
                  <th scope="col" className="tr-table__th">Literal</th>
                  <th scope="col" className="tr-table__th tr-table__th--num">Wt</th>
                  <th scope="col" className="tr-table__th tr-table__th--num">Share</th>
                  <th scope="col" className="tr-table__th tr-table__th--action" aria-label="Reorder"></th>
                  <th scope="col" className="tr-table__th tr-table__th--action" aria-label="Remove"></th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((tok, idx) => (
                  <tr
                    key={tok.id}
                    className={[
                      "tr-table__row",
                      primary?.type === "token" && primary.tokenId === tok.id ? "tr-table__row--selected" : "",
                      dragFrom === idx ? "tr-table__row--dragging" : "",
                      dragOver === idx ? "tr-table__row--drag-over" : "",
                    ].filter(Boolean).join(" ")}
                    draggable
                    onDragStart={() => onDragStart(idx)}
                    onDragOver={(e) => onDragOver(e, idx)}
                    onDrop={(e) => onDrop(e, idx)}
                    onDragEnd={onDragEnd}
                    onClick={() => dispatch(selectToken({ bankName: activeBank, tokenId: tok.id }))}
                    aria-selected={primary?.type === "token" && primary.tokenId === tok.id}
                  >
                    <td className="tr-table__td tr-table__td--drag" aria-hidden="true">⠿</td>
                    <td className="tr-table__td">
                      <input
                        className="tr-input tr-input--literal"
                        value={tok.literal}
                        onChange={(e) => dispatch(mutateProject(updateTokenLiteral(project, activeBank, tok.id, e.target.value)))}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Literal for sample ${tok.literal}`}
                        data-token-literal={tok.id}
                      />
                    </td>
                    <td className="tr-table__td tr-table__td--num">
                      <input
                        type="number"
                        className="tr-input tr-input--num"
                        value={tok.weight}
                        min={0}
                        max={999}
                        onChange={(e) => dispatch(mutateProject(setTokenWeight(project, activeBank, tok.id, Number(e.target.value))))}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Weight for ${tok.literal}`}
                      />
                    </td>
                    <td className="tr-table__td tr-table__td--num tr-table__td--share" aria-label={`Expected share for ${tok.literal}`}>
                      {totalWeight > 0 ? `${Math.round((tok.weight / totalWeight) * 100)}%` : "—"}
                    </td>
                    <td className="tr-table__td tr-table__td--action">
                      <div className="tr-reorder" role="group" aria-label={`Reorder ${tok.literal}`}>
                        <button className="tr-btn tr-btn--icon" aria-label={`Move ${tok.literal} to start`} disabled={idx === 0} onClick={(e) => { e.stopPropagation(); moveToken(idx, 0); }}>⇈</button>
                        <button className="tr-btn tr-btn--icon" aria-label={`Move ${tok.literal} up`} disabled={idx === 0} onClick={(e) => { e.stopPropagation(); moveToken(idx, idx - 1); }}>↑</button>
                        <button className="tr-btn tr-btn--icon" aria-label={`Move ${tok.literal} down`} disabled={idx === tokens.length - 1} onClick={(e) => { e.stopPropagation(); moveToken(idx, idx + 1); }}>↓</button>
                        <button className="tr-btn tr-btn--icon" aria-label={`Move ${tok.literal} to end`} disabled={idx === tokens.length - 1} onClick={(e) => { e.stopPropagation(); moveToken(idx, tokens.length - 1); }}>⇊</button>
                      </div>
                    </td>
                    <td className="tr-table__td tr-table__td--action">
                      <button
                        className="tr-btn tr-btn--icon"
                        aria-label={`Remove ${tok.literal}`}
                        onClick={(e) => { e.stopPropagation(); dispatch(mutateProject(removeToken(project, activeBank, tok.id))); }}
                      >✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="tr-panel__add-row">
              <input
                ref={addRef}
                className="tr-input"
                placeholder="Add sample…"
                value={newSample}
                onChange={(e) => setNewSample(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") doAddSample(); }}
                aria-label="New sample literal"
              />
              <button className="tr-btn tr-btn--primary" onClick={doAddSample}>Add</button>
            </div>

            {/* Role-aware forms for selected token */}
            {selectedToken && (
              <div className="tr-panel__section">
                <div className="tr-panel__section-head">
                  FORMS — {selectedToken.literal}
                </div>
                <p className="tr-forms__hint">
                  Override how this {bankRole} is inflected. "Keep unchanged" preserves the literal for that form.
                </p>
                <div className="tr-forms" role="group" aria-label={`Form overrides for ${selectedToken.literal}`}>
                  {forms.map(({ key, label }) => {
                    const kept = isKept(selectedToken.id, key);
                    const ov = getOverride(selectedToken.id, key);
                    const preview = formToken(project, selectedToken, key);
                    return (
                      <div key={key} className="tr-form-row" data-form={key}>
                        <label className="tr-form-row__label" htmlFor={`form-${selectedToken.id}-${key}`}>{label}</label>
                        <span className="tr-form-row__preview" aria-label={`Preview: ${preview}`}>{preview}</span>
                        <label className="tr-form-row__keep" title="Keep text unchanged — preserves literal regardless of inflection">
                          <input
                            type="checkbox"
                            checked={kept}
                            onChange={() => toggleKeep(selectedToken.id, key, kept)}
                            aria-label={`Keep ${label} unchanged for ${selectedToken.literal}`}
                          />
                          {" "}Keep text unchanged
                        </label>
                        <input
                          id={`form-${selectedToken.id}-${key}`}
                          className="tr-form-row__input"
                          type="text"
                          disabled={kept}
                          value={ov}
                          placeholder={kept ? "(keeping literal)" : "(auto)"}
                          aria-label={`${label} override for ${selectedToken.literal}`}
                          data-form-override={`${selectedToken.id}:${key}`}
                          onChange={(e) => setOverride(selectedToken.id, key, e.target.value)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="tr-panel__empty">Select a bank to view its samples.</p>
        )}
      </div>
    </div>
  );
}
