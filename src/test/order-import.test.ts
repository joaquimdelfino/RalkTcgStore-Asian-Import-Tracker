import { describe, expect, it, vi } from "vitest";
import { loadOnlineOrderBook } from "@/lib/order-import";
import { newOrder } from "@/lib/orders";

describe("one-time transfer to online storage", () => {
  it("never replaces an existing empty online list with browser orders", async () => {
    const online = { orders: [], version: 7 };
    const initialize = vi.fn();
    const read = vi.fn();
    const clear = vi.fn();
    expect(await loadOnlineOrderBook(async () => online, initialize, read, clear)).toEqual(online);
    expect(initialize).not.toHaveBeenCalled();
    expect(read).not.toHaveBeenCalled();
    expect(clear).not.toHaveBeenCalled();
  });
  it("transfers an intentionally empty legacy list, not six starter orders", async () => {
    const initialize = vi.fn().mockResolvedValue({ orders: [], version: 0 });
    const clear = vi.fn();
    await loadOnlineOrderBook(async () => null, initialize, () => "[]", clear);
    expect(initialize).toHaveBeenCalledWith([]);
    expect(clear).toHaveBeenCalledTimes(1);
  });
  it("uses the online starter template only when no browser orders exist", async () => {
    const initialize = vi.fn().mockResolvedValue({ orders: [newOrder("starter")], version: 0 });
    const clear = vi.fn();
    await loadOnlineOrderBook(async () => null, initialize, () => null, clear);
    expect(initialize).toHaveBeenCalledWith(null);
    expect(clear).not.toHaveBeenCalled();
  });
  it("clears browser data only after the matching transfer is confirmed online", async () => {
    const orders = [newOrder("old")];
    const clear = vi.fn();
    const initialize = vi.fn(async (input) => {
      expect(clear).not.toHaveBeenCalled();
      return { orders: input, version: 0 };
    });
    await loadOnlineOrderBook(async () => null, initialize, () => JSON.stringify(orders), clear);
    expect(initialize).toHaveBeenCalledWith(orders);
    expect(clear).toHaveBeenCalledTimes(1);
  });
  it("keeps old browser data when transfer fails", async () => {
    const clear = vi.fn();
    await expect(loadOnlineOrderBook(async () => null, async () => { throw new Error("Offline"); }, () => "[]", clear)).rejects.toThrow("Offline");
    expect(clear).not.toHaveBeenCalled();
  });
  it("blocks initialization when old data cannot be read", async () => {
    const initialize = vi.fn();
    await expect(loadOnlineOrderBook(async () => null, initialize, () => "broken", vi.fn())).rejects.toThrow();
    expect(initialize).not.toHaveBeenCalled();
    await expect(loadOnlineOrderBook(async () => null, initialize, () => { throw new Error("Blocked"); }, vi.fn())).rejects.toThrow();
    expect(initialize).not.toHaveBeenCalled();
  });
  it("keeps legacy orders if another device initialized a different online book first", async () => {
    const clear = vi.fn();
    const online = { orders: [newOrder("other-device")], version: 0 };
    expect(await loadOnlineOrderBook(async () => null, async () => online, () => "[]", clear)).toEqual(online);
    expect(clear).not.toHaveBeenCalled();
  });
});