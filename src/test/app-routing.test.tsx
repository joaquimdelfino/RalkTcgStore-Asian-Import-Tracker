import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/account-provider", () => ({ AccountProvider: ({ children }: { children: unknown }) => children, useAccount: () => ({ user: null, loading: false }) }));
vi.mock("@/components/account-sign-in", () => ({ AccountSignIn: () => null }));
vi.mock("@/components/orders-header", () => ({ OrdersHeader: () => null }));
vi.mock("@/hooks/use-online-orders", () => ({ useOnlineOrders: () => { throw new Error("Not rendered by route matching"); } }));

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });
});
