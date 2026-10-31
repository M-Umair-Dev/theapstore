import { bytesResponse } from "@/lib/byte-response";
import { getPublishedBlogMedia, isBlogId } from "@/lib/blogs";

/**
 * Published blog pictures and videos. Draft media is 404 here — admins preview
 * it on `/api/admin/blog-media/[id]`. Range requests let a video element seek.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isBlogId(id)) return new Response("Not found", { status: 404 });

  const media = await getPublishedBlogMedia(id);
  if (!media) return new Response("Not found", { status: 404 });

  const bytes = new Uint8Array(Buffer.from(media.data, "base64"));
  return bytesResponse(
    request,
    bytes,
    media.contentType,
    "public, max-age=60, stale-while-revalidate=300",
  );
}
