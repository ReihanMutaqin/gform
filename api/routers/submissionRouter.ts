import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import type { Timestamp } from "firebase-admin/firestore";

export type Submission = {
  id: string;
  formConfigId: string;
  personName: string;
  answers: Record<string, { value: string | number; label: string }>;
  status: string;
  errorMessage?: string;
  createdAt: Timestamp | null;
};

export const submissionRouter = createRouter({
  listByForm: publicQuery
    .input(z.object({ formConfigId: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const snapshot = await db
        .collection("submissions")
        .where("formConfigId", "==", input.formConfigId)
        .orderBy("createdAt", "desc")
        .get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Submission));
    }),

  submitBatch: publicQuery
    .input(
      z.object({
        formConfigId: z.string(),
        names: z.array(z.string()),
        ratingRange: z.object({
          min: z.number().min(1).max(5),
          max: z.number().min(1).max(5),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const configDoc = await db.collection("formConfigs").doc(input.formConfigId).get();

      if (!configDoc.exists) {
        throw new Error("Form config not found");
      }

      const config = configDoc.data()!;
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
          const submitUrl = config.formUrl.replace(/\/viewform.*$/, "/formResponse");

          await fetch(submitUrl, {
            method: "POST",
            body: formData,
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
          });

          const ref = await db.collection("submissions").add({
            formConfigId: input.formConfigId,
            personName: name,
            answers,
            status: "success",
            createdAt: new Date(),
          });

          results.push({ name, status: "success", answers, id: ref.id });
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "Unknown error";

          const ref = await db.collection("submissions").add({
            formConfigId: input.formConfigId,
            personName: name,
            answers,
            status: "failed",
            errorMessage: errorMsg,
            createdAt: new Date(),
          });

          results.push({ name, status: "failed", error: errorMsg, id: ref.id });
        }
      }

      return { results, total: input.names.length };
    }),

  deleteByForm: publicQuery
    .input(z.object({ formConfigId: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const snapshot = await db
        .collection("submissions")
        .where("formConfigId", "==", input.formConfigId)
        .get();

      const batch = db.batch();
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();

      return { success: true };
    }),
});
