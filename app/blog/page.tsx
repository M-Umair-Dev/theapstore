import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { listPublishedBlogs } from "@/lib/blogs";
import { blogPictures, blogPublicMediaSrc } from "@/lib/upload-rules";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Guides and plain-English explainers about the subscriptions we sell.",
};

export default async function BlogPage() {
  const blogs = await listPublishedBlogs();

  return (
    <>
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Blog" }]} />

      <div className="container" style={{ paddingTop: "var(--space-6)" }}>
        <h1 className="section-title">Blog</h1>
        <p className="section-lead">
          Guides and explainers about the subscriptions and tools we sell —
          written to answer the questions we get before an order.
        </p>
      </div>

      <div className="container" style={{ paddingBlock: "var(--space-7) var(--space-8)" }}>
        {blogs.length === 0 ? (
          <p className="section-lead">No posts are published yet. Check back soon.</p>
        ) : (
          <div className="grid grid-3">
            {blogs.map((blog) => {
              const cover = blogPictures(blog)[0];
              return (
                <article className="card blog-card" key={blog.id}>
                  {cover && (
                    <div className="card-media blog-cover">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={blogPublicMediaSrc(cover)} alt={blog.title} />
                    </div>
                  )}
                  <div className="card-body">
                    <h2 className="card-title">
                      <Link href={`/blog/${blog.slug}`}>{blog.title}</Link>
                    </h2>
                    <p className="card-tag">{blog.description}</p>
                    <Link href={`/blog/${blog.slug}`} className="btn btn-primary btn-sm">
                      Watch Details
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <section className="section dark cta-band">
        <div className="container">
          <h2>Have a Question We Have Not Written About?</h2>
          <p>Send it over and it may become the next post — you get an answer either way.</p>
          <div className="hero-actions">
            <Link href="/contact" className="btn btn-primary">
              Ask a Question
            </Link>
            <Link href="/shop" className="btn btn-secondary">
              Browse the Shop
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
