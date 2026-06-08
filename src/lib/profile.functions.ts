import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      full_name: z.string().max(200).optional(),
      headline: z.string().max(300).optional(),
      location: z.string().max(200).optional(),
      phone: z.string().max(50).optional(),
      linkedin_url: z.string().url().max(500).optional().or(z.literal("")),
      portfolio_url: z.string().url().max(500).optional().or(z.literal("")),
      target_roles: z.array(z.string().max(100)).max(20).optional(),
      target_locations: z.array(z.string().max(100)).max(20).optional(),
      work_authorization: z.string().max(200).optional(),
      requires_sponsorship: z.boolean().optional(),
      min_salary: z.number().int().nonnegative().optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("profiles")
      .update(data)
      .eq("id", userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });
