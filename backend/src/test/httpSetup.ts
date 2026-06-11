import request from "supertest";
import { createApp } from "../app.js";

export function createTestApp() {
  return createApp();
}

export { request };
