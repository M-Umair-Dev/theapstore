/** Shared image and video upload validation for server actions. */

import { imageFileError, videoFileError } from "./upload-rules.ts";

export {
  IMAGE_ACCEPT,
  IMAGE_SIZE_ERROR,
  IMAGE_TYPE_ERROR,
  IMAGE_TYPES,
  MAX_IMAGE_BYTES,
} from "./upload-rules.ts";

export type ImageResult =
  | { ok: true; base64: string; contentType: string }
  | { ok: false; empty: true }
  | { ok: false; empty?: false; error: string };

export type VideoResult =
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
  const problem = imageFileError(value);
  if (problem) return { ok: false, error: problem };

  const bytes = Buffer.from(await value.arrayBuffer());
  return { ok: true, base64: bytes.toString("base64"), contentType: value.type };
}

/**
 * Reads a video out of a form field. Same shape as `readImageField`: empty
 * means the field was left blank, and only MP4 or WebM up to 4 MB is accepted.
 */
export async function readVideoField(
  fd: FormData,
  key: string,
): Promise<VideoResult> {
  const value = fd.get(key);

  if (!(value instanceof File) || value.size === 0) {
    return { ok: false, empty: true };
  }
  const problem = videoFileError(value);
  if (problem) return { ok: false, error: problem };

  const bytes = Buffer.from(await value.arrayBuffer());
  return { ok: true, base64: bytes.toString("base64"), contentType: value.type };
}
