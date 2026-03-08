import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const analyses = pgTable("analyses", {
  id: serial("id").primaryKey(),
  imageUrl: text("image_url").notNull(),
  diseaseName: text("disease_name").notNull(),
  confidence: integer("confidence").notNull(),
  severity: text("severity").notNull(),
  treatmentTime: text("treatment_time").notNull(),
  treatment: text("treatment").notNull(),
  precautions: text("precautions").notNull(),
  pesticides: text("pesticides").notNull(),
  modelName: text("model_name").notNull(),
  language: text("language").notNull().default('en'),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAnalysisSchema = createInsertSchema(analyses).omit({ id: true, createdAt: true });

export type Analysis = typeof analyses.$inferSelect;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
