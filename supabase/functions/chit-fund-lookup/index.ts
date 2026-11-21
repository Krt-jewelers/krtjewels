import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeadersFor, jsonResponse } from "../_shared/cors.ts";

// Looks up a savings scheme for the public "My scheme" page.
//
// A phone number is easy to know or guess, so a phone lookup returns only a
// summary with the name masked (no payment history, gold balance or scheme
// ID). The scheme ID printed on the customer's card unlocks the full details.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function maskName(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => (part.length <= 1 ? part : part[0] + "•".repeat(Math.min(part.length - 1, 6))))
    .join(" ");
}

function normalizePhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  const local = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits.length === 11 && digits.startsWith("0") ? digits.slice(1) : digits;
  return /^\d{10}$/.test(local) ? local : null;
}

Deno.serve(async (req) => {
  const cors = corsHeadersFor(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { search } = await req.json();
    if (!search || typeof search !== "string" || search.trim().length < 3 || search.length > 64) {
      return jsonResponse({ error: "Invalid search query" }, 400, cors);
    }

    const trimmed = search.trim();
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const fields = "id, customer_name, plan_name, monthly_amount, total_months, months_paid, start_date, next_due_date, status, total_gold_grams";

    if (UUID_RE.test(trimmed)) {
      const { data: chit, error } = await supabase.from("chit_funds").select(fields).eq("id", trimmed).maybeSingle();
      if (error) throw error;
      if (!chit) return jsonResponse({ data: null }, 200, cors);

      const { data: payments, error: payError } = await supabase
        .from("chit_payments")
        .select("id, amount, gold_grams, gold_rate_applied, payment_date, payment_method, receipt_number")
        .eq("chit_fund_id", chit.id)
        .order("payment_date", { ascending: false });
      if (payError) throw payError;

      return jsonResponse({ data: { ...chit, payments: payments || [], limited: false } }, 200, cors);
    }

    const phone = normalizePhone(trimmed);
    if (!phone) return jsonResponse({ data: null }, 200, cors);

    // Phone numbers may be stored with or without +91.
    const { data: rows, error } = await supabase
      .from("chit_funds")
      .select(fields)
      .in("phone", [phone, `+91${phone}`, `91${phone}`, `+91 ${phone}`, `0${phone}`])
      .order("start_date", { ascending: false })
      .limit(1);
    if (error) throw error;
    const chit = rows?.[0];
    if (!chit) return jsonResponse({ data: null }, 200, cors);

    return jsonResponse(
      {
        data: {
          customer_name: maskName(chit.customer_name || ""),
          plan_name: chit.plan_name,
          monthly_amount: chit.monthly_amount,
          total_months: chit.total_months,
          months_paid: chit.months_paid,
          start_date: chit.start_date,
          next_due_date: chit.next_due_date,
          status: chit.status,
          payments: [],
          limited: true,
        },
      },
      200,
      cors,
    );
  } catch (err) {
    console.error("chit-fund-lookup failed:", err);
    return jsonResponse({ error: "Server error" }, 500, cors);
  }
});
