import { useFinancialTotals, useSalesTotals } from "../../../hooks/useSupabaseQuery";

export function useFinancialAnalytics() {
  const salesTotals = useSalesTotals();
  const financialTotals = useFinancialTotals();

  return {
    salesTotals,
    financialTotals,
    isLoading: salesTotals.isLoading || financialTotals.isLoading,
    hasError: salesTotals.isError || financialTotals.isError,
  };
}
