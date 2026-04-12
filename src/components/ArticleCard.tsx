import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import type { BlogPost } from "@/lib/content";
import { blogImages } from "@/lib/images";
import CategoryBadge from "./CategoryBadge";

const ArticleCard = ({ post }: { post: BlogPost }) => {
  // Use post.image (which may come from DB image_url) or fall back to static blogImages
  const coverImage = post.image && post.image !== "/placeholder.svg" ? post.image : blogImages[post.slug];

  return (
    <article className="group rounded-lg border bg-card overflow-hidden transition-shadow hover:shadow-md">
      <Link to={`/blog/${post.slug}`} className="block">
        {coverImage && (
          <div className="aspect-video overflow-hidden">
            <img
              src={coverImage}
              alt={post.title}
              width={600}
              height={338}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <CategoryBadge category={post.category} />
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {post.readingTime} min de leitura
            </span>
          </div>
          <h3 className="font-heading font-bold text-foreground text-lg leading-snug mb-2 group-hover:text-primary transition-colors">
            {post.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
            {post.excerpt}
          </p>
          <time
            dateTime={post.datePublished}
            className="mt-3 block text-xs text-muted-foreground"
          >
            {new Date(post.datePublished).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
          </time>
        </div>
      </Link>
    </article>
  );
};

export default ArticleCard;
