import { Save } from 'lucide-react';

const fields = [
  ['principal', 'Loan amount', 'number'],
  ['annualRate', 'APR', 'number'],
  ['termMonths', 'Term months', 'number'],
  ['extraMonthlyPayment', 'Extra payment', 'number'],
  ['incomeMonthly', 'Monthly income', 'number'],
  ['debtMonthly', 'Monthly debt', 'number'],
  ['creditScore', 'Credit score', 'number']
];

export default function ScenarioForm({ draft, error, onChange, onSubmit }) {
  return (
    <form className="panel scenario-form" onSubmit={onSubmit}>
      <div>
        <p className="eyebrow">Scenario Builder</p>
        <h2>Compare lending outcomes</h2>
      </div>
      <label>
        Label
        <input value={draft.label} onChange={(event) => onChange('label', event.target.value)} maxLength="80" />
      </label>
      <div className="field-grid">
        {fields.map(([name, label, type]) => (
          <label key={name}>
            {label}
            <input
              type={type}
              min="0"
              inputMode="decimal"
              value={draft[name]}
              onChange={(event) => onChange(name, event.target.value)}
            />
          </label>
        ))}
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      <button className="primary-action" type="submit">
        <Save size={18} />
        Save private scenario
      </button>
    </form>
  );
}
