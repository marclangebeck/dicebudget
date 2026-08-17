import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import request from "supertest";
import { createApp } from "../app.js";
import { prisma } from "../db/prisma.js";
import { normalizeDisplayName } from "./playerDisplayNames.js";

describe("player display names", () => {
  const app = createApp();
  const playerId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

  before(async () => {
    await prisma.playerDisplayName.deleteMany();
  });

  after(async () => {
    await prisma.playerDisplayName.deleteMany();
  });

  it("normalisiert den Anzeigenamen", () => {
    assert.equal(normalizeDisplayName("  Mara   K.  "), "Mara K.");
  });

  it("legt Name an, schützt Updates und liefert Lookup", async () => {
    const created = await request(app)
      .put("/player-names/display")
      .send({ playerId, displayName: "Mara" })
      .expect(200);

    assert.equal(created.body.displayName, "Mara");
    assert.ok(created.body.nameToken);

    await request(app)
      .put("/player-names/display")
      .send({ playerId, displayName: "Andere" })
      .expect(403);

    const updated = await request(app)
      .put("/player-names/display")
      .set("X-Name-Token", created.body.nameToken as string)
      .send({ playerId, displayName: "Mara K" })
      .expect(200);

    assert.equal(updated.body.displayName, "Mara K");

    const listed = await request(app)
      .get(`/player-names/display?ids=${playerId}`)
      .expect(200);

    assert.equal(listed.body.names[playerId], "Mara K");
    assert.equal(listed.body.names[playerId + "missing"], undefined);
  });

  it("lehnt ungültige Namen ab", async () => {
    await request(app)
      .put("/player-names/display")
      .send({ playerId, displayName: "<script>" })
      .expect(400);
  });
});
