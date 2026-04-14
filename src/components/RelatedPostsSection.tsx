import type { BlogPost } from "@/lib/content";
import ArticleCard from "@/components/ArticleCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface RelatedPostsSectionProps {
  currentSlug: string;
  currentCategory: string;
  posts: BlogPost[];
}

const getRelatedPosts = (posts: BlogPost[], currentSlug: string, currentCategory: string) => {
  const related = posts
    .filter((post) => post.slug !== currentSlug && post.category === currentCategory)
    .slice(0, 4);

  if (related.length >= 4) {
    return related;
  }

  const fallbackPosts = posts
    .filter(
      (post) =>
        post.slug !== currentSlug &&
        post.category !== currentCategory &&
        !related.some((relatedPost) => relatedPost.slug === post.slug),
    )
    .slice(0, 4 - related.length);

  return [...related, ...fallbackPosts];
};

const RelatedPostsSection = ({ currentSlug, currentCategory, posts }: RelatedPostsSectionProps) => {
  const relatedPosts = getRelatedPosts(posts, currentSlug, currentCategory);

  if (relatedPosts.length === 0) {
    return null;
  }

  return (
    <section className="mt-12 border-t border-border pt-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="font-heading text-xl font-bold text-foreground">Artigos Relacionados</h2>

        {relatedPosts.length > 1 && (
          <div className="flex items-center gap-2 md:hidden">
            <CarouselPrevious className="static size-9 translate-x-0 translate-y-0" />
            <CarouselNext className="static size-9 translate-x-0 translate-y-0" />
          </div>
        )}
      </div>

      <div className="md:hidden">
        <Carousel opts={{ align: "start" }} className="w-full">
          <CarouselContent className="-ml-3">
            {relatedPosts.map((post) => (
              <CarouselItem key={post.slug} className="basis-[88%] pl-3">
                <ArticleCard post={post} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      <div className="hidden grid-cols-1 gap-4 sm:grid-cols-2 md:grid">
        {relatedPosts.slice(0, 2).map((post) => (
          <ArticleCard key={post.slug} post={post} />
        ))}
      </div>
    </section>
  );
};

export default RelatedPostsSection;