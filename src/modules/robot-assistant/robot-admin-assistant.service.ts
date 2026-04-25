import { singleton } from "tsyringe";
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
  "forgot-password": "recuperação de senha",
  home: "menu inicial",
  login: "login",
  portfolio: "portfólio",
  profile: "perfil",
  register: "cadastro",
  "study-post": "leituras individuais",
  studies: "área de estudos",
};

const describeRoute = (path: string) => routeLabelMap[path] ?? path;

const toPercent = (value: number) => `${Math.round(value * 100)}%`;

const buildAdminActions = (): RobotAssistantAction[] => [
  { id: "admin-summary-day", kind: "prompt", label: "Resumo do dia", prompt: "O que aconteceu hoje?" },
  { id: "admin-bottlenecks", kind: "prompt", label: "Gargalos atuais", prompt: "Onde estou perdendo usuários?" },
  {
    id: "admin-content-highlight",
    kind: "prompt",
    label: "Conteúdo em destaque",
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

@singleton()
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
      ? `Hoje ${describeRoute(mainRoute.path)} concentrou a maior parte do interesse, com ${mainRoute.visitors} visitantes distintos circulando por essa área.`
      : "Hoje o radar ainda está com pouco volume para cravar um eixo dominante de navegação.";
    const insight = weakestFriction && weakestFriction.attempts > 0
      ? `${describeRoute(weakestFriction.path)} continua sendo o ponto mais sensível do fluxo, com conversão estimada em ${toPercent(weakestFriction.completionRate)}. ${bestContent ? `Ao mesmo tempo, "${bestContent.title}" é o conteúdo mais qualificado do momento.` : ""}`
      : bestContent
        ? `"${bestContent.title}" está puxando a leitura mais qualificada agora, enquanto ${leastExploredRoute ? describeRoute(leastExploredRoute.path) : "outras áreas do site"} segue abaixo do potencial.`
        : "O comportamento geral ainda está mais espalhado do que concentrado em um fluxo claro.";
    const recommendation = weakestFriction && weakestFriction.attempts > 0
      ? `Minha recomendação prática é reduzir a fricção entre ${describeRoute(mainRoute?.path || "o conteúdo")} e ${describeRoute(weakestFriction.path)}, porque é ali que parte da atenção está se perdendo.`
      : `Minha recomendação prática é empurrar mais tráfego qualificado para ${leastExploredRoute ? describeRoute(leastExploredRoute.path) : "as áreas menos exploradas"}, usando o melhor conteúdo atual como ponte.`;

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
        ? "O movimento caiu em relação ao bloco anterior."
        : visitorDelta > 0.18 || readsDelta > 0.18
          ? "O movimento acelerou em relação ao bloco anterior."
          : "O movimento ficou relativamente estável em relação ao bloco anterior.";
    const summary = `Nas últimas 24 horas, o site recebeu ${comparison.current.uniqueVisitors} visitantes únicos e gerou ${comparison.current.reads} leituras registradas. ${anomalyTone}`;
    const insight = mainRoute
      ? `${describeRoute(mainRoute.path)} segue como principal porta de interesse, enquanto ${comparison.current.likes} interações de afinidade e ${comparison.current.comments} comentários ajudam a separar leitura superficial de interesse real.`
      : "Ainda não apareceu um fluxo forte o suficiente para dominar a navegação do dia.";
    const recommendation = `Minha recomendação prática é observar de perto ${snapshot.authFriction[0] ? describeRoute(snapshot.authFriction[0].path) : "o fluxo de entrada"} nas próximas horas e usar ${mainRoute ? describeRoute(mainRoute.path) : "a área mais visitada"} como alavanca para o restante do site.`;

    return `${summary}\n\n${insight}\n\n${recommendation}`;
  }

  private buildWeekResponse(snapshot: RobotAssistantAdminSnapshot) {
    const topTransition = snapshot.routeTransitions[0];
    const leastExploredRoute = findLeastExploredRoute(snapshot.routeUsage);
    const bestContent = [...snapshot.contentPerformance].sort(
      (left, right) => right.engagementScore - left.engagementScore
    )[0];
    const summary = `Na última semana, o site acumulou ${snapshot.visitorSummary7d.visitorsSince} visitantes distintos em ${snapshot.visitorSummary7d.entriesSince} entradas rastreadas.`;
    const insight = topTransition
      ? `O caminho mais repetido foi de ${describeRoute(topTransition.fromPath)} para ${describeRoute(topTransition.toPath)}, o que indica um eixo de navegação mais forte do que o restante. ${bestContent ? `"${bestContent.title}" aparece como a melhor âncora de retenção desse período.` : ""}`
      : `${bestContent ? `"${bestContent.title}" lidera a retenção do período, mas o restante dos fluxos ainda está pulverizado.` : "Ainda falta densidade para identificar um fluxo dominante com segurança."}`;
    const recommendation = `Minha recomendação prática é reforçar a passagem para ${leastExploredRoute ? describeRoute(leastExploredRoute.path) : "as áreas menos exploradas"}, porque hoje ela está ficando fora da trilha principal dos usuários.`;

    return `${summary}\n\n${insight}\n\n${recommendation}`;
  }

  private buildFrictionResponse(snapshot: RobotAssistantAdminSnapshot) {
    const weakestFriction = [...snapshot.authFriction].sort(
      (left, right) => left.completionRate - right.completionRate
    )[0];
    const mainDropOff = snapshot.dropOffs[0];
    const summary = weakestFriction
      ? `${describeRoute(weakestFriction.path)} é o ponto mais sensível do fluxo hoje, com ${weakestFriction.attempts} tentativas rastreadas e conversão estimada em ${toPercent(weakestFriction.completionRate)}.`
      : "Ainda não houve volume suficiente em login ou cadastro para medir fricção de forma confiável.";
    const insight = mainDropOff
      ? `${describeRoute(mainDropOff.path)} também aparece como uma das principais saídas de sessão, o que sugere quebra entre curiosidade e continuidade.`
      : "O gargalo principal continua concentrado na entrada, não no restante da navegação.";
    const recommendation = "Minha recomendação prática é simplificar o salto entre leitura e autenticação, especialmente se o usuário vier de estudos ou de um post individual.";

    return `${summary}\n\n${insight}\n\n${recommendation}`;
  }

  private buildContentResponse(snapshot: RobotAssistantAdminSnapshot) {
    const bestContent = [...snapshot.contentPerformance].sort(
      (left, right) => right.engagementScore - left.engagementScore
    )[0];
    const secondContent = [...snapshot.contentPerformance]
      .sort((left, right) => right.engagementScore - left.engagementScore)[1];
    const summary = bestContent
      ? `"${bestContent.title}" é o conteúdo mais forte agora, combinando ${bestContent.views} leituras com um índice de resposta acima da média.`
      : "Ainda não existe conteúdo com sinal suficiente para destacar como líder.";
    const insight = secondContent
      ? `"${secondContent.title}" aparece logo atrás, mas com intensidade menor, o que mostra que o interesse ainda está concentrado em poucos estudos.`
      : "O consumo ainda está concentrado em um conjunto pequeno de leituras.";
    const recommendation = bestContent
      ? `Minha recomendação prática é usar "${bestContent.title}" como ponte para outros estudos da mesma categoria e puxar o usuário dali para cadastro, portfólio ou contato.`
      : "Minha recomendação prática é fortalecer a distribuição das leituras com melhor taxa de resposta antes de ampliar o volume de conteúdo.";

    return `${summary}\n\n${insight}\n\n${recommendation}`;
  }

  private buildNavigationResponse(snapshot: RobotAssistantAdminSnapshot) {
    const mainRoute = findMainRoute(snapshot.routeUsage);
    const topTransition = snapshot.routeTransitions[0];
    const mainDropOff = snapshot.dropOffs[0];
    const summary = mainRoute
      ? `${describeRoute(mainRoute.path)} é hoje o ponto de entrada mais forte do site.`
      : "Ainda não apareceu um ponto de entrada dominante na navegação recente.";
    const insight = topTransition
      ? `O caminho mais usado foi de ${describeRoute(topTransition.fromPath)} para ${describeRoute(topTransition.toPath)}, enquanto ${mainDropOff ? describeRoute(mainDropOff.path) : "alguns trechos"} concentram as principais saídas.`
      : "A navegação está mais fragmentada do que encadeada, com poucos caminhos repetidos.";
    const recommendation = "Minha recomendação prática é reforçar as transições entre as áreas que já recebem atenção e as páginas menos visitadas, em vez de tentar criar novos caminhos do zero.";

    return `${summary}\n\n${insight}\n\n${recommendation}`;
  }

  private buildBehaviorResponse(snapshot: RobotAssistantAdminSnapshot) {
    const mostEngagedUser = snapshot.analytics.topUsers[0];
    const topReader = snapshot.analytics.topReaders[0];
    const summary = mostEngagedUser
      ? `${mostEngagedUser.name} lidera a interação recente, enquanto ${topReader ? topReader.name : "os leitores mais ativos"} sustenta o consumo de conteúdo.`
      : "Ainda não há densidade suficiente para destacar um padrão forte de comportamento por usuário.";
    const insight = `No mix atual, leituras representam ${snapshot.analytics.overview.totalReads} eventos acumulados, mas a distância entre leitura e resposta ainda é o principal filtro de qualidade.`;
    const recommendation = "Minha recomendação prática é observar quem lê muito mas quase não avança para comentário, curtida ou contato, porque é ali que pode existir interesse sem conversão.";

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
      return `O movimento saiu do padrão nas últimas 24 horas, com queda perceptível de visitas ou leituras em relação ao bloco anterior.\n\nO principal insight é que o consumo caiu antes de virar interação, então o problema parece estar mais na entrada ou na descoberta do que no conteúdo em si.\n\nMinha recomendação prática é revisar imediatamente os caminhos que levam para estudos, login e cadastro, porque qualquer fricção ali agora está custando atenção real.`;
    }

    if (weakestFriction && weakestFriction.attempts > 0 && weakestFriction.completionRate < 0.35) {
      return `O que mais merece atenção agora é o atrito no ${describeRoute(weakestFriction.path)}.\n\nO principal insight é que o conteúdo está conseguindo puxar interesse, mas parte da energia morre antes da autenticação se completar.\n\nMinha recomendação prática é simplificar esse fluxo antes de mexer no resto, porque ele está segurando a conversão do que já funciona.`;
    }

    return `Não apareceu nenhuma anomalia grave fora do padrão recente.\n\nO principal insight é que o site está concentrando valor em poucas leituras fortes, enquanto algumas áreas seguem subexploradas.\n\nMinha recomendação prática é usar o melhor conteúdo atual para redistribuir atenção e testar transições mais fortes para portfólio, sobre mim e autenticação.`;
  }
}
