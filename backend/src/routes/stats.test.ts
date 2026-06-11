import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import express from "express";
import { statsRouter } from "./stats.js";

const TEST_ADMIN_KEY = "test-admin-key-m23";

function createStatsApp(): express.Express {
  const app = express();
  app.use(express.json());
  app.use("/stats", statsRouter);
  return app;
}

async function postJson(
  app: express.Express,
  path: string,
  body: unknown,
  headers: Record<string, string> = {},
): Promise<{ status: number; body: { error?: string } }> {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const { port } = server.address() as { port: number };
      void fetch(`http://127.0.0.1:${port}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(body),
      })
        .then(async (res) => {
          const text = await res.text();
          let parsed: { error?: string } = {};
          if (text) parsed = JSON.parse(text) as { error?: string };
          server.close(() => resolve({ status: res.status, body: parsed }));
        })
        .catch((err) => {
          server.close(() => reject(err));
        });
    });
  });
}

describe("stats admin auth", () => {
  const previousKey = process.env.ADMIN_API_KEY;

  before(() => {
    process.env.ADMIN_API_KEY = TEST_ADMIN_KEY;
  });

  after(() => {
    process.env.ADMIN_API_KEY = previousKey;
  });

  it("rejects pairings reset without admin key", async () => {
    const app = createStatsApp();
    const res = await postJson(app, "/stats/pairings/reset", { keys: ["a::b"] });
    assert.equal(res.status, 401);
    assert.match(res.body.error ?? "", /admin api key/i);
  });

  it("rejects pairings baseline without admin key", async () => {
    const app = createStatsApp();
    const res = await postJson(app, "/stats/pairings/baseline", {
      entries: [
        {
          key: "a::b",
          extraWinsA: 0,
          extraWinsB: 0,
          extraBonusA: 0,
          extraBonusB: 0,
        },
      ],
    });
    assert.equal(res.status, 401);
  });

  it("accepts pairings reset with valid admin key", async () => {
    const app = createStatsApp();
    const res = await postJson(
      app,
      "/stats/pairings/reset",
      { keys: ["nonexistent::pairing"] },
      { "X-Admin-Key": TEST_ADMIN_KEY },
    );
    assert.equal(res.status, 200);
  });
});

describe("stats admin auth without configured key", () => {
  const previousKey = process.env.ADMIN_API_KEY;

  before(() => {
    process.env.ADMIN_API_KEY = "";
  });

  after(() => {
    process.env.ADMIN_API_KEY = previousKey;
  });

  it("returns 503 when ADMIN_API_KEY is not set", async () => {
    const app = createStatsApp();
    const res = await postJson(app, "/stats/pairings/reset", { keys: ["a::b"] });
    assert.equal(res.status, 503);
    assert.match(res.body.error ?? "", /not configured/i);
  });
});
