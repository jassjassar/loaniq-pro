import { Download, FileText } from 'lucide-react';
import { buildAmortizationSchedule, summarizeScenario } from '../lib/amortization';
import { exportScheduleCsv, exportSchedulePdf } from '../lib/exporters';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default function ScenarioTable({ scenarios, approvalResults }) {
  return (
    <section className="scenario-list">
      {scenarios.map((scenario) => {
        const summary = summarizeScenario(scenario);
        const schedule = buildAmortizationSchedule(scenario);
        const approval = approvalResults[scenario.localId];

        return (
          <article className="scenario-card" key={scenario.localId}>
            <div className="card-heading">
              <div>
                <p className="eyebrow">{scenario.label}</p>
                <h3>{money.format(summary.monthlyPayment)} monthly</h3>
              </div>
              <span className={`risk-pill ${approval?.riskTier?.toLowerCase() ?? 'pending'}`}>
                {approval?.riskTier ?? 'Pending'}
              </span>
            </div>
            <dl className="metric-grid">
              <div>
                <dt>Total interest</dt>
                <dd>{money.format(summary.totalInterest)}</dd>
              </div>
              <div>
                <dt>Payoff</dt>
                <dd>{summary.payoffMonths} months</dd>
              </div>
              <div>
                <dt>DTI</dt>
                <dd>{approval ? `${approval.debtToIncomeRatio}%` : 'Waiting'}</dd>
              </div>
            </dl>
            <div className="card-actions">
              <button type="button" onClick={() => exportSchedulePdf(scenario.label, schedule)}>
                <FileText size={17} />
                PDF
              </button>
              <button type="button" onClick={() => exportScheduleCsv(scenario.label, schedule)}>
                <Download size={17} />
                CSV
              </button>
            </div>
          </article>
        );
      })}
    </section>
  );
}
