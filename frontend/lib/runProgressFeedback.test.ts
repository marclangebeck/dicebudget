import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildProgressMilestoneAfterField,
  enteredDiceScore,
  lobbyPlayerDiceScore,
  progressScoreDeltaLabel,
  resolveProgressPosition,
  wouldCrossProgressMilestone,
} from "./runProgressFeedback.js";
import type { FieldDto, GameDto, RunDto } from "./types.js";
import type { SessionLobbyDto } from "./sessionTypes.js";

function field(partial: Partial<FieldDto> & { score: number | null }): FieldDto {
  return {
    id: partial.id ?? "f",
    fieldType: partial.fieldType ?? "ONES",
    score: partial.score,
    rollsUsed: partial.rollsUsed ?? 1,
    rolls: [],
  };
}

function game(fields: FieldDto[], index = 0): GameDto {
  return {
    id: `g${index}`,
    index,
    score: 0,
    summary: {
      upperSum: 0,
      bonus: null,
      ergebnisOben: null,
      lowerSum: 0,
      extraYatzyBonus: 0,
      gameTotal: 0,
    },
    fields,
  };
}

/** Minimaler Run: `fieldCount` Felder, davon die ersten `scoredCount` mit Score. */
function runWithProgress(
  scoredCount: number,
  fieldCount: number,
  scores: number[] = [],
): RunDto {
  const fields: FieldDto[] = [];
  for (let i = 0; i < fieldCount; i++) {
    fields.push(
      field({
        id: `f${i}`,
        score: i < scoredCount ? (scores[i] ?? 1) : null,
      }),
    );
  }
  return {
    id: "run",
    gameCount: 1,
    useStrategyRules: true,
    totalScore: 999,
    totalRollsUsed: scoredCount,
    extraYatzyCount: 0,
    rollsInPool: 0,
    rollsRemaining: null,
    status: "ACTIVE",
    createdAt: "",
    finishedAt: null,
    lastScoredFieldId: null,
    games: [game(fields)],
  };
}

function lobbyStub(
  players: { playerId: string; totalScore: number; diceScore?: number }[],
): SessionLobbyDto {
  return {
    id: "s",
    inviteCode: "ABC",
    gameCount: 1,
    maxPlayers: 2,
    useStrategyRules: true,
    showOpponentPool: false,
    poolEndgameEnabled: false,
    poolEndgameResolved: false,
    poolEndgameImproverPlayerId: null,
    status: "ACTIVE",
    createdAt: "",
    leagueCode: "L",
    roundNumber: 1,
    pointsAwarded: false,
    playerCount: players.length,
    players: players.map((p, orderIndex) => ({
      id: `row-${orderIndex}`,
      playerId: p.playerId,
      orderIndex,
      runFinished: false,
      totalScore: p.totalScore,
      diceScore: p.diceScore,
      rollsInPool: null,
    })),
    allRunsFinished: false,
    leagueStandings: [],
    joinPath: "/multi/join?code=ABC",
  };
}

describe("enteredDiceScore", () => {
  it("summiert nur Feld-Scores, nicht totalScore", () => {
    const run = runWithProgress(3, 13, [5, 10, 0]);
    run.totalScore = 50;
    assert.equal(enteredDiceScore(run), 15);
  });
});

describe("lobbyPlayerDiceScore", () => {
  it("nimmt diceScore, nie totalScore", () => {
    assert.equal(lobbyPlayerDiceScore({ diceScore: 40 }), 40);
    assert.equal(lobbyPlayerDiceScore({}), null);
  });
});

describe("resolveProgressPosition", () => {
  it("vergleicht Feldpunkte und ignoriert aufgeblasenes totalScore", () => {
    const me = runWithProgress(4, 13, [10, 10, 10, 10]);
    me.totalScore = 200;
    const lobby = lobbyStub([
      { playerId: "me", totalScore: 200, diceScore: 40 },
      { playerId: "opp", totalScore: 500, diceScore: 30 },
    ]);
    const pos = resolveProgressPosition(me, {
      kind: "lobby",
      lobby,
      ownPlayerId: "me",
    });
    assert.deepEqual(pos, { hint: "ahead", scoreDelta: 10 });
  });

  it("ohne diceScore kein Fallback auf totalScore", () => {
    const me = runWithProgress(2, 13, [20, 20]);
    const lobby = lobbyStub([
      { playerId: "me", totalScore: 40 },
      { playerId: "opp", totalScore: 999 },
    ]);
    const pos = resolveProgressPosition(me, {
      kind: "lobby",
      lobby,
      ownPlayerId: "me",
    });
    assert.equal(pos, null);
  });

  it("Tischmodus: beide Runs nur Feldpunkte", () => {
    const left = runWithProgress(3, 13, [12, 12, 12]);
    const right = runWithProgress(3, 13, [10, 10, 10]);
    left.totalScore = 100;
    right.totalScore = 100;
    const pos = resolveProgressPosition(left, {
      kind: "table",
      ownSide: "left",
      runs: { left, right },
    });
    assert.deepEqual(pos, { hint: "ahead", scoreDelta: 6 });
  });
});

describe("wouldCrossProgressMilestone / buildProgressMilestoneAfterField", () => {
  it("erkennt Kreuzung 25 % (13 Felder → 4 scored)", () => {
    const before = runWithProgress(3, 13);
    const after = runWithProgress(4, 13, [5, 5, 5, 5]);
    assert.equal(wouldCrossProgressMilestone(before, after, new Set()), 25);
  });

  it("Delta im Overlay nur aus Feldpunkten", () => {
    const before = runWithProgress(3, 13);
    const after = runWithProgress(4, 13, [10, 10, 10, 10]);
    after.totalScore = 999;
    const lobby = lobbyStub([
      { playerId: "me", totalScore: 999, diceScore: 40 },
      { playerId: "opp", totalScore: 80, diceScore: 25 },
    ]);
    const overlay = buildProgressMilestoneAfterField(before, after, new Set(), {
      kind: "lobby",
      lobby,
      ownPlayerId: "me",
    });
    assert.ok(overlay);
    assert.equal(overlay!.percent, 25);
    assert.equal(overlay!.positionHint, "ahead");
    assert.equal(overlay!.scoreDelta, 15);
    assert.equal(progressScoreDeltaLabel("ahead", 15), "15 Punkte voraus");
  });
});
