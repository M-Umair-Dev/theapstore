import Link from "next/link";

export default function Breadcrumbs({
  items,
}: {
  items: { href?: string; label: string }[];
}) {
  return (
    <nav className="container breadcrumbs" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`}>
          {item.href ? <Link href={item.href}>{item.label}</Link> : (
            <span aria-current="page">{item.label}</span>
          )}
          {i < items.length - 1 && " /"}
        </span>
      ))}
    </nav>
  );
}
