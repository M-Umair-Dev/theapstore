import ProductForm from "@/components/ProductForm";

export const dynamic = "force-dynamic";

export default function NewProductPage() {
  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Add Product</h1>
          <p>Create a new item in the catalog.</p>
        </div>
      </div>

      <ProductForm />
    </>
  );
}
