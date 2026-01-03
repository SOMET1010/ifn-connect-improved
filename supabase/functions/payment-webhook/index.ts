import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-Sandbox-Webhook, X-Provider",
};

interface WebhookPayload {
  reference: string;
  status: string;
  transaction_id: string;
  amount: string;
  currency: string;
  provider: string;
  phone_number: string;
  timestamp: string;
  signature: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const payload: WebhookPayload = await req.json();

    console.log("[Webhook] Received payment webhook:", {
      reference: payload.reference,
      status: payload.status,
      provider: payload.provider,
    });

    const isSandbox = req.headers.get("X-Sandbox-Webhook") === "true";

    if (isSandbox) {
      console.log("[Webhook] Sandbox webhook detected");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      console.error("[Webhook] Missing Supabase credentials");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { reference, status, transaction_id } = payload;

    const updateResponse = await fetch(
      `${supabaseUrl}/rest/v1/transactions?reference=eq.${reference}`,
      {
        method: "PATCH",
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          "Prefer": "return=representation",
        },
        body: JSON.stringify({
          status,
          transaction_id,
          webhook_data: JSON.stringify(payload),
          updated_at: new Date().toISOString(),
        }),
      }
    );

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error("[Webhook] Failed to update transaction:", errorText);
      return new Response(
        JSON.stringify({
          error: "Failed to update transaction",
          details: errorText,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const updatedTransactions = await updateResponse.json();
    console.log("[Webhook] Transaction updated:", updatedTransactions);

    if (status === "success" && updatedTransactions && updatedTransactions.length > 0) {
      const transaction = updatedTransactions[0];
      if (transaction.order_id) {
        const orderUpdateResponse = await fetch(
          `${supabaseUrl}/rest/v1/marketplace_orders?id=eq.${transaction.order_id}`,
          {
            method: "PATCH",
            headers: {
              "apikey": supabaseKey,
              "Authorization": `Bearer ${supabaseKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: "paid",
              updated_at: new Date().toISOString(),
            }),
          }
        );

        if (!orderUpdateResponse.ok) {
          console.error("[Webhook] Failed to update order status");
        } else {
          console.log("[Webhook] Order marked as paid");
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Webhook processed successfully",
        reference: payload.reference,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[Webhook] Error processing webhook:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
