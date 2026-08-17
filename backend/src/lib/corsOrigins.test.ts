import assert from "node:assert/strict";
import { describe, it } from "node:test";
import request from "supertest";
import { createApp } from "../app.js";
import { isAllowedCorsOrigin } from "./corsOrigins.js";

describe("isAllowedCorsOrigin", () => {
  it("erlaubt Capacitor-https://localhost", () => {
    assert.equal(isAllowedCorsOrigin("https://localhost"), true);
  });

  it("erlaubt Tournament-Dev", () => {
    assert.equal(isAllowedCorsOrigin("http://127.0.0.1:3022"), true);
  });

  it("lehnt fremde Origins ab", () => {
    assert.equal(isAllowedCorsOrigin("https://evil.example"), false);
  });
});

describe("CORS preflight", () => {
  const app = createApp();

  it("setzt Allow-Origin für https://localhost", async () => {
    const res = await request(app)
      .options("/tournaments")
      .set("Origin", "https://localhost")
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "content-type")
      .expect(204);
    assert.equal(res.headers["access-control-allow-origin"], "https://localhost");
    assert.equal(res.headers["cross-origin-resource-policy"], "cross-origin");
  });
});
