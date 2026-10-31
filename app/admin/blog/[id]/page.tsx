import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteBlogAction } from "@/app/admin/blog/actions";
import BlogForm from "@/components/BlogForm";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import { getBlogById, isBlogId } from "@/lib/blogs";
import { blogPictures, isVercelBlobUrl } from "@/lib/upload-rules";

export const dynamic = "force-dynamic";

export default async function EditBlogPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; t?: string }>;
}) {
  const { id } = await params;
  const { error, t } = await searchParams;
  if (!isBlogId(id)) notFound();

  const blog = await getBlogById(id);
  if (!blog) notFound();

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Edit Blog</h1>
          <p>{blog.title}</p>
        </div>
        <Link href={`/blog/${blog.slug}`} target="_blank" className="btn btn-secondary">
          View
        </Link>
      </div>

      <BlogForm
        key={`${blog.updatedAt.toISOString()}-${error ?? ""}-${t ?? ""}`}
        initialError={error ?? null}
        blog={{
          id: blog.id,
          title: blog.title,
          slug: blog.slug,
          description: blog.description,
          status: blog.status,
          images: blogPictures(blog).map((image) => ({
            id: image.id,
            url: image.url,
            filename: image.filename,
            legacy: image.legacy,
          })),
          videos: (blog.videos ?? []).map((video) => ({
            id: video.id,
            title: video.title,
            url: video.url && isVercelBlobUrl(video.url) ? video.url : null,
            filename: video.filename ?? null,
            legacy: !(video.url && isVercelBlobUrl(video.url)),
          })),
        }}
      />

      <form action={deleteBlogAction} style={{ marginTop: "var(--space-5)" }}>
        <input type="hidden" name="id" value={blog.id} />
        <ConfirmSubmit
          label="Delete"
          message={`Delete "${blog.title}"? This removes the post and its pictures and videos.`}
        />
      </form>
    </>
  );
}
