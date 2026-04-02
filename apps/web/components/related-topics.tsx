import Link from 'next/link';

interface RelatedTopicsProps {
  tags: string[];
  locale: string;
}

export function RelatedTopics({ tags, locale }: RelatedTopicsProps) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <Link
          key={tag}
          href={`/${locale}/questions?tag=${tag}`}
          className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-secondary/60 text-secondary-foreground hover:bg-secondary transition-colors"
        >
          #{tag}
        </Link>
      ))}
    </div>
  );
}
