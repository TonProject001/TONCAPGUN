export type LoanTerm = '1_MONTH' | '3_MONTHS' | '5_MONTHS' | '10_MONTHS' | 'CUSTOM';
export type BorrowerType = 'INDIVIDUAL' | 'GROUP';
export type LoanStatus = 'ACTIVE' | 'CLOSED' | 'OVERDUE';

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: 'REPAYMENT' | 'FEE' | 'LEND';
  note?: string;
  slipUrl?: string; // Base64 string for demo purposes
}

export interface Loan {
  id: string;
  borrowerName: string;
  borrowerType: BorrowerType;
  amount: number; // Principal
  interestRate: number; // Percentage
  totalInterest: number; // Calculated total interest expected
  term: LoanTerm;
  startDate: string;
  repaymentDay?: number; // Day of month (1-31)
  status: LoanStatus;
  transactions: Transaction[];
  notificationsEnabled: boolean;
}

export interface DashboardStats {
  totalLent: number;
  totalInterestExpected: number;
  totalRealizedInterest: number;
  totalPending: number;
  activeLoansCount: number;
}