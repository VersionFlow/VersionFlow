import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

console.log(`Server is running on http://localhost:${process.env.PORT}`);

serve({
  fetch: app.fetch,
  port: +process.env.PORT!,
});
