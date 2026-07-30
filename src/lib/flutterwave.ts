import { supabase } from './supabase';

declare global {
  interface Window {
    FlutterwaveCheckout?: (config: Record<string, unknown>) => void;
  }
}

const FLW_SCRIPT_URL = 'https://checkout.flutterwave.com/v3.js';
let scriptPromise: Promise<void> | null = null;

function loadFlutterwaveScript(): Promise<void> {
  if (window.FlutterwaveCheckout) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = FLW_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Impossible de charger Flutterwave. Vérifiez votre connexion.'));
    document.body.appendChild(script);
  });
  return scriptPromise;
}

interface PayForPlanArgs {
  school: { id: string; name: string; email: string | null };
  profile: { email: string; first_name: string | null; last_name: string | null; phone: string | null };
  plan: { id: string; name: string; price_monthly: number };
  billingPeriod: 'monthly' | 'annual';
  amount: number; // resolved price to charge, in `currency`
  currency?: string;
  onSuccess: () => void;
  onError: (message: string) => void;
  onClose?: () => void;
}

// Note: VITE_FLUTTERWAVE_PUBLIC_KEY is a *public* key — safe to ship in the
// frontend bundle. The secret key used for server-side verification lives only
// in the flutterwave-verify edge function's environment, never here.
const FLW_PUBLIC_KEY = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY as string | undefined;

export async function payForPlan({ school, profile, plan, billingPeriod, amount, currency = 'USD', onSuccess, onError, onClose }: PayForPlanArgs) {
  if (!FLW_PUBLIC_KEY) {
    onError('Le paiement en ligne n\'est pas encore configuré (clé Flutterwave manquante). Contactez support@liafrik.com.');
    return;
  }

  try {
    await loadFlutterwaveScript();
  } catch (e: any) {
    onError(e.message);
    return;
  }

  const tx_ref = `klaso-${school.id.slice(0, 8)}-${Date.now()}`;

  // Create the pending record first — only the edge function (service role)
  // will ever be able to flip this to 'successful' and activate the plan.
  const { error: insertErr } = await supabase.from('flutterwave_transactions').insert({
    school_id: school.id,
    plan_id: plan.id,
    tx_ref,
    amount,
    currency,
    billing_period: billingPeriod,
    status: 'pending',
  });
  if (insertErr) { onError(insertErr.message); return; }

  window.FlutterwaveCheckout?.({
    public_key: FLW_PUBLIC_KEY,
    tx_ref,
    amount,
    currency,
    payment_options: 'card,mobilemoney,ussd,banktransfer',
    customer: {
      email: profile.email,
      phone_number: profile.phone || undefined,
      name: [profile.first_name, profile.last_name].filter(Boolean).join(' ') || school.name,
    },
    customizations: {
      title: 'Klaso',
      description: `Abonnement ${plan.name} (${billingPeriod === 'annual' ? 'annuel' : 'mensuel'}) — ${school.name}`,
      logo: `${window.location.origin}/icon.jpg`,
    },
    callback: async (response: { status: string; transaction_id?: number | string }) => {
      if (response.status !== 'successful' && response.status !== 'completed') {
        onError('Paiement non abouti.');
        return;
      }
      try {
        const { data, error } = await supabase.functions.invoke('flutterwave-verify', {
          body: { tx_ref, transaction_id: response.transaction_id },
        });
        if (error || !data?.success) {
          onError(data?.error || error?.message || 'La vérification du paiement a échoué. Contactez support@liafrik.com avec votre référence : ' + tx_ref);
          return;
        }
        onSuccess();
      } catch (e: any) {
        onError(e.message || 'Erreur de vérification du paiement.');
      }
    },
    onclose: () => { onClose?.(); },
  });
}
