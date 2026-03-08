import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { search } = await req.json();
    if (!search || typeof search !== "string" || search.trim().length < 3) {
      return new Response(JSON.stringify({ error: "Invalid search query" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const trimmed = search.trim();

    // Use service role to bypass RLS for this specific secure lookup
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trimmed);

    let chitData = null;

    if (isUUID) {
      const { data, error } = await supabase
        .from("chit_funds")
        .select("id, customer_name, plan_name, monthly_amount, total_months, months_paid, start_date, next_due_date, status, total_gold_grams")
        .eq("id", trimmed)
        .maybeSingle();
      if (error) throw error;
      chitData = data;
    } else {
      // Phone number lookup
      const { data, error } = await supabase
        .from("chit_funds")
        .select("id, customer_name, plan_name, monthly_amount, total_months, months_paid, start_date, next_due_date, status, total_gold_grams")
        .eq("phone", trimmed)
        .maybeSingle();
      if (error) throw error;
      chitData = data;
    }

    if (!chitData) {
      return new Response(JSON.stringify({ data: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch payments - only return non-sensitive fields
    const { data: payments, error: payError } = await supabase
      .from("chit_payments")
      .select("id, amount, gold_grams, gold_rate_applied, payment_date, payment_method, receipt_number")
      .eq("chit_fund_id", chitData.id)
      .order("payment_date", { ascending: false });

    if (payError) throw payError;

    return new Response(
      JSON.stringify({ data: { ...chitData, payments: payments || [] } }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
