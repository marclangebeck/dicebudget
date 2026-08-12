import { APP_NAME } from "@/lib/branding";
import type { HeadToHeadAnalysisDto, MatchAnalysisDto } from "@/lib/matchAnalysisTypes";
import {
  SHARE_CARD_SIZE,
  canvasToPngBlob,
  drawShareAccentGlow,
  drawShareBackground,
  drawShareBrandFooter,
  drawShareBrandHeader,
  roundShareRect,
  wrapShareText,
} from "@/lib/shareCanvasUtils";
import { appendSiteLink } from "@/lib/shareSocial";
import { runHasOpenFields } from "@/lib/runUtils";
import type { RunDto } from "@/lib/types";

type OutcomeTone = "win" | "loss" | "tie" | "lead" | "mid";

const TONE_ACCENT: Record<OutcomeTone, string> = {
  win: "rgba(16, 185, 129, 0.24)",
  loss: "rgba(248, 113, 113, 0.2)",
  tie: "rgba(148, 163, 184, 0.18)",
  lead: "rgba(56, 189, 248, 0.2)",
  mid: "rgba(229, 192, 123, 0.2)",
};

const TONE_LABEL_COLOR: Record<OutcomeTone, string> = {
  win: "#6ee7b7",
  loss: "#fca5a5",
  tie: "#cbd5e1",
  lead: "#7dd3fc",
  mid: "#e5c07b",
};

function formatSigned(n: number): string {
  if (n > 0) return `+${n}`;
  return String(n);
}

function resolveOutcome(
  analysis: MatchAnalysisDto,
  h2h: HeadToHeadAnalysisDto | null,
  isMultiRound: boolean,
): { label: string; tone: OutcomeTone } {
  if (analysis.mode === "solo") {
    return { label: "Einzelspiel", tone: "lead" };
  }
  if (!isMultiRound && h2h) {
    if (h2h.winner === "viewer") return { label: "Sieg", tone: "win" };
    if (h2h.winner === "opponent") return { label: "Niederlage", tone: "loss" };
    return { label: "Remis", tone: "tie" };
  }
  if (analysis.viewerRank === 1) return { label: "Rundensieg", tone: "win" };
  if (analysis.viewerRank != null && analysis.viewerRank <= 2) {
    return { label: `Platz ${analysis.viewerRank}`, tone: "mid" };
  }
  return {
    label: analysis.viewerRank != null ? `Platz ${analysis.viewerRank}` : "Ergebnis",
    tone: "loss",
  };
}

export function buildRunFinishShareText(run: RunDto): string {
  const abandoned = runHasOpenFields(run);
  const headline = abandoned
    ? `Run beendet: ${run.totalScore} Punkte`
    : `Run abgeschlossen: ${run.totalScore} Punkte`;
  const blocks = run.games.map((g) => `Sp${g.index}: ${g.summary.gameTotal}`).join(" · ");
  const mode = run.useStrategyRules ? "Strategy Edition" : "Klassisch";
  return appendSiteLink(
    `🎲 ${headline} — ${APP_NAME}\n${run.gameCount} ${run.gameCount === 1 ? "Spiel" : "Spiele"} · ${mode}\n${blocks}`,
  );
}

export async function renderRunFinishShareImage(run: RunDto): Promise<Blob> {
  const abandoned = runHasOpenFields(run);
  const canvas = document.createElement("canvas");
  canvas.width = SHARE_CARD_SIZE;
  canvas.height = SHARE_CARD_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas nicht verfügbar");

  drawShareBackground(ctx);
  drawShareAccentGlow(ctx, "rgba(16, 185, 129, 0.2)");
  await drawShareBrandHeader(ctx);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = abandoned ? "#fcd34d" : "#6ee7b7";
  ctx.font = "700 30px system-ui, sans-serif";
  ctx.fillText(
    (abandoned ? "RUN BEENDET" : "RUN ABGESCHLOSSEN").toUpperCase(),
    SHARE_CARD_SIZE / 2,
    220,
  );

  ctx.fillStyle = "#f8fafc";
  ctx.font = "800 120px system-ui, sans-serif";
  ctx.fillText(String(run.totalScore), SHARE_CARD_SIZE / 2, 380);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "500 32px system-ui, sans-serif";
  ctx.fillText(
    `Gesamtpunkte · ${run.gameCount} ${run.gameCount === 1 ? "Spiel" : "Spiele"}`,
    SHARE_CARD_SIZE / 2,
    430,
  );

  let rowY = 520;
  const maxRows = Math.min(run.games.length, 5);
  for (let i = 0; i < maxRows; i++) {
    const game = run.games[i];
    roundShareRect(ctx, 180, rowY - 36, SHARE_CARD_SIZE - 360, 56, 14);
    ctx.fillStyle = "rgba(15, 23, 42, 0.55)";
    ctx.fill();
    ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "600 28px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`Spiel ${game.index}`, 210, rowY);
    ctx.textAlign = "right";
    ctx.fillStyle = "#f8fafc";
    ctx.font = "700 34px system-ui, sans-serif";
    ctx.fillText(String(game.summary.gameTotal), SHARE_CARD_SIZE - 210, rowY);
    rowY += 72;
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "#64748b";
  ctx.font = "500 26px system-ui, sans-serif";
  ctx.fillText(
    run.useStrategyRules ? "Strategy Edition" : "Klassisch",
    SHARE_CARD_SIZE / 2,
    SHARE_CARD_SIZE - 170,
  );

  drawShareBrandFooter(ctx);
  return canvasToPngBlob(canvas);
}

export function buildMatchAnalysisShareText(params: {
  analysis: MatchAnalysisDto;
  viewerLabel: string;
  opponentLabel?: string;
}): string {
  const { analysis, viewerLabel, opponentLabel } = params;
  const h2h = analysis.headToHead;
  const isMultiRound = analysis.playerCount > 2;
  const outcome = resolveOutcome(analysis, h2h, isMultiRound);

  let headline: string;
  if (!isMultiRound && h2h) {
    headline = `${outcome.label} (${formatSigned(h2h.scoreDiff)})`;
  } else if (analysis.viewerRank != null) {
    headline = `${outcome.label} · ${analysis.viewer.totalScore} Punkte`;
  } else {
    headline = `${analysis.viewer.totalScore} Punkte`;
  }

  const caption =
    !isMultiRound && h2h && opponentLabel
      ? `${analysis.viewer.totalScore} vs. ${analysis.opponent?.totalScore ?? "—"} gegen ${opponentLabel}`
      : analysis.viewerRank != null
        ? `Platz ${analysis.viewerRank} von ${analysis.playerCount}`
        : `${analysis.viewer.gameCount} Spielblock${analysis.viewer.gameCount === 1 ? "" : "e"}`;

  const narrative = analysis.coaching?.narrative?.trim() || analysis.insights[0]?.trim() || "";
  const narrativeLine = narrative ? `\n${narrative}` : "";

  return appendSiteLink(
    `🎲 ${headline} — ${APP_NAME}\n${viewerLabel}: ${caption}${narrativeLine}`,
  );
}

export async function renderMatchAnalysisShareImage(params: {
  analysis: MatchAnalysisDto;
  viewerLabel: string;
  opponentLabel?: string;
}): Promise<Blob> {
  const { analysis, viewerLabel, opponentLabel } = params;
  const h2h = analysis.headToHead;
  const isMultiRound = analysis.playerCount > 2;
  const outcome = resolveOutcome(analysis, h2h, isMultiRound);

  const heroScore =
    !isMultiRound && h2h ? formatSigned(h2h.scoreDiff) : String(analysis.viewer.totalScore);

  const heroCaption =
    !isMultiRound && h2h
      ? `${analysis.viewer.totalScore} vs. ${analysis.opponent?.totalScore ?? "—"}`
      : analysis.viewerRank != null
        ? `Platz ${analysis.viewerRank} von ${analysis.playerCount}`
        : `${analysis.viewer.gameCount} Spielblock${analysis.viewer.gameCount === 1 ? "" : "e"}`;

  const narrative =
    analysis.coaching?.narrative?.trim() || analysis.insights.join(" ").trim() || "";

  const canvas = document.createElement("canvas");
  canvas.width = SHARE_CARD_SIZE;
  canvas.height = SHARE_CARD_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas nicht verfügbar");

  drawShareBackground(ctx);
  drawShareAccentGlow(ctx, TONE_ACCENT[outcome.tone]);
  await drawShareBrandHeader(ctx);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  const pillW = 280;
  const pillH = 52;
  const pillX = SHARE_CARD_SIZE / 2 - pillW / 2;
  roundShareRect(ctx, pillX, 198, pillW, pillH, 26);
  ctx.fillStyle = "rgba(15, 23, 42, 0.65)";
  ctx.fill();
  ctx.strokeStyle = TONE_LABEL_COLOR[outcome.tone];
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = TONE_LABEL_COLOR[outcome.tone];
  ctx.font = "800 26px system-ui, sans-serif";
  ctx.fillText(outcome.label.toUpperCase(), SHARE_CARD_SIZE / 2, 234);

  ctx.fillStyle = "#f8fafc";
  ctx.font = "800 108px system-ui, sans-serif";
  ctx.fillText(heroScore, SHARE_CARD_SIZE / 2, 360);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "500 32px system-ui, sans-serif";
  ctx.fillText(heroCaption, SHARE_CARD_SIZE / 2, 410);

  if (opponentLabel && !isMultiRound && analysis.mode === "multi") {
    ctx.fillStyle = "#64748b";
    ctx.font = "500 28px system-ui, sans-serif";
    ctx.fillText(`${viewerLabel} vs. ${opponentLabel}`, SHARE_CARD_SIZE / 2, 456);
  }

  if (narrative) {
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "500 30px system-ui, sans-serif";
    const lines = wrapShareText(ctx, narrative, SHARE_CARD_SIZE - 200);
    let y = 540;
    for (const line of lines.slice(0, 4)) {
      ctx.fillText(line, SHARE_CARD_SIZE / 2, y);
      y += 40;
    }
  }

  if (analysis.coaching?.playStyle) {
    ctx.fillStyle = "#e5c07b";
    ctx.font = "700 24px system-ui, sans-serif";
    ctx.fillText(analysis.coaching.playStyle.toUpperCase(), SHARE_CARD_SIZE / 2, SHARE_CARD_SIZE - 200);
  }

  drawShareBrandFooter(ctx);
  return canvasToPngBlob(canvas);
}

export type PairingShareParams = {
  playerAName: string;
  playerBName: string;
  playerAWins: number;
  playerBWins: number;
  ties: number;
  roundsPlayed: number;
  /** Netto-Punktedifferenz A − B (Bonus/Diff). */
  netDiff?: number;
  /** Letzte Ergebnisse chronologisch (älteste zuerst), max. ~5. */
  form?: Array<"A" | "B" | "tie">;
};

export type HomeRecordShareParams = {
  recordTitle: string;
  wins: number;
  losses: number;
  ties: number;
  bestScore: number | null;
  pairingGames: number | null;
};

export type TableModeShareParams = {
  leftLabel: string;
  rightLabel: string;
  leftScore: number;
  rightScore: number;
  inviteCode: string;
};

/** Form aus Paarungs-Runden: API newest-first → Ausgabe älteste→neueste (max N). */
export function recentPairingForm(
  rounds: { winner: "A" | "B" | "tie" }[],
  max = 5,
): Array<"A" | "B" | "tie"> {
  if (rounds.length === 0 || max <= 0) return [];
  return rounds
    .slice(0, max)
    .map((r) => r.winner)
    .reverse();
}

function pairingLeadLabel(params: PairingShareParams): string {
  if (params.playerAWins === params.playerBWins) return "Ausgeglichen";
  const leader =
    params.playerAWins > params.playerBWins ? params.playerAName : params.playerBName;
  const lead = Math.abs(params.playerAWins - params.playerBWins);
  return `${leader} führt (+${lead})`;
}

export function buildPairingShareText(params: PairingShareParams): string {
  const tiePart = params.ties > 0 ? ` · ${params.ties} Remis` : "";
  const diff =
    params.netDiff != null && params.netDiff !== 0
      ? `\nPunktedifferenz: ${formatSigned(params.netDiff)}`
      : "";
  const form =
    params.form && params.form.length > 0
      ? `\nForm: ${params.form.map((w) => (w === "tie" ? "U" : w)).join("-")}`
      : "";
  return appendSiteLink(
    `🎲 ${params.playerAName} vs. ${params.playerBName} — ${APP_NAME}\n` +
      `Bilanz ${params.playerAWins}:${params.playerBWins}${tiePart} · ${pairingLeadLabel(params)}` +
      `${diff}${form}\n` +
      `${params.roundsPlayed} ${params.roundsPlayed === 1 ? "Runde" : "Runden"} gesamt`,
  );
}

export async function renderPairingShareImage(params: PairingShareParams): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = SHARE_CARD_SIZE;
  canvas.height = SHARE_CARD_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas nicht verfügbar");

  const totalWins = params.playerAWins + params.playerBWins;
  const shareA = totalWins > 0 ? params.playerAWins / totalWins : 0.5;
  const accent =
    params.playerAWins === params.playerBWins
      ? "rgba(229, 192, 123, 0.22)"
      : params.playerAWins > params.playerBWins
        ? "rgba(16, 185, 129, 0.24)"
        : "rgba(56, 189, 248, 0.22)";

  drawShareBackground(ctx);
  drawShareAccentGlow(ctx, accent);
  await drawShareBrandHeader(ctx);

  ctx.textAlign = "center";
  ctx.fillStyle = "#e5c07b";
  ctx.font = "700 28px system-ui, sans-serif";
  ctx.fillText("RIVALEN-DUELL", SHARE_CARD_SIZE / 2, 210);

  ctx.fillStyle = "#f8fafc";
  ctx.font = "700 38px system-ui, sans-serif";
  const titleLines = wrapShareText(
    ctx,
    `${params.playerAName} vs. ${params.playerBName}`,
    SHARE_CARD_SIZE - 160,
  );
  let titleY = 275;
  for (const line of titleLines.slice(0, 2)) {
    ctx.fillText(line, SHARE_CARD_SIZE / 2, titleY);
    titleY += 44;
  }

  const scoreY = 400;
  ctx.font = "800 100px system-ui, sans-serif";
  ctx.fillStyle = "#6ee7b7";
  ctx.fillText(String(params.playerAWins), SHARE_CARD_SIZE / 2 - 180, scoreY);
  ctx.fillStyle = "#94a3b8";
  ctx.fillText(":", SHARE_CARD_SIZE / 2, scoreY);
  ctx.fillStyle = "#7dd3fc";
  ctx.fillText(String(params.playerBWins), SHARE_CARD_SIZE / 2 + 180, scoreY);

  ctx.font = "600 26px system-ui, sans-serif";
  ctx.fillStyle = "#cbd5e1";
  ctx.fillText("Siege", SHARE_CARD_SIZE / 2 - 180, scoreY + 40);
  ctx.fillText("Siege", SHARE_CARD_SIZE / 2 + 180, scoreY + 40);

  // Duell-Balken
  const barX = 160;
  const barY = 480;
  const barW = SHARE_CARD_SIZE - 320;
  const barH = 36;
  roundShareRect(ctx, barX, barY, barW, barH, 18);
  ctx.fillStyle = "rgba(15, 23, 42, 0.55)";
  ctx.fill();
  const aW = Math.max(barH, Math.round(barW * shareA));
  roundShareRect(ctx, barX, barY, aW, barH, 18);
  ctx.fillStyle = "#10b981";
  ctx.fill();
  if (shareA < 0.98) {
    roundShareRect(ctx, barX + aW - 8, barY, barW - aW + 8, barH, 18);
    ctx.fillStyle = "#38bdf8";
    ctx.fill();
  }
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "700 22px system-ui, sans-serif";
  ctx.fillText(`${Math.round(shareA * 100)}% · ${Math.round((1 - shareA) * 100)}%`, SHARE_CARD_SIZE / 2, barY + 26);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "500 28px system-ui, sans-serif";
  ctx.fillText(pairingLeadLabel(params), SHARE_CARD_SIZE / 2, 560);

  let metaY = 608;
  if (params.netDiff != null && params.netDiff !== 0) {
    ctx.fillStyle = "#e5c07b";
    ctx.font = "600 28px system-ui, sans-serif";
    ctx.fillText(`Punktedifferenz ${formatSigned(params.netDiff)}`, SHARE_CARD_SIZE / 2, metaY);
    metaY += 40;
  }
  if (params.ties > 0) {
    ctx.fillStyle = "#94a3b8";
    ctx.font = "500 26px system-ui, sans-serif";
    ctx.fillText(`${params.ties} Remis`, SHARE_CARD_SIZE / 2, metaY);
    metaY += 36;
  }

  // Form / Trend
  if (params.form && params.form.length > 0) {
    ctx.fillStyle = "#64748b";
    ctx.font = "600 22px system-ui, sans-serif";
    ctx.fillText("FORM (LETZTE RUNDEN)", SHARE_CARD_SIZE / 2, metaY + 8);
    const dotR = 16;
    const gap = 44;
    const totalW = (params.form.length - 1) * gap;
    let dx = SHARE_CARD_SIZE / 2 - totalW / 2;
    const dy = metaY + 48;
    for (const w of params.form) {
      ctx.beginPath();
      ctx.arc(dx, dy, dotR, 0, Math.PI * 2);
      ctx.fillStyle = w === "A" ? "#10b981" : w === "B" ? "#38bdf8" : "#94a3b8";
      ctx.fill();
      dx += gap;
    }
    metaY = dy + 40;
  }

  ctx.fillStyle = "#64748b";
  ctx.font = "500 26px system-ui, sans-serif";
  ctx.fillText(
    `${params.roundsPlayed} ${params.roundsPlayed === 1 ? "Runde" : "Runden"} gesamt`,
    SHARE_CARD_SIZE / 2,
    Math.max(metaY + 8, SHARE_CARD_SIZE - 190),
  );

  drawShareBrandFooter(ctx);
  return canvasToPngBlob(canvas);
}

export function buildHomeRecordShareText(params: HomeRecordShareParams): string {
  const bestPart =
    params.bestScore != null ? `\nBester Run: ${params.bestScore} Punkte` : "";
  const gamesPart =
    params.pairingGames != null
      ? `\n${params.pairingGames} Paarungs-${params.pairingGames === 1 ? "Spiel" : "Spiele"}`
      : "";
  const tiePart = params.ties > 0 ? ` · ${params.ties} Remis` : "";
  return appendSiteLink(
    `🎲 ${params.recordTitle} — ${APP_NAME}\n` +
      `Gewonnen ${params.wins} · Verloren ${params.losses}${tiePart}${bestPart}${gamesPart}`,
  );
}

export async function renderHomeRecordShareImage(params: HomeRecordShareParams): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = SHARE_CARD_SIZE;
  canvas.height = SHARE_CARD_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas nicht verfügbar");

  drawShareBackground(ctx);
  drawShareAccentGlow(ctx, "rgba(229, 192, 123, 0.22)");
  await drawShareBrandHeader(ctx);

  ctx.textAlign = "center";
  ctx.fillStyle = "#e5c07b";
  ctx.font = "700 28px system-ui, sans-serif";
  ctx.fillText("STARTSCREEN-BILANZ", SHARE_CARD_SIZE / 2, 220);

  ctx.fillStyle = "#f8fafc";
  ctx.font = "700 42px system-ui, sans-serif";
  const titleLines = wrapShareText(ctx, params.recordTitle, SHARE_CARD_SIZE - 160);
  let titleY = 300;
  for (const line of titleLines.slice(0, 2)) {
    ctx.fillText(line, SHARE_CARD_SIZE / 2, titleY);
    titleY += 48;
  }

  ctx.font = "800 88px system-ui, sans-serif";
  ctx.fillStyle = "#6ee7b7";
  ctx.fillText(String(params.wins), SHARE_CARD_SIZE / 2 - 150, 450);
  ctx.fillStyle = "#94a3b8";
  ctx.fillText(":", SHARE_CARD_SIZE / 2, 450);
  ctx.fillStyle = "#fca5a5";
  ctx.fillText(String(params.losses), SHARE_CARD_SIZE / 2 + 150, 450);

  ctx.font = "600 26px system-ui, sans-serif";
  ctx.fillStyle = "#cbd5e1";
  ctx.fillText("Gewonnen", SHARE_CARD_SIZE / 2 - 150, 492);
  ctx.fillText("Verloren", SHARE_CARD_SIZE / 2 + 150, 492);

  let metaY = 580;
  ctx.fillStyle = "#94a3b8";
  ctx.font = "500 30px system-ui, sans-serif";
  if (params.ties > 0) {
    ctx.fillText(`${params.ties} Remis`, SHARE_CARD_SIZE / 2, metaY);
    metaY += 40;
  }
  if (params.bestScore != null) {
    ctx.fillText(`Bester Run: ${params.bestScore}`, SHARE_CARD_SIZE / 2, metaY);
    metaY += 40;
  }
  if (params.pairingGames != null) {
    ctx.fillText(`${params.pairingGames} Paarungs-Spiele`, SHARE_CARD_SIZE / 2, metaY);
  }

  drawShareBrandFooter(ctx);
  return canvasToPngBlob(canvas);
}

function tableModeWinner(params: TableModeShareParams): "left" | "right" | "tie" {
  if (params.leftScore > params.rightScore) return "left";
  if (params.rightScore > params.leftScore) return "right";
  return "tie";
}

export function buildTableModeShareText(params: TableModeShareParams): string {
  const winner = tableModeWinner(params);
  const resultLine =
    winner === "tie"
      ? "Remis"
      : winner === "left"
        ? `${params.leftLabel} gewinnt (+${params.leftScore - params.rightScore})`
        : `${params.rightLabel} gewinnt (+${params.rightScore - params.leftScore})`;
  return appendSiteLink(
    `🎲 iPad-Duell — ${APP_NAME}\n` +
      `${params.leftLabel} ${params.leftScore} : ${params.rightScore} ${params.rightLabel}\n` +
      `${resultLine} · Raum ${params.inviteCode}`,
  );
}

export async function renderTableModeShareImage(params: TableModeShareParams): Promise<Blob> {
  const winner = tableModeWinner(params);
  const canvas = document.createElement("canvas");
  canvas.width = SHARE_CARD_SIZE;
  canvas.height = SHARE_CARD_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas nicht verfügbar");

  drawShareBackground(ctx);
  drawShareAccentGlow(
    ctx,
    winner === "tie" ? "rgba(229, 192, 123, 0.2)" : "rgba(16, 185, 129, 0.22)",
  );
  await drawShareBrandHeader(ctx);

  ctx.textAlign = "center";
  ctx.fillStyle = "#e5c07b";
  ctx.font = "700 28px system-ui, sans-serif";
  ctx.fillText("IPAD-TISCHMODUS", SHARE_CARD_SIZE / 2, 220);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "500 28px system-ui, sans-serif";
  ctx.fillText(`Raum ${params.inviteCode}`, SHARE_CARD_SIZE / 2, 268);

  const leftX = SHARE_CARD_SIZE / 2 - 210;
  const rightX = SHARE_CARD_SIZE / 2 + 210;
  ctx.font = "700 34px system-ui, sans-serif";
  ctx.fillStyle = "#cbd5e1";
  const leftNameLines = wrapShareText(ctx, params.leftLabel, 320);
  const rightNameLines = wrapShareText(ctx, params.rightLabel, 320);
  ctx.fillText(leftNameLines[0] ?? params.leftLabel, leftX, 340);
  ctx.fillText(rightNameLines[0] ?? params.rightLabel, rightX, 340);

  ctx.font = "800 88px system-ui, sans-serif";
  ctx.fillStyle = winner === "left" ? "#6ee7b7" : "#f8fafc";
  ctx.fillText(String(params.leftScore), leftX, 450);
  ctx.fillStyle = "#64748b";
  ctx.fillText(":", SHARE_CARD_SIZE / 2, 450);
  ctx.fillStyle = winner === "right" ? "#6ee7b7" : "#f8fafc";
  ctx.fillText(String(params.rightScore), rightX, 450);

  ctx.fillStyle = winner === "tie" ? "#e5c07b" : "#6ee7b7";
  ctx.font = "700 32px system-ui, sans-serif";
  const outcome =
    winner === "tie"
      ? "REMIS"
      : winner === "left"
        ? `${params.leftLabel} SIEG`.slice(0, 28).toUpperCase()
        : `${params.rightLabel} SIEG`.slice(0, 28).toUpperCase();
  ctx.fillText(outcome, SHARE_CARD_SIZE / 2, 560);

  drawShareBrandFooter(ctx);
  return canvasToPngBlob(canvas);
}
