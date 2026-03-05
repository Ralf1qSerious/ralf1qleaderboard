export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders(request),
      });
    }

    // Simple health
    if (url.pathname === "/") {
      return new Response("RALF1Q proxy ok", { headers: corsHeaders(request) });
    }

    // Proxy endpoint:
    // /api/leaderboard?token=...&take=...&order=...&from=...&to=...
    if (url.pathname === "/api/leaderboard") {
      const target = new URL("https://api.skinrave.gg/affiliates/public/applicants");
      for (const [k, v] of url.searchParams.entries()) target.searchParams.set(k, v);

      const upstream = await fetch(target.toString(), {
        headers: {
          "User-Agent": request.headers.get("User-Agent") || "Mozilla/5.0",
          "Accept": "application/json",
        },
      });

      const body = await upstream.text();
      return new Response(body, {
        status: upstream.status,
        headers: {
          ...corsHeaders(request),
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }

    // SSE stream endpoint (live-ish):
    // /sse/leaderboard?... same params ...
    // Worker polls upstream every 15s and pushes.
    if (url.pathname === "/sse/leaderboard") {
      const encoder = new TextEncoder();
      let aborted = false;

      const stream = new ReadableStream({
        start: async (controller) => {
          const push = (event, data) => {
            controller.enqueue(encoder.encode(`event: ${event}\n`));
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          };

          const pollOnce = async () => {
            const target = new URL("https://api.skinrave.gg/affiliates/public/applicants");
            for (const [k, v] of url.searchParams.entries()) target.searchParams.set(k, v);

            const upstream = await fetch(target.toString(), {
              headers: { "Accept": "application/json" },
            });

            const json = await upstream.json().catch(() => null);
            if (json) push("leaderboard", json);
          };

          push("hello", { ok: true });

          while (!aborted) {
            await pollOnce();
            await sleep(15000);
          }
        },
        cancel() {
          aborted = true;
        },
      });

      return new Response(stream, {
        headers: {
          ...corsHeaders(request),
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Connection": "keep-alive",
        },
      });
    }

    return new Response("Not found", { status: 404, headers: corsHeaders(request) });
  },
};

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));