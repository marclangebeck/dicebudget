import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { createTestApp, request } from "../test/httpSetup.js";

const TEST_ADMIN_KEY = "test-admin-key-m23";

describe("stats admin auth", () => {
  const previousKey = process.env.ADMIN_API_KEY;

  before(() => {
    process.env.ADMIN_API_KEY = TEST_ADMIN_KEY;
  });

  after(() => {
    process.env.ADMIN_API_KEY = previousKey;
  });

  it("rejects pairings reset without admin key", async () => {
    const app = createTestApp();
    const res = await request(app)
      .post("/stats/pairings/reset")
      .send({ keys: ["a::b"] });
    assert.equal(res.status, 401);
    assert.match(res.body.error ?? "", /admin api key/i);
  });

  it("rejects pairings baseline without admin key", async () => {
    const app = createTestApp();
    const res = await request(app)
      .post("/stats/pairings/baseline")
      .send({
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
    const app = createTestApp();
    const res = await request(app)
      .post("/stats/pairings/reset")
      .set("X-Admin-Key", TEST_ADMIN_KEY)
      .send({ keys: ["nonexistent::pairing"] });
    assert.equal(res.status, 200);
  });

  it("GET /stats returns aggregate payload", async () => {
    const app = createTestApp();
    const res = await request(app).get("/stats");
    assert.equal(res.status, 200);
    assert.ok(typeof res.body.stats?.finishedRuns === "number");
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
    const app = createTestApp();
    const res = await request(app)
      .post("/stats/pairings/reset")
      .send({ keys: ["a::b"] });
    assert.equal(res.status, 503);
    assert.match(res.body.error ?? "", /not configured/i);
  });
});
