import { useState } from "react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { generateBreadcrumbSchema } from "@/lib/seo";
import { toast } from "sonner";

const Contato = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Início", url: "/" },
    { name: "Contato", url: "/contato" },
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Mensagem enviada com sucesso! Responderemos em breve.");
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <Layout>
      <SEOHead
        title="Contato"
        description="Entre em contato com a equipe do Neurodivergências. Envie dúvidas, sugestões ou colaborações."
        path="/contato"
        keywords={ROUTE_KEYWORDS["/contato"]}
        schemas={[breadcrumbSchema]}
      />
      <div className="container py-8 md:py-12">
        <Breadcrumbs items={[{ label: "Contato" }]} />

        <div className="max-w-xl">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-2">Contato</h1>
          <p className="text-muted-foreground mb-8">
            Tem alguma dúvida, sugestão ou quer colaborar com o projeto? Preencha o formulário abaixo.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">Nome</label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">E-mail</label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-1.5">Assunto</label>
              <Input id="subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-foreground mb-1.5">Mensagem</label>
              <Textarea id="message" rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
            </div>
            <Button type="submit" className="w-full">Enviar mensagem</Button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default Contato;
