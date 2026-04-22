import { injectable } from "tsyringe";
import {
  RobotAssistantAction,
  RobotAssistantAdminSnapshot,
  RobotAssistantResponse,
  RobotAssistantRouteUsage,
} from "./robot-assistant.types";

const normalizePrompt = (value: string | null | undefined) =>
  (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const routeLabelMap: Record<string, string> = {
  about: "Sobre mim",
  admin: "painel administrativo",
  "forgot-password": "recuperacao de senha",
  home: "menu inicial",
  login: "login",
  portfolio: "portfolio",
  profile: "perfil",
  register: "cadastro",
  "study-post": "leituras individuais",
  studies: "area de estudos",
};

const describeRoute = (path: string) => routeLabelMap[path] ?? path;

const toPercent = (value: number) => `${Math.round(value * 100)}%`;

const buildAdminActions = (): RobotAssistantAction[] => [
  { id: "admin-summary-day", kind: "prompt", label: "Resumo do dia", prompt: "O que aconteceu hoje?" },
  { id: "admin-bottlenecks", kind: "prompt", label: "Gargalos atuais", prompt: "Onde estou perdendo usuários?" },
  {
    id: "admin-content-highlight",
    kind: "prompt",
    label: "Conteudo em destaque",
    prompt: "Qual conteúdo está performando melhor?",
  },
  {
    id: "admin-user-behavior",
    kind: "prompt",
    label: "Comportamento dos usuários",
    prompt: "Como os usuários estão se comportando?",
  },
  {
    id: "admin-anomalies",
    kind: "prompt",
    label: "Anomalias recentes",
    prompt: "O que merece minha atenção agora?",
  },
];

const computeDelta = (current: number, previous: number) => {
  if (!previous) {
    return current > 0 ? 1 : 0;
  }

  return (current - previous) / previous;
};

const findMainRoute = (routes: RobotAssistantRouteUsage[]) =>
  routes.find((route) => ["studies", "study-post", "portfolio", "about", "home"].includes(route.path)) ||
  routes[0] ||
  null;

const findLeastExploredRoute = (routes: RobotAssistantRouteUsage[]) =>
  [...routes]
    .filter((route) => ["portfolio", "about", "studies", "study-post"].includes(route.path))
    .sort((left, right) => left.visitors - right.visitors)[0] || null;

const detectAdminIntent = (prompt: string) => {
  if (!prompt || prompt === "conversar") {
    return "admin-overview";
  }

  if (prompt.includes("hoje")) {
    return "admin-today";
  }

  if (prompt.includes("ultima semana") || prompt.includes("última semana") || prompt.includes("semana")) {
    return "admin-week";
  }

  if (prompt.includes("perdendo usuarios") || prompt.includes("gargalo") || prompt.includes("friccao")) {
    return "admin-friction";
  }

  if (prompt.includes("conteudo") || prompt.includes("performando melhor") || prompt.includes("melhor")) {
    return "admin-content";
  }

  if (prompt.includes("navegacao")) {
    return "admin-navigation";
  }

  if (prompt.includes("comportamento")) {
    return "admin-behavior";
  }

  if (prompt.includes("atencao") || prompt.includes("anomalia") || prompt.includes("atenção")) {
    return "admin-attention";
  }

  return "admin-overview";
};

@injectable()
export class RobotAdminAssistantService {
  public buildResponse(input: {
    prompt?: string | null;
    snapshot: RobotAssistantAdminSnapshot;
  }): RobotAssistantResponse {
    const normalizedPrompt = normalizePrompt(input.prompt);
    const intent = detectAdminIntent(normalizedPrompt);
    const responseByIntent = {
      "admin-attention": this.buildAttentionResponse(input.snapshot),
      "admin-behavior": this.buildBehaviorResponse(input.snapshot),
      "admin-content": this.buildContentResponse(input.snapshot),
      "admin-friction": this.buildFrictionResponse(input.snapshot),
      "admin-navigation": this.buildNavigationResponse(input.snapshot),
      "admin-overview": this.buildOverviewResponse(input.snapshot),
      "admin-today": this.buildTodayResponse(input.snapshot),
      "admin-week": this.buildWeekResponse(input.snapshot),
    }[intent];

    return {
      actions: buildAdminActions(),
      intent,
      profile: "admin",
      reply: responseByIntent,
    };
  }

  private buildOverviewResponse(snapshot: RobotAssistantAdminSnapshot) {
    const mainRoute = findMainRoute(snapshot.routeUsage);
    const leastExploredRoute = findLeastExploredRoute(snapshot.routeUsage);
    const bestContent = [...snapshot.contentPerformance].sort(
      (left, right) => right.engagementScore - left.engagementScore
    )[0];
    const weakestFriction = [...snapshot.authFriction].sort(
      (left, right) => left.completionRate - right.completionRate
    )[0];

    const summary = mainRoute
      ? `Hoje ${describeRoute(mainRoute.path)} concentrou a maior parte do interesse, com ${mainRoute.visitors} visitantes distintos circulando por essa area.`
      : `Hoje o radar ainda esta com pouco volume para cravar um eixo dominante de navegacao.`;
    const insight = weakestFriction && weakestFriction.attempts > 0
      ? `${describeRoute(weakestFriction.path)} continua sendo o ponto mais sensivel do fluxo, com conversao estimada em ${toPercent(weakestFriction.completionRate)}. ${bestContent ? `Ao mesmo tempo, "${bestContent.title}" e o conteudo mais qualificado do momento.` : ""}`
      : bestContent
        ? `"${bestContent.title}" esta puxando a leitura mais qualificada agora, enquanto ${leastExploredRoute ? describeRoute(leastExploredRoute.path) : "outras areas do site"} segue abaixo do potencial.`
        : `O comportamento geral ainda esta mais espalhado do que concentrado em um fluxo claro.`;
    const recommendation = weakestFriction && weakestFriction.attempts > 0
      ? `Minha recomendacao pratica e reduzir a friccao entre ${describeRoute(mainRoute?.path || "o conteudo")} e ${describeRoute(weakestFriction.path)}, porque e ali que parte da atencao esta se perdendo.`
      : `Minha recomendacao pratica e empurrar mais trafego qualificado para ${leastExploredRoute ? describeRoute(leastExploredRoute.path) : "as areas menos exploradas"}, usando o melhor conteudo atual como ponte.`;

    return `${summary}\n\n${insight}\n\n${recommendation}`;
  }

  private buildTodayResponse(snapshot: RobotAssistantAdminSnapshot) {
    const comparison = snapshot.windowComparison24h;
    const visitorDelta = computeDelta(
      comparison.current.uniqueVisitors,
      comparison.previous.uniqueVisitors
    );
    const readsDelta = computeDelta(comparison.current.reads, comparison.previous.reads);
    const mainRoute = findMainRoute(snapshot.routeUsage);
    const anomalyTone =
      visitorDelta < -0.18 || readsDelta < -0.18
        ? "O movimento caiu em relacao ao bloco anterior."
        : visitorDelta > 0.18 || readsDelta > 0.18
          ? "O movimento acelerou em relacao ao bloco anterior."
          : "O movimento ficou relativamente estavel em relacao ao bloco anterior.";
    const summary = `Nas ultimas 24 horas, o site recebeu ${comparison.current.uniqueVisitors} visitantes unicos e gerou ${comparison.current.reads} leituras registradas. ${anomalyTone}`;
    const insight = mainRoute
      ? `${describeRoute(mainRoute.path)} segue como principal porta de interesse, enquanto ${comparison.current.likes} interacoes de afinidade e ${comparison.current.comments} comentarios ajudam a separar leitura superficial de interesse real.`
      : `Ainda nao apareceu um fluxo forte o suficiente para dominar a navegacao do dia.`;
    const recommendation = `Minha recomendacao pratica e observar de perto ${snapshot.authFriction[0] ? describeRoute(snapshot.authFriction[0].path) : "o fluxo de entrada"} nas proximas horas e usar ${mainRoute ? describeRoute(mainRoute.path) : "a area mais visitada"} como alavanca para o restante do site.`;

    return `${summary}\n\n${insight}\n\n${recommendation}`;
  }

  private buildWeekResponse(snapshot: RobotAssistantAdminSnapshot) {
    const topTransition = snapshot.routeTransitions[0];
    const leastExploredRoute = findLeastExploredRoute(snapshot.routeUsage);
    const bestContent = [...snapshot.contentPerformance].sort(
      (left, right) => right.engagementScore - left.engagementScore
    )[0];
    const summary = `Na ultima semana, o site acumulou ${snapshot.visitorSummary7d.visitorsSince} visitantes distintos em ${snapshot.visitorSummary7d.entriesSince} entradas rastreadas.`;
    const insight = topTransition
      ? `O caminho mais repetido foi de ${describeRoute(topTransition.fromPath)} para ${describeRoute(topTransition.toPath)}, o que indica um eixo de navegacao mais forte do que o restante. ${bestContent ? `"${bestContent.title}" aparece como a melhor ancora de retencao desse periodo.` : ""}`
      : `${bestContent ? `"${bestContent.title}" lidera a retencao do periodo, mas o restante dos fluxos ainda esta pulverizado.` : "Ainda falta densidade para identificar um fluxo dominante com seguranca."}`;
    const recommendation = `Minha recomendacao pratica e reforcar a passagem para ${leastExploredRoute ? describeRoute(leastExploredRoute.path) : "as areas menos exploradas"}, porque hoje ela esta ficando fora da trilha principal dos usuarios.`;

    return `${summary}\n\n${insight}\n\n${recommendation}`;
  }

  private buildFrictionResponse(snapshot: RobotAssistantAdminSnapshot) {
    const weakestFriction = [...snapshot.authFriction].sort(
      (left, right) => left.completionRate - right.completionRate
    )[0];
    const mainDropOff = snapshot.dropOffs[0];
    const summary = weakestFriction
      ? `${describeRoute(weakestFriction.path)} e o ponto mais sensivel do fluxo hoje, com ${weakestFriction.attempts} tentativas rastreadas e conversao estimada em ${toPercent(weakestFriction.completionRate)}.`
      : `Ainda nao houve volume suficiente em login ou cadastro para medir friccao de forma confiavel.`;
    const insight = mainDropOff
      ? `${describeRoute(mainDropOff.path)} tambem aparece como uma das principais saidas de sessao, o que sugere quebra entre curiosidade e continuidade.`
      : `O gargalo principal continua concentrado na entrada, nao no restante da navegacao.`;
    const recommendation = `Minha recomendacao pratica e simplificar o salto entre leitura e autenticacao, especialmente se o usuario vier de estudos ou de um post individual.`;

    return `${summary}\n\n${insight}\n\n${recommendation}`;
  }

  private buildContentResponse(snapshot: RobotAssistantAdminSnapshot) {
    const bestContent = [...snapshot.contentPerformance].sort(
      (left, right) => right.engagementScore - left.engagementScore
    )[0];
    const secondContent = [...snapshot.contentPerformance]
      .sort((left, right) => right.engagementScore - left.engagementScore)[1];
    const summary = bestContent
      ? `"${bestContent.title}" e o conteudo mais forte agora, combinando ${bestContent.views} leituras com um indice de resposta acima da media.`
      : `Ainda nao existe conteudo com sinal suficiente para destacar como lider.`;
    const insight = secondContent
      ? `"${secondContent.title}" aparece logo atras, mas com intensidade menor, o que mostra que o interesse ainda esta concentrado em poucos estudos.`
      : `O consumo ainda esta concentrado em um conjunto pequeno de leituras.`;
    const recommendation = bestContent
      ? `Minha recomendacao pratica e usar "${bestContent.title}" como ponte para outros estudos da mesma categoria e puxar o usuario dali para cadastro, portfolio ou contato.`
      : `Minha recomendacao pratica e fortalecer a distribuicao das leituras com melhor taxa de resposta antes de ampliar o volume de conteudo.`;

    return `${summary}\n\n${insight}\n\n${recommendation}`;
  }

  private buildNavigationResponse(snapshot: RobotAssistantAdminSnapshot) {
    const mainRoute = findMainRoute(snapshot.routeUsage);
    const topTransition = snapshot.routeTransitions[0];
    const mainDropOff = snapshot.dropOffs[0];
    const summary = mainRoute
      ? `${describeRoute(mainRoute.path)} e hoje o ponto de entrada mais forte do site.`
      : `Ainda nao apareceu um ponto de entrada dominante na navegacao recente.`;
    const insight = topTransition
      ? `O caminho mais usado foi de ${describeRoute(topTransition.fromPath)} para ${describeRoute(topTransition.toPath)}, enquanto ${mainDropOff ? describeRoute(mainDropOff.path) : "alguns trechos"} concentram as principais saidas.`
      : `A navegacao esta mais fragmentada do que encadeada, com poucos caminhos repetidos.`;
    const recommendation = `Minha recomendacao pratica e reforcar as transicoes entre as areas que ja recebem atencao e as paginas menos visitadas, em vez de tentar criar novos caminhos do zero.`;

    return `${summary}\n\n${insight}\n\n${recommendation}`;
  }

  private buildBehaviorResponse(snapshot: RobotAssistantAdminSnapshot) {
    const mostEngagedUser = snapshot.analytics.topUsers[0];
    const topReader = snapshot.analytics.topReaders[0];
    const summary = mostEngagedUser
      ? `${mostEngagedUser.name} lidera a interacao recente, enquanto ${topReader ? topReader.name : "os leitores mais ativos"} sustenta o consumo de conteudo.`
      : `Ainda nao ha densidade suficiente para destacar um padrao forte de comportamento por usuario.`;
    const insight = `No mix atual, leituras representam ${snapshot.analytics.overview.totalReads} eventos acumulados, mas a distancia entre leitura e resposta ainda e o principal filtro de qualidade.`;
    const recommendation = `Minha recomendacao pratica e observar quem le muito mas quase nao avanca para comentario, curtida ou contato, porque e ali que pode existir interesse sem conversao.`;

    return `${summary}\n\n${insight}\n\n${recommendation}`;
  }

  private buildAttentionResponse(snapshot: RobotAssistantAdminSnapshot) {
    const comparison = snapshot.windowComparison24h;
    const visitorDelta = computeDelta(
      comparison.current.uniqueVisitors,
      comparison.previous.uniqueVisitors
    );
    const readsDelta = computeDelta(comparison.current.reads, comparison.previous.reads);
    const weakestFriction = [...snapshot.authFriction].sort(
      (left, right) => left.completionRate - right.completionRate
    )[0];

    if (visitorDelta < -0.25 || readsDelta < -0.25) {
      return `O movimento saiu do padrao nas ultimas 24 horas, com queda perceptivel de visitas ou leituras em relacao ao bloco anterior.\n\nO principal insight e que o consumo caiu antes de virar interacao, entao o problema parece estar mais na entrada ou na descoberta do que no conteudo em si.\n\nMinha recomendacao pratica e revisar imediatamente os caminhos que levam para estudos, login e cadastro, porque qualquer friccao ali agora esta custando atencao real.`;
    }

    if (weakestFriction && weakestFriction.attempts > 0 && weakestFriction.completionRate < 0.35) {
      return `O que mais merece atencao agora e o atrito no ${describeRoute(weakestFriction.path)}.\n\nO principal insight e que o conteudo esta conseguindo puxar interesse, mas parte da energia morre antes da autenticacao se completar.\n\nMinha recomendacao pratica e simplificar esse fluxo antes de mexer no resto, porque ele esta segurando a conversao do que ja funciona.`;
    }

    return `Nao apareceu nenhuma anomalia grave fora do padrao recente.\n\nO principal insight e que o site esta concentrando valor em poucas leituras fortes, enquanto algumas areas seguem subexploradas.\n\nMinha recomendacao pratica e usar o melhor conteudo atual para redistribuir atencao e testar transicoes mais fortes para portfolio, sobre mim e autenticacao.`;
  }
}
