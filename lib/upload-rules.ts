/** Shared upload limits. Safe to import from client components — no Node APIs. */

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

/** Same cap as images: a server action body is 4 MB, and each file is its own action. */
export const MAX_VIDEO_BYTES = MAX_IMAGE_BYTES;

export const IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
];

export const VIDEO_TYPES = ["video/mp4", "video/webm"];

export const IMAGE_ACCEPT = IMAGE_TYPES.join(",");
export const VIDEO_ACCEPT = VIDEO_TYPES.join(",");

export const IMAGE_TYPE_ERROR = "Images must be JPEG, PNG, WebP, AVIF or GIF.";
export const IMAGE_SIZE_ERROR = "That image is larger than 4 MB. Resize it and retry.";
export const VIDEO_TYPE_ERROR = "Videos must be MP4 or WebM.";
export const VIDEO_SIZE_ERROR = "That video is larger than 4 MB.";

/** Type, then size. A zero-byte file is the caller's "nothing chosen" case. */
export function imageFileError(file: { type: string; size: number }): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return IMAGE_TYPE_ERROR;
  if (file.size > MAX_IMAGE_BYTES) return IMAGE_SIZE_ERROR;
  return null;
}

export function videoFileError(file: { type: string; size: number }): string | null {
  if (!VIDEO_TYPES.includes(file.type)) return VIDEO_TYPE_ERROR;
  if (file.size > MAX_VIDEO_BYTES) return VIDEO_SIZE_ERROR;
  return null;
}

/**
 * Blog pictures and videos. Separate from `imageFileError` / `videoFileError`,
 * which product and receipt uploads still use (exact MIME, 4 MB).
 * An empty or nonstandard `file.type` is accepted when the extension matches.
 */

export const BLOG_IMAGE_BYTES = 10 * 1024 * 1024;
export const BLOG_VIDEO_BYTES = 50 * 1024 * 1024;

export const BLOG_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const BLOG_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"] as const;

export const BLOG_IMAGE_ACCEPT = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";
export const BLOG_VIDEO_ACCEPT = ".mp4,.webm,.mov,video/mp4,video/webm,video/quicktime";

export const BLOG_IMAGE_TYPE_ERROR = "Pictures must be JPG, JPEG, PNG, or WebP.";
export const BLOG_IMAGE_SIZE_ERROR = "That picture is larger than 10 MB.";
export const BLOG_VIDEO_TYPE_ERROR = "Videos must be MP4, WebM, or MOV.";
export const BLOG_VIDEO_SIZE_ERROR = "That video is larger than 50 MB.";

const BLOG_IMAGE_EXT: Record<string, (typeof BLOG_IMAGE_TYPES)[number]> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

const BLOG_VIDEO_EXT: Record<string, (typeof BLOG_VIDEO_TYPES)[number]> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};

export function blogFileExtension(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? name;
  const dot = base.lastIndexOf(".");
  if (dot <= 0) return "";
  return base.slice(dot).toLowerCase();
}

export function blogFilename(name: string): string {
  const base = name.split(/[/\\]/).pop()?.replace(/[\u0000-\u001f]/g, "").trim() ?? "";
  return base.slice(0, 180);
}

export function blogTitleFromFilename(name: string): string {
  const base = blogFilename(name);
  const dot = base.lastIndexOf(".");
  if (dot <= 0) return base;
  return base.slice(0, dot);
}

function listedType(type: string, allowed: readonly string[]): string | null {
  const value = type.trim().toLowerCase();
  return allowed.includes(value) ? value : null;
}

export function blogImageContentType(file: { name: string; type: string }): string | null {
  const fromType = listedType(file.type, BLOG_IMAGE_TYPES);
  if (fromType) return fromType;
  if (file.type.trim().toLowerCase() === "image/jpg") return "image/jpeg";
  return BLOG_IMAGE_EXT[blogFileExtension(file.name)] ?? null;
}

export function blogVideoContentType(file: { name: string; type: string }): string | null {
  const fromType = listedType(file.type, BLOG_VIDEO_TYPES);
  if (fromType) return fromType;
  return BLOG_VIDEO_EXT[blogFileExtension(file.name)] ?? null;
}

export function blogImageFileError(file: {
  name: string;
  type: string;
  size: number;
}): string | null {
  if (!blogImageContentType(file)) return BLOG_IMAGE_TYPE_ERROR;
  if (file.size > BLOG_IMAGE_BYTES) return BLOG_IMAGE_SIZE_ERROR;
  return null;
}

export function blogVideoFileError(file: {
  name: string;
  type: string;
  size: number;
}): string | null {
  if (!blogVideoContentType(file)) return BLOG_VIDEO_TYPE_ERROR;
  if (file.size > BLOG_VIDEO_BYTES) return BLOG_VIDEO_SIZE_ERROR;
  return null;
}

type BlogUploadKind = "image" | "video";

/**
 * Blob's token callback does not receive the file's real byte length.
 * `maximumSizeInBytes` is 10 MB for a picture and 50 MB for a video, from the
 * filename and content type. Callers still reject oversize files first.
 * 50 MB is the larger cap.
 */
export function blogClientPayloadLimits(input: {
  pathname: string;
  clientPayload: string | null;
}): { maximumSizeInBytes: number; contentType: string } {
  let payload: {
    kind?: unknown;
    size?: unknown;
    contentType?: unknown;
    name?: unknown;
  } = {};

  if (input.clientPayload) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(input.clientPayload);
    } catch {
      throw new Error("Invalid upload.");
    }
    if (!parsed || typeof parsed !== "object") throw new Error("Invalid upload.");
    payload = parsed;
  }

  const name =
    typeof payload.name === "string" && payload.name.trim() ? payload.name : input.pathname;
  const type = typeof payload.contentType === "string" ? payload.contentType : "";
  const size =
    typeof payload.size === "number" && Number.isFinite(payload.size) ? payload.size : null;
  const hinted: BlogUploadKind | null =
    payload.kind === "image" || payload.kind === "video" ? payload.kind : null;
  const image = blogImageContentType({ name, type });
  const video = blogVideoContentType({ name, type });

  const kind: BlogUploadKind | null =
    hinted ?? (image && !video ? "image" : video && !image ? "video" : null);

  switch (kind) {
    case "image":
      if (!image) throw new Error(BLOG_IMAGE_TYPE_ERROR);
      if (size !== null && size <= 0) throw new Error("Choose a picture.");
      if (size !== null && size > BLOG_IMAGE_BYTES) throw new Error(BLOG_IMAGE_SIZE_ERROR);
      return { maximumSizeInBytes: BLOG_IMAGE_BYTES, contentType: image };
    case "video":
      if (!video) throw new Error(BLOG_VIDEO_TYPE_ERROR);
      if (size !== null && size <= 0) throw new Error("Choose a video file.");
      if (size !== null && size > BLOG_VIDEO_BYTES) throw new Error(BLOG_VIDEO_SIZE_ERROR);
      return { maximumSizeInBytes: BLOG_VIDEO_BYTES, contentType: video };
    case null:
      throw new Error("That file type is not allowed.");
    default: {
      const unreachable: never = kind;
      throw new Error(`Unexpected upload kind: ${String(unreachable)}`);
    }
  }
}

/** Public blob hosts from the Vercel Blob SDK (`*.public.blob.vercel-storage.com`). */
export function isVercelBlobUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    if (url.username || url.password) return false;
    const host = url.hostname.toLowerCase();
    return host === "blob.vercel-storage.com" || host.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
}

export type BlogPictureRef = {
  id: string;
  url?: string | null;
  filename?: string | null;
  contentType?: string | null;
};

export function blogPublicMediaSrc(item: { id: string; url?: string | null }): string {
  if (item.url && isVercelBlobUrl(item.url)) return item.url;
  return `/api/blog-media/${item.id}`;
}

export function blogAdminMediaSrc(item: { id: string; url?: string | null }): string {
  if (item.url && isVercelBlobUrl(item.url)) return item.url;
  return `/api/admin/blog-media/${item.id}`;
}

export function blogPictures(blog: {
  imageIds?: readonly string[] | null;
  images?: readonly BlogPictureRef[] | null;
}): Array<{
  id: string;
  url: string | null;
  filename: string | null;
  contentType: string | null;
  legacy: boolean;
}> {
  const stored = blog.images ?? [];
  const byId = new Map(stored.filter((image) => image.id).map((image) => [image.id, image]));
  const seen = new Set<string>();
  const pictures: Array<{
    id: string;
    url: string | null;
    filename: string | null;
    contentType: string | null;
    legacy: boolean;
  }> = [];

  const push = (id: string, image: BlogPictureRef | undefined, alreadyStored: boolean) => {
    const url = image?.url && isVercelBlobUrl(image.url) ? image.url : null;
    pictures.push({
      id,
      url,
      filename: image?.filename ?? null,
      contentType: image?.contentType ?? null,
      legacy: !alreadyStored || url === null,
    });
  };

  for (const id of blog.imageIds ?? []) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const image = byId.get(id);
    push(id, image, Boolean(image?.url && isVercelBlobUrl(image.url)));
  }

  for (const image of stored) {
    if (!image.id || seen.has(image.id)) continue;
    seen.add(image.id);
    push(image.id, image, Boolean(image.url && isVercelBlobUrl(image.url)));
  }

  return pictures;
}

export function blogImageCount(blog: {
  imageIds?: readonly string[] | null;
  images?: readonly { id: string }[] | null;
}): number {
  const ids = new Set<string>();
  for (const id of blog.imageIds ?? []) if (id) ids.add(id);
  for (const image of blog.images ?? []) if (image.id) ids.add(image.id);
  return ids.size;
}

export function blogVideoCount(blog: { videos?: readonly { id: string }[] | null }): number {
  const ids = new Set<string>();
  for (const video of blog.videos ?? []) if (video.id) ids.add(video.id);
  return ids.size;
}
