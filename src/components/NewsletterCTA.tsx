import { useState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const NewsletterCTA = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast.success("Inscrição realizada com sucesso! 🎉");
    setEmail("");
  };

  return (
    <section className="rounded-lg border bg-card p-6 md:p-8">
      <div className="flex items-start gap-3 mb-4">
        <div className="rounded-full bg-accent p-2.5">
          <Mail className="h-5 w-5 text-accent-foreground" />
        </div>
        <div>
          <h3 className="font-heading font-bold text-foreground text-lg">Receba nossas atualizações</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Conteúdo semanal sobre neurodivergências direto no seu e-mail. Sem spam.
          </p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <Input
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          aria-label="E-mail para newsletter"
          className="flex-1"
        />
        <Button type="submit">Inscrever-se</Button>
      </form>
    </section>
  );
};

export default NewsletterCTA;
