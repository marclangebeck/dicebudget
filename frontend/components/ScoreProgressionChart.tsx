"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { ScoreProgressionDto } from "@/lib/matchAnalysisTypes";
import {
  downsampleScoreProgressionPoints,
  scoreProgressionColor,
} from "@/lib/scoreProgressionChart";

type Props = {
  progression: ScoreProgressionDto;
  highlightPlayerId?: string;
  /** Volle Höhe für Landscape-Vollbild. */
  expansive?: boolean;
};

const CHART_WIDTH = 640;
const ABS_HEIGHT = 220;
const DIFF_HEIGHT = 88;
const PAD = { top: 14, right: 16, bottom: 30, left: 42 };

function buildScorePath(
  points: ScoreProgressionDto["points"],
  playerIndex: number,
  xScale: (percent: number) => number,
  yScale: (score: number) => number,
): string {
  if (points.length === 0) return "";
  return points
    .map((point, index) => {
      const cmd = index === 0 ? "M" : "L";
      const score = point.scores[playerIndex] ?? 0;
      return `${cmd}${xScale(point.turn).toFixed(1)},${yScale(score).toFixed(1)}`;
    })
    .join(" ");
}

function buildLeadPath(
  points: ScoreProgressionDto["points"],
  xScale: (percent: number) => number,
  yScale: (margin: number) => number,
): string {
  if (points.length === 0) return "";
  return points
    .map((point, index) => {
      const cmd = index === 0 ? "M" : "L";
      return `${cmd}${xScale(point.turn).toFixed(1)},${yScale(point.leadMargin).toFixed(1)}`;
    })
    .join(" ");
}

export function ScoreProgressionChart({
  progression,
  highlightPlayerId,
  expansive = false,
}: Props) {
  const { players, leadChanges, finalLeaderIndex } = progression;
  const points = downsampleScoreProgressionPoints(progression.points);
  const chartRef = useRef<HTMLDivElement>(null);
  const [cursorIndex, setCursorIndex] = useState<number | null>(null);

  const maxScore = useMemo(
    () => Math.max(...points.flatMap((p) => p.scores), 1),
    [points],
  );
  const maxLead = useMemo(
    () => Math.max(...points.map((p) => p.leadMargin), 1),
    [points],
  );

  const innerW = CHART_WIDTH - PAD.left - PAD.right;
  const absInnerH = ABS_HEIGHT - PAD.top - PAD.bottom;
  const diffInnerH = DIFF_HEIGHT - PAD.top - PAD.bottom;

  const xScale = (percent: number) => PAD.left + (percent / 100) * innerW;
  const yScore = (score: number) =>
    PAD.top + absInnerH - (score / maxScore) * absInnerH;
  const yLead = (margin: number) =>
    PAD.top + diffInnerH - (margin / maxLead) * diffInnerH;

  const yTicks = [0, Math.round(maxScore / 2), maxScore];
  const leadTicks = [0, maxLead];
  const xTicks = [0, 25, 50, 75, 100];

  const finalLeaderName =
    finalLeaderIndex != null ? players[finalLeaderIndex]?.name : null;

  const activePoint =
    cursorIndex != null && cursorIndex >= 0 && cursorIndex < points.length
      ? points[cursorIndex]
      : points[points.length - 1]!;

  const resolveIndexFromClientX = useCallback(
    (clientX: number) => {
      const root = chartRef.current;
      if (!root || points.length === 0) return null;
      const svg = root.querySelector("svg");
      if (!svg) return null;
      const rect = svg.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const viewX = ratio * CHART_WIDTH;
      const percent = ((viewX - PAD.left) / innerW) * 100;
      let best = 0;
      let bestDist = Infinity;
      points.forEach((point, index) => {
        const dist = Math.abs(point.turn - percent);
        if (dist < bestDist) {
          bestDist = dist;
          best = index;
        }
      });
      return best;
    },
    [innerW, points],
  );

  function onPointer(e: React.PointerEvent<HTMLElement>) {
    const index = resolveIndexFromClientX(e.clientX);
    if (index != null) setCursorIndex(index);
  }

  if (points.length < 2 || players.length < 2) return null;

  const leaderAtCursor = activePoint.leaderIndex;
  const leaderNameAtCursor =
    leaderAtCursor != null ? players[leaderAtCursor]?.name : "Gleichstand";
  const leadColor =
    leaderAtCursor != null
      ? scoreProgressionColor(leaderAtCursor)
      : "rgba(148, 163, 184, 0.65)";

  return (
    <div
      ref={chartRef}
      className={`score-progression-chart${expansive ? " score-progression-chart--expansive" : ""}`}
      onPointerDown={onPointer}
      onPointerMove={onPointer}
      onPointerLeave={() => setCursorIndex(null)}
    >
      <div className="score-progression-legend">
        {players.map((player, index) => {
          const emphasis = highlightPlayerId === player.id;
          return (
            <span
              key={player.id}
              className={`score-progression-legend-item${emphasis ? " score-progression-legend-item--emphasis" : ""}`}
            >
              <span
                className="score-progression-swatch"
                style={{ background: scoreProgressionColor(index) }}
                aria-hidden
              />
              {player.name}
            </span>
          );
        })}
      </div>

      <div className="score-progression-readout tabular-nums" aria-live="polite">
        <span className="score-progression-readout-pct">{activePoint.turn}%</span>
        <span className="score-progression-readout-lead" style={{ color: leadColor }}>
          {leaderAtCursor != null
            ? `${leaderNameAtCursor} +${activePoint.leadMargin}`
            : "Gleichstand"}
        </span>
        <span className="score-progression-readout-scores">
          {players.map((player, index) => (
            <span key={player.id}>
              {index > 0 ? " · " : ""}
              <span style={{ color: scoreProgressionColor(index) }}>
                {activePoint.scores[index] ?? 0}
              </span>
            </span>
          ))}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${ABS_HEIGHT}`}
        className="score-progression-svg score-progression-svg--abs"
        role="img"
        aria-label="Punkteverlauf aller Spieler"
      >
        <rect
          x={PAD.left}
          y={PAD.top}
          width={innerW}
          height={absInnerH}
          className="score-progression-plot-bg"
          rx="8"
        />

        {yTicks.map((tick) => (
          <g key={`y-${tick}`}>
            <line
              x1={PAD.left}
              x2={PAD.left + innerW}
              y1={yScore(tick)}
              y2={yScore(tick)}
              className="score-progression-grid-line"
            />
            <text
              x={PAD.left - 8}
              y={yScore(tick) + 4}
              textAnchor="end"
              className="score-progression-axis-label"
            >
              {tick}
            </text>
          </g>
        ))}

        {xTicks.map((tick) => (
          <text
            key={`x-abs-${tick}`}
            x={xScale(tick)}
            y={ABS_HEIGHT - 8}
            textAnchor="middle"
            className="score-progression-axis-label"
          >
            {tick}%
          </text>
        ))}

        {players.map((player, index) => (
          <path
            key={`line-${player.id}`}
            d={buildScorePath(points, index, xScale, yScore)}
            className="score-progression-line"
            style={{ stroke: scoreProgressionColor(index) }}
            fill="none"
          />
        ))}

        {points.map((point, pointIndex) =>
          point.leaderIndex != null &&
          pointIndex > 0 &&
          points[pointIndex - 1]?.leaderIndex != null &&
          points[pointIndex - 1]!.leaderIndex !== point.leaderIndex ? (
            <line
              key={`lead-change-${point.turn}`}
              x1={xScale(point.turn)}
              x2={xScale(point.turn)}
              y1={PAD.top}
              y2={PAD.top + absInnerH}
              className="score-progression-lead-change"
            />
          ) : null,
        )}

        {cursorIndex != null && (
          <line
            x1={xScale(activePoint.turn)}
            x2={xScale(activePoint.turn)}
            y1={PAD.top}
            y2={PAD.top + absInnerH}
            className="score-progression-cursor"
          />
        )}

        {players.map((player, index) => (
          <circle
            key={`dot-${player.id}`}
            cx={xScale(activePoint.turn)}
            cy={yScore(activePoint.scores[index] ?? 0)}
            r={cursorIndex != null ? 4.5 : 3.2}
            className="score-progression-dot"
            style={{ fill: scoreProgressionColor(index) }}
          />
        ))}
      </svg>

      <p className="score-progression-panel-label">Vorsprung des Führenden</p>
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${DIFF_HEIGHT}`}
        className="score-progression-svg score-progression-svg--diff"
        role="img"
        aria-label="Führungsvorsprung in Punkten"
      >
        <rect
          x={PAD.left}
          y={PAD.top}
          width={innerW}
          height={diffInnerH}
          className="score-progression-plot-bg"
          rx="8"
        />

        {leadTicks.map((tick) => (
          <g key={`lead-y-${tick}`}>
            <line
              x1={PAD.left}
              x2={PAD.left + innerW}
              y1={yLead(tick)}
              y2={yLead(tick)}
              className="score-progression-grid-line"
            />
            <text
              x={PAD.left - 8}
              y={yLead(tick) + 4}
              textAnchor="end"
              className="score-progression-axis-label"
            >
              {tick}
            </text>
          </g>
        ))}

        {points.map((point, index) => {
          if (index === 0) return null;
          const prev = points[index - 1]!;
          const x1 = xScale(prev.turn);
          const x2 = xScale(point.turn);
          const y1 = yLead(prev.leadMargin);
          const yZero = yLead(0);
          const y2 = yLead(point.leadMargin);
          const color =
            point.leaderIndex != null
              ? scoreProgressionColor(point.leaderIndex)
              : "rgba(148, 163, 184, 0.35)";
          return (
            <polygon
              key={`band-${point.turn}`}
              points={`${x1},${yZero} ${x1},${y1} ${x2},${y2} ${x2},${yZero}`}
              fill={color}
              opacity={0.35}
            />
          );
        })}

        <path
          d={buildLeadPath(points, xScale, yLead)}
          className="score-progression-line score-progression-line--lead"
          style={{ stroke: leadColor }}
          fill="none"
        />

        {cursorIndex != null && (
          <line
            x1={xScale(activePoint.turn)}
            x2={xScale(activePoint.turn)}
            y1={PAD.top}
            y2={PAD.top + diffInnerH}
            className="score-progression-cursor"
          />
        )}
      </svg>

      <p className="score-progression-caption">
        {finalLeaderName ? `${finalLeaderName} vorn` : "Remis am Ende"}
        {leadChanges > 0 ? ` · ${leadChanges} Führungswechsel` : " · stabile Führung"}
        {" · Finger auf dem Chart für Zwischenstand"}
      </p>
    </div>
  );
}
