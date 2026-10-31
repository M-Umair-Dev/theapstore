"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentAdmin } from "@/auth";
import {
  blogSlug,
  blogSlugOwner,
  createBlog,
  deleteBlog,
  deleteUnreferencedBlob,
  getBlogById,
  isBlogId,
  pushBlogImage,
  pushBlogVideo,
  removeBlogBlob,
  removeBlogMedia,
  renameBlogVideo,
  updateBlogDetails,
  type BlogStatus,
} from "@/lib/blogs";
import {
  blogFilename,
  blogImageContentType,
  blogVideoContentType,
  isVercelBlobUrl,
} from "@/lib/upload-rules";

export type BlogActionResult =
  | { ok: true; id: string; notice?: string; mediaId?: string }
  | { ok: false; error: string };

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

const backTo = (path: string, key: string, value: string) =>
  `${path}?${key}=${encodeURIComponent(value)}`;

const MISSING = "That blog post no longer exists.";
const SLUG_TAKEN = "A post already uses that address. Change the title and try again.";
const SLUG_EMPTY = "Enter a title that can become a web address.";

function revalidateBlog(slug?: string, previousSlug?: string) {
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  if (slug) revalidatePath(`/blog/${slug}`);
  if (previousSlug && previousSlug !== slug) revalidatePath(`/blog/${previousSlug}`);
}

function parseStatus(value: string, allowDefault: boolean): BlogStatus | null {
  if (!value && allowDefault) return "draft";
  if (value === "draft" || value === "published") return value;
  return null;
}

function parseDetails(
  fd: FormData,
  allowDefaultStatus: boolean,
):
  | { ok: true; title: string; description: string; status: BlogStatus }
  | { ok: false; error: string } {
  const title = str(fd, "title");
  const description = str(fd, "description");
  const status = parseStatus(str(fd, "status"), allowDefaultStatus);

  if (!title) return { ok: false, error: "Title is required." };
  if (!description) return { ok: false, error: "Description is required." };
  if (!status) return { ok: false, error: "Status must be Draft or Published." };

  return { ok: true, title, description, status };
}

function keptSlugNotice(wanted: string, kept: string): string {
  return `The address /blog/${wanted} is already used, so this post kept /blog/${kept}.`;
}

async function requireBlog(id: string) {
  if (!isBlogId(id)) return null;
  return getBlogById(id);
}

export async function createBlogAction(fd: FormData): Promise<BlogActionResult> {
  if (!(await currentAdmin())) redirect("/login?next=/admin/blog");

  const parsed = parseDetails(fd, true);
  if (!parsed.ok) return parsed;

  const slug = blogSlug(parsed.title);
  if (!slug) return { ok: false, error: SLUG_EMPTY };
  if (await blogSlugOwner(slug)) return { ok: false, error: SLUG_TAKEN };

  const created = await createBlog({ ...parsed, slug });
  if (!created.ok) return { ok: false, error: SLUG_TAKEN };

  revalidateBlog(created.blog.slug);
  return { ok: true, id: created.blog.id };
}

export async function updateBlogAction(fd: FormData): Promise<BlogActionResult> {
  if (!(await currentAdmin())) redirect("/login?next=/admin/blog");

  const blog = await requireBlog(str(fd, "id"));
  if (!blog) return { ok: false, error: MISSING };

  const parsed = parseDetails(fd, false);
  if (!parsed.ok) return parsed;

  const wanted = blogSlug(parsed.title);
  if (!wanted) return { ok: false, error: SLUG_EMPTY };

  let slug = wanted;
  let notice: string | undefined;
  if (wanted !== blog.slug && (await blogSlugOwner(wanted)) !== null) {
    slug = blog.slug;
    notice = keptSlugNotice(wanted, blog.slug);
  }

  let saved = await updateBlogDetails(blog.id, { ...parsed, slug });
  if (saved === "duplicate") {
    slug = blog.slug;
    notice = keptSlugNotice(wanted, blog.slug);
    saved = await updateBlogDetails(blog.id, { ...parsed, slug });
  }
  if (saved === "missing") return { ok: false, error: MISSING };
  if (saved === "duplicate") return { ok: false, error: SLUG_TAKEN };

  revalidateBlog(slug, blog.slug);
  return { ok: true, id: blog.id, ...(notice ? { notice } : {}) };
}

const BLOB_URL_ERROR = "Upload URL was not a Vercel Blob URL.";
const FILE_GONE = "That file is no longer on this post.";

function blobUrl(fd: FormData): string | null {
  const url = str(fd, "url");
  return isVercelBlobUrl(url) ? url : null;
}

export async function attachBlogImageAction(fd: FormData): Promise<BlogActionResult> {
  if (!(await currentAdmin())) redirect("/login?next=/admin/blog");

  const blog = await requireBlog(str(fd, "blogId"));
  if (!blog) return { ok: false, error: MISSING };

  const url = blobUrl(fd);
  if (!url) return { ok: false, error: BLOB_URL_ERROR };

  const filename = blogFilename(str(fd, "filename"));
  const contentType = blogImageContentType({ name: filename, type: str(fd, "contentType") });
  if (!filename || !contentType) {
    return { ok: false, error: "Pictures must be JPG, JPEG, PNG, or WebP." };
  }

  const mediaId = crypto.randomUUID();
  const pushed = await pushBlogImage(blog.id, { id: mediaId, url, filename, contentType });
  if (!pushed) return { ok: false, error: MISSING };

  revalidateBlog(blog.slug);
  return { ok: true, id: blog.id, mediaId };
}

export async function attachBlogVideoAction(fd: FormData): Promise<BlogActionResult> {
  if (!(await currentAdmin())) redirect("/login?next=/admin/blog");

  const blog = await requireBlog(str(fd, "blogId"));
  if (!blog) return { ok: false, error: MISSING };

  const url = blobUrl(fd);
  if (!url) return { ok: false, error: BLOB_URL_ERROR };

  const title = str(fd, "title");
  if (!title) return { ok: false, error: "Enter a name for each video." };

  const filename = blogFilename(str(fd, "filename"));
  const contentType = blogVideoContentType({ name: filename, type: str(fd, "contentType") });
  if (!filename || !contentType) {
    return { ok: false, error: "Videos must be MP4, WebM, or MOV." };
  }

  const mediaId = crypto.randomUUID();
  const pushed = await pushBlogVideo(blog.id, {
    id: mediaId,
    url,
    filename,
    title,
    contentType,
  });
  if (!pushed) return { ok: false, error: MISSING };

  revalidateBlog(blog.slug);
  return { ok: true, id: blog.id, mediaId };
}

export async function removeBlogBlobAction(fd: FormData): Promise<BlogActionResult> {
  if (!(await currentAdmin())) redirect("/login?next=/admin/blog");

  const blog = await requireBlog(str(fd, "blogId"));
  if (!blog) return { ok: false, error: MISSING };

  const mediaId = str(fd, "mediaId");
  const kind = str(fd, "kind");
  if (!isBlogId(mediaId) || (kind !== "image" && kind !== "video")) {
    return { ok: false, error: FILE_GONE };
  }

  const removed = await removeBlogBlob(blog.id, mediaId, kind);
  if (!removed) return { ok: false, error: FILE_GONE };

  revalidateBlog(blog.slug);
  return { ok: true, id: blog.id };
}

/** Best-effort delete when the browser uploaded a blob the post did not keep. */
export async function discardBlogUploadAction(fd: FormData): Promise<BlogActionResult> {
  if (!(await currentAdmin())) redirect("/login?next=/admin/blog");

  const url = blobUrl(fd);
  if (!url) return { ok: false, error: BLOB_URL_ERROR };

  await deleteUnreferencedBlob(url);
  return { ok: true, id: str(fd, "blogId") };
}

export async function renameBlogVideoAction(fd: FormData): Promise<BlogActionResult> {
  if (!(await currentAdmin())) redirect("/login?next=/admin/blog");

  const blog = await requireBlog(str(fd, "blogId"));
  if (!blog) return { ok: false, error: MISSING };

  const mediaId = str(fd, "mediaId");
  const name = str(fd, "name");
  if (!isBlogId(mediaId) || !name) {
    return { ok: false, error: name ? "That file is no longer on this post." : "Enter a name for each video." };
  }

  const renamed = await renameBlogVideo(blog.id, mediaId, name);
  if (!renamed) return { ok: false, error: "That file is no longer on this post." };

  revalidateBlog(blog.slug);
  return { ok: true, id: blog.id };
}

export async function removeBlogMediaAction(fd: FormData): Promise<BlogActionResult> {
  if (!(await currentAdmin())) redirect("/login?next=/admin/blog");

  const blog = await requireBlog(str(fd, "blogId"));
  if (!blog) return { ok: false, error: MISSING };

  const mediaId = str(fd, "mediaId");
  if (!isBlogId(mediaId)) return { ok: false, error: "That file is no longer on this post." };

  const removed = await removeBlogMedia(blog.id, mediaId);
  if (!removed) return { ok: false, error: "That file is no longer on this post." };

  revalidateBlog(blog.slug);
  return { ok: true, id: blog.id };
}

export async function deleteBlogAction(fd: FormData) {
  if (!(await currentAdmin())) redirect("/login?next=/admin/blog");

  const id = str(fd, "id");
  const blog = await requireBlog(id);
  if (!blog) redirect(backTo("/admin/blog", "error", MISSING));

  const removed = await deleteBlog(blog.id);
  if (!removed) redirect(backTo("/admin/blog", "error", MISSING));

  revalidateBlog(blog.slug);
  redirect("/admin/blog?deleted=1");
}
