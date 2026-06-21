import { createRouter, publicQuery } from "./middleware";
import { formRouter } from "./routers/formRouter";
import { submissionRouter } from "./routers/submissionRouter";
import { excelRouter } from "./routers/excelRouter";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  form: formRouter,
  submission: submissionRouter,
  excel: excelRouter,
});

export type AppRouter = typeof appRouter;
