import { z } from "zod";

export const associateMemberSchema = z.object({
  email: z.email("Informe um e-mail válido.").trim(),
});

export type AssociateMemberValues = z.infer<typeof associateMemberSchema>;
