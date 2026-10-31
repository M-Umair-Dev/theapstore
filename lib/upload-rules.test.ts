import assert from "node:assert/strict";
import test from "node:test";
import {
  BLOG_IMAGE_BYTES,
  BLOG_VIDEO_BYTES,
  IMAGE_TYPE_ERROR,
  blogClientPayloadLimits,
  blogImageContentType,
  blogImageCount,
  blogImageFileError,
  blogPictures,
  blogVideoContentType,
  blogVideoFileError,
  imageFileError,
} from "./upload-rules.ts";

const file = (name: string, type = "", size = 100) => ({ name, type, size });

test("empty-type jpg is accepted", () => {
  assert.equal(blogImageFileError(file("photo.jpg", "")), null);
  assert.equal(blogImageContentType(file("photo.jpg", "")), "image/jpeg");
  assert.equal(blogImageFileError(file("photo.jpeg", "image/jpg")), null);
});

test("png and webp are accepted", () => {
  assert.equal(blogImageFileError(file("a.png", "image/png")), null);
  assert.equal(blogImageFileError(file("a.webp", "")), null);
  assert.equal(blogImageContentType(file("a.webp", "")), "image/webp");
});

test("gif is rejected for blog pictures", () => {
  assert.equal(blogImageFileError(file("a.gif", "image/gif")), "Pictures must be JPG, JPEG, PNG, or WebP.");
  assert.ok(blogImageFileError(file("a.gif", "")));
});

test("mp4 mov and webm are accepted", () => {
  assert.equal(blogVideoFileError(file("a.mp4", "")), null);
  assert.equal(blogVideoFileError(file("a.mov", "")), null);
  assert.equal(blogVideoContentType(file("a.mov", "")), "video/quicktime");
  assert.equal(blogVideoContentType(file("a.mov", "video/quicktime")), "video/quicktime");
  assert.equal(blogVideoFileError(file("a.webm", "video/webm")), null);
});

test("exe is rejected", () => {
  assert.ok(blogImageFileError(file("run.exe", "")));
  assert.ok(blogVideoFileError(file("run.exe", "application/octet-stream")));
});

test("oversize blog files are rejected and files over 4 MB pictures still pass", () => {
  assert.equal(blogImageFileError(file("a.jpg", "", 5 * 1024 * 1024)), null);
  assert.equal(blogImageFileError(file("a.jpg", "", BLOG_IMAGE_BYTES)), null);
  assert.match(
    blogImageFileError(file("a.jpg", "image/jpeg", BLOG_IMAGE_BYTES + 1)) ?? "",
    /10 MB/,
  );
  assert.equal(blogVideoFileError(file("a.mov", "", BLOG_VIDEO_BYTES)), null);
  assert.match(blogVideoFileError(file("a.mp4", "", BLOG_VIDEO_BYTES + 1)) ?? "", /50 MB/);
});

test("product image rule still requires a listed mime and stays at 4 MB", () => {
  assert.equal(imageFileError({ type: "", size: 10 }), IMAGE_TYPE_ERROR);
  assert.equal(imageFileError({ type: "image/gif", size: 10 }), null);
  assert.equal(imageFileError({ type: "image/jpeg", size: 4 * 1024 * 1024 }), null);
  assert.ok(imageFileError({ type: "image/jpeg", size: 4 * 1024 * 1024 + 1 }));
});

test("token cap is 10 MB for a picture and 50 MB for a video", () => {
  const image = blogClientPayloadLimits({
    pathname: "blog/a.jpg",
    clientPayload: JSON.stringify({ kind: "image", size: 100, contentType: "", name: "a.jpg" }),
  });
  assert.equal(image.maximumSizeInBytes, BLOG_IMAGE_BYTES);
  assert.equal(image.contentType, "image/jpeg");

  const video = blogClientPayloadLimits({
    pathname: "blog/a.mov",
    clientPayload: JSON.stringify({ kind: "video", size: 100, contentType: "", name: "clip.mov" }),
  });
  assert.equal(video.maximumSizeInBytes, BLOG_VIDEO_BYTES);
  assert.equal(video.contentType, "video/quicktime");

  assert.throws(
    () =>
      blogClientPayloadLimits({
        pathname: "a.jpg",
        clientPayload: JSON.stringify({
          kind: "image",
          size: BLOG_IMAGE_BYTES + 1,
          contentType: "image/jpeg",
          name: "a.jpg",
        }),
      }),
    /10 MB/,
  );
  assert.throws(
    () => blogClientPayloadLimits({ pathname: "run.exe", clientPayload: null }),
    /not allowed/,
  );
});

test("picture count unions legacy ids and blob images without double-counting", () => {
  assert.equal(
    blogImageCount({ imageIds: ["a", "b"], images: [{ id: "b" }, { id: "c" }] }),
    3,
  );
  assert.equal(blogImageCount({ imageIds: ["a"] }), 1);
  assert.deepEqual(blogPictures({ imageIds: ["legacy"] }), [
    {
      id: "legacy",
      url: null,
      filename: null,
      contentType: null,
      legacy: true,
    },
  ]);
  const url = "https://abc.public.blob.vercel-storage.com/blog/photo.jpg";
  assert.deepEqual(
    blogPictures({
      imageIds: ["legacy"],
      images: [{ id: "new", url, filename: "photo.jpg", contentType: "image/jpeg" }],
    }).map((picture) => picture.id),
    ["legacy", "new"],
  );
});
