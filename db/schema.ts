import {
  mysqlTable,
  serial,
  varchar,
  text,
  timestamp,
  json,
  int,
} from "drizzle-orm/mysql-core";

export const formConfigs = mysqlTable("form_configs", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  formUrl: varchar("form_url", { length: 1000 }).notNull(),
  formEntries: json("form_entries").notNull(),
  questions: json("questions").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const submissions = mysqlTable("submissions", {
  id: serial("id").primaryKey(),
  formConfigId: int("form_config_id").notNull(),
  personName: varchar("person_name", { length: 255 }).notNull(),
  answers: json("answers").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type FormConfig = typeof formConfigs.$inferSelect;
export type NewFormConfig = typeof formConfigs.$inferInsert;
export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;
