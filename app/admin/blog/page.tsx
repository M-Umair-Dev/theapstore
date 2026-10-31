import Link from "next/link";
import { deleteBlogAction } from "@/app/admin/blog/actions";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import { listBlogs } from "@/lib/blogs";
import { blogImageCount, blogVideoCount } from "@/lib/upload-rules";

export const dynamic = "force-dynamic";

const formatDate = (value: Date) =>
  value.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default async function AdminBlogList({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string; error?: string }>;
}) {
  const { saved, deleted, error } = await searchParams;
  const blogs = await listBlogs();

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Blog</h1>
          <p>{blogs.length} posts.</p>
        </div>
        <Link href="/admin/blog/new" className="btn btn-primary">
          Add New Blog
        </Link>
      </div>

      {saved && (
        <p className="form-success" style={{ marginBottom: "var(--space-5)" }}>
          Saved <strong>{saved}</strong>.
        </p>
      )}
      {deleted && (
        <p className="form-success" style={{ marginBottom: "var(--space-5)" }}>
          Blog post deleted.
        </p>
      )}
      {error && (
        <p className="form-error" style={{ marginBottom: "var(--space-5)" }}>
          {error}
        </p>
      )}

      <div className="admin-panel">
        {blogs.length === 0 ? (
          <p className="hint">No blog posts yet. Add one to show it on the storefront.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Pictures</th>
                  <th>Videos</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {blogs.map((blog) => (
                  <tr key={blog.id}>
                    <td>{blog.title}</td>
                    <td>
                      <span className="cell-clip" title={blog.description}>
                        {blog.description}
                      </span>
                    </td>
                    <td>{blogImageCount(blog)}</td>
                    <td>{blogVideoCount(blog)}</td>
                    <td className="nowrap">{formatDate(blog.createdAt)}</td>
                    <td>
                      {blog.status === "published" ? (
                        <span className="pill pill-ok">Published</span>
                      ) : (
                        <>
                          <span className="pill pill-off">Draft</span>
                          <span className="muted" style={{ display: "block", marginTop: 4 }}>
                            Hidden on the store
                          </span>
                        </>
                      )}
                    </td>
                    <td>
                      <div className="table-actions">
                        <Link href={`/admin/blog/${blog.id}`} className="link-btn">
                          Edit
                        </Link>
                        <form action={deleteBlogAction}>
                          <input type="hidden" name="id" value={blog.id} />
                          <ConfirmSubmit
                            label="Delete"
                            message={`Delete "${blog.title}"? This removes the post and its pictures and videos.`}
                          />
                        </form>
                        <Link
                          href={`/blog/${blog.slug}`}
                          target="_blank"
                          className="link-btn"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
