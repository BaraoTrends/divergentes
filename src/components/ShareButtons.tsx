import { MessageCircle, Twitter, Linkedin, Link2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { SITE_URL } from "@/lib/seo";

interface ShareButtonsProps {
  title: string;
  slug: string;
}

const ShareButtons = ({ title, slug }: ShareButtonsProps) => {
  const [copied, setCopied] = useState(false);
  const url = `${SITE_URL}/blog/${slug}`;
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-muted-foreground mr-1">Compartilhar:</span>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 text-[#25D366] border-[#25D366]/30 hover:bg-[#25D366]/10"
        asChild
      >
        <a
          href={`https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Compartilhar no WhatsApp"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="hidden sm:inline">WhatsApp</span>
        </a>
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 text-foreground border-border hover:bg-accent"
        asChild
      >
        <a
          href={`https://x.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Compartilhar no X (Twitter)"
        >
          <Twitter className="h-4 w-4" />
          <span className="hidden sm:inline">X</span>
        </a>
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 text-[#0A66C2] border-[#0A66C2]/30 hover:bg-[#0A66C2]/10"
        asChild
      >
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Compartilhar no LinkedIn"
        >
          <Linkedin className="h-4 w-4" />
          <span className="hidden sm:inline">LinkedIn</span>
        </a>
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={copyLink}
        aria-label="Copiar link"
      >
        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Link2 className="h-4 w-4" />}
        <span className="hidden sm:inline">{copied ? "Copiado!" : "Copiar"}</span>
      </Button>
    </div>
  );
};

export default ShareButtons;
