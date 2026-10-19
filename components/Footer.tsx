import Link from "next/link";
import Logo from "@/components/Logo";
import type { SocialId } from "@/lib/social-logos";
import { site } from "@/lib/site";
import { waEnabled, waLink } from "@/lib/whatsapp";

/**
 * A footer social badge. Uses the brand's own asset when one has been placed
 * in public/social/, and the account's letters when not — never a drawn
 * imitation of someone else's mark. The anchor carries the name, so the image
 * is decorative.
 */
function SocialBadge({
  label,
  href,
  logo,
  mark,
}: {
  label: string;
  href: string;
  logo: string | null;
  mark: string;
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="" className="social-logo" />
      ) : (
        mark
      )}
    </a>
  );
}

/**
 * The logo paths are resolved by the server layout and passed down, because
 * this component is rendered inside a client tree and the lookup reads the
 * filesystem.
 */
export default function Footer({
  socialLogos,
}: {
  socialLogos: Record<SocialId, string | null>;
}) {
  const whatsapp = waLink(`Hello ${site.name}, I have a question.`);
  const logos = socialLogos;

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="/" className="logo">
              <Logo />
              <span>
                <span className="logo-name">{site.name}</span>
                <span className="logo-sub">{site.tagline}</span>
              </span>
            </Link>
            <p>
              {site.description} Serving customers since {site.since}.
            </p>
            <div className="footer-contact">
              <a href={`mailto:${site.email}`}>{site.email}</a>
              {waEnabled && whatsapp && (
                <a href={whatsapp} target="_blank" rel="noopener noreferrer">
                  WhatsApp us
                </a>
              )}
            </div>
            <div className="footer-social">
              {waEnabled && whatsapp && (
                <SocialBadge
                  label="WhatsApp"
                  href={whatsapp}
                  logo={logos.whatsapp}
                  mark="WA"
                />
              )}
              <SocialBadge
                label="Facebook"
                href={site.social.facebook}
                logo={logos.facebook}
                mark="FB"
              />
              <SocialBadge
                label="TikTok"
                href={site.social.tiktok}
                logo={logos.tiktok}
                mark="TT"
              />
            </div>
          </div>

          {site.footer.map((col) => (
            <div className="footer-col" key={col.title}>
              <h3>{col.title}</h3>
              <ul>
                {col.links.map((link) => (
                  <li key={`${col.title}-${link.href}`}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
          <p>
            {site.name} is an independent digital store. Product names, logos and
            trademarks belong to their respective owners and are used only to
            describe the services offered.
          </p>
        </div>
      </div>
    </footer>
  );
}
