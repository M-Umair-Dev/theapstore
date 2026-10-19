import Image from "next/image";

/**
 * The AP Store mark, in one place so the header, footer and admin panel can
 * never drift apart.
 *
 * The supplied artwork is a square canvas with the mark centred on white, so:
 *   - it is laid out with `fill` + `object-fit: contain`, which cannot distort
 *     it whatever the file's real pixel dimensions turn out to be;
 *   - it sits on a white plate, because the same file is used on the white
 *     header and on the black footer/admin sidebar, and recolouring it or
 *     cropping the background would break the brand mark.
 */
export default function Logo() {
  return (
    <span className="logo-art">
      <Image
        src="/logo.png.png"
        alt="The AP Store logo"
        fill
        sizes="48px"
        priority
        className="logo-art-img"
      />
    </span>
  );
}
