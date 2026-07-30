// supabase/functions/flutterwave-verify/index.ts
//
// Verifies a Flutterwave payment server-side (using the secret key, which must
// NEVER be exposed to the client) before activating a school's subscription.
// The client can create a 'pending' flutterwave_transactions row and trigger
// the Flutterwave checkout, but only this function — running with the service
// role — can mark a transaction 'successful' and flip schools.subscription_status.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const FLW_SECRET_KEY = Deno.env.get('FLUTTERWAVE_SECRET_KEY')!;
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

function corsResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Content-Type': 'application/json',
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse({}, 204);
  if (req.method !== 'POST') return corsResponse({ error: 'Method not allowed' }, 405);

  try {
    const { tx_ref, transaction_id } = await req.json();
    if (!tx_ref) return corsResponse({ error: 'tx_ref is required' }, 400);

    // Only ever act on a transaction WE created and that is still pending —
    // never trust anything the client claims about amount/plan/school.
    const { data: txRow, error: txErr } = await supabase
      .from('flutterwave_transactions')
      .select('id, school_id, plan_id, amount, currency, status, billing_period')
      .eq('tx_ref', tx_ref)
      .maybeSingle();

    if (txErr || !txRow) return corsResponse({ error: 'Transaction introuvable.' }, 404);
    if (txRow.status === 'successful') return corsResponse({ success: true, already_processed: true });

    // Verify directly against Flutterwave's API using the secret key — this is
    // the step that actually confirms money changed hands. Never trust a
    // client-supplied "it worked" flag.
    const verifyUrl = transaction_id
      ? `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`
      : `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(tx_ref)}`;

    const flwRes = await fetch(verifyUrl, {
      headers: { Authorization: `Bearer ${FLW_SECRET_KEY}` },
    });
    const flwData = await flwRes.json();

    const payment = flwData?.data;
    const isSuccessful =
      flwData?.status === 'success' &&
      payment?.status === 'successful' &&
      payment?.tx_ref === tx_ref &&
      payment?.currency === txRow.currency &&
      Number(payment?.amount) >= Number(txRow.amount);

    if (!isSuccessful) {
      await supabase.from('flutterwave_transactions').update({ status: 'failed' }).eq('id', txRow.id);
      return corsResponse({ success: false, error: 'Paiement non confirmé par Flutterwave.' }, 402);
    }

    // Real payment confirmed — activate the plan.
    await supabase
      .from('flutterwave_transactions')
      .update({ status: 'successful', flw_transaction_id: String(payment.id), verified_at: new Date().toISOString() })
      .eq('id', txRow.id);

    const { error: schoolErr } = await supabase
      .from('schools')
      .update({ plan_id: txRow.plan_id, subscription_status: 'active' })
      .eq('id', txRow.school_id);

    if (schoolErr) return corsResponse({ error: schoolErr.message }, 500);

    return corsResponse({ success: true });
  } catch (e) {
    return corsResponse({ error: e instanceof Error ? e.message : 'Erreur inconnue.' }, 500);
  }
});
