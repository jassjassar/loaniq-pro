export function calculateMonthlyPayment(principal, annualRate, termMonths) {
  const monthlyRate = annualRate / 100 / 12;

  if (monthlyRate === 0) {
    return principal / termMonths;
  }

  return (principal * monthlyRate) / (1 - (1 + monthlyRate) ** -termMonths);
}

export function buildAmortizationSchedule(scenario) {
  const basePayment = calculateMonthlyPayment(scenario.principal, scenario.annualRate, scenario.termMonths);
  const monthlyPayment = basePayment + scenario.extraMonthlyPayment;
  const monthlyRate = scenario.annualRate / 100 / 12;
  let balance = scenario.principal;
  let totalInterest = 0;

  return Array.from({ length: scenario.termMonths }, (_, index) => {
    const interest = balance * monthlyRate;
    const principalPaid = Math.min(monthlyPayment - interest, balance);
    balance = Math.max(balance - principalPaid, 0);
    totalInterest += interest;

    return {
      month: index + 1,
      payment: Number(Math.min(monthlyPayment, principalPaid + interest).toFixed(2)),
      principal: Number(principalPaid.toFixed(2)),
      interest: Number(interest.toFixed(2)),
      balance: Number(balance.toFixed(2)),
      totalInterest: Number(totalInterest.toFixed(2))
    };
  }).filter((row) => row.payment > 0);
}

export function summarizeScenario(scenario) {
  const schedule = buildAmortizationSchedule(scenario);
  const totalPaid = schedule.reduce((sum, row) => sum + row.payment, 0);
  const totalInterest = schedule.reduce((sum, row) => sum + row.interest, 0);

  return {
    monthlyPayment: schedule[0]?.payment ?? 0,
    payoffMonths: schedule.length,
    totalPaid: Number(totalPaid.toFixed(2)),
    totalInterest: Number(totalInterest.toFixed(2))
  };
}
