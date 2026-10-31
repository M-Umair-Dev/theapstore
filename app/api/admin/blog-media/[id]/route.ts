import { currentAdmin } from "@/auth";
import { bytesResponse } from "@/lib/byte-response";
import { getBlogMedia, isBlogId } from "@/lib/blogs";

/** Draft and published bytes for a signed-in admin. Unknown ids and guests are 404. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await currentAdmin())) {
    return new Response("Not found", { status: 404 });
  }

  const { id } = await params;
  if (!isBlogId(id)) return new Response("Not found", { status: 404 });

  const media = await getBlogMedia(id);
  if (!media) return new Response("Not found", { status: 404 });

  const bytes = new Uint8Array(Buffer.from(media.data, "base64"));
  return bytesResponse(request, bytes, media.contentType, "private, no-store");
}
