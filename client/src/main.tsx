import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from "@shared/const";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";

const resolveAnalyticsScriptUrl = (endpoint: string): string | null => {
  const normalizedEndpoint = endpoint.trim();
  if (!normalizedEndpoint) return null;

  if (
    normalizedEndpoint.startsWith("http://") ||
    normalizedEndpoint.startsWith("https://")
  ) {
    return new URL(
      "umami",
      normalizedEndpoint.endsWith("/")
        ? normalizedEndpoint
        : `${normalizedEndpoint}/`
    ).toString();
  }

  if (normalizedEndpoint.startsWith("/")) {
    return `${normalizedEndpoint.replace(/\/$/, "")}/umami`;
  }

  return null;
};

const setupAnalytics = () => {
  if (typeof document === "undefined") return;

  const endpoint = String(import.meta.env.VITE_ANALYTICS_ENDPOINT ?? "").trim();
  const websiteId = String(
    import.meta.env.VITE_ANALYTICS_WEBSITE_ID ?? ""
  ).trim();
  if (!endpoint || !websiteId) return;

  const src = resolveAnalyticsScriptUrl(endpoint);
  if (!src) {
    console.warn(
      "[Analytics] Invalid VITE_ANALYTICS_ENDPOINT. Expected absolute URL or path starting with '/'."
    );
    return;
  }

  const existing = document.querySelector("script[data-website-id]");
  if (existing) return;

  const script = document.createElement("script");
  script.defer = true;
  script.src = src;
  script.setAttribute("data-website-id", websiteId);
  document.body.appendChild(script);
};

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

setupAnalytics();

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
