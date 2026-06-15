"use client";

import type { ScoreProgressionDto } from "@/lib/matchAnalysisTypes";
import { downsampleScoreProgressionPoints } from "@/lib/scoreProgressionChart";

type Props = {
  progression: ScoreProgressionDto;
  highlightPlayerId?: string;
};

const CHART_WIDTH = 320;
const CHART_HEIGHT = 148;
const PAD = { top: 12, right: 12, bottom: 28, left: 36 };

function buildPath(
  points: ScoreProgressionDto["points"],
  key: "playerAScore" | "playerBScore",
  xScale: (percent: number) => number,
  yScale: (score: number) => number,
): string {
  if (points.length === 0) return "";
  return points
    .map((point, index) => {
      const cmd = index === 0 ? "M" : "L";
      return `${cmd}${xScale(point.turn).toFixed(1)},${yScale(point[key]).toFixed(1)}`;
    })
    .join(" ");
}

export function ScoreProgressionChart({ progression, highlightPlayerId }: Props) {
  const { playerAName, playerBName, playerAId, playerBId, leadChanges, finalLeader } =
    progression;

  const points = downsampleScoreProgressionPoints(progression.points);
  if (points.length < 2) return null;

  const maxScore = Math.max(
    ...points.flatMap((p) => [p.playerAScore, p.playerBScore]),
    1,
  );

  const innerW = CHART_WIDTH - PAD.left - PAD.right;
  const innerH = CHART_HEIGHT - PAD.top - PAD.bottom;

  const xScale = (percent: number) => PAD.left + (percent / 100) * innerW;
  const yScale = (score: number) => PAD.top + innerH - (score / maxScore) * innerH;

  const pathA = buildPath(points, "playerAScore", xScale, yScale);
  const pathB = buildPath(points, "playerBScore", xScale, yScale);

  const yTicks = [0, Math.round(maxScore / 2), maxScore];
  const xTicks = [0, 25, 50, 75, 100];

  const leaderLabel =
    finalLeader === "a"
      ? `${playerAName} vorn`
      : finalLeader === "b"
        ? `${playerBName} vorn`
        : "Remis am Ende";

  const emphasizeA = highlightPlayerId === playerAId;
  const emphasizeB = highlightPlayerId === playerBId;

  return (
    <div className="score-progression-chart">
      <div className="score-progression-legend">
        <span
          className={`score-progression-legend-item score-progression-legend-item--a${emphasizeA ? " score-progression-legend-item--emphasis" : ""}`}
        >
          <span className="score-progression-swatch score-progression-swatch--a" aria-hidden />
          {playerAName}
        </span>
        <span
          className={`score-progression-legend-item score-progression-legend-item--b${emphasizeB ? " score-progression-legend-item--emphasis" : ""}`}
        >
          <span className="score-progression-swatch score-progression-swatch--b" aria-hidden />
          {playerBName}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="score-progression-svg"
        role="img"
        aria-label={`Punkteverlauf alle 10 Prozent: ${playerAName} gegen ${playerBName}`}
      >
        <defs>
          <linearGradient id="score-progression-grid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(148, 163, 184, 0.12)" />
            <stop offset="100%" stopColor="rgba(148, 163, 184, 0.04)" />
          </linearGradient>
        </defs>

        <rect
          x={PAD.left}
          y={PAD.top}
          width={innerW}
          height={innerH}
          fill="url(#score-progression-grid)"
          rx="6"
        />

        {yTicks.map((tick) => (
          <g key={`y-${tick}`}>
            <line
              x1={PAD.left}
              x2={PAD.left + innerW}
              y1={yScale(tick)}
              y2={yScale(tick)}
              stroke="rgba(148, 163, 184, 0.18)"
              strokeDasharray="3 4"
            />
            <text
              x={PAD.left - 6}
              y={yScale(tick) + 3}
              textAnchor="end"
              className="score-progression-axis-label"
            >
              {tick}
            </text>
          </g>
        ))}

        {xTicks.map((tick) => (
          <text
            key={`x-${tick}`}
            x={xScale(tick)}
            y={CHART_HEIGHT - 8}
            textAnchor="middle"
            className="score-progression-axis-label"
          >
            {tick}%
          </text>
        ))}

        <path d={pathA} className="score-progression-line score-progression-line--a" fill="none" />
        <path d={pathB} className="score-progression-line score-progression-line--b" fill="none" />

        {points.map((point) => (
          <g key={`dots-${point.turn}`}>
            <circle
              cx={xScale(point.turn)}
              cy={yScale(point.playerAScore)}
              r={point.turn === 100 ? 3.5 : 2.5}
              className="score-progression-dot score-progression-dot--a"
            />
            <circle
              cx={xScale(point.turn)}
              cy={yScale(point.playerBScore)}
              r={point.turn === 100 ? 3.5 : 2.5}
              className="score-progression-dot score-progression-dot--b"
            />
          </g>
        ))}

        <text
          x={PAD.left + innerW / 2}
          y={CHART_HEIGHT - 2}
          textAnchor="middle"
          className="score-progression-axis-title"
        >
          Spielfortschritt
        </text>
      </svg>

      <p className="score-progression-caption">
        {leaderLabel}
        {leadChanges > 0 ? ` · ${leadChanges} Führungswechsel` : " · stabile Führung"}
      </p>
    </div>
  );
}
