# Social logos

Drop the official logo for each account in this folder, named after the
account. The footer picks it up automatically.

| Account | File to add |
| --- | --- |
| WhatsApp | `whatsapp.svg` (or `.png` / `.webp`) |
| Facebook | `facebook.svg` |
| TikTok | `tiktok.svg` |

`.svg` is tried first, then `.png`, then `.webp`. The first file found is used.

## Until a file is added

The footer badge shows `WA`, `FB` or `TT` in the existing bordered square. No
broken image is ever rendered — the file is checked on the server before the
page is sent.

## Getting the assets

Official brand marks belong to their owners. Use the provider's own brand
resource, or the media kit your account provides. Do not take them from a random
icon site; those are frequently an outdated or altered mark.

## Sizing and colour

The badges sit on the **black footer**, in 36px squares. Best results:

- **Transparent background**, roughly square.
- **White or light monochrome** marks read best on the dark badge. Full-colour
  logos work too but can look muddy at 18px.
- Anything between 1:1 and 3:1 aspect ratio. Wider logos shrink to fit 18px of
  height and become hard to read.

## Adding one

1. Save the asset here with the exact name from the table.
2. Restart the dev server — the file list is cached per process.
3. Reload the site and scroll to the footer.
