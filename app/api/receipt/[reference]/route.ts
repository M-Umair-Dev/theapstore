import { currentAdmin } from "@/auth";
import { getOrderReceipt } from "@/lib/repo";

/**
 * Serves a payment screenshot. Admin only — a receipt is a customer's banking
 * evidence, so a known order reference must not be enough to read it.
 * Answers 404 rather than 403 so the endpoint doesn't confirm which references
 * exist.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ reference: string }> },
) {
  if (!(await currentAdmin())) {
    return new Response("Not found", { status: 404 });
  }

  const { reference } = await params;
  const receipt = await getOrderReceipt(reference.toUpperCase());

  if (!receipt) {
    return new Response("Not found", { status: 404 });
  }

  const bytes = new Uint8Array(Buffer.from(receipt.data, "base64"));

  return new Response(bytes, {
    headers: {
      "Content-Type": receipt.contentType,
      "Content-Length": String(bytes.byteLength),
      // Private: this must never sit in a shared or CDN cache.
      "Cache-Control": "private, max-age=60",
    },
  });
}
