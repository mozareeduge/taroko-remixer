import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { mutateProject } from "../store/projectSlice.js";
import { setCasePolicy, setCompoundPolicy, setTokenOverride } from "../store/commands.js";
import { KEEP_UNCHANGED_SENTINEL } from "@taroke/core";

// Role-to-form mapping: only expose implemented, meaningful overrides per role.
const ROLE_OVERRIDE_FORMS: Record<string, { key: string; label: string }[]> = {
  noun:      [{ key: "singular", label: "Singular" }, { key: "plural", label: "Plural" }],
  verb:      [{ key: "thirdSingular", label: "3rd singular" }, { key: "imperative", label: "Imperative" }],
  adjective: [],
  adverb:    [],
  mixed:     [],
  literal:   [],
};

function roleOverrideForms(role: string): { key: string; label: string }[] {
  return ROLE_OVERRIDE_FORMS[role] ?? [];
}

export function FormsPanel() {
  const dispatch = useAppDispatch();
  const project = useAppSelector((s) => s.project.present);

  const banks = Object.keys(project.materials.trays);
  const casePolicy = project.forms.casePolicy ?? "preserve";
  const compoundPolicy = project.forms.compoundPolicy ?? "hyphen";

  return (
    <div className="tr-panel tr-panel--forms">
      <div className="tr-panel__main">
        <div className="tr-panel__section-head">FORMS</div>
        <div className="tr-forms__policies">
          <label className="tr-forms__label">
            Case policy
            <select
              className="tr-select"
              value={casePolicy}
              onChange={(e) => dispatch(mutateProject(setCasePolicy(project, e.target.value)))}
              aria-label="Case policy"
            >
              <option value="preserve">preserve</option>
              <option value="lower">lowercase</option>
              <option value="upper">uppercase</option>
              <option value="title">title case</option>
            </select>
          </label>
          <label className="tr-forms__label">
            Compound policy
            <select
              className="tr-select"
              value={compoundPolicy}
              onChange={(e) => dispatch(mutateProject(setCompoundPolicy(project, e.target.value)))}
              aria-label="Compound policy"
            >
              <option value="hyphen">hyphen</option>
              <option value="space">space</option>
              <option value="none">none</option>
            </select>
          </label>
        </div>

        <div className="tr-panel__section-head">OVERRIDES</div>
        <p className="tr-forms__desc">
          Override inflected forms for individual samples. Overrides are role-relevant: nouns show
          singular/plural, verbs show 3rd-singular/imperative. Literal and other roles have no
          inflection overrides.
        </p>
        {banks.map((bankName) => {
          const tokens = project.materials.trays[bankName] ?? [];
          const bankRole = project.materials.bankMeta[bankName]?.role ?? "literal";
          const overrideForms = roleOverrideForms(bankRole);
          // Only show banks that have tokens AND have at least one override form
          if (tokens.length === 0 || overrideForms.length === 0) return null;
          return (
            <details key={bankName} className="tr-forms__bank" open={bankName === banks[0]}>
              <summary className="tr-forms__bank-label">
                {project.materials.bankMeta[bankName]?.label ?? bankName.toUpperCase()}
                <span className="tr-forms__bank-role">({bankRole})</span>
                <span className="tr-forms__bank-count">{tokens.length}</span>
              </summary>
              <table className="tr-table" aria-label={`Form overrides for ${project.materials.bankMeta[bankName]?.label ?? bankName}`}>
                <thead>
                  <tr>
                    <th scope="col" className="tr-table__th">Sample</th>
                    {overrideForms.map(({ key, label }) => (
                      <th key={key} scope="col" className="tr-table__th">{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((tok) => (
                    <tr key={tok.id} className="tr-table__row">
                      <td className="tr-table__td tr-table__td--literal">{tok.literal}</td>
                      {overrideForms.map(({ key, label }) => {
                        const raw = project.forms.overrides[tok.id]?.[key] ?? "";
                        const isKept = raw === KEEP_UNCHANGED_SENTINEL;
                        const value = isKept ? "" : raw;
                        return (
                          <td key={key} className="tr-table__td">
                            <input
                              className="tr-input"
                              value={value}
                              placeholder={isKept ? "(unchanged)" : "(auto)"}
                              onChange={(e) => dispatch(mutateProject(setTokenOverride(project, tok.id, key, e.target.value)))}
                              aria-label={`${label} override for ${tok.literal}`}
                              data-override={`${tok.id}:${key}`}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          );
        })}
        {banks.every((b) => {
          const role = project.materials.bankMeta[b]?.role ?? "literal";
          return roleOverrideForms(role).length === 0 || (project.materials.trays[b]?.length ?? 0) === 0;
        }) && (
          <p className="tr-panel__empty">
            No banks with inflectable roles (noun, verb). Assign a role to a bank in Banks &amp; Samples to see overrides here.
          </p>
        )}
      </div>
    </div>
  );
}
