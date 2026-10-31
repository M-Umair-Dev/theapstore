import { del } from "@vercel/blob";
import { getDb } from "./mongodb.ts";
import { slugify } from "./products.ts";
import { isVercelBlobUrl } from "./upload-rules.ts";

/**
 * Blog posts keep metadata. Legacy picture and video bytes stay in `blog_media`.
 * New uploads store a Vercel Blob URL on the post and do not write file bytes.
 * Nothing here reads or writes the product `images`, `thumbnails`, or `receipts` collections.
 */

export const blogStatuses = ["draft", "published"] as const;
export type BlogStatus = (typeof blogStatuses)[number];
export type BlogMediaKind = "image" | "video";

export type BlogImage = {
  id: string;
  url: string;
  filename: string;
  contentType: string;
};

export type BlogVideo = {
  id: string;
  title: string;
  url?: string;
  filename?: string;
  contentType?: string;
};

export type Blog = {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: BlogStatus;
  imageIds: string[];
  /** Blob pictures. Missing on posts saved before Blob uploads. */
  images?: BlogImage[];
  videos: BlogVideo[];
  createdAt: Date;
  updatedAt: Date;
};

export type BlogMedia = {
  id: string;
  blogId: string;
  kind: BlogMediaKind;
  contentType: string;
  data: string;
  updatedAt: Date;
};

const BLOG_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isBlogId(value: string): boolean {
  return BLOG_ID.test(value);
}

/** Lowercase, hyphenated, punctuation stripped. Capped so the unique index can store it. */
export function blogSlug(title: string): string {
  return slugify(title).slice(0, 80).replace(/-+$/, "");
}

const blogs = () => getDb().collection<Blog>("blogs");
const blogMedia = () => getDb().collection<BlogMedia>("blog_media");

let indexesReady: Promise<void> | null = null;

function ensureIndexes() {
  indexesReady ??= Promise.all([
    blogs().createIndex({ id: 1 }, { unique: true }),
    blogs().createIndex({ slug: 1 }, { unique: true }),
    blogMedia().createIndex({ id: 1 }, { unique: true }),
    blogMedia().createIndex({ blogId: 1 }),
  ])
    .then(() => undefined)
    .catch((err: unknown) => {
      indexesReady = null;
      throw err;
    });
  return indexesReady;
}

function isDuplicateKey(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: unknown }).code === 11000
  );
}

function toBlog(doc: Blog & { _id?: unknown }): Blog {
  const { _id, ...blog } = doc;
  return blog;
}

export async function countBlogs(): Promise<number> {
  await ensureIndexes();
  return blogs().countDocuments();
}

export async function listBlogs(): Promise<Blog[]> {
  await ensureIndexes();
  const docs = await blogs().find().sort({ createdAt: -1 }).toArray();
  return docs.map(toBlog);
}

export async function listPublishedBlogs(): Promise<Blog[]> {
  await ensureIndexes();
  const docs = await blogs()
    .find({ status: "published" })
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map(toBlog);
}

export async function getBlogById(id: string): Promise<Blog | null> {
  await ensureIndexes();
  const doc = await blogs().findOne({ id });
  return doc ? toBlog(doc) : null;
}

export async function getPublishedBlog(slug: string): Promise<Blog | null> {
  await ensureIndexes();
  const doc = await blogs().findOne({ slug, status: "published" });
  return doc ? toBlog(doc) : null;
}

/** Id of the post that already owns this slug, if any. */
export async function blogSlugOwner(slug: string): Promise<string | null> {
  await ensureIndexes();
  const doc = await blogs().findOne({ slug }, { projection: { id: 1 } });
  return doc?.id ?? null;
}

export async function createBlog(input: {
  title: string;
  slug: string;
  description: string;
  status: BlogStatus;
}): Promise<{ ok: true; blog: Blog } | { ok: false; duplicate: true }> {
  await ensureIndexes();
  const now = new Date();
  const blog: Blog = {
    id: crypto.randomUUID(),
    title: input.title,
    slug: input.slug,
    description: input.description,
    status: input.status,
    imageIds: [],
    images: [],
    videos: [],
    createdAt: now,
    updatedAt: now,
  };

  try {
    await blogs().insertOne(blog);
  } catch (err) {
    if (isDuplicateKey(err)) return { ok: false, duplicate: true };
    throw err;
  }

  return { ok: true, blog };
}

export async function updateBlogDetails(
  id: string,
  fields: Pick<Blog, "title" | "slug" | "description" | "status">,
): Promise<"ok" | "missing" | "duplicate"> {
  await ensureIndexes();
  try {
    const res = await blogs().updateOne(
      { id },
      { $set: { ...fields, updatedAt: new Date() } },
    );
    return res.matchedCount === 1 ? "ok" : "missing";
  } catch (err) {
    if (isDuplicateKey(err)) return "duplicate";
    throw err;
  }
}

async function attachMedia(
  blogId: string,
  kind: BlogMediaKind,
  contentType: string,
  base64: string,
  videoTitle?: string,
): Promise<string | null> {
  await ensureIndexes();
  const mediaId = crypto.randomUUID();
  const now = new Date();

  await blogMedia().insertOne({
    id: mediaId,
    blogId,
    kind,
    contentType,
    data: base64,
    updatedAt: now,
  });

  const updated =
    kind === "image"
      ? await blogs().updateOne(
          { id: blogId },
          { $push: { imageIds: mediaId }, $set: { updatedAt: now } },
        )
      : await blogs().updateOne(
          { id: blogId },
          {
            $push: { videos: { id: mediaId, title: videoTitle ?? "" } },
            $set: { updatedAt: now },
          },
        );

  if (updated.matchedCount !== 1) {
    await blogMedia().deleteOne({ id: mediaId, blogId });
    return null;
  }

  return mediaId;
}

export async function pushBlogImage(blogId: string, image: BlogImage): Promise<boolean> {
  await ensureIndexes();
  const res = await blogs().updateOne(
    { id: blogId },
    { $push: { images: image }, $set: { updatedAt: new Date() } },
  );
  return res.matchedCount === 1;
}

export async function pushBlogVideo(blogId: string, video: BlogVideo): Promise<boolean> {
  await ensureIndexes();
  const res = await blogs().updateOne(
    { id: blogId },
    { $push: { videos: video }, $set: { updatedAt: new Date() } },
  );
  return res.matchedCount === 1;
}

export function addBlogImage(
  blogId: string,
  contentType: string,
  base64: string,
): Promise<string | null> {
  return attachMedia(blogId, "image", contentType, base64);
}

export function addBlogVideo(
  blogId: string,
  title: string,
  contentType: string,
  base64: string,
): Promise<string | null> {
  return attachMedia(blogId, "video", contentType, base64, title);
}

/** Replaces bytes on that one media document. The blog row is left as it is. */
export async function replaceBlogMedia(
  blogId: string,
  mediaId: string,
  kind: BlogMediaKind,
  contentType: string,
  base64: string,
): Promise<boolean> {
  await ensureIndexes();
  const res = await blogMedia().updateOne(
    { id: mediaId, blogId, kind },
    { $set: { contentType, data: base64, updatedAt: new Date() } },
  );
  return res.matchedCount === 1;
}

export async function renameBlogVideo(
  blogId: string,
  mediaId: string,
  title: string,
): Promise<boolean> {
  await ensureIndexes();
  const res = await blogs().updateOne(
    { id: blogId, "videos.id": mediaId },
    { $set: { "videos.$.title": title, updatedAt: new Date() } },
  );
  return res.matchedCount === 1;
}

export async function removeBlogMedia(blogId: string, mediaId: string): Promise<boolean> {
  await ensureIndexes();
  const existing = await blogMedia().findOne(
    { id: mediaId, blogId },
    { projection: { kind: 1 } },
  );
  if (!existing) return false;

  await blogMedia().deleteOne({ id: mediaId, blogId });
  const now = new Date();

  switch (existing.kind) {
    case "image":
      await blogs().updateOne(
        { id: blogId },
        { $pull: { imageIds: mediaId }, $set: { updatedAt: now } },
      );
      break;
    case "video":
      await blogs().updateOne(
        { id: blogId },
        { $pull: { videos: { id: mediaId } }, $set: { updatedAt: now } },
      );
      break;
    default: {
      const unreachable: never = existing.kind;
      throw new Error(`Unexpected media kind: ${String(unreachable)}`);
    }
  }

  return true;
}

async function deleteBlobQuiet(url: string | undefined) {
  if (!url || !isVercelBlobUrl(url)) return;
  try {
    await del(url);
  } catch {
    // The post no longer points at this file. A blob delete failure stays quiet.
  }
}

/** Drops one Blob picture or video. Legacy `blog_media` rows are left untouched. */
export async function removeBlogBlob(
  blogId: string,
  mediaId: string,
  kind: BlogMediaKind,
): Promise<boolean> {
  await ensureIndexes();
  const blog = await blogs().findOne({ id: blogId });
  if (!blog) return false;

  let url: string | undefined;
  switch (kind) {
    case "image":
      url = blog.images?.find((image) => image.id === mediaId)?.url;
      break;
    case "video":
      url = blog.videos?.find((video) => video.id === mediaId)?.url;
      break;
    default: {
      const unreachable: never = kind;
      throw new Error(`Unexpected media kind: ${String(unreachable)}`);
    }
  }
  if (!url || !isVercelBlobUrl(url)) return false;

  const now = new Date();
  const updated =
    kind === "image"
      ? await blogs().updateOne(
          { id: blogId },
          { $pull: { images: { id: mediaId } }, $set: { updatedAt: now } },
        )
      : await blogs().updateOne(
          { id: blogId },
          { $pull: { videos: { id: mediaId } }, $set: { updatedAt: now } },
        );
  if (updated.matchedCount !== 1) return false;

  await deleteBlobQuiet(url);
  return true;
}

/** Deletes an uploaded blob that was never saved on a post. */
export async function deleteUnreferencedBlob(url: string): Promise<void> {
  if (!isVercelBlobUrl(url)) return;
  const used = await blogs().findOne(
    { $or: [{ "images.url": url }, { "videos.url": url }] },
    { projection: { id: 1 } },
  );
  if (used) return;
  await deleteBlobQuiet(url);
}

/**
 * Deletes that blog document and only `blog_media` rows for its id.
 * Blob URLs on that post are deleted after the document is gone.
 * Does not touch product images, thumbnails, or receipts.
 */
export async function deleteBlog(id: string): Promise<boolean> {
  await ensureIndexes();
  const existing = await blogs().findOne({ id });
  if (!existing) return false;
  await blogMedia().deleteMany({ blogId: id });
  await blogs().deleteOne({ id });
  const urls = [
    ...(existing.images ?? []).map((image) => image.url),
    ...(existing.videos ?? []).flatMap((video) => (video.url ? [video.url] : [])),
  ];
  await Promise.all(urls.map((url) => deleteBlobQuiet(url)));
  return true;
}

export async function getBlogMedia(id: string): Promise<BlogMedia | null> {
  await ensureIndexes();
  return blogMedia().findOne({ id });
}

/** Bytes for a published post only. Draft media and unknown ids are missing. */
export async function getPublishedBlogMedia(id: string): Promise<BlogMedia | null> {
  await ensureIndexes();
  const media = await blogMedia().findOne({ id });
  if (!media) return null;
  const blog = await blogs().findOne(
    { id: media.blogId },
    { projection: { status: 1 } },
  );
  if (!blog || blog.status !== "published") return null;
  return media;
}
