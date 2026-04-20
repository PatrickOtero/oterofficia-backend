import { randomUUID } from "crypto";
import { AboutBlock, UpsertAboutPageInput } from "./about.types";

export const ABOUT_PAGE_ID = "main-about-page";

const createBlock = (type: AboutBlock["type"], data: AboutBlock["data"]): AboutBlock => ({
  data,
  id: randomUUID(),
  type,
});

export const createDefaultAboutPageInput = (): UpsertAboutPageInput => ({
  blocks: [
    createBlock("hero", {
      availability: "Aberto a oportunidades júnior e estágio",
      eyebrow: "Sobre mim",
      highlights: [
        "Node.js e TypeScript",
        "React e interfaces focadas em produto",
        "Arquitetura e modelagem de domínio",
      ],
      imageAlt: "Foto de Patrick Otero",
      imageUrl: "",
      location: "Rio de Janeiro, Brasil",
      primaryCtaLabel: "Ver portfólio",
      primaryCtaUrl: "/portfolio",
      secondaryCtaLabel: "Ler estudos",
      secondaryCtaUrl: "/studies",
      subtitle: "Desenvolvedor de software com foco em clareza técnica, utilidade real e boa experiência.",
      summary:
        "Construo aplicações com atenção à regra de negócio, arquitetura consistente e interfaces que comunicam valor sem depender de excesso de texto.",
      title: "Patrick Otero",
    }),
    createBlock("text", {
      body:
        "Tenho interesse especial por software que precisa decidir com consistência, organizar informação com clareza e entregar experiência cuidadosa para quem usa. Busco projetos em que engenharia, contexto de negócio e responsabilidade técnica caminham juntos.\n\nNos meus estudos e projetos, gosto de explorar arquitetura, modelagem de domínio, interfaces ricas e sistemas com comportamento previsível.",
      title: "Como penso software",
      variant: "spotlight",
    }),
    createBlock("stack", {
      description: "Tecnologias e ferramentas com as quais venho construindo projetos e estudos.",
      groups: [
        {
          items: ["Node.js", "TypeScript", "Express", "TypeORM", "PostgreSQL", "Jest"],
          title: "Back-end",
        },
        {
          items: ["React", "React Router", "Styled Components", "Context API", "Axios"],
          title: "Front-end",
        },
        {
          items: ["Docker", "Cloudflare R2", "Swagger", "Nodemailer", "Git"],
          title: "Infra e ferramentas",
        },
      ],
      title: "Stacks e ferramentas",
    }),
    createBlock("social", {
      description: "Canais públicos para acompanhar meus projetos e entrar em contato.",
      items: [
        {
          handle: "github.com/PatrickOtero",
          label: "GitHub",
          url: "https://github.com/PatrickOtero",
        },
        {
          handle: "linkedin.com/in/patrick-da-rocha-otero",
          label: "LinkedIn",
          url: "https://www.linkedin.com/in/patrick-da-rocha-otero/",
        },
        {
          handle: "telegram.me/PatrickOtero",
          label: "Telegram",
          url: "https://telegram.me/PatrickOtero",
        },
        {
          handle: "wa.me/5521983036378",
          label: "WhatsApp",
          url: "https://wa.me/5521983036378",
        },
      ],
      title: "Redes e canais",
    }),
    createBlock("contact", {
      description: "Informações diretas para conversas profissionais.",
      items: [
        {
          label: "E-mail",
          url: "mailto:patrick.rocha.otero@gmail.com",
          value: "patrick.rocha.otero@gmail.com",
        },
        {
          label: "Localizacao",
          value: "Rio de Janeiro, Brasil",
        },
      ],
      title: "Contato",
    }),
    createBlock("contact-form", {
      description: "Se preferir, envie uma mensagem diretamente por aqui.",
      emailLabel: "Seu e-mail",
      messageLabel: "Mensagem",
      nameLabel: "Seu nome",
      subjectLabel: "Assunto",
      submitLabel: "Enviar mensagem",
      successMessage: "Mensagem enviada com sucesso.",
      title: "Mensagem direta",
    }),
  ],
  seoDescription:
    "Página sobre Patrick Otero com resumo profissional, stacks, redes sociais, contatos e formulário direto.",
  seoTitle: "Sobre Patrick Otero | Oterofficia",
});
