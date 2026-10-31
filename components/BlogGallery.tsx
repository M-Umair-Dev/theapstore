"use client";

import { useEffect, useRef, useState } from "react";

export default function BlogGallery({
  title,
  pictures,
}: {
  title: string;
  pictures: { id: string; src: string }[];
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !src || dialog.open) return;
    dialog.showModal();
  }, [src]);

  if (pictures.length === 0) return null;

  return (
    <>
      <div className="grid grid-3">
        {pictures.map((picture, index) => (
          <button
            key={picture.id}
            type="button"
            className="blog-shot"
            onClick={() => setSrc(picture.src)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={picture.src} alt={`${title} picture ${index + 1}`} />
          </button>
        ))}
      </div>
      <dialog
        ref={dialogRef}
        className="blog-lightbox"
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
        onClose={() => setSrc(null)}
      >
        {src && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={title} />
        )}
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => dialogRef.current?.close()}
        >
          Close
        </button>
      </dialog>
    </>
  );
}
