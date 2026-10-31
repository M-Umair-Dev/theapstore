import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import BlogGallery from "@/components/BlogGallery";
import { getPublishedBlog } from "@/lib/blogs";
import { blogPictures, blogPublicMediaSrc } from "@/lib/upload-rules";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const blog = await getPublishedBlog((await params).slug);
  if (!blog) return {};
  return { title: blog.title, description: blog.description };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const blog = await getPublishedBlog((await params).slug);
  if (!blog) notFound();

  const pictures = blogPictures(blog).map((picture) => ({
    id: picture.id,
    src: blogPublicMediaSrc(picture),
  }));

  return (
    <>
      <Breadcrumbs
        items={[
          { href: "/", label: "Home" },
          { href: "/blog", label: "Blog" },
          { label: blog.title },
        ]}
      />

      <article className="container blog-post">
        <header>
          <h1 className="section-title">{blog.title}</h1>
          <p className="section-lead">{blog.description}</p>
        </header>

        {pictures.length > 0 && (
          <section className="blog-block">
            <h2>Pictures</h2>
            <BlogGallery title={blog.title} pictures={pictures} />
          </section>
        )}

        {(blog.videos ?? []).length > 0 && (
          <section className="blog-block">
            <h2>Videos</h2>
            <div className="blog-videos">
              {(blog.videos ?? []).map((video) => (
                <figure key={video.id}>
                  <figcaption>{video.title}</figcaption>
                  <video
                    controls
                    playsInline
                    preload="metadata"
                    src={blogPublicMediaSrc(video)}
                  />
                </figure>
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
