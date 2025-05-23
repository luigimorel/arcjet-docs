import type { FrameworkKey } from "@/lib/prefs";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema, i18nSchema } from "@astrojs/starlight/schema";
import { defineCollection, z } from "astro:content";

export type TocNode = {
  text: string;
  anchor: string;
  framework: FrameworkKey | FrameworkKey[];
  children: TocNode[];
};

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        ajToc: z.custom<TocNode[]>(),
        frameworks: z.custom<FrameworkKey[]>().optional(),
        titleByFramework: z
          .custom<{ [key in FrameworkKey]: string }>()
          .optional(),
      }),
    }),
  }),
  i18n: defineCollection({ type: "data", schema: i18nSchema() }),
};
