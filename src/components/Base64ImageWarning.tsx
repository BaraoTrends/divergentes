import { useMemo, useState } from "react";
import { AlertTriangle, Loader2, UploadCloud } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Base64ImageWarningProps {
  content: string;
  onContentChange: (newContent: string) => void;
}

interface DetectedImage {
  full: string; // full data URI
  mime: string;
  approxKb: number;
}

const BASE64_IMG_REGEX = /data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,([A-Za-z0-9+/=]+)/g;

function detectBase64Images(html: string): DetectedImage[] {
  const found: DetectedImage[] = [];
  const seen = new Set<string>();
  let match: RegExpExecArray | null;
  // reset lastIndex since regex is global
  BASE64_IMG_REGEX.lastIndex = 0;
  while ((match = BASE64_IMG_REGEX.exec(html)) !== null) {
    const full = match[0];
    if (seen.has(full)) continue;
    seen.add(full);
    const mime = `image/${match[1]}`;
    // base64 size ≈ length * 3/4
    const approxKb = Math.round((match[2].length * 0.75) / 1024);
    found.push({ full, mime, approxKb });
  }
  return found;
}

function dataUriToBlob(dataUri: string, mime: string): Blob {
  const base64 = dataUri.split(",")[1] || "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function extFromMime(mime: string): string {
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpg";
  if (mime === "image/svg+xml") return "svg";
  return mime.replace("image/", "");
}

const Base64ImageWarning = ({ content, onContentChange }: Base64ImageWarningProps) => {
  const { toast } = useToast();
  const [migrating, setMigrating] = useState(false);

  const images = useMemo(() => detectBase64Images(content), [content]);
  const totalKb = useMemo(() => images.reduce((sum, i) => sum + i.approxKb, 0), [images]);

  if (images.length === 0) return null;

  const handleMigrate = async () => {
    setMigrating(true);
    let updated = content;
    let success = 0;
    let failed = 0;

    for (const img of images) {
      try {
        const blob = dataUriToBlob(img.full, img.mime);
        const ext = extFromMime(img.mime);
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const filePath = `inline/${fileName}`;

        const { error } = await supabase.storage
          .from("article-images")
          .upload(filePath, blob, { cacheControl: "3600", upsert: false, contentType: img.mime });

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from("article-images")
          .getPublicUrl(filePath);

        // Replace ALL occurrences of this exact data URI
        updated = updated.split(img.full).join(urlData.publicUrl);
        success++;
      } catch (e) {
        console.error("[base64-migrate] failed:", e);
        failed++;
      }
    }

    onContentChange(updated);
    setMigrating(false);

    if (success > 0) {
      toast({
        title: `${success} imagem(ns) migrada(s) para o storage`,
        description: failed > 0 ? `${failed} falharam — verifique o console.` : "HTML reduzido com sucesso.",
      });
    } else {
      toast({
        title: "Falha ao migrar imagens",
        description: "Veja o console para detalhes.",
        variant: "destructive",
      });
    }
  };

  return (
    <Alert variant="destructive" className="border-destructive/50">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between gap-4 flex-wrap">
        <span>
          {images.length} imagem(ns) em base64 detectada(s) — ~{totalKb.toLocaleString("pt-BR")} KB inflando o HTML
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={migrating}
          onClick={handleMigrate}
          className="gap-1"
        >
          {migrating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5" />}
          {migrating ? "Migrando..." : "Migrar para storage"}
        </Button>
      </AlertTitle>
      <AlertDescription className="text-xs mt-1">
        Imagens incorporadas em base64 aumentam o tamanho do HTML (ruim para SEO e velocidade). Clique em "Migrar para storage"
        para fazer upload automático ao bucket <code>article-images</code> e substituir as ocorrências por URLs.
      </AlertDescription>
    </Alert>
  );
};

export default Base64ImageWarning;
