import BlogForm from "@/components/BlogForm";

export const dynamic = "force-dynamic";

export default function NewBlogPage() {
  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Add New Blog</h1>
          <p>Create a post, then each picture and video uploads on its own.</p>
        </div>
      </div>
      <BlogForm />
    </>
  );
}
