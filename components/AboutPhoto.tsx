"use client";

import { useEffect, useRef, useState } from "react";

/** Static file the owner drops in public/images. Missing file shows the frame. */
export default function AboutPhoto() {
  const imgRef = useRef<HTMLImageElement>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth === 0) setMissing(true);
  }, []);

  return (
    <div className="about-photo">
      {missing ? (
        <span>Photo coming soon</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          src="/images/about-us.jpg"
          alt="TheApStore"
          onError={() => setMissing(true)}
        />
      )}
    </div>
  );
}
