/** Shared image-upload validation for server actions. */

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export const IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
];

export const IMAGE_ACCEPT = IMAGE_TYPES.join(",");

export type ImageResult =
  | { ok: true; base64: string; contentType: string }
  | { ok: false; empty: true }
  | { ok: false; empty?: false; error: string };

/**
 * Reads an image out of a form field. Returns `empty` when the field is absent
 * or untouched, so callers can tell "no new upload" from "bad upload".
 */
export async function readImageField(
  fd: FormData,
  key: string,
): Promise<ImageResult> {
  const value = fd.get(key);

  if (!(value instanceof File) || value.size === 0) {
    return { ok: false, empty: true };
  }
  if (!IMAGE_TYPES.includes(value.type)) {
    return { ok: false, error: "Images must be JPEG, PNG, WebP, AVIF or GIF." };
  }
  if (value.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "That image is larger than 4 MB. Resize it and retry." };
  }

  const bytes = Buffer.from(await value.arrayBuffer());
  return { ok: true, base64: bytes.toString("base64"), contentType: value.type };
}
