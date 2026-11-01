"use client";

import { useId, useRef, useState } from "react";

export type HeroChoice = {
  slug: string;
  title: string;
  priceLabel: string;
  hasThumbnail: boolean;
  hasImage: boolean;
};

function markSrc(choice: HeroChoice, allowImage: boolean) {
  if (choice.hasThumbnail) return `/api/thumbnail/${choice.slug}`;
  if (allowImage && choice.hasImage) return `/api/image/${choice.slug}`;
  return null;
}

function Mark({
  choice,
  allowImage,
}: {
  choice: HeroChoice;
  allowImage: boolean;
}) {
  const src = markSrc(choice, allowImage);
  return (
    <span className="hero-mark" aria-hidden="true">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" />
      ) : (
        choice.title.charAt(0).toUpperCase()
      )}
    </span>
  );
}

export default function HeroPicker({
  choices,
  initialSlug,
}: {
  choices: HeroChoice[];
  initialSlug: string;
}) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [slug, setSlug] = useState(
    choices.some((c) => c.slug === initialSlug)
      ? initialSlug
      : (choices[0]?.slug ?? ""),
  );
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const selected = choices.find((c) => c.slug === slug) ?? choices[0];
  const needle = query.trim().toLowerCase();
  const filtered = needle
    ? choices.filter(
        (c) =>
          c.title.toLowerCase().includes(needle) ||
          c.slug.toLowerCase().includes(needle),
      )
    : choices;

  function pick(next: string) {
    setSlug(next);
    setQuery("");
    setOpen(false);
  }

  function reopen() {
    setQuery("");
    setOpen(true);
    setActive(0);
    inputRef.current?.focus();
  }

  if (!selected) return null;

  return (
    <>
      <div className="field hero-combo">
        <label className="label" htmlFor="hero-search">
          Select Featured Product
        </label>
        <input
          ref={inputRef}
          id="hero-search"
          className="input"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          placeholder="Search by name or slug"
          value={open ? query : selected.title}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => {
            setOpen(true);
            setQuery("");
            setActive(
              Math.max(
                0,
                choices.findIndex((c) => c.slug === slug),
              ),
            );
          }}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 120);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
              setActive((index) =>
                Math.min(index + 1, Math.max(filtered.length - 1, 0)),
              );
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((index) => Math.max(index - 1, 0));
            } else if (event.key === "Enter" && open && filtered[active]) {
              event.preventDefault();
              pick(filtered[active].slug);
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
        />
        {open && (
          <ul id={listId} role="listbox" className="hero-list">
            {filtered.length === 0 ? (
              <li className="hint">No matching products.</li>
            ) : (
              filtered.map((choice, index) => (
                <li key={choice.slug}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={choice.slug === slug}
                    className={
                      index === active ? "hero-option is-active" : "hero-option"
                    }
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => pick(choice.slug)}
                  >
                    <Mark choice={choice} allowImage />
                    <span>
                      {choice.title}
                      <span className="hint"> /{choice.slug}</span>
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      <div className="admin-panel hero-preview">
        {selected.hasThumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/api/thumbnail/${selected.slug}`} alt="" />
        ) : null}
        <h2 style={{ marginBottom: 0 }}>{selected.title}</h2>
        <p className="hint" style={{ margin: 0 }}>
          {selected.priceLabel}
        </p>
      </div>

      <input type="hidden" name="productSlug" value={slug} />

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          Save Changes
        </button>
        <button type="button" className="btn btn-secondary" onClick={reopen}>
          Change Product
        </button>
      </div>
    </>
  );
}
