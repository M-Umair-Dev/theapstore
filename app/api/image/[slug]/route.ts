import { getProductImage } from "@/lib/repo";

/** Serves an uploaded product image out of MongoDB. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const image = await getProductImage(slug);

  if (!image) {
    return new Response("Not found", { status: 404 });
  }

  const bytes = new Uint8Array(Buffer.from(image.data, "base64"));

  return new Response(bytes, {
    headers: {
      "Content-Type": image.contentType,
      "Content-Length": String(bytes.byteLength),
      // Short cache so a replaced image shows up quickly, but repeat views
      // within a page still hit the cache.
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
    },
  });
}
