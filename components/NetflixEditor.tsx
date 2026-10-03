"use client";

import { useState } from "react";
import type { OptionGroup, PriceRule } from "@/lib/products";

/**
 * Dedicated editor for Netflix and Amazon Prime Video products.
 *
 * The structure is fixed — duration × screens, priced cell by cell — so this
 * does not offer the free-form group builder. It writes the same
 * `optionGroups` + `prices` shape as the generic OptionsEditor, which is why
 * the storefront, cart and checkout need no Netflix-specific code.
 *
 * Ids are fixed strings because a Netflix product has exactly one duration
 * group and one screens group; that keeps saved prices stable across edits.
 */

const DURATIONS = [
  { id: "1m", label: "1 Month" },
  { id: "3m", label: "3 Months" },
  { id: "6m", label: "6 Months" },
  { id: "12m", label: "12 Months" },
];

const SCREENS = [
  { id: "s1", label: "1 Screen" },
  { id: "s2", label: "2 Screens" },
  { id: "s3", label: "3 Screens" },
  { id: "full", label: "Full Account" },
];

/** Mobile and laptop count as one allocation category. */
const DEVICES = [
  { id: "ml", label: "Mobile / Laptop" },
  { id: "tv", label: "TV" },
];

/** One device allocation per screen. Full Account is unlimited — no rule. */
const PER_SCREEN: Record<string, number> = {
  s1: 1,
  s2: 2,
  s3: 3,
  full: 0,
};

/** Every device a Netflix/Prime product offers by default. */
export const ALL_DEVICE_IDS = DEVICES.map((d) => d.id);

export const DURATION_GROUP_ID = "duration";
export const SCREENS_GROUP_ID = "screens";
export const DEVICE_GROUP_ID = "device";

/** Builds the canonical Netflix/Prime group list for a given device set. */
export function buildGroups(deviceIds: string[]): OptionGroup[] {
  const groups: OptionGroup[] = [
    {
      id: DURATION_GROUP_ID,
      label: "Select Duration",
      priced: true,
      choices: DURATIONS,
    },
    {
      id: SCREENS_GROUP_ID,
      label: "Select Screen",
      priced: true,
      choices: SCREENS,
    },
  ];

  // Unticking every device removes the step entirely rather than leaving an
  // empty group the customer cannot satisfy.
  if (deviceIds.length > 0) {
    groups.push({
      id: DEVICE_GROUP_ID,
      label: "Select Devices",
      kind: "multi",
      hideWhen: { groupId: SCREENS_GROUP_ID, choiceIds: ["full"] },
      quantityFrom: { groupId: SCREENS_GROUP_ID, perChoice: PER_SCREEN },
      choices: DEVICES.filter((d) => deviceIds.includes(d.id)),
    });
  }

  return groups;
}

type Props = {
  groups: OptionGroup[];
  prices: PriceRule[];
  onChange: (next: { groups: OptionGroup[]; prices: PriceRule[] }) => void;
};

export default function NetflixEditor({ groups, prices, onChange }: Props) {
  const deviceGroup = groups.find((g) => g.id === DEVICE_GROUP_ID);
  const [devices, setDevices] = useState<string[]>(
    () =>
      deviceGroup?.choices.map((c) => c.id) ??
      DEVICES.map((d) => d.id),
  );

  const setDevicesAndEmit = (next: string[]) => {
    setDevices(next);
    onChange({ groups: buildGroups(next), prices });
  };

  const priceAt = (durationId: string, screenId: string) =>
    prices.find(
      (rule) =>
        rule.values[DURATION_GROUP_ID] === durationId &&
        rule.values[SCREENS_GROUP_ID] === screenId,
    )?.price;

  const setPrice = (durationId: string, screenId: string, raw: string) => {
    const trimmed = raw.trim();
    const rest = prices.filter(
      (rule) =>
        !(
          rule.values[DURATION_GROUP_ID] === durationId &&
          rule.values[SCREENS_GROUP_ID] === screenId
        ),
    );

    onChange({
      groups: buildGroups(devices),
      prices: trimmed
        ? [
            ...rest,
            {
              values: {
                [DURATION_GROUP_ID]: durationId,
                [SCREENS_GROUP_ID]: screenId,
              },
              price: Number(trimmed) || 0,
            },
          ]
        : rest,
    });
  };

  return (
    <>
      <div className="admin-panel">
        <h2>Netflix / Prime options</h2>
        <p className="hint" style={{ marginBottom: "var(--space-5)" }}>
          Every duration and screen combination needs its own price. Nothing is
          calculated automatically. Device counts never affect these prices. The
          device step disappears for Full Account on its own.
        </p>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Duration</th>
                {SCREENS.map((s) => (
                  <th key={s.id}>{s.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DURATIONS.map((d) => (
                <tr key={d.id}>
                  <td className="muted nowrap">{d.label}</td>
                  {SCREENS.map((s) => (
                    <td key={s.id}>
                      <input
                        className="input"
                        type="number"
                        min="0"
                        style={{ maxWidth: 130 }}
                        value={priceAt(d.id, s.id) ?? ""}
                        onChange={(e) => setPrice(d.id, s.id, e.target.value)}
                        placeholder="0"
                        aria-label={`${d.label} ${s.label} price`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-panel">
        <h2>Allowed devices</h2>
        <p className="hint" style={{ marginBottom: "var(--space-4)" }}>
          Only ticked categories are offered. The customer allocates one device
          per screen bought — two screens means two devices in any split. Device
          counts never change the price. Untick everything to remove the device
          step from this product entirely.
        </p>

        <div className="check-row">
          {DEVICES.map((d) => (
            <label className="check" key={d.id}>
              <input
                type="checkbox"
                checked={devices.includes(d.id)}
                onChange={() =>
                  setDevicesAndEmit(
                    devices.includes(d.id)
                      ? devices.filter((id) => id !== d.id)
                      : [...devices, d.id],
                  )
                }
              />
              {d.label}
            </label>
          ))}
        </div>
      </div>
    </>
  );
}
