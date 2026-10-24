import { readOrders, type Order, type OrderBook } from "./orders";

// Called only after hydration and sign-in; existing online data always wins.
export async function loadOnlineOrderBook(
  getOnline: () => Promise<OrderBook | null>,
  initialize: (orders: Order[] | null) => Promise<OrderBook>,
  readLegacy: () => string | null,
  clearLegacy: () => void,
): Promise<OrderBook> {
  const online = await getOnline();
  if (online) return online;
  let legacy: string | null;
  try { legacy = readLegacy(); }
  catch { throw new Error("Não foi possível ler os pedidos antigos. Nenhum pedido foi substituído."); }
  const imported = legacy === null ? null : readOrders(legacy);
  const result = await initialize(imported);
  if (imported !== null && JSON.stringify(result.orders) === JSON.stringify(imported)) {
    try { clearLegacy(); } catch { /* The confirmed online copy remains authoritative. */ }
  }
  return result;
}