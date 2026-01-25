import { z } from "zod";

export const CategoricalFeatureSchema = z.object({
  feature_name: z.string().min(1),
  value: z.string().min(1).optional(),
}).strict();

export const BooleanFeatureSchema = z.object({
  feature_name: z.string().min(1),
  value: z.boolean(),
}).strict();

export const FeatureBucketsSchema = z.object({
  categorical: z.array(CategoricalFeatureSchema),
  boolean: z.array(BooleanFeatureSchema),
}).strict();

export const SequenceInputSchema = z.object({
  batter: z.string().min(1),
  pitcher: z.string().min(1),
  features: FeatureBucketsSchema,
}).strict();

export type CategoricalFeature = z.infer<typeof CategoricalFeatureSchema>;
export type BooleanFeature = z.infer<typeof BooleanFeatureSchema>;
export type FeatureBuckets = z.infer<typeof FeatureBucketsSchema>;
export type SequenceInput = z.infer<typeof SequenceInputSchema>;
