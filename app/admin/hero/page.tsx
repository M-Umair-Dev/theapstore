import HeroPicker from "./HeroPicker";
import { saveHeroAction } from "./actions";
import { startingPrice } from "@/lib/options";
import { formatPrice } from "@/lib/products";
import { fallbackHeroProduct, getHeroSetting, listProducts } from "@/lib/repo";

export const dynamic = "force-dynamic";

type Params = { saved?: string; error?: string };

export default async function AdminHero({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const [sp, products, setting] = await Promise.all([
    searchParams,
    listProducts(),
    getHeroSetting(),
  ]);

  const savedProduct = setting
    ? products.find((product) => product.slug === setting.productSlug)
    : undefined;
  const fallback = fallbackHeroProduct(products);
  const active = savedProduct ?? fallback;

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Hero Section</h1>
          {savedProduct ? (
            <p>
              Active hero product: <strong>{savedProduct.title}</strong> (
              {savedProduct.slug}).
            </p>
          ) : setting && fallback ? (
            <p>
              Saved product <strong>{setting.productSlug}</strong> is no longer
              in the catalogue. The homepage is still using the automatic
              fallback: <strong>{fallback.title}</strong> ({fallback.slug}).
            </p>
          ) : fallback ? (
            <p>
              No hero product has been saved. The homepage is still using the
              automatic fallback: <strong>{fallback.title}</strong> (
              {fallback.slug}).
            </p>
          ) : (
            <p>No products in the catalogue yet.</p>
          )}
        </div>
      </div>

      {sp.saved && (
        <p className="form-success" style={{ marginBottom: "var(--space-5)" }}>
          Hero product saved.
        </p>
      )}
      {sp.error && (
        <p
          className="form-error"
          role="alert"
          style={{ marginBottom: "var(--space-5)" }}
        >
          {sp.error}
        </p>
      )}

      {products.length === 0 || !active ? (
        <div className="admin-panel">
          <p className="hint">Add a product before choosing a hero.</p>
        </div>
      ) : (
        <form action={saveHeroAction} className="admin-form">
          <HeroPicker
            initialSlug={active.slug}
            choices={products.map((product) => ({
              slug: product.slug,
              title: product.title,
              priceLabel: `From ${formatPrice(startingPrice(product))}`,
              hasThumbnail: Boolean(product.cartHeroThumbnailContentType),
              hasImage: Boolean(product.imageContentType),
            }))}
          />
        </form>
      )}
    </>
  );
}
