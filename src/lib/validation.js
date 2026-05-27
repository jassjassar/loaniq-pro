import { z } from 'zod';

const currency = z.coerce
  .number({ invalid_type_error: 'Enter a valid amount.' })
  .finite()
  .positive()
  .max(100_000_000);

const percentage = z.coerce
  .number({ invalid_type_error: 'Enter a valid percentage.' })
  .finite()
  .min(0)
  .max(100);

export const loanScenarioSchema = z.object({
  label: z.string().trim().min(1).max(80),
  principal: currency,
  annualRate: percentage,
  termMonths: z.coerce.number().int().min(1).max(480),
  extraMonthlyPayment: z.coerce.number().finite().min(0).max(1_000_000).default(0),
  incomeMonthly: currency,
  debtMonthly: z.coerce.number().finite().min(0).max(10_000_000),
  creditScore: z.coerce.number().int().min(300).max(850)
});

export function parseScenario(input) {
  return loanScenarioSchema.parse(input);
}
