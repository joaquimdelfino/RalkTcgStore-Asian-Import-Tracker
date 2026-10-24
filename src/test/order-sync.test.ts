import { afterEach, describe, expect, it, vi } from "vitest";
import { OrderSync } from "@/lib/order-sync";
import { newOrder, validateOrderBook } from "@/lib/orders";

afterEach(() => vi.useRealTimers());
describe("online order persistence", () => {
  it("accepts an empty online book without restoring starter orders", () => {
    expect(validateOrderBook({ orders: [], version: 3 })).toEqual({ orders: [], version: 3 });
  });
  it("rejects unreadable online orders before they can be overwritten", () => {
    expect(() => validateOrderBook({ orders: [{ status: "Outro" }], version: 0 })).toThrow();
  });
  it("saves edits online with the last confirmed version", async () => {
    const orders = [newOrder("online")];
    const save = vi.fn().mockResolvedValue({ conflict: false, book: { orders, version: 5 } });
    const notify = vi.fn();
    const sync = new OrderSync({ orders: [], version: 4 }, save, notify);
    sync.change(orders);
    await sync.flush();
    expect(save).toHaveBeenCalledWith({ orders, version: 4 });
    expect(notify).toHaveBeenLastCalledWith("saved");
    sync.dispose();
  });
  it("serializes rapid edits so an older save cannot undo a newer edit", async () => {
    const first = [newOrder("first")];
    const latest = [newOrder("latest")];
    let resolveFirst: ((value: { conflict: false; book: { orders: typeof first; version: number } }) => void) | undefined;
    const save = vi.fn().mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }))
      .mockResolvedValueOnce({ conflict: false, book: { orders: latest, version: 2 } });
    const sync = new OrderSync({ orders: [], version: 0 }, save, vi.fn());
    sync.change(first);
    const flushing = sync.flush();
    sync.change(latest);
    await sync.flush();
    expect(save).toHaveBeenCalledTimes(1);
    if (!resolveFirst) throw new Error("Missing pending save");
    resolveFirst({ conflict: false, book: { orders: first, version: 1 } });
    await flushing;
    expect(save.mock.calls[1]?.[0]).toEqual({ orders: latest, version: 1 });
    sync.dispose();
  });
  it("does not overwrite newer online orders after a version conflict", async () => {
    const save = vi.fn().mockResolvedValue({ conflict: true });
    const notify = vi.fn();
    const sync = new OrderSync({ orders: [], version: 0 }, save, notify);
    sync.change([newOrder("stale")]);
    await sync.flush();
    expect(notify).toHaveBeenLastCalledWith("conflict");
    sync.change([newOrder("still-stale")]);
    await sync.flush();
    expect(save).toHaveBeenCalledTimes(1);
    sync.dispose();
  });
  it("retains failed edits and reports saved only after online confirmation", async () => {
    const orders = [newOrder("retry")];
    const save = vi.fn().mockRejectedValueOnce(new Error("Offline"))
      .mockResolvedValueOnce({ conflict: false, book: { orders, version: 1 } });
    const notify = vi.fn();
    const sync = new OrderSync({ orders: [], version: 0 }, save, notify);
    sync.change(orders);
    await sync.flush();
    expect(notify).toHaveBeenLastCalledWith("error");
    sync.retry();
    await vi.waitFor(() => expect(notify).toHaveBeenLastCalledWith("saved"));
    expect(save.mock.calls[1]?.[0]).toEqual({ orders, version: 0 });
    sync.dispose();
  });
  it("cancels queued edits when an account is removed", async () => {
    vi.useFakeTimers();
    const save = vi.fn();
    const sync = new OrderSync({ orders: [], version: 0 }, save, vi.fn());
    sync.change([newOrder("private")]);
    sync.dispose();
    await vi.runAllTimersAsync();
    expect(save).not.toHaveBeenCalled();
  });
});