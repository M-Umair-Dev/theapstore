/**
 * Serves stored bytes. A single `Range: bytes=` header returns 206 so a
 * `<video controls>` element can seek. Anything else it cannot satisfy is 416.
 */

export function bytesResponse(
  request: Request,
  bytes: Uint8Array,
  contentType: string,
  cacheControl: string,
): Response {
  const total = bytes.byteLength;
  const headers = {
    "Content-Type": contentType,
    "Accept-Ranges": "bytes",
    "Cache-Control": cacheControl,
  };

  const range = request.headers.get("range");
  if (!range?.trim()) {
    return new Response(copyBytes(bytes), {
      status: 200,
      headers: { ...headers, "Content-Length": String(total) },
    });
  }

  const match = /^bytes=(\d*)-(\d*)$/i.exec(range.trim());
  if (!match || total === 0) return unsatisfiable(total, headers);

  const startRaw = match[1] ?? "";
  const endRaw = match[2] ?? "";
  if (startRaw === "" && endRaw === "") return unsatisfiable(total, headers);

  let start: number;
  let end: number;

  if (startRaw === "") {
    const suffix = Number(endRaw);
    if (!Number.isInteger(suffix) || suffix <= 0) return unsatisfiable(total, headers);
    start = Math.max(total - suffix, 0);
    end = total - 1;
  } else {
    start = Number(startRaw);
    end = endRaw === "" ? total - 1 : Number(endRaw);
    if (!Number.isInteger(start) || !Number.isInteger(end)) {
      return unsatisfiable(total, headers);
    }
  }

  if (start < 0 || start >= total || end < start) return unsatisfiable(total, headers);

  end = Math.min(end, total - 1);
  const slice = copyBytes(bytes.subarray(start, end + 1));

  return new Response(slice, {
    status: 206,
    headers: {
      ...headers,
      "Content-Length": String(slice.byteLength),
      "Content-Range": `bytes ${start}-${end}/${total}`,
    },
  });
}

/** A fresh ArrayBuffer view, which `Response` accepts. A subarray view does not. */
function copyBytes(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy;
}

function unsatisfiable(
  total: number,
  headers: { "Content-Type": string; "Accept-Ranges": string; "Cache-Control": string },
): Response {
  return new Response(null, {
    status: 416,
    headers: { ...headers, "Content-Range": `bytes */${total}` },
  });
}
