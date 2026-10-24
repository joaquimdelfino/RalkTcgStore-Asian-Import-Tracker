import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { validateOrderBook, validateOrders } from "./orders";

export const getOrderBook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { ownerId: string }) => ({ ownerId: z.string().uuid().parse(input.ownerId) }))
  .handler(async ({ data: input, context }) => {
    if (input.ownerId !== context.userId) throw new Error("A conta mudou. Entre novamente.");
    const { data, error } = await context.supabase.from("order_books")
      .select("orders, version").eq("user_id", context.userId).maybeSingle();
    if (error) throw new Error("Não foi possível carregar os pedidos online.");
    return data ? validateOrderBook(data) : null;
  });

export const initializeOrderBook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { orders: unknown | null; ownerId: string }) => ({ orders: input.orders === null ? null : validateOrders(input.orders), ownerId: z.string().uuid().parse(input.ownerId) }))
  .handler(async ({ data, context }) => {
    if (data.ownerId !== context.userId) throw new Error("A conta mudou. Entre novamente.");
    const { data: rows, error } = await context.supabase.rpc("initialize_order_book", {
      ...(data.orders === null ? {} : { legacy_orders: data.orders }),
    });
    const row = rows?.[0];
    if (error || !row) throw new Error("Não foi possível transferir os pedidos para a sua conta.");
    return validateOrderBook(row);
  });

export const saveOrderBook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { orders: unknown; version: number; ownerId: string }) => ({
    orders: validateOrders(input.orders), version: z.number().int().nonnegative().parse(input.version), ownerId: z.string().uuid().parse(input.ownerId),
  }))
  .handler(async ({ data, context }) => {
    if (data.ownerId !== context.userId) throw new Error("A conta mudou. Entre novamente para salvar seus pedidos.");
    const { data: row, error } = await context.supabase.from("order_books")
      .update({ orders: data.orders }).eq("user_id", context.userId).eq("version", data.version)
      .select("orders, version").maybeSingle();
    if (error) throw new Error("Não foi possível salvar online. Tente novamente.");
    if (!row) return { conflict: true as const };
    return { conflict: false as const, book: validateOrderBook(row) };
  });