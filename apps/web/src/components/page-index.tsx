type IndexItem = {
  index: string;
  label: string;
  href: `#${string}`;
};

export function PageIndex({ label, items }: { label: string; items: IndexItem[] }) {
  return (
    <nav className="page-index" aria-label={label}>
      <p>{label}</p>
      <ol>
        {items.map((item) => (
          <li key={item.href}>
            <a href={item.href}>
              <span>{item.index}</span>
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
