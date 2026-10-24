import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { Component, Suspense, useState, type ReactNode } from "react";
import { Check, CircleCheck, CloudOff, Hash, Package, Plus, Trash2, LoaderCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { OrderDatePicker } from "@/components/order-date-picker";
import { newOrder, summarizeOrders, type Order, type OrderStatus } from "@/lib/orders";
import { useAccount } from "@/components/account-provider";
import { AccountSignIn } from "@/components/account-sign-in";
import { OrdersHeader } from "@/components/orders-header";
import { useOnlineOrders } from "@/hooks/use-online-orders";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({ meta: [
    { title: "Pedidos de Importações da China | Controle de pedidos" },
    { name: "description", content: "Gerencie seus pedidos de importações da China, acompanhe entregas, datas de chegada e observações com salvamento online na sua conta." },
    { property: "og:title", content: "Pedidos de Importações da China | Controle de pedidos" },
    { property: "og:description", content: "Pedidos de importações da China, conteúdo dos pacotes e entregas organizados em um só lugar." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
});

function Index() {
  const { user, loading } = useAccount();
  if (loading) return <LoadingOrders />;
  if (!user) return <div className="min-h-screen"><OrdersHeader /><main className="page-container main-content"><h1 className="page-title">Pedidos de Importações da China</h1><AccountSignIn /></main></div>;
  return <OnlineErrorBoundary key={user.id}><ClientOnly fallback={<LoadingOrders />}><Suspense fallback={<LoadingOrders />}><OnlineOrders key={user.id} userId={user.id} /></Suspense></ClientOnly></OnlineErrorBoundary>;
}

function LoadingOrders() {
  return <div className="min-h-screen"><OrdersHeader /><main className="page-container main-content"><h1 className="page-title">Pedidos de Importações da China</h1><div role="status" className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" />Carregando pedidos online…</div></main></div>;
}

class OnlineErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  override state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  override render() {
    if (!this.state.error) return this.props.children;
    return <div className="min-h-screen"><OrdersHeader /><main className="page-container main-content"><h1 className="page-title">Pedidos de Importações da China</h1><div className="py-16 text-center"><p role="alert" className="text-sm text-destructive">{this.state.error.message}</p><Button variant="outline" className="mt-5" onClick={() => window.location.reload()}><RefreshCw />Tentar novamente</Button></div></main></div>;
  }
}

function OnlineOrders({ userId }: { userId: string }) {
  const { orders, commit, syncState, retry } = useOnlineOrders(userId);
  const ready = syncState !== "error" && syncState !== "conflict";
  const storageError = syncState === "error" || syncState === "conflict";
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  function update(id: string, patch: Partial<Order>) {
    commit(orders.map((order) => order.id === id ? { ...order, ...patch } : order));
  }
  function add() {
    const id = crypto.randomUUID();
    setFocusId(id);
    commit([newOrder(id), ...orders]);
  }
  const summary = summarizeOrders(orders);
  const pending = summary.total - summary.delivered;
  const percentage = summary.total ? Math.round(summary.delivered / summary.total * 100) : 0;
  const deleting = orders.find((order) => order.id === deleteId);
  return <div className="min-h-screen">
    <OrdersHeader canSignOut={syncState === "saved"} />
    <main className="page-container main-content">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="page-title">Pedidos de Importações da China</h1>
        <Button onClick={add} disabled={!ready} className="h-10 gap-2 px-4 shadow-none"><Plus className="size-4" />Novo pedido</Button>
      </div>
      <section className="summary-grid" aria-label="Resumo dos pedidos">
        <div className="summary-metric">
          <span className="text-xs text-muted-foreground">Total de pedidos</span>
          <div className="mt-2 text-3xl font-semibold tabular-nums" data-testid="total-count">{summary.total}</div>
          <div className="mt-2 text-xs text-muted-foreground">{pending} aguardando entrega</div>
        </div>
        <div className="summary-metric">
          <span className="text-xs text-muted-foreground">Entregues</span>
          <div className="mt-2 text-3xl font-semibold tabular-nums" data-testid="delivered-count">{summary.delivered}</div>
          <div className="mt-2 text-xs text-muted-foreground">{percentage}% recebidos</div>
        </div>
      </section>
      <section aria-label="Pedidos">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-sm font-semibold">Pedidos</h2><div role="status" className={`flex items-center gap-1.5 text-xs ${storageError ? "text-destructive" : "text-muted-foreground"}`}>{storageError ? <CloudOff className="size-3.5" /> : syncState === "saving" ? <LoaderCircle className="size-3.5 animate-spin" /> : <CircleCheck className="size-3.5" />}<span>{syncState === "conflict" ? "Pedidos alterados em outro dispositivo" : syncState === "error" ? "Alterações não salvas. Verifique sua conexão." : syncState === "saving" ? "Salvando online…" : "Salvo online"}</span>{syncState === "error" && <Button variant="ghost" size="icon" title="Tentar salvar novamente" aria-label="Tentar salvar novamente" onClick={retry}><RefreshCw /></Button>}</div></div>
        {syncState === "conflict" && <div role="alert" className="mb-4 flex flex-wrap items-center gap-3 text-sm text-destructive"><span>Suas edições não foram salvas para evitar substituir os pedidos mais recentes.</span><Button variant="outline" onClick={() => { if (window.confirm("Suas alterações não salvas serão descartadas. Carregar os pedidos online mais recentes?")) window.location.reload(); }}><RefreshCw />Carregar pedidos online</Button></div>}
        <div className="orders-table-shell">
          <table className="orders-table">
            <colgroup><col className="w-[5%]" /><col className="w-[16%]" /><col className="w-[22%]" /><col className="w-[16%]" /><col className="w-[16%]" /><col className="w-[20%]" /><col className="w-[5%]" /></colgroup>
            <thead><tr><th><Hash className="size-3" aria-label="Número" /></th><th>Código do pedido</th><th>Conteúdo</th><th>Status</th><th>Data de chegada</th><th>Observações</th><th><span className="sr-only">Ação</span></th></tr></thead>
            <tbody>{orders.map((order, index) => <tr key={order.id}>
              <td className="text-center text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</td>
              <td><input className="cell-input font-medium" aria-label={`Código do pedido ${index + 1}`} value={order.code} placeholder="Código do pedido" disabled={!ready} ref={(element) => { if (element && focusId === order.id) { element.focus(); setFocusId(null); } }} onChange={(event) => update(order.id, { code: event.target.value })} /></td>
              <td><input className="cell-input" aria-label={`Conteúdo do pedido ${index + 1}`} value={order.content} placeholder="Itens do pacote" disabled={!ready} onChange={(event) => update(order.id, { content: event.target.value })} /></td>
              <td><Select value={order.status} disabled={!ready} onValueChange={(status: OrderStatus) => update(order.id, { status })}><SelectTrigger className="status-trigger" data-status={order.status} aria-label={`Status do pedido ${index + 1}`}><SelectValue><span className="status-dot" />{order.status}</SelectValue></SelectTrigger><SelectContent><SelectItem value="Pendente">Pendente</SelectItem><SelectItem value="Entregue">Entregue</SelectItem></SelectContent></Select></td>
              <td><OrderDatePicker disabled={!ready} value={order.arrival} label={`Data de chegada do pedido ${index + 1}`} onChange={(arrival) => update(order.id, { arrival })} /></td>
              <td><input className="cell-input" aria-label={`Observações do pedido ${index + 1}`} value={order.notes} placeholder="Adicionar observação" disabled={!ready} onChange={(event) => update(order.id, { notes: event.target.value })} /></td>
              <td><Button variant="dangerGhost" size="icon" className="size-8" title="Excluir pedido" aria-label={`Excluir pedido ${order.code || index + 1}`} disabled={!ready} onClick={() => setDeleteId(order.id)}><Trash2 className="size-3.5" strokeWidth={1.6} /></Button></td>
            </tr>)}</tbody>
          </table>
          {orders.length === 0 && <div className="empty-table"><Package className="mx-auto mb-3 size-8" /><p className="text-sm">Nenhum pedido cadastrado.</p><Button variant="link" onClick={add} disabled={!ready}><Plus />Novo pedido</Button></div>}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><span>{summary.total} {summary.total === 1 ? "pedido no total" : "pedidos no total"}</span><span className="flex items-center gap-1.5"><Check className="size-3.5" />{syncState === "saved" ? "Dados salvos na sua conta" : "Alterações ainda não salvas"}</span></div>
      </section>
    </main>
    <AlertDialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
      <AlertDialogContent className="max-w-[calc(100%-32px)] sm:max-w-md"><AlertDialogHeader><AlertDialogTitle>Excluir pedido?</AlertDialogTitle><AlertDialogDescription>O pedido {deleting?.code || "sem código"} será excluído permanentemente. Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><Button variant="destructive" onClick={() => { commit(orders.filter((order) => order.id !== deleteId)); setDeleteId(null); }}><Trash2 />Excluir pedido</Button></AlertDialogFooter></AlertDialogContent>
    </AlertDialog>
  </div>;
}
