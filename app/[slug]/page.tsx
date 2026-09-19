import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import { legalPages } from "@/lib/content";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(legalPages).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const page = legalPages[(await params).slug];
  if (!page) return {};
  return { title: page.title, description: page.intro };
}

export default async function StaticPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = legalPages[slug];
  if (!page) notFound();

  return (
    <>
      <Breadcrumbs
        items={[{ href: "/", label: "Home" }, { label: page.title }]}
      />

      <div className="container prose">
        <h1 className="section-title">{page.title}</h1>
        <p>{page.intro}</p>

        {page.sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}
      </div>
    </>
  );
}
