import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { currentAdmin } from "@/auth";
import { BLOG_IMAGE_TYPES, BLOG_VIDEO_TYPES, blogClientPayloadLimits } from "@/lib/upload-rules";

const TOKEN_ERROR = "uploads need BLOB_READ_WRITE_TOKEN";

/**
 * Browser uploads go straight to Vercel Blob. This route only mints the token.
 * `onBeforeGenerateToken` receives the pathname and clientPayload, not the
 * file's real byte length. The browser rejects oversize files first.
 * `maximumSizeInBytes` is 10 MB for a picture and 50 MB for a video, from the
 * filename and content type. 50 MB is the larger cap.
 * The upload-completed callback has no admin cookie, so this route does not
 * attach the file. The browser does that after `upload()` resolves.
 */
export async function POST(request: Request): Promise<NextResponse> {
  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  try {
    if (body.type === "blob.generate-client-token") {
      if (!(await currentAdmin())) {
        throw new Error("Admin sign-in required.");
      }
      if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
        throw new Error(TOKEN_ERROR);
      }
    }

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!(await currentAdmin())) {
          throw new Error("Admin sign-in required.");
        }
        if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
          throw new Error(TOKEN_ERROR);
        }

        const limits = blogClientPayloadLimits({ pathname, clientPayload });
        return {
          allowedContentTypes: [...BLOG_IMAGE_TYPES, ...BLOG_VIDEO_TYPES],
          maximumSizeInBytes: limits.maximumSizeInBytes,
          addRandomSuffix: true,
        };
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    const safe = message.replace(/vercel_blob_\S+/gi, "[redacted]");
    console.error("blog-upload:", safe);
    const status = safe === "Admin sign-in required." ? 401 : safe === TOKEN_ERROR || safe.includes("BLOB_READ_WRITE_TOKEN") ? 503 : 400;
    const clear = safe.includes("BLOB_READ_WRITE_TOKEN") ? TOKEN_ERROR : safe;
    return NextResponse.json({ error: clear }, { status });
  }
}
