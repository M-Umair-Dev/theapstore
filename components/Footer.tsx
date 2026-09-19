import Link from "next/link";
import { site } from "@/lib/site";
import { waEnabled, waLink } from "@/lib/whatsapp";

export default function Footer() {
  const whatsapp = waLink(`Hello ${site.name}, I have a question.`);

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="/" className="logo">
              <span className="logo-mark" aria-hidden="true">
                A
              </span>
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
              <a
                href={site.social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
              >
                in
              </a>
              <a
                href={site.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                ig
              </a>
              <a
                href={site.social.x}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X"
              >
                x
              </a>
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
