import { initTRPC } from "@trpc/server";
import { z } from "zod";

const t = initTRPC.create();
const publicProcedure = t.procedure;

const appRouter = t.router({ products: t.router({ getProductById: publicProcedure.input(z.object({ id: z.string() })).output(z.object({ id: z.string(), name: z.string() })).query(async () => "PLACEHOLDER_DO_NOT_REMOVE" as any) }) });
export type AppRouter = typeof appRouter;

