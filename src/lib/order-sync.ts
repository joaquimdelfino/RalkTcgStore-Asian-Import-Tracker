import type { Order, OrderBook } from "./orders";

export type SyncState = "saved" | "saving" | "error" | "conflict";
type SaveResult = { conflict: true } | { conflict: false; book: OrderBook };

// Serialize snapshots and compare versions so slower requests cannot undo newer edits.
export class OrderSync {
  private desired: Order[];
  private confirmed: Order[];
  private version: number;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private running = false;
  private disposed = false;
  private blocked = false;
  constructor(book: OrderBook, private save: (book: OrderBook) => Promise<SaveResult>, private notify: (state: SyncState) => void) {
    this.desired = this.confirmed = book.orders;
    this.version = book.version;
  }
  change(orders: Order[]) {
    this.desired = orders;
    if (this.blocked || this.disposed) return;
    this.notify("saving");
    clearTimeout(this.timer);
    this.timer = setTimeout(() => { void this.flush(); }, 400);
  }
  retry() { this.blocked = false; void this.flush(); }
  async flush() {
    clearTimeout(this.timer);
    if (this.running || this.disposed || this.blocked) return;
    this.running = true;
    this.notify("saving");
    try {
      while (this.desired !== this.confirmed && !this.disposed) {
        const snapshot = this.desired;
        const result = await this.save({ orders: snapshot, version: this.version });
        if (this.disposed) return;
        if (result.conflict) { this.blocked = true; this.notify("conflict"); return; }
        this.version = result.book.version;
        this.confirmed = snapshot;
      }
      if (!this.disposed) this.notify("saved");
    } catch { if (!this.disposed) { this.blocked = true; this.notify("error"); } }
    finally { this.running = false; }
  }
  dispose() { this.disposed = true; clearTimeout(this.timer); }
}