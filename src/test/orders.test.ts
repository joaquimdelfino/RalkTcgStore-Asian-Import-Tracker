import { describe, expect, it } from "vitest";
import { initialOrders, newOrder, readOrders, summarizeOrders } from "../lib/orders";

describe("order rules", () => {
  it("starts with the six requested pending orders", () => {
    expect(readOrders(null).map(({ code, content, status }) => ({ code, content, status }))).toEqual([
      { code: "82145214", content: "25 m2a", status: "Pendente" },
      { code: "82147159", content: "25 m2a", status: "Pendente" },
      { code: "82147158", content: "25 m2a", status: "Pendente" },
      { code: "82145005", content: "25 m2a e 2 m6", status: "Pendente" },
      { code: "82142441", content: "25 m2a", status: "Pendente" },
      { code: "82145473", content: "15 m6a chines", status: "Pendente" },
    ]);
  });
  it("counts all rows and only delivered orders", () => {
    expect(summarizeOrders(initialOrders)).toEqual({ total: 6, delivered: 0 });
    expect(summarizeOrders(initialOrders.map((order, index) => index === 0 ? { ...order, status: "Entregue" } : order))).toEqual({ total: 6, delivered: 1 });
  });
  it("creates a blank pending order at the top", () => {
    const rows = [newOrder("new"), ...initialOrders];
    expect(rows[0]).toEqual({ id: "new", code: "", content: "", status: "Pendente", arrival: "", notes: "" });
    expect(rows[1]?.code).toBe("82145214");
  });
  it("preserves edits when reading persisted data", () => {
    const original = initialOrders[0];
    if (!original) throw new Error("Missing initial order");
    const edited = [{ ...original, content: "Novo item", notes: "Recebido", status: "Entregue" as const, arrival: "2026-10-11" }];
    expect(readOrders(JSON.stringify(edited))).toEqual(edited);
  });
  it("does not restore deleted orders in an empty saved list", () => {
    expect(readOrders("[]")).toEqual([]);
  });
  it("rejects invalid stored data rather than silently overwriting", () => {
    expect(() => readOrders('[{"status":"Outro"}]')).toThrow();
  });
});