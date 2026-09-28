"use client";

import type { OptionChoice, OptionGroup, PriceRule } from "@/lib/products";

/**
 * Editor for the duration × screens × devices matrix.
 *
 * Group and choice ids are generated here and never shown — they are what the
 * price rules key on, so deriving them from labels would break prices every
 * time an admin reworded something.
 */

type Props = {
  groups: OptionGroup[];
  prices: PriceRule[];
  onChange: (next: { groups: OptionGroup[]; prices: PriceRule[] }) => void;
};

let seq = 0;
const newId = (prefix: string) => `${prefix}${(seq++).toString(36)}${Date.now().toString(36).slice(-3)}`;

const newGroup = (): OptionGroup => ({
  id: newId("g"),
  label: "",
  priced: true,
  kind: "select",
  choices: [{ id: newId("c"), label: "" }],
});

const newChoice = (): OptionChoice => ({ id: newId("c"), label: "" });

/** Every priced combination, in display order. */
function matrixRows(groups: OptionGroup[]) {
  const priced = groups.filter((g) => g.priced);
  let rows: Record<string, string>[] = [{}];

  for (const g of priced) {
    rows = rows.flatMap((row) =>
      g.choices.map((c) => ({ ...row, [g.id]: c.id })),
    );
  }
  return { priced, rows };
}

export default function OptionsEditor({ groups, prices, onChange }: Props) {
  const emit = (nextGroups: OptionGroup[], nextPrices = prices) =>
    onChange({ groups: nextGroups, prices: nextPrices });

  const patchGroup = (id: string, patch: Partial<OptionGroup>) =>
    emit(groups.map((g) => (g.id === id ? { ...g, ...patch } : g)));

  const patchChoice = (
    groupId: string,
    choiceId: string,
    patch: Partial<OptionChoice>,
  ) =>
    emit(
      groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              choices: g.choices.map((c) =>
                c.id === choiceId ? { ...c, ...patch } : c,
              ),
            }
          : g,
      ),
    );

  const addChoice = (groupId: string) =>
    emit(
      groups.map((g) =>
        g.id === groupId ? { ...g, choices: [...g.choices, newChoice()] } : g,
      ),
    );

  const removeChoice = (groupId: string, choiceId: string) =>
    emit(
      groups.map((g) =>
        g.id === groupId
          ? { ...g, choices: g.choices.filter((c) => c.id !== choiceId) }
          : g,
      ),
    );

  const removeGroup = (id: string) =>
    emit(groups.filter((g) => g.id !== id));

  const setPrice = (values: Record<string, string>, raw: string) => {
    const trimmed = raw.trim();
    const rest = prices.filter(
      (rule) =>
        !Object.entries(values).every(([k, v]) => rule.values[k] === v),
    );
    if (!trimmed) {
      emit(groups, rest);
      return;
    }
    emit(groups, [...rest, { values, price: Number(trimmed) || 0 }]);
  };

  const { priced, rows } = matrixRows(groups);

  return (
    <>
      <div className="admin-panel">
        <h2>Option groups</h2>
        <p className="hint" style={{ marginBottom: "var(--space-5)" }}>
          Shown to the customer in this order. A group does one of three jobs:
          <br />
          <strong>Sets the price</strong> — forms the price grid (screens).
          <br />
          <strong>Multiplies the price</strong> — charges the grid price once per
          unit, using each choice&apos;s number (duration: 3 months = 3 ×).
          <br />
          <strong>Neither</strong> — a qualifier that does not affect price
          (device).
        </p>

        <div className="repeat-list">
          {groups.map((g, index) => (
            <div className="repeat-item" key={g.id}>
              <div className="repeat-head">
                <span>Group {index + 1}</span>
                {groups.length > 1 && (
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => removeGroup(g.id)}
                  >
                    Remove group
                  </button>
                )}
              </div>

              <div className="form-row form-row-3">
                <div className="field">
                  <label className="label">Heading</label>
                  <input
                    className="input"
                    value={g.label}
                    onChange={(e) => patchGroup(g.id, { label: e.target.value })}
                    placeholder="Duration"
                  />
                </div>

                <div className="field">
                  <label className="label">Type</label>
                  <select
                    className="select"
                    value={g.kind ?? "select"}
                    onChange={(e) =>
                      patchGroup(g.id, {
                        kind: e.target.value as OptionGroup["kind"],
                      })
                    }
                  >
                    <option value="select">Pick one</option>
                    <option value="slots">Pick a device per slot</option>
                  </select>
                </div>

                {g.kind === "slots" && (
                  <div className="field">
                    <label className="label">Slots come from</label>
                    <select
                      className="select"
                      value={g.slotsFrom ?? ""}
                      onChange={(e) =>
                        patchGroup(g.id, { slotsFrom: e.target.value })
                      }
                    >
                      <option value="">Choose a group</option>
                      {groups
                        .filter((x) => x.id !== g.id && x.kind !== "slots")
                        .map((x) => (
                          <option key={x.id} value={x.id}>
                            {x.label || "(unnamed group)"}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div className="field">
                  <span className="label">Pricing</span>
                  <div style={{ display: "grid", gap: "var(--space-2)" }}>
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={Boolean(g.priced)}
                        onChange={(e) =>
                          patchGroup(g.id, {
                            priced: e.target.checked,
                            // the two roles are exclusive
                            ...(e.target.checked ? { multiplies: false } : {}),
                          })
                        }
                      />
                      Sets the price
                    </label>
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={Boolean(g.multiplies)}
                        onChange={(e) =>
                          patchGroup(g.id, {
                            multiplies: e.target.checked,
                            ...(e.target.checked ? { priced: false } : {}),
                          })
                        }
                      />
                      Multiplies the price
                    </label>
                  </div>
                </div>
              </div>

              <div className="repeat-list" style={{ marginTop: "var(--space-4)" }}>
                {g.choices.map((c, ci) => (
                  <div className="form-row" key={c.id}>
                    <div className="field">
                      <label className="label">Choice {ci + 1}</label>
                      <input
                        className="input"
                        value={c.label}
                        onChange={(e) =>
                          patchChoice(g.id, c.id, { label: e.target.value })
                        }
                        placeholder="1 Month"
                      />
                    </div>
                    <div className="field">
                      <label className="label">
                        {g.multiplies
                          ? "Months this choice covers"
                          : g.kind === "slots"
                            ? "Devices granted per choice"
                            : "Devices granted (optional)"}
                      </label>
                      <div style={{ display: "flex", gap: "var(--space-3)" }}>
                        <input
                          className="input"
                          type="number"
                          min="0"
                          value={c.count ?? ""}
                          onChange={(e) =>
                            patchChoice(g.id, c.id, {
                              count: e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            })
                          }
                          placeholder="1"
                        />
                        {g.choices.length > 1 && (
                          <button
                            type="button"
                            className="link-btn"
                            onClick={() => removeChoice(g.id, c.id)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="link-btn"
                style={{ marginTop: "var(--space-4)" }}
                onClick={() => addChoice(g.id)}
              >
                Add choice
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm add-btn"
          style={{ marginTop: "var(--space-4)" }}
          onClick={() => emit([...groups, newGroup()])}
        >
          Add group
        </button>
      </div>

      {priced.length > 0 && (
        <div className="admin-panel">
          <h2>Prices</h2>
          <p className="hint" style={{ marginBottom: "var(--space-5)" }}>
            One price per combination of the price-setting groups. Everything
            else — duration, device — stays out of this grid because it does not
            change the base price. A duration multiplies the price below by the
            months chosen.
          </p>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  {priced.map((g) => (
                    <th key={g.id}>{g.label || "(unnamed)"}</th>
                  ))}
                  <th>Price (Rs.)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((values) => {
                  const key = priced.map((g) => values[g.id]).join("|");
                  const current = prices.find((rule) =>
                    priced.every((g) => rule.values[g.id] === values[g.id]),
                  );

                  return (
                    <tr key={key}>
                      {priced.map((g) => (
                        <td key={g.id} className="muted">
                          {g.choices.find((c) => c.id === values[g.id])
                            ?.label || "—"}
                        </td>
                      ))}
                      <td>
                        <input
                          className="input"
                          type="number"
                          min="0"
                          style={{ maxWidth: 140 }}
                          value={current?.price ?? ""}
                          onChange={(e) => setPrice(values, e.target.value)}
                          placeholder="0"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
