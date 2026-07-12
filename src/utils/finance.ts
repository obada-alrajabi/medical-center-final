export const calcNetProfit = (
  revenue: number,
  costPrice: number,
  expenses: number,
  salaries: number,
): number => revenue - costPrice - expenses - salaries;
