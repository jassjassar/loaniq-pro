import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { z } from 'https://deno.land/x/zod@v3.23.8/mod.ts';

const scenarioSchema = z.object({
  label: z.string().trim().min(1).max(80),
  principal: z.number().finite().positive().max(100_000_000),
  annualRate: z.number().finite().min(0).max(100),
  termMonths: z.number().int().min(1).max(480),
  extraMonthlyPayment: z.number().finite().min(0).max(1_000_000),
  incomeMonthly: z.number().finite().positive().max(100_000_000),
  debtMonthly: z.number().finite().min(0).max(10_000_000),
  creditScore: z.number().int().min(300).max(850)
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function calculateApproval(input: z.infer<typeof scenarioSchema>) {
  const monthlyRate = input.annualRate / 100 / 12;
  const basePayment =
    monthlyRate === 0
      ? input.principal / input.termMonths
      : (input.principal * monthlyRate) / (1 - (1 + monthlyRate) ** -input.termMonths);
  const totalMonthlyDebt = input.debtMonthly + basePayment + input.extraMonthlyPayment;
  const debtToIncomeRatio = Number(((totalMonthlyDebt / input.incomeMonthly) * 100).toFixed(2));

  let score = 100;
  if (debtToIncomeRatio > 43) score -= 35;
  if (debtToIncomeRatio > 50) score -= 25;
  if (input.creditScore < 680) score -= 25;
  if (input.creditScore < 620) score -= 25;
  if (input.annualRate > 12) score -= 10;

  const riskTier = score >= 75 ? 'Low' : score >= 50 ? 'Moderate' : 'High';

  return {
    decision: riskTier === 'High' ? 'Needs Manual Review' : 'Prequalified Estimate',
    riskTier,
    score: Math.max(score, 0),
    debtToIncomeRatio,
    monthlyPayment: Number((basePayment + input.extraMonthlyPayment).toFixed(2))
  };
}

serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const authorization = request.headers.get('Authorization');

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey || !authorization) {
      return new Response(JSON.stringify({ error: 'Missing secure function configuration.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authorization } }
    });
    const { data: userData, error: userError } = await authClient.auth.getUser();

    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: 'Authentication required.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const payload = await request.json();
    const scenario = scenarioSchema.parse(payload);
    const approval = calculateApproval(scenario);
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: insertedScenario, error: insertError } = await adminClient
      .from('user_scenarios')
      .insert({
        user_id: userData.user.id,
        label: scenario.label,
        principal: scenario.principal,
        annual_rate: scenario.annualRate,
        term_months: scenario.termMonths,
        extra_monthly_payment: scenario.extraMonthlyPayment,
        income_monthly: scenario.incomeMonthly,
        debt_monthly: scenario.debtMonthly,
        credit_score: scenario.creditScore,
        approval_result: approval
      })
      .select('id')
      .single();

    if (insertError) {
      return new Response(JSON.stringify({ error: 'Unable to save loan scenario.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ scenarioId: insertedScenario.id, approval }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (_error) {
    return new Response(JSON.stringify({ error: 'Invalid loan scenario input.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
