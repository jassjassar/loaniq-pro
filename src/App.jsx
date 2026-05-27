import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { LogOut, ShieldCheck } from 'lucide-react';
import AuthPanel from './components/AuthPanel';
import ScenarioForm from './components/ScenarioForm';
import ScenarioTable from './components/ScenarioTable';
import Legal from './pages/Legal';
import { buildAmortizationSchedule } from './lib/amortization';
import { parseScenario } from './lib/validation';
import { isSupabaseConfigured, supabase, supabaseConfig } from './lib/supabaseClient';

const ScenarioCharts = lazy(() => import('./components/ScenarioCharts'));

const defaultDraft = {
  label: 'Scenario A',
  principal: '450000',
  annualRate: '6.25',
  termMonths: '360',
  extraMonthlyPayment: '250',
  incomeMonthly: '12500',
  debtMonthly: '2100',
  creditScore: '740'
};

export default function App() {
  const [draft, setDraft] = useState(defaultDraft);
  const [scenarios, setScenarios] = useState([]);
  const [approvalResults, setApprovalResults] = useState({});
  const [error, setError] = useState('');
  const [view, setView] = useState('dashboard');
  const [session, setSession] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const schedules = useMemo(
    () => scenarios.slice(0, 2).map((scenario) => ({ label: scenario.label, schedule: buildAmortizationSchedule(scenario) })),
    [scenarios]
  );

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsAuthReady(true);
      return undefined;
    }

    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (isMounted) {
        setSession(data.session);
        setIsAuthReady(true);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsAuthReady(true);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) {
      return;
    }

    async function loadScenarios() {
      const { data, error: loadError } = await supabase
        .from('user_scenarios')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);

      if (loadError) {
        setError(loadError.message);
        return;
      }

      const restoredScenarios = data.map((row) => ({
        localId: row.id,
        label: row.label,
        principal: Number(row.principal),
        annualRate: Number(row.annual_rate),
        termMonths: row.term_months,
        extraMonthlyPayment: Number(row.extra_monthly_payment),
        incomeMonthly: Number(row.income_monthly),
        debtMonthly: Number(row.debt_monthly),
        creditScore: row.credit_score
      }));

      setScenarios(restoredScenarios);
      setApprovalResults(
        data.reduce((resultMap, row) => ({ ...resultMap, [row.id]: row.approval_result }), {})
      );
    }

    loadScenarios();
  }, [session]);

  function updateDraft(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function getApprovalResult(scenario) {
    if (!supabase) {
      throw new Error('Supabase is not configured.');
    }

    const { data, error: functionError } = await supabase.functions.invoke('approval-engine', {
      body: scenario
    });

    if (functionError) {
      throw functionError;
    }

    return data;
  }

  async function saveScenario(event) {
    event.preventDefault();
    setError('');

    try {
      const parsed = parseScenario(draft);
      const localId = crypto.randomUUID();
      const scenario = { ...parsed, localId };
      const result = await getApprovalResult(parsed);
      const savedScenario = { ...scenario, localId: result.scenarioId ?? localId };
      setScenarios((current) => [savedScenario, ...current].slice(0, 6));
      setApprovalResults((current) => ({ ...current, [savedScenario.localId]: result.approval }));
      setDraft((current) => ({
        ...current,
        label: current.label.endsWith('A') ? 'Scenario B' : `Scenario ${current.label.slice(-1) || 'B'}`
      }));
    } catch (caughtError) {
      setError(caughtError?.issues?.[0]?.message ?? caughtError?.message ?? 'Unable to save this scenario.');
    }
  }

  async function signOut() {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    setScenarios([]);
    setApprovalResults({});
  }

  if (!isSupabaseConfigured) {
    return (
      <main className="auth-page">
        <section className="auth-panel">
          <p className="eyebrow">Configuration Needed</p>
          <h1>Connect Supabase in Vercel.</h1>
          <p>
            Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the Vercel project environment variables, then
            redeploy the production build.
          </p>
          {supabaseConfig.error ? <p className="auth-message">{supabaseConfig.error}</p> : null}
        </section>
      </main>
    );
  }

  if (!isAuthReady) {
    return <main className="loading-state">Preparing secure workspace...</main>;
  }

  if (!session) {
    return <AuthPanel />;
  }

  if (view === 'legal') {
    return (
      <>
        <nav className="topbar">
          <button type="button" onClick={() => setView('dashboard')}>Dashboard</button>
          <button type="button" onClick={signOut}>Sign out</button>
        </nav>
        <Legal />
      </>
    );
  }

  return (
    <main>
      <nav className="topbar">
        <div className="brand">
          <ShieldCheck size={25} />
          <span>LoanIQ Pro</span>
        </div>
        <div className="nav-actions">
          <button type="button" onClick={() => setView('legal')}>Legal</button>
          <button type="button" onClick={signOut}>
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </nav>
      <section className="hero">
        <div>
          <p className="eyebrow">Private Scenario Intelligence</p>
          <h1>Compare loan outcomes with server-side risk analysis.</h1>
          <p>
            Build A/B loan scenarios, save them to a protected Supabase account, and export audit-ready amortization
            schedules without exposing approval logic in the browser.
          </p>
        </div>
      </section>
      <div className="workspace">
        <ScenarioForm draft={draft} error={error} onChange={updateDraft} onSubmit={saveScenario} />
        <div className="results-column">
          <ScenarioTable scenarios={scenarios} approvalResults={approvalResults} />
          <Suspense fallback={<section className="panel chart-panel">Loading charts...</section>}>
            <ScenarioCharts schedules={schedules} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
