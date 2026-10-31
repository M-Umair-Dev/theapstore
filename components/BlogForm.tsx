"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import {
  attachBlogImageAction,
  attachBlogVideoAction,
  createBlogAction,
  discardBlogUploadAction,
  removeBlogBlobAction,
  removeBlogMediaAction,
  renameBlogVideoAction,
  updateBlogAction,
  type BlogActionResult,
} from "@/app/admin/blog/actions";
import {
  BLOG_IMAGE_ACCEPT,
  BLOG_IMAGE_TYPE_ERROR,
  BLOG_VIDEO_ACCEPT,
  BLOG_VIDEO_TYPE_ERROR,
  blogAdminMediaSrc,
  blogFilename,
  blogImageContentType,
  blogImageFileError,
  blogTitleFromFilename,
  blogVideoContentType,
  blogVideoFileError,
  isVercelBlobUrl,
} from "@/lib/upload-rules";

type Status = "draft" | "published";
type UploadStatus =
  | { state: "waiting" }
  | { state: "uploading"; percent: number }
  | { state: "saved" }
  | { state: "error"; message: string };

export type BlogFormValues = {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: Status;
  images: { id: string; url: string | null; filename: string | null; legacy: boolean }[];
  videos: {
    id: string;
    title: string;
    url: string | null;
    filename: string | null;
    legacy: boolean;
  }[];
};

type ExistingImage = {
  id: string;
  url: string | null;
  filename: string | null;
  legacy: boolean;
  removed: boolean;
  replacement: File | null;
  status: UploadStatus;
};
type ExistingVideo = {
  id: string;
  url: string | null;
  filename: string | null;
  legacy: boolean;
  name: string;
  originalName: string;
  removed: boolean;
  replacement: File | null;
  status: UploadStatus;
};
type NewPicture = { key: string; file: File; status: UploadStatus };
type NewVideo = { key: string; file: File; title: string; status: UploadStatus };

const MULTIPART_FROM = 4.5 * 1024 * 1024;

function isRedirect(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "digest" in err &&
    String((err as { digest?: unknown }).digest).startsWith("NEXT_REDIRECT")
  );
}

function failureMessage(err: unknown, fallback: string): string {
  const raw = err instanceof Error ? err.message.trim() : "";
  if (!raw) return fallback;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      "error" in parsed &&
      typeof parsed.error === "string" &&
      parsed.error.trim()
    ) {
      return parsed.error.trim();
    }
  } catch {
    // The message is already plain text.
  }
  return raw;
}

function statusText(status: UploadStatus): string {
  switch (status.state) {
    case "waiting":
      return "Waiting";
    case "uploading":
      return `Uploading ${status.percent}%`;
    case "saved":
      return "Saved";
    case "error":
      return status.message;
    default: {
      const unreachable: never = status;
      return unreachable;
    }
  }
}

function pictureProblem(file: File): string | null {
  if (file.size === 0) return "Choose a picture.";
  return blogImageFileError(file);
}

function videoProblem(file: File): string | null {
  if (file.size === 0) return "Choose a video file.";
  return blogVideoFileError(file);
}

function formData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

function uploadEvent(file: File, kind: "image" | "video", contentType: string) {
  return {
    type: "blob.generate-client-token",
    payload: {
      pathname: `blog/${blogFilename(file.name) || "file"}`,
      clientPayload: JSON.stringify({
        kind,
        size: file.size,
        contentType,
        name: file.name,
      }),
      multipart: file.size > MULTIPART_FROM,
    },
  };
}

/** The Blob SDK replaces any non-OK token response with a generic message. Read the route's JSON instead. */
async function tokenError(file: File, kind: "image" | "video", contentType: string): Promise<string> {
  const res = await fetch("/api/admin/blog-upload", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(uploadEvent(file, kind, contentType)),
  });
  const raw = await res.text();
  try {
    const parsed = JSON.parse(raw) as { error?: unknown };
    if (typeof parsed.error === "string" && parsed.error.trim()) return parsed.error.trim();
  } catch {
    if (res.status === 404) {
      return "The upload endpoint is not on this deployment. Redeploy after the blog upload route is included.";
    }
  }
  return `Upload token request failed (${res.status}).`;
}

async function putFile(
  file: File,
  kind: "image" | "video",
  contentType: string,
  onProgress: (percent: number) => void,
): Promise<string> {
  let blob: { url: string };
  try {
    blob = await upload(`blog/${blogFilename(file.name) || "file"}`, file, {
      access: "public",
      handleUploadUrl: "/api/admin/blog-upload",
      contentType,
      multipart: file.size > MULTIPART_FROM,
      clientPayload: uploadEvent(file, kind, contentType).payload.clientPayload,
      onUploadProgress: ({ percentage }) => {
        onProgress(Math.max(0, Math.min(100, Math.round(percentage))));
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("retrieve the client token")) {
      throw new Error(await tokenError(file, kind, contentType));
    }
    throw err;
  }
  if (!isVercelBlobUrl(blob.url)) {
    throw new Error("Upload URL was not a Vercel Blob URL.");
  }
  return blob.url;
}

async function discardQuiet(url: string) {
  try {
    await discardBlogUploadAction(formData({ url }));
  } catch (err) {
    if (isRedirect(err)) throw err;
  }
}

function FilePreview({
  file,
  kind,
  contentType,
}: {
  file: File;
  kind: "image" | "video";
  contentType: string | null;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [playable, setPlayable] = useState(kind === "image");

  useEffect(() => {
    const next = URL.createObjectURL(file);
    setUrl(next);
    if (kind === "video") {
      const probe = document.createElement("video");
      setPlayable(contentType ? probe.canPlayType(contentType) !== "" : false);
    }
    return () => URL.revokeObjectURL(next);
  }, [file, kind, contentType]);

  if (!url) return null;
  if (kind === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt="" />
    );
  }
  if (!playable) return null;
  return <video src={url} controls playsInline muted preload="metadata" />;
}

function FileTrigger({
  label,
  accept,
  multiple = false,
  disabled,
  className,
  onFiles,
}: {
  label: string;
  accept: string;
  multiple?: boolean;
  disabled: boolean;
  className: string;
  onFiles: (files: File[]) => void;
}) {
  return (
    <label className={className} aria-disabled={disabled ? true : undefined}>
      {label}
      <input
        className="file-trigger"
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          if (files.length > 0) onFiles(files);
        }}
      />
    </label>
  );
}

function StatusLine({ status }: { status: UploadStatus }) {
  return (
    <p className={status.state === "error" ? "blog-file-error" : "hint"} aria-live="polite">
      {statusText(status)}
    </p>
  );
}

export default function BlogForm({
  blog,
  initialError = null,
}: {
  blog?: BlogFormValues;
  initialError?: string | null;
}) {
  const router = useRouter();
  const uid = useId();
  const sessionBlogId = useRef(blog?.id ?? null);
  const [editingId, setEditingId] = useState(blog?.id ?? null);
  const [title, setTitle] = useState(blog?.title ?? "");
  const [description, setDescription] = useState(blog?.description ?? "");
  const [status, setStatus] = useState<Status>(blog?.status ?? "draft");
  const [existingImages, setExistingImages] = useState<ExistingImage[]>(
    () =>
      blog?.images.map((image) => ({
        id: image.id,
        url: image.url,
        filename: image.filename,
        legacy: image.legacy,
        removed: false,
        replacement: null,
        status: { state: "saved" },
      })) ?? [],
  );
  const [existingVideos, setExistingVideos] = useState<ExistingVideo[]>(
    () =>
      blog?.videos.map((video) => ({
        id: video.id,
        url: video.url,
        filename: video.filename,
        legacy: video.legacy,
        name: video.title,
        originalName: video.title,
        removed: false,
        replacement: null,
        status: { state: "saved" },
      })) ?? [],
  );
  const [newPictures, setNewPictures] = useState<NewPicture[]>([]);
  const [newVideos, setNewVideos] = useState<NewVideo[]>([]);
  const [error, setError] = useState<string | null>(initialError);
  const [pending, setPending] = useState(false);

  function addPictures(files: File[]) {
    const accepted: NewPicture[] = files.map((file) => {
      const problem = pictureProblem(file);
      return {
        key: crypto.randomUUID(),
        file,
        status: problem
          ? { state: "error", message: `${file.name}: ${problem}` }
          : { state: "waiting" },
      };
    });
    setNewPictures((prev) => [...prev, ...accepted]);
  }

  function addVideos(files: File[]) {
    const accepted: NewVideo[] = files.map((file) => {
      const problem = videoProblem(file);
      return {
        key: crypto.randomUUID(),
        file,
        title: blogTitleFromFilename(file.name),
        status: problem
          ? { state: "error", message: `${file.name}: ${problem}` }
          : { state: "waiting" },
      };
    });
    setNewVideos((prev) => [...prev, ...accepted]);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    if (!cleanTitle) {
      setError("Title is required.");
      return;
    }
    if (!cleanDescription) {
      setError("Description is required.");
      return;
    }

    const picturesAtSubmit = newPictures;
    const videosAtSubmit = newVideos;
    const imagesAtSubmit = existingImages;
    const existingVideosAtSubmit = existingVideos;

    setPending(true);
    setError(null);
    let formError: string | null = null;
    const note = (message: string) => {
      formError ??= message;
    };

    try {
      const activeBefore = sessionBlogId.current;
      const details = formData({
        title: cleanTitle,
        description: cleanDescription,
        status,
        ...(activeBefore ? { id: activeBefore } : {}),
      });
      const saved = activeBefore
        ? await updateBlogAction(details)
        : await createBlogAction(details);
      if (!saved.ok) {
        setError(saved.error);
        return;
      }

      const activeId = saved.id;
      sessionBlogId.current = activeId;
      setEditingId(activeId);

      for (const image of imagesAtSubmit) {
        if (image.removed) {
          const removed = await removeStored(activeId, image.id, "image", image.legacy);
          if (!removed.ok) {
            note(removed.error);
            setExistingImages((prev) =>
              prev.map((item) =>
                item.id === image.id
                  ? { ...item, removed: false, status: { state: "error", message: removed.error } }
                  : item,
              ),
            );
          } else {
            setExistingImages((prev) => prev.filter((item) => item.id !== image.id));
          }
          continue;
        }
        if (!image.replacement) {
          if (image.status.state === "error") note(image.status.message);
          continue;
        }
        const replaced = await replaceImage(activeId, image);
        if (replaced) note(replaced);
      }

      for (const video of existingVideosAtSubmit) {
        if (video.removed) {
          const removed = await removeStored(activeId, video.id, "video", video.legacy);
          if (!removed.ok) {
            note(removed.error);
            setExistingVideos((prev) =>
              prev.map((item) =>
                item.id === video.id
                  ? { ...item, removed: false, status: { state: "error", message: removed.error } }
                  : item,
              ),
            );
          } else {
            setExistingVideos((prev) => prev.filter((item) => item.id !== video.id));
          }
          continue;
        }
        const name = video.name.trim();
        if (!name) {
          note("Enter a name for each video.");
          setExistingVideos((prev) =>
            prev.map((item) =>
              item.id === video.id
                ? { ...item, status: { state: "error", message: "Enter a name for each video." } }
                : item,
            ),
          );
          continue;
        }
        if (video.replacement) {
          const replaced = await replaceVideo(activeId, video, name);
          if (replaced) note(replaced);
          continue;
        }
        if (video.status.state === "error") note(video.status.message);
        if (name !== video.originalName) {
          const renamed = await renameBlogVideoAction(
            formData({ blogId: activeId, mediaId: video.id, name }),
          );
          if (!renamed.ok) note(renamed.error);
        }
      }

      for (const picture of picturesAtSubmit) {
        const failed = await sendPicture(activeId, picture);
        if (failed) note(failed);
      }
      for (const video of videosAtSubmit) {
        const failed = await sendVideo(activeId, video);
        if (failed) note(failed);
      }

      if (formError) {
        if (!blog) window.history.replaceState(null, "", `/admin/blog/${activeId}`);
        setError([saved.notice, formError].filter(Boolean).join(" "));
        return;
      }

      if (saved.notice) {
        router.replace(
          `/admin/blog/${activeId}?error=${encodeURIComponent(saved.notice)}&t=${Date.now()}`,
        );
        return;
      }

      router.push(`/admin/blog?saved=${encodeURIComponent(cleanTitle)}`);
    } catch (err) {
      if (isRedirect(err)) throw err;
      setError(failureMessage(err, "Could not save the post. Try again."));
    } finally {
      setPending(false);
    }
  }

  async function removeStored(
    blogId: string,
    mediaId: string,
    kind: "image" | "video",
    legacy: boolean,
  ): Promise<BlogActionResult> {
    if (legacy) return removeBlogMediaAction(formData({ blogId, mediaId }));
    return removeBlogBlobAction(formData({ blogId, mediaId, kind }));
  }

  async function replaceImage(blogId: string, image: ExistingImage): Promise<string | null> {
    const file = image.replacement;
    if (!file) return null;
    const problem = pictureProblem(file);
    if (problem) {
      const message = `${file.name}: ${problem}`;
      setExistingImages((prev) =>
        prev.map((item) =>
          item.id === image.id ? { ...item, status: { state: "error", message } } : item,
        ),
      );
      return message;
    }
    const contentType = blogImageContentType(file);
    if (!contentType) return BLOG_IMAGE_TYPE_ERROR;

    setExistingImages((prev) =>
      prev.map((item) =>
        item.id === image.id ? { ...item, status: { state: "uploading", percent: 0 } } : item,
      ),
    );

    let url: string | null = null;
    try {
      url = await putFile(file, "image", contentType, (percent) => {
        setExistingImages((prev) =>
          prev.map((item) =>
            item.id === image.id ? { ...item, status: { state: "uploading", percent } } : item,
          ),
        );
      });
      const attached = await attachBlogImageAction(
        formData({ blogId, url, filename: file.name, contentType }),
      );
      if (!attached.ok || !attached.mediaId) {
        await discardQuiet(url);
        const message = attached.ok ? "Could not save that picture." : attached.error;
        setExistingImages((prev) =>
          prev.map((item) =>
            item.id === image.id ? { ...item, status: { state: "error", message } } : item,
          ),
        );
        return message;
      }
      const mediaId = attached.mediaId;

      const saved: ExistingImage = {
        id: mediaId,
        url,
        filename: file.name,
        legacy: false,
        removed: false,
        replacement: null,
        status: { state: "saved" },
      };
      const removed = await removeStored(blogId, image.id, "image", image.legacy);
      if (!removed.ok) {
        setExistingImages((prev) => [
          ...prev.map((item) =>
            item.id === image.id
              ? {
                  ...item,
                  replacement: null,
                  status: { state: "error" as const, message: removed.error },
                }
              : item,
          ),
          saved,
        ]);
        return removed.error;
      }
      setExistingImages((prev) => prev.map((item) => (item.id === image.id ? saved : item)));
      return null;
    } catch (err) {
      if (isRedirect(err)) throw err;
      if (url) await discardQuiet(url);
      const message = failureMessage(err, "Could not upload that picture.");
      setExistingImages((prev) =>
        prev.map((item) =>
          item.id === image.id ? { ...item, status: { state: "error", message } } : item,
        ),
      );
      return message;
    }
  }

  async function replaceVideo(
    blogId: string,
    video: ExistingVideo,
    name: string,
  ): Promise<string | null> {
    const file = video.replacement;
    if (!file) return null;
    const problem = videoProblem(file);
    if (problem) {
      const message = `${file.name}: ${problem}`;
      setExistingVideos((prev) =>
        prev.map((item) =>
          item.id === video.id ? { ...item, status: { state: "error", message } } : item,
        ),
      );
      return message;
    }
    const contentType = blogVideoContentType(file);
    if (!contentType) return BLOG_VIDEO_TYPE_ERROR;

    setExistingVideos((prev) =>
      prev.map((item) =>
        item.id === video.id ? { ...item, status: { state: "uploading", percent: 0 } } : item,
      ),
    );

    let url: string | null = null;
    try {
      url = await putFile(file, "video", contentType, (percent) => {
        setExistingVideos((prev) =>
          prev.map((item) =>
            item.id === video.id ? { ...item, status: { state: "uploading", percent } } : item,
          ),
        );
      });
      const attached = await attachBlogVideoAction(
        formData({ blogId, url, filename: file.name, contentType, title: name }),
      );
      if (!attached.ok || !attached.mediaId) {
        await discardQuiet(url);
        const message = attached.ok ? "Could not save that video." : attached.error;
        setExistingVideos((prev) =>
          prev.map((item) =>
            item.id === video.id ? { ...item, status: { state: "error", message } } : item,
          ),
        );
        return message;
      }

      const saved: ExistingVideo = {
        id: attached.mediaId,
        url,
        filename: file.name,
        legacy: false,
        name,
        originalName: name,
        removed: false,
        replacement: null,
        status: { state: "saved" },
      };
      const removed = await removeStored(blogId, video.id, "video", video.legacy);
      if (!removed.ok) {
        setExistingVideos((prev) => [
          ...prev.map((item) =>
            item.id === video.id
              ? {
                  ...item,
                  replacement: null,
                  status: { state: "error" as const, message: removed.error },
                }
              : item,
          ),
          saved,
        ]);
        return removed.error;
      }
      setExistingVideos((prev) => prev.map((item) => (item.id === video.id ? saved : item)));
      return null;
    } catch (err) {
      if (isRedirect(err)) throw err;
      if (url) await discardQuiet(url);
      const message = failureMessage(err, "Could not upload that video.");
      setExistingVideos((prev) =>
        prev.map((item) =>
          item.id === video.id ? { ...item, status: { state: "error", message } } : item,
        ),
      );
      return message;
    }
  }

  async function sendPicture(blogId: string, picture: NewPicture): Promise<string | null> {
    const problem = pictureProblem(picture.file);
    if (problem) {
      const message = `${picture.file.name}: ${problem}`;
      setNewPictures((prev) =>
        prev.map((item) =>
          item.key === picture.key ? { ...item, status: { state: "error", message } } : item,
        ),
      );
      return message;
    }
    const contentType = blogImageContentType(picture.file);
    if (!contentType) return BLOG_IMAGE_TYPE_ERROR;

    setNewPictures((prev) =>
      prev.map((item) =>
        item.key === picture.key ? { ...item, status: { state: "uploading", percent: 0 } } : item,
      ),
    );

    let url: string | null = null;
    try {
      url = await putFile(picture.file, "image", contentType, (percent) => {
        setNewPictures((prev) =>
          prev.map((item) =>
            item.key === picture.key ? { ...item, status: { state: "uploading", percent } } : item,
          ),
        );
      });
      const attached = await attachBlogImageAction(
        formData({ blogId, url, filename: picture.file.name, contentType }),
      );
      if (!attached.ok || !attached.mediaId) {
        await discardQuiet(url);
        const message = attached.ok ? "Could not save that picture." : attached.error;
        setNewPictures((prev) =>
          prev.map((item) =>
            item.key === picture.key ? { ...item, status: { state: "error", message } } : item,
          ),
        );
        return message;
      }
      const pictureId = attached.mediaId;
      setNewPictures((prev) => prev.filter((item) => item.key !== picture.key));
      setExistingImages((prev) => [
        ...prev,
        {
          id: pictureId,
          url,
          filename: picture.file.name,
          legacy: false,
          removed: false,
          replacement: null,
          status: { state: "saved" },
        },
      ]);
      return null;
    } catch (err) {
      if (isRedirect(err)) throw err;
      if (url) await discardQuiet(url);
      const message = failureMessage(err, "Could not upload that picture.");
      setNewPictures((prev) =>
        prev.map((item) =>
          item.key === picture.key ? { ...item, status: { state: "error", message } } : item,
        ),
      );
      return message;
    }
  }

  async function sendVideo(blogId: string, video: NewVideo): Promise<string | null> {
    const name = video.title.trim();
    if (!name) {
      const message = "Enter a name for each video.";
      setNewVideos((prev) =>
        prev.map((item) =>
          item.key === video.key ? { ...item, status: { state: "error", message } } : item,
        ),
      );
      return message;
    }
    const problem = videoProblem(video.file);
    if (problem) {
      const message = `${video.file.name}: ${problem}`;
      setNewVideos((prev) =>
        prev.map((item) =>
          item.key === video.key ? { ...item, status: { state: "error", message } } : item,
        ),
      );
      return message;
    }
    const contentType = blogVideoContentType(video.file);
    if (!contentType) return BLOG_VIDEO_TYPE_ERROR;

    setNewVideos((prev) =>
      prev.map((item) =>
        item.key === video.key ? { ...item, status: { state: "uploading", percent: 0 } } : item,
      ),
    );

    let url: string | null = null;
    try {
      url = await putFile(video.file, "video", contentType, (percent) => {
        setNewVideos((prev) =>
          prev.map((item) =>
            item.key === video.key ? { ...item, status: { state: "uploading", percent } } : item,
          ),
        );
      });
      const attached = await attachBlogVideoAction(
        formData({ blogId, url, filename: video.file.name, contentType, title: name }),
      );
      if (!attached.ok || !attached.mediaId) {
        await discardQuiet(url);
        const message = attached.ok ? "Could not save that video." : attached.error;
        setNewVideos((prev) =>
          prev.map((item) =>
            item.key === video.key ? { ...item, status: { state: "error", message } } : item,
          ),
        );
        return message;
      }
      const videoId = attached.mediaId;
      setNewVideos((prev) => prev.filter((item) => item.key !== video.key));
      setExistingVideos((prev) => [
        ...prev,
        {
          id: videoId,
          url,
          filename: video.file.name,
          legacy: false,
          name,
          originalName: name,
          removed: false,
          replacement: null,
          status: { state: "saved" },
        },
      ]);
      return null;
    } catch (err) {
      if (isRedirect(err)) throw err;
      if (url) await discardQuiet(url);
      const message = failureMessage(err, "Could not upload that video.");
      setNewVideos((prev) =>
        prev.map((item) =>
          item.key === video.key ? { ...item, status: { state: "error", message } } : item,
        ),
      );
      return message;
    }
  }

  return (
    <form className="admin-form" onSubmit={onSubmit} aria-busy={pending}>
      {error && <p className="form-error">{error}</p>}

      <div className="admin-panel">
        <h2>{editingId ? "Post" : "New post"}</h2>
        <div className="field">
          <label className="label" htmlFor={`${uid}-title`}>
            Title
          </label>
          <input
            id={`${uid}-title`}
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={pending}
          />
        </div>
        <div className="field">
          <label className="label" htmlFor={`${uid}-description`}>
            Short description
          </label>
          <textarea
            id={`${uid}-description`}
            className="textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            required
            disabled={pending}
          />
        </div>
        <div className="field">
          <label className="label" htmlFor={`${uid}-status`}>
            Status
          </label>
          <select
            id={`${uid}-status`}
            className="select"
            value={status}
            onChange={(e) => {
              const next = e.target.value;
              if (next === "draft" || next === "published") setStatus(next);
            }}
            disabled={pending}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <span className="hint">
            Drafts are hidden on the storefront. The address is taken from the title.
            {blog ? ` Current address: /blog/${blog.slug}` : ""}
          </span>
        </div>
      </div>

      <div className="admin-panel">
        <h2>Pictures</h2>
        <p className="hint">JPG, JPEG, PNG, or WebP, up to 10 MB each.</p>
        <div className="blog-file-list">
          {existingImages.map((image) => (
            <div className="blog-file" key={image.id}>
              {image.removed ? (
                <p className="hint">This picture will be removed when you save.</p>
              ) : (
                <>
                  {image.replacement ? (
                    <FilePreview
                      file={image.replacement}
                      kind="image"
                      contentType={blogImageContentType(image.replacement)}
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={blogAdminMediaSrc(image)} alt="" />
                  )}
                  <p className="hint">{image.replacement?.name ?? image.filename ?? "Picture"}</p>
                  <StatusLine status={image.status} />
                </>
              )}
              <div className="table-actions">
                {image.removed ? (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={pending}
                    onClick={() =>
                      setExistingImages((prev) =>
                        prev.map((item) =>
                          item.id === image.id ? { ...item, removed: false } : item,
                        ),
                      )
                    }
                  >
                    Undo
                  </button>
                ) : (
                  <>
                    <FileTrigger
                      label="Replace"
                      accept={BLOG_IMAGE_ACCEPT}
                      disabled={pending}
                      className="btn btn-secondary btn-sm"
                      onFiles={(files) => {
                        const file = files[0];
                        if (!file) return;
                        const problem = pictureProblem(file);
                        setExistingImages((prev) =>
                          prev.map((item) =>
                            item.id === image.id
                              ? {
                                  ...item,
                                  replacement: problem ? null : file,
                                  removed: false,
                                  status: problem
                                    ? { state: "error", message: `${file.name}: ${problem}` }
                                    : { state: "waiting" },
                                }
                              : item,
                          ),
                        );
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={pending}
                      onClick={() =>
                        setExistingImages((prev) =>
                          prev.map((item) =>
                            item.id === image.id
                              ? { ...item, removed: true, replacement: null }
                              : item,
                          ),
                        )
                      }
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}

          {newPictures.map((picture) => (
            <div className="blog-file" key={picture.key}>
              <FilePreview
                file={picture.file}
                kind="image"
                contentType={blogImageContentType(picture.file)}
              />
              <p className="hint">{picture.file.name}</p>
              <StatusLine status={picture.status} />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={pending}
                onClick={() =>
                  setNewPictures((prev) => prev.filter((item) => item.key !== picture.key))
                }
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <FileTrigger
          label="Add Pictures"
          accept={BLOG_IMAGE_ACCEPT}
          multiple
          disabled={pending}
          className="btn btn-secondary"
          onFiles={addPictures}
        />
      </div>

      <div className="admin-panel">
        <h2>Videos</h2>
        <p className="hint">MP4, WebM, or MOV, up to 50 MB each. Every video needs a name.</p>
        <div className="blog-file-list">
          {existingVideos.map((video) => (
            <div className="blog-file" key={video.id}>
              {video.removed ? (
                <p className="hint">This video will be removed when you save.</p>
              ) : (
                <>
                  <div className="field">
                    <label className="label" htmlFor={`${uid}-video-${video.id}`}>
                      Name
                    </label>
                    <input
                      id={`${uid}-video-${video.id}`}
                      className="input"
                      value={video.name}
                      disabled={pending}
                      onChange={(e) =>
                        setExistingVideos((prev) =>
                          prev.map((item) =>
                            item.id === video.id ? { ...item, name: e.target.value } : item,
                          ),
                        )
                      }
                    />
                  </div>
                  <p className="hint">{video.replacement?.name ?? video.filename ?? "Video"}</p>
                  <StatusLine status={video.status} />
                  {video.replacement ? (
                    <FilePreview
                      file={video.replacement}
                      kind="video"
                      contentType={blogVideoContentType(video.replacement)}
                    />
                  ) : (
                    <video
                      controls
                      playsInline
                      muted
                      preload="metadata"
                      src={blogAdminMediaSrc(video)}
                    />
                  )}
                </>
              )}
              <div className="table-actions">
                {video.removed ? (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={pending}
                    onClick={() =>
                      setExistingVideos((prev) =>
                        prev.map((item) =>
                          item.id === video.id ? { ...item, removed: false } : item,
                        ),
                      )
                    }
                  >
                    Undo
                  </button>
                ) : (
                  <>
                    <FileTrigger
                      label="Replace"
                      accept={BLOG_VIDEO_ACCEPT}
                      disabled={pending}
                      className="btn btn-secondary btn-sm"
                      onFiles={(files) => {
                        const file = files[0];
                        if (!file) return;
                        const problem = videoProblem(file);
                        setExistingVideos((prev) =>
                          prev.map((item) =>
                            item.id === video.id
                              ? {
                                  ...item,
                                  replacement: problem ? null : file,
                                  removed: false,
                                  status: problem
                                    ? { state: "error", message: `${file.name}: ${problem}` }
                                    : { state: "waiting" },
                                }
                              : item,
                          ),
                        );
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={pending}
                      onClick={() =>
                        setExistingVideos((prev) =>
                          prev.map((item) =>
                            item.id === video.id
                              ? { ...item, removed: true, replacement: null }
                              : item,
                          ),
                        )
                      }
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}

          {newVideos.map((video) => (
            <div className="blog-file" key={video.key}>
              <div className="field">
                <label className="label" htmlFor={`${uid}-new-video-${video.key}`}>
                  Name
                </label>
                <input
                  id={`${uid}-new-video-${video.key}`}
                  className="input"
                  value={video.title}
                  disabled={pending}
                  onChange={(e) =>
                    setNewVideos((prev) =>
                      prev.map((item) =>
                        item.key === video.key ? { ...item, title: e.target.value } : item,
                      ),
                    )
                  }
                />
              </div>
              <p className="hint">{video.file.name}</p>
              <StatusLine status={video.status} />
              <FilePreview
                file={video.file}
                kind="video"
                contentType={blogVideoContentType(video.file)}
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={pending}
                onClick={() =>
                  setNewVideos((prev) => prev.filter((item) => item.key !== video.key))
                }
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <FileTrigger
          label="Add Videos"
          accept={BLOG_VIDEO_ACCEPT}
          multiple
          disabled={pending}
          className="btn btn-secondary"
          onFiles={addVideos}
        />
      </div>

      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Saving…" : editingId ? "Save Changes" : "Add New Blog"}
      </button>
    </form>
  );
}
