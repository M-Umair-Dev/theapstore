# Payment method logos

Drop the official logo for each payment method in this folder, named after the
method id. The checkout picks it up automatically — no code change, no restart
of anything but the dev server.

| Method | File to add |
| --- | --- |
| EasyPaisa | `easypaisa.svg` (or `.png` / `.webp`) |
| JazzCash | `jazzcash.svg` |
| SadaPay | `sadapay.svg` |
| NayaPay | `nayapay.svg` |
| Bank Transfer | `bank_transfer.svg` — optional, and only if it is one specific bank |

`.svg` is tried first, then `.png`, then `.webp`. The first file found is used.

## Why these files are not already here

Official brand marks are the property of their owners. They were not added
automatically because this project has no way to verify that a given file is the
real, current, correctly-coloured asset, and shipping an approximation or the
wrong company's mark is worse than shipping none. Source them from the provider
directly — their website footer, press or brand page, or a merchant kit they
issue when you open a business account. That is also the only route that gives
you permission to display them.

## Until a file is added

The checkout shows the brand's initials in a plain chip — `EP`, `JC`, `SP`,
`NP` — beside the method name. Bank Transfer keeps a building icon. Nothing
breaks and no broken image is rendered: the file is checked for on the server
before the page is sent.

## Adding one

1. Save the asset here with the exact name in the table above.
2. Reload the checkout. The chip is replaced by the logo.

If you add a file and still see the chip, the name does not match. Names are
lowercase with underscores — `bank_transfer`, not `Bank Transfer`.

## Sizing

Logos are rendered at a 20px height inside a rounded chip and are never
stretched: `object-fit: contain` keeps the aspect ratio, so a wide wordmark and
a square symbol both sit correctly. Prefer assets with a transparent background,
and roughly square or 3:1 at most — anything wider will look small next to the
method name.
