import Link from "next/link";
import { notFound } from "next/navigation";
import ProductForm from "@/components/ProductForm";
import { getProductBySlug } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Edit product</h1>
          <p>{product.title}</p>
        </div>
        <Link
          href={`/product/${product.slug}`}
          target="_blank"
          className="btn btn-secondary"
        >
          View on store
        </Link>
      </div>

      <ProductForm product={product} />
    </>
  );
}
