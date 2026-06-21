import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { submissions, formConfigs } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export const submissionRouter = createRouter({
  listByForm: publicQuery
    .input(z.object({ formConfigId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db
        .select()
        .from(submissions)
        .where(eq(submissions.formConfigId, input.formConfigId))
        .orderBy(desc(submissions.createdAt));
    }),

  submitBatch: publicQuery
    .input(
      z.object({
        formConfigId: z.number(),
        names: z.array(z.string()),
        ratingRange: z.object({
          min: z.number().min(1).max(5),
          max: z.number().min(1).max(5),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const configs = await db
        .select()
        .from(formConfigs)
        .where(eq(formConfigs.id, input.formConfigId))
        .limit(1);

      if (!configs[0]) {
        throw new Error("Form config not found");
      }

      const config = configs[0];
      const entries = config.formEntries as Array<{
        entryId: string;
        type: string;
        label: string;
      }>;
      const questions = config.questions as Array<{
        label: string;
        entryId: string;
      }>;

      const nameEntry = entries.find((e) => e.type === "name");

      const results = [];

      for (const name of input.names) {
        const answers: Record<string, { value: string | number; label: string }> = {};
        const formData = new URLSearchParams();

        if (nameEntry) {
          formData.append(`entry.${nameEntry.entryId}`, name);
          answers[nameEntry.entryId] = { value: name, label: nameEntry.label };
        }

        for (const q of questions) {
          const rating =
            Math.floor(
              Math.random() * (input.ratingRange.max - input.ratingRange.min + 1)
            ) + input.ratingRange.min;
          formData.append(`entry.${q.entryId}`, String(rating));
          answers[q.entryId] = { value: rating, label: q.label };
        }

        try {
          const submitUrl = config.formUrl.replace(
            /\/viewform.*$/,
            "/formResponse"
          );

          await fetch(submitUrl, {
            method: "POST",
            body: formData,
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          });

          const result = await db.insert(submissions).values({
            formConfigId: input.formConfigId,
            personName: name,
            answers,
            status: "success",
          });

          results.push({
            name,
            status: "success",
            answers,
            id: Number(result[0].insertId),
          });
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : "Unknown error";

          const result = await db.insert(submissions).values({
            formConfigId: input.formConfigId,
            personName: name,
            answers,
            status: "failed",
            errorMessage: errorMsg,
          });

          results.push({
            name,
            status: "failed",
            error: errorMsg,
            id: Number(result[0].insertId),
          });
        }
      }

      return { results, total: input.names.length };
    }),

  deleteByForm: publicQuery
    .input(z.object({ formConfigId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .delete(submissions)
        .where(eq(submissions.formConfigId, input.formConfigId));
      return { success: true };
    }),
});
