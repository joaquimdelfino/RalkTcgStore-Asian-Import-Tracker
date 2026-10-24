import { useEffect, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getOrderBook, initializeOrderBook, saveOrderBook } from "@/lib/orders.functions";
import { STORAGE_KEY, type Order } from "@/lib/orders";
import { OrderSync, type SyncState } from "@/lib/order-sync";
import { loadOnlineOrderBook } from "@/lib/order-import";

export function useOnlineOrders(userId: string) {
  const { data: book } = useSuspenseQuery({
    queryKey: ["online-orders", userId],
    queryFn: () => loadOnlineOrderBook(
      () => getOrderBook({ data: { ownerId: userId } }),
      (orders) => initializeOrderBook({ data: { orders, ownerId: userId } }),
      () => localStorage.getItem(STORAGE_KEY),
      () => localStorage.removeItem(STORAGE_KEY),
    ),
    retry: false,
    staleTime: Infinity,
  });
  const [orders, setOrders] = useState(book.orders);
  const [syncState, setSyncState] = useState<SyncState>("saved");
  const [sync] = useState(() => new OrderSync(book,
    (next) => saveOrderBook({ data: { ...next, ownerId: userId } }), setSyncState));
  useEffect(() => () => sync.dispose(), [sync]);
  useEffect(() => {
    if (syncState === "saved") return;
    const preventClose = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", preventClose);
    return () => window.removeEventListener("beforeunload", preventClose);
  }, [syncState]);
  function commit(next: Order[]) { setOrders(next); sync.change(next); }
  return { orders, commit, syncState, retry: () => sync.retry() };
}