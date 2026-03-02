import { describe, it, expect } from "vitest";
import { ORDER_STATUS_TRANSITIONS } from "@/lib/data/admin-orders";
import type { OrderStatus } from "@/lib/db/schema";

describe("ORDER_STATUS_TRANSITIONS", () => {
  it("pending peut aller vers confirmed et cancelled", () => {
    expect(ORDER_STATUS_TRANSITIONS.pending).toContain("confirmed");
    expect(ORDER_STATUS_TRANSITIONS.pending).toContain("cancelled");
  });

  it("delivered est un état final (pas de transitions)", () => {
    expect(ORDER_STATUS_TRANSITIONS.delivered).toHaveLength(0);
  });

  it("cancelled est un état final", () => {
    expect(ORDER_STATUS_TRANSITIONS.cancelled).toHaveLength(0);
  });

  it("confirmed → shipped ou cancelled", () => {
    expect(ORDER_STATUS_TRANSITIONS.confirmed).toContain("shipped");
    expect(ORDER_STATUS_TRANSITIONS.confirmed).toContain("cancelled");
  });

  it("shipped → delivered uniquement", () => {
    expect(ORDER_STATUS_TRANSITIONS.shipped).toEqual(["delivered"]);
  });
});
