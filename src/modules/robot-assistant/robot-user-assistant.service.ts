import { injectable } from "tsyringe";
import { AboutBlock } from "../about/about.types";
import { RobotAssistantResponse, RobotAssistantUserSnapshot, RobotAssistantAction } from "./robot-assistant.types";

const normalizePrompt = (value: string | null | undefined) =>
  (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const formatRelativeMoment = (value: string) => {
  const date = new Date(value);
  const deltaInMinutes = Math.round((Date.now() - date.getTime()) / (1000 * 60));

  if (deltaInMinutes <= 1) {
    return "agora mesmo";
  }

  if (deltaInMinutes < 60) {
    return `ha ${deltaInMinutes} min`;
  }

  const deltaInHours = Math.round(deltaInMinutes / 60);

  if (deltaInHours < 24) {
    return `ha ${deltaInHours} h`;
  }

  const deltaInDays = Math.round(deltaInHours / 24);
  return `ha ${deltaInDays} dia${deltaInDays === 1 ? "" : "s"}`;
};

const pageDescriptions: Record<string, string> = {
  about:
    "Voce esta na pagina Sobre mim. Aqui ficam apresentacao, stacks, contexto profissional e os caminhos para contato.",
  home:
    "Voce esta no menu inicial. Daqui o caminho mais util costuma ser entrar em estudos para conteudo ou portfolio para projetos.",
  login:
    "Voce esta na entrada da conta. Se quiser comentar, acompanhar leituras e manter continuidade, este e o passo certo.",
  portfolio:
    "Voce esta no portfolio. Aqui ficam os projetos, o papel desempenhado em cada um e a leitura mais pratica do trabalho.",
  profile:
    "Voce esta no perfil. Aqui fica sua area de conta e continuidade da experiencia autenticada.",
  register:
    "Voce esta no cadastro. Criando conta, voce libera comentarios e continuidade mais pessoal no site.",
  "study-post":
    "Voce esta lendo um estudo. Aqui vale continuar a leitura, pedir um resumo ou seguir para um tema relacionado.",
  studies:
    "Voce esta na area de estudos. Aqui da para filtrar leituras, descobrir novidades e continuar de onde parou.",
};

const buildUserActions = (snapshot: RobotAssistantUserSnapshot): RobotAssistantAction[] => {
  const actions: RobotAssistantAction[] = [];

  if (snapshot.lastStudy?.path) {
    actions.push({
      id: "user-continue-last-study",
      kind: "navigate",
      label: "Continue de onde parei",
      path: snapshot.lastStudy.path,
    });
  }

  actions.push(
    {
      id: "user-recommend",
      kind: "prompt",
      label: "Recomende algo",
      prompt: "O que você me recomenda agora?",
    },
    {
      id: "user-explain-page",
      kind: "prompt",
      label: "Explique esta página",
      prompt: "Explique esta página",
    },
    {
      id: "user-open-studies",
      kind: "navigate",
      label: "Quero ver os estudos",
      path: "/studies",
    },
    {
      id: "user-open-projects",
      kind: "navigate",
      label: "Quero ver os projetos",
      path: "/portfolio",
    }
  );

  return actions.slice(0, 5);
};

const extractContactSignals = (blocks: AboutBlock[]) => {
  const contactBlock = blocks.find((block) => block.type === "contact");
  const contactFormBlock = blocks.find((block) => block.type === "contact-form");

  return {
    hasContactBlock: Boolean(contactBlock),
    hasContactForm: Boolean(contactFormBlock),
  };
};

const detectUserIntent = (prompt: string) => {
  if (!prompt || prompt === "conversar") {
    return "user-overview";
  }

  if (prompt.includes("o que ha de novo") || prompt.includes("novidade")) {
    return "user-whats-new";
  }

  if (prompt.includes("onde eu parei") || prompt.includes("onde parei")) {
    return "user-where-left";
  }

  if (prompt.includes("recomenda") || prompt.includes("vale a pena ver primeiro")) {
    return "user-recommend";
  }

  if (prompt.includes("explique esta pagina") || prompt.includes("explique essa pagina")) {
    return "user-explain-page";
  }

  if (prompt.includes("resuma este post") || prompt.includes("resuma esse post") || prompt.includes("resuma")) {
    return "user-summarize-post";
  }

  if (prompt.includes("projeto")) {
    return "user-projects";
  }

  if (prompt.includes("contato")) {
    return "user-contact";
  }

  return "user-overview";
};

@injectable()
export class RobotUserAssistantService {
  public buildResponse(input: {
    prompt?: string | null;
    snapshot: RobotAssistantUserSnapshot;
  }): RobotAssistantResponse {
    const normalizedPrompt = normalizePrompt(input.prompt);
    const intent = detectUserIntent(normalizedPrompt);
    const responseByIntent = {
      "user-contact": this.buildContactResponse(input.snapshot),
      "user-explain-page": this.buildExplainPageResponse(input.snapshot),
      "user-overview": this.buildOverviewResponse(input.snapshot),
      "user-projects": this.buildProjectsResponse(input.snapshot),
      "user-recommend": this.buildRecommendationResponse(input.snapshot),
      "user-summarize-post": this.buildStudySummaryResponse(input.snapshot),
      "user-whats-new": this.buildWhatsNewResponse(input.snapshot),
      "user-where-left": this.buildWhereLeftResponse(input.snapshot),
    }[intent];

    return {
      actions: buildUserActions(input.snapshot),
      intent,
      profile: "user",
      reply: responseByIntent,
    };
  }

  private buildOverviewResponse(snapshot: RobotAssistantUserSnapshot) {
    if (snapshot.currentStudy) {
      return `Voce esta em um estudo agora. Se quiser, eu posso resumir "${snapshot.currentStudy.title}" antes da leitura ou te levar para um tema relacionado.\n\nO passo mais util neste contexto e continuar a leitura ou abrir outro estudo da mesma linha.`;
    }

    if (snapshot.currentPageKind === "studies" && snapshot.latestStudies[0]) {
      return `Voce esta na area de estudos. A publicacao mais recente e "${snapshot.latestStudies[0].title}".\n\nSe quiser ganhar tempo, eu posso te recomendar uma leitura ou te mandar direto para o estudo mais atual.`;
    }

    if (snapshot.currentPageKind === "portfolio") {
      return `Voce esta no portfolio. Aqui faz mais sentido comparar projetos e depois cruzar isso com a pagina Sobre mim ou com os estudos.\n\nSe quiser, eu posso te mandar para os projetos ou sugerir um estudo que combine com o que voce esta vendo.`;
    }

    return `Posso te guiar pelo site sem repetir o que ja fica nas notificacoes.\n\nSe quiser, eu consigo te dizer onde voce parou, o que ha de novo ou o proximo conteudo que faz mais sentido para voce agora.`;
  }

  private buildWhatsNewResponse(snapshot: RobotAssistantUserSnapshot) {
    const newestStudy = snapshot.latestStudies[0];

    if (!newestStudy) {
      return `Ainda nao apareceu uma publicacao nova o suficiente para eu destacar agora.\n\nO melhor caminho por enquanto e explorar a area de estudos ou portfolio conforme o que voce quer descobrir primeiro.`;
    }

    return `A novidade mais clara agora e "${newestStudy.title}", na categoria ${newestStudy.category}.\n\nSe voce quiser, eu posso te levar direto para essa leitura ou te sugerir algo parecido com base no que voce ja explorou.`;
  }

  private buildWhereLeftResponse(snapshot: RobotAssistantUserSnapshot) {
    if (!snapshot.lastStudy) {
      return `Eu ainda nao tenho um ponto de leitura salvo para retomar.\n\nSe voce abrir um estudo, eu passo a usar esse contexto para te lembrar exatamente de onde continuar.`;
    }

    const progressLabel =
      typeof snapshot.lastStudy.progress === "number"
        ? `${Math.round(snapshot.lastStudy.progress)}% da leitura`
        : "um ponto intermediario da leitura";

    return `Voce parou em "${snapshot.lastStudy.title || snapshot.lastStudy.slug}" por volta de ${progressLabel}, ${formatRelativeMoment(snapshot.lastStudy.lastSeenAt)}.\n\nSe quiser, eu posso te levar de volta para esse estudo agora.`;
  }

  private buildRecommendationResponse(snapshot: RobotAssistantUserSnapshot) {
    if (snapshot.recommendedStudy) {
      return `Com base no que voce explorou ate agora, o proximo conteudo mais promissor e "${snapshot.recommendedStudy.title}".\n\nEle encaixa melhor neste momento porque continua a mesma linha de interesse sem te jogar para um contexto totalmente diferente.`;
    }

    if (snapshot.featuredProjects[0]) {
      return `Se a ideia agora for conhecer melhor o trabalho pratico, eu recomendo abrir o portfolio antes dos estudos.\n\nEle te entrega contexto mais rapido sobre os projetos e facilita decidir se vale seguir para leitura tecnica depois.`;
    }

    return `Neste momento, o melhor proximo passo e entrar na area de estudos.\n\nEla esta mais preparada para te dar continuidade e descoberta do que o restante do site.`;
  }

  private buildExplainPageResponse(snapshot: RobotAssistantUserSnapshot) {
    return (
      pageDescriptions[snapshot.currentPageKind] ||
      `Esta area do site ainda nao tem uma descricao especifica no meu contexto atual.\n\nSe voce quiser, eu posso te levar para estudos, projetos ou contato.`
    );
  }

  private buildStudySummaryResponse(snapshot: RobotAssistantUserSnapshot) {
    const study = snapshot.currentStudy;

    if (!study) {
      return `Para resumir um post com qualidade, eu preciso que voce esteja dentro de uma leitura especifica.\n\nSe abrir um estudo, eu consigo te devolver um resumo enxuto antes de voce entrar no texto completo.`;
    }

    const headings = study.content
      .filter((block) => block.type === "heading")
      .map((block) => String(block.data?.text || "").trim())
      .filter(Boolean)
      .slice(0, 3);
    const headingSnippet = headings.length
      ? ` O eixo principal passa por ${headings.join(", ")}.`
      : "";

    return `"${study.title}" discute ${study.excerpt}.${headingSnippet}\n\nE uma leitura de ${study.readingTime} minutos pensada para aprofundar o tema sem perder objetividade.`;
  }

  private buildProjectsResponse(snapshot: RobotAssistantUserSnapshot) {
    const featuredProject = snapshot.featuredProjects[0];

    if (!featuredProject) {
      return `Ainda nao tenho um projeto destacado para te mostrar agora.\n\nMesmo assim, o caminho certo para explorar essa parte continua sendo o portfolio.`;
    }

    return `Se voce quer conhecer os projetos, o melhor caminho e o portfolio.\n\nComece por "${featuredProject.project_name}", porque ele funciona bem como porta de entrada para entender a linha pratica do trabalho mostrado aqui.`;
  }

  private buildContactResponse(snapshot: RobotAssistantUserSnapshot) {
    const contactSignals = extractContactSignals(snapshot.aboutPage?.blocks || []);

    if (contactSignals.hasContactForm || contactSignals.hasContactBlock) {
      return `O caminho mais direto para contato fica na pagina Sobre mim.\n\nLa voce encontra ${contactSignals.hasContactForm ? "um formulario e os meios diretos de contato" : "os canais de contato"} sem precisar passar por outra area antes.`;
    }

    return `Se voce quiser entrar em contato, eu te levo para a pagina Sobre mim agora.\n\nE o ponto mais coerente do site para isso.`;
  }
}
