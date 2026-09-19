"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart, type NewLine } from "@/lib/cart";
import { cartMessage, waLink } from "@/lib/whatsapp";
import WhatsAppIcon from "@/components/WhatsAppIcon";

/**
 * Buy Now is the primary action and hands the customer straight to WhatsApp
 * with the product, plan and price already written out. Add to cart stays
 * beside it for people who want to combine several items on the site.
 */
export default function CardActions({
  line,
  disabled,
}: {
  line: NewLine;
  disabled?: boolean;
}) {
  const { add } = useCart();
  const router = useRouter();
  const [added, setAdded] = useState(false);

  const whatsapp = waLink(cartMessage([{ ...line, qty: 1 }], line.price));

  if (disabled) {
    return (
      <div className="card-actions">
        <button type="button" className="btn btn-secondary btn-sm" disabled>
          Coming soon
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
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => {
          add(line);
          setAdded(true);
        }}
      >
        {added ? "Added" : "Add to cart"}
      </button>
      <button
        type="button"
        className="btn btn-dark btn-sm"
        onClick={() => {
          add(line);
          router.push("/order");
        }}
      >
        Order on site
      </button>
    </div>
  );
}
