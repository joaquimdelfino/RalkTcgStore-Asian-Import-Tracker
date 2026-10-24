export type OrderStatus = "Pendente" | "Entregue";
export type Order = {
  id: string;
  code: string;
  content: string;
  status: OrderStatus;
  arrival: string;
  notes: string;
};

export const STORAGE_KEY = "aliexpress-orders-v1";
export const initialOrders: Order[] = ([
  ["82145214", "25 m2a"],
  ["82147159", "25 m2a"],
  ["82147158", "25 m2a"],
  ["82145005", "25 m2a e 2 m6"],
  ["82142441", "25 m2a"],
  ["82145473", "15 m6a chines"],
] as const).map(([code, content], index) => ({
  id: `initial-${index}`, code, content, status: "Pendente", arrival: "", notes: "",
}));

export function newOrder(id: string): Order {
  return { id, code: "", content: "", status: "Pendente", arrival: "", notes: "" };
}

export function summarizeOrders(orders: Order[]) {
  return { total: orders.length, delivered: orders.filter((order) => order.status === "Entregue").length };
}

export function readOrders(value: string | null): Order[] {
  if (value === null) return initialOrders.map((order) => ({ ...order }));
  const parsed: unknown = JSON.parse(value);
  return validateOrders(parsed);
}

export function validateOrders(parsed: unknown): Order[] {
  if (!Array.isArray(parsed) || !parsed.every((item) => item && typeof item === "object" &&
    ["id", "code", "content", "arrival", "notes"].every((key) => typeof item[key] === "string") &&
    (item.status === "Pendente" || item.status === "Entregue"))) {
    throw new Error("Os pedidos salvos não puderam ser lidos.");
  }
  if (new Set(parsed.map((item) => item.id)).size !== parsed.length) {
    throw new Error("Há pedidos com identificadores repetidos.");
  }
  return parsed as Order[];
}

export type OrderBook = { orders: Order[]; version: number };

export function validateOrderBook(value: { orders: unknown; version: number }): OrderBook {
  if (!Number.isSafeInteger(value.version) || value.version < 0) throw new Error("Versão de pedidos inválida.");
  return { orders: validateOrders(value.orders), version: value.version };
}