import { useRef, useState, type ReactNode } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { setProject } from "../store/projectSlice.js";
import { setPreviewFresh, setPreviewHtml } from "../store/editorSlice.js";
import { showReceipt } from "../store/importReceiptSlice.js";
import { exportProjectJson, exportProjectHtml, importProjectWithReceipt, downloadName } from "@taroko/core";

type PreviewLifecycle = "unbuilt" | "fresh" | "stale" | "error";

function safeLink(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return (u.protocol === "http:" || u.protocol === "https:") ? url : null;
  } catch { return null; }
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <tr className="tr-table__row">
      <th scope="row" className="tr-table__th tr-table__th--label">{label}</th>
      <td className="tr-table__td">{children}</td>
    </tr>
  );
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ArchivePanel() {
  const dispatch = useAppDispatch();
  const project = useAppSelector((s) => s.project.present);
  const previewFresh = useAppSelector((s) => s.editor.previewFresh);
  const previewHtml = useAppSelector((s) => s.editor.previewHtml);
  const importRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const lifecycle: PreviewLifecycle =
    previewError !== null
      ? "error"
      : previewHtml === null
      ? "unbuilt"
      : previewFresh
      ? "fresh"
      : "stale";

  function doPreview() {
    setPreviewError(null);
    try {
      const html = exportProjectHtml(project);
      dispatch(setPreviewHtml(html));
      dispatch(setPreviewFresh(true));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setPreviewError(msg);
      dispatch(setPreviewHtml(null));
    }
  }

  function doExportJson() {
    download(downloadName(project, ".taroke.json"), exportProjectJson(project), "application/json");
  }

  function doExportHtml() {
    download(downloadName(project, ".taroke.html"), exportProjectHtml(project), "text/html");
  }

  function doImport(file: File) {
    setImportError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = String(e.target?.result ?? "");
      try {
        const { project: imported, receipt } = importProjectWithReceipt(text, file.name);
        dispatch(setProject(imported));
        dispatch(showReceipt({
          filename: file.name,
          issues: [],
          repairCount: receipt.repairCount,
          fullReceipt: receipt,
        }));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setImportError(`Could not import "${file.name}": ${msg}`);
      }
    };
    reader.onerror = () => {
      setImportError(`Could not read "${file.name}".`);
    };
    reader.readAsText(file);
  }

  return (
    <div className="tr-panel tr-panel--archive">
      <div className="tr-panel__main">
        <div className="tr-panel__section-head">EXPORT</div>
        <div className="tr-archive__actions">
          <button className="tr-btn tr-btn--primary" onClick={doExportJson}>
            Export JSON (.taroke.json)
          </button>
          <p className="tr-archive__desc">Project data for editing in another session.</p>

          <button className="tr-btn tr-btn--primary" onClick={doExportHtml}>
            Export HTML (.taroke.html)
          </button>
          <p className="tr-archive__desc">Standalone artifact — runs in any browser, no server needed.</p>
        </div>

        <div className="tr-panel__section-head">IMPORT</div>
        <div className="tr-archive__actions">
          <input
            ref={importRef}
            type="file"
            accept=".json,.html,.taroke.json,.taroke.html"
            className="tr-visually-hidden"
            aria-label="Import project file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) doImport(file);
              e.target.value = "";
            }}
          />
          <button className="tr-btn tr-btn--ghost" onClick={() => importRef.current?.click()}>
            Import .taroke.json or .taroke.html
          </button>
          <p className="tr-archive__desc">Replaces the current project. Undo is available.</p>
          {importError && (
            <p className="tr-archive__error" role="alert" aria-live="assertive">
              {importError}
            </p>
          )}
        </div>

        <div className="tr-panel__section-head">
          PREVIEW
          <span
            className={`tr-badge tr-badge--lifecycle tr-badge--lifecycle-${lifecycle}`}
            data-preview-lifecycle={lifecycle}
            aria-label={`Preview status: ${lifecycle}`}
          >
            {lifecycle.toUpperCase()}
          </span>
        </div>
        <div className="tr-archive__actions">
          <button
            className="tr-btn tr-btn--ghost"
            onClick={doPreview}
            aria-label={lifecycle === "unbuilt" ? "Generate preview of exported artifact" : "Refresh artifact preview"}
          >
            {lifecycle === "unbuilt" ? "Preview artifact" : "Refresh preview"}
          </button>
          {lifecycle === "stale" && (
            <p className="tr-archive__desc tr-archive__stale-hint">
              Project has changed — preview is stale. Click Refresh to rebuild.
            </p>
          )}
          {previewError && (
            <p className="tr-archive__error" role="alert" aria-live="assertive">
              Preview error: {previewError}
            </p>
          )}
        </div>
        {previewHtml && (
          <div
            className="tr-archive__preview-frame"
            data-preview-lifecycle={lifecycle}
          >
            <iframe
              title="Artifact preview"
              srcDoc={previewHtml}
              sandbox="allow-scripts"
              className="tr-archive__iframe"
              aria-label="Exported artifact preview"
            />
          </div>
        )}

        <div className="tr-panel__section-head tr-panel__section-head--subordinate">PROJECT INFO</div>
        <table className="tr-table tr-archive__info-table">
          <tbody>
            <InfoRow label="Title">{project.project.title || "(untitled)"}</InfoRow>
            <InfoRow label="Author">{project.project.author || "—"}</InfoRow>
            <InfoRow label="Language">{project.project.language || "—"}</InfoRow>
            <InfoRow label="Source title">{project.project.sourceTitle || "—"}</InfoRow>
            <InfoRow label="Source URL">
              {(() => {
                const href = safeLink(project.project.sourceUrl);
                if (href) return <a href={href} className="tr-archive__source-link" target="_blank" rel="noopener noreferrer">{project.project.sourceUrl}</a>;
                return project.project.sourceUrl || "—";
              })()}
            </InfoRow>
            <InfoRow label="Statement">
              {project.project.statement
                ? <span className="tr-archive__multiline">{project.project.statement}</span>
                : "—"}
            </InfoRow>
            <InfoRow label="Credits">
              {project.project.credits
                ? <span className="tr-archive__multiline">{project.project.credits}</span>
                : "—"}
            </InfoRow>
            <InfoRow label="Version">{project.schemaVersion}</InfoRow>
            <InfoRow label="Banks">{Object.keys(project.materials.trays).length}</InfoRow>
            <InfoRow label="Devices">{project.lineDevices.length}</InfoRow>
            <InfoRow label="Patterns">{project.stanzaPatterns.length}</InfoRow>
            <InfoRow label="Triggers">{project.triggers.length}</InfoRow>
          </tbody>
        </table>
      </div>
    </div>
  );
}
