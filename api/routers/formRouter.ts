import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import type { Timestamp } from "firebase-admin/firestore";

export type FormConfig = {
  id: string;
  name: string;
  formUrl: string;
  formEntries: Array<{ entryId: string; type: string; label: string }>;
  questions: Array<{ label: string; entryId: string }>;
  createdAt: Timestamp | null;
};

export const formRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    const snapshot = await db
      .collection("formConfigs")
      .orderBy("createdAt", "desc")
      .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as FormConfig));
  }),

  getById: publicQuery
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const doc = await db.collection("formConfigs").doc(input.id).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() } as FormConfig;
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
      const ref = await db.collection("formConfigs").add({
        name: input.name,
        formUrl: input.formUrl,
        formEntries: input.formEntries,
        questions: input.questions,
        createdAt: new Date(),
      });
      return { id: ref.id };
    }),

  delete: publicQuery
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.collection("formConfigs").doc(input.id).delete();
      return { success: true };
    }),
});
