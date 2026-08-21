import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { winbackNightly } from "@/lib/inngest/functions/winback";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [winbackNightly],
});
