import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { formConfigs } from "../../db/schema";
import { eq, desc } from "drizzle-orm";

export const formRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(formConfigs).orderBy(desc(formConfigs.createdAt));
  }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const results = await db
        .select()
        .from(formConfigs)
        .where(eq(formConfigs.id, input.id))
        .limit(1);
      return results[0] ?? null;
    }),

  create: publicQuery
    .input(
      z.object({
        name: z.string().min(1),
        formUrl: z.string().url(),
        formEntries: z.array(
          z.object({
            entryId: z.string(),
            type: z.enum(["name", "rating", "text", "email", "other"]),
            label: z.string(),
          })
        ),
        questions: z.array(
          z.object({
            label: z.string(),
            entryId: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(formConfigs).values({
        name: input.name,
        formUrl: input.formUrl,
        formEntries: input.formEntries,
        questions: input.questions,
      });
      return { id: Number(result[0].insertId) };
    }),

  delete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(formConfigs).where(eq(formConfigs.id, input.id));
      return { success: true };
    }),
});
