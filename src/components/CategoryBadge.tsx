import { categories } from "@/lib/content";

const CategoryBadge = ({ category }: { category: string }) => {
  const cat = categories.find((c) => c.slug === category);
  if (!cat) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cat.bgClass} text-white`}
    >
      {cat.icon} {cat.shortName}
    </span>
  );
};

export default CategoryBadge;
