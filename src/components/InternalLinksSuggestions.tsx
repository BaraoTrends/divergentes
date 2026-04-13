import { Link } from "react-router-dom";
import { useInternalLinksForArticle } from "@/hooks/useInternalLinks";
import { useArticles } from "@/hooks/useArticles";
import { Link2 } from "lucide-react";

interface Props {
  articleId: string | undefined;
  currentSlug: string;
}

const InternalLinksSuggestions = ({ articleId, currentSlug }: Props) => {
  const { data: links = [] } = useInternalLinksForArticle(articleId);
  const { data: articles = [] } = useArticles({ publishedOnly: true });

  if (!articleId || links.length === 0) return null;

  const articleMap = new Map(articles.map((a) => [a.id, a]));

  // Get target articles linked FROM this article
  const outLinks = links
    .filter((l) => l.source_article_id === articleId)
    .map((l) => {
      const article = articleMap.get(l.target_article_id);
      return article ? { article, anchor: l.anchor_text } : null;
    })
    .filter(Boolean) as { article: NonNullable<ReturnType<typeof articleMap.get>>; anchor: string }[];

  // Also get articles that link TO this article
  const inLinks = links
    .filter((l) => l.target_article_id === articleId)
    .map((l) => {
      const article = articleMap.get(l.source_article_id);
      return article ? { article, anchor: l.anchor_text } : null;
    })
    .filter(Boolean) as { article: NonNullable<ReturnType<typeof articleMap.get>>; anchor: string }[];

  const allLinked = [...new Map([...outLinks, ...inLinks].map((item) => [item.article.id, item])).values()];

  if (allLinked.length === 0) return null;

  return (
    <div className="mt-8 p-4 rounded-lg border bg-accent/20">
      <h3 className="font-heading text-sm font-semibold text-foreground flex items-center gap-1.5 mb-3">
        <Link2 className="h-4 w-4 text-primary" />
        Leia Também
      </h3>
      <ul className="space-y-2">
        {allLinked.slice(0, 4).map((article) => (
          <li key={article!.id}>
            <Link
              to={`/blog/${article!.slug}`}
              className="text-sm text-primary hover:underline flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
              {article!.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default InternalLinksSuggestions;
