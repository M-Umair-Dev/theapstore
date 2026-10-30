"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart, type NewLine } from "@/lib/cart";
import { site } from "@/lib/site";
import { waLink } from "@/lib/whatsapp";
import WhatsAppIcon from "@/components/WhatsAppIcon";

/**
 * Buy Now is the primary action and hands the customer straight to WhatsApp
 * naming the product, so the conversation starts with something to answer.
 * Add to cart stays beside it for people who want to combine several items.
 *
 * `chooseHref` is set on any product the customer has to choose something for
 * — an option matrix or several plans. Both site buttons are then replaced by
 * one link to the selectors, so a price the customer never picked can never
 * reach the cart.
 */
export default function CardActions({
  line,
  disabled,
  chooseHref,
}: {
  line: NewLine;
  disabled?: boolean;
  chooseHref?: string;
}) {
  const { add } = useCart();
  const router = useRouter();
  const [added, setAdded] = useState(false);

  // Card-only message, the same for every product. The cart and checkout build
  // their own lines through cartMessage, so they are untouched by this.
  const whatsapp = waLink(
    `Hello ${site.name}, I would like to buy the ${line.title} subscription. Please send the details.`,
  );

  if (disabled) {
    return (
      <div className="card-actions">
        <button type="button" className="btn btn-secondary btn-sm" disabled>
          Coming Soon
        </button>
      </div>
    );
  }

  return (
    <div className="card-actions">
      {whatsapp && (
        <a
          className="btn btn-whatsapp btn-sm"
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
        >
          <WhatsAppIcon />
          Buy on WhatsApp
        </a>
      )}

      {chooseHref ? (
        <Link href={chooseHref} className="btn btn-dark btn-sm">
          Choose Options
        </Link>
      ) : (
        <>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              add(line);
              setAdded(true);
            }}
          >
            {added ? "Added to Cart" : "Add to Cart"}
          </button>
          <button
            type="button"
            className="btn btn-dark btn-sm"
            onClick={() => {
              add(line);
              router.push("/order");
            }}
          >
            Order on Site
          </button>
        </>
      )}
    </div>
  );
}
