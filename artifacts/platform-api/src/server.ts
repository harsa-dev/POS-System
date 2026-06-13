import { createServer } from "node:http";

const port = Number(process.env.PORT ?? 8080);

function sendJson(res: import("node:http").ServerResponse, status: number, body: unknown) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(JSON.stringify(body, null, 2));
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

  if (req.method === "GET" && url.pathname === "/api/healthz") {
    sendJson(res, 200, { status: "ok", service: "platform-api" });
    return;
  }

  sendJson(res, 404, {
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `No mock backend route for ${req.method ?? "GET"} ${url.pathname}`,
    },
  });
});

server.listen(port, () => {
  console.log(`platform-api listening on http://localhost:${port}`);
});
