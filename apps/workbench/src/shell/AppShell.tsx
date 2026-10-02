import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { toggleSidebar, toggleInspector, setActivePanel } from "../store/editorSlice.js";
import { popForUndo, popForRedo } from "../store/historySlice.js";
import { Transport } from "./Transport.js";
import { Navigator } from "./Navigator.js";
import { Workspace } from "./Workspace.js";
import { Inspector } from "./Inspector.js";
import type { EditorPanel } from "../store/types.js";

const MOBILE_NAV_ITEMS: Array<{ id: EditorPanel; abbr: string; fullName: string }> = [
  { id: "materials",   abbr: "MAT",  fullName: "Material" },
  { id: "instruments", abbr: "INST", fullName: "Devices" },
  { id: "composition", abbr: "COMP", fullName: "Compose" },
  { id: "automation",  abbr: "AUTO", fullName: "Automate" },
  { id: "performance", abbr: "PERF", fullName: "Perform" },
  { id: "archive",     abbr: "ARCH", fullName: "Archive" },
];

function isMobileNavActive(itemId: EditorPanel, current: EditorPanel): boolean {
  if (itemId === "materials") return current === "materials" || current === "forms";
  return current === itemId;
}

export function AppShell() {
  const dispatch = useAppDispatch();
  const activePanel = useAppSelector((s) => s.editor.activePanel);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        dispatch(popForUndo());
      } else if (e.key === "Z" || (e.key === "z" && e.shiftKey)) {
        e.preventDefault();
        dispatch(popForRedo());
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [dispatch]);

  return (
    <div className="tr-shell">
      <a href="#tr-main-content" className="tr-skip-nav">
        Skip to main content
      </a>
      <a href="#tr-navigator" className="tr-skip-nav">
        Skip to navigation
      </a>

      <Transport />
      <Workspace />
      <Navigator />
      <Inspector />

      <nav className="tr-mobile-nav" aria-label="Main navigation">
        {MOBILE_NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={isMobileNavActive(item.id, activePanel)
              ? "tr-mobile-nav__btn tr-mobile-nav__btn--active"
              : "tr-mobile-nav__btn"
            }
            onClick={() => dispatch(setActivePanel(item.id))}
            aria-current={isMobileNavActive(item.id, activePanel) ? "page" : undefined}
            aria-label={item.fullName}
          >
            <span className="tr-mobile-nav__abbr">{item.abbr}</span>
            <span className="tr-mobile-nav__label">{item.fullName}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
