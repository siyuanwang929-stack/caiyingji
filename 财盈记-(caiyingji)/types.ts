
export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  INTEREST = 'INTEREST',
  CORRECTION = 'CORRECTION'
}

export interface User {
  id: string;
  name: string;
  createdAt: number;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number; // Positive for inflow, Negative for outflow
  type: TransactionType;
  timestamp: number;
  remarks: string;
  settlementMonth?: string; // Format: YYYY-MM (Used for preventing duplicate interest)
}

export interface MonthlyReport {
  month: string; // YYYY-MM
  openingBalance: number;
  deposits: number;
  withdrawals: number;
  interest: number;
  closingBalance: number;
  isSettled: boolean;
}

export interface AppState {
  users: User[];
  transactions: Transaction[];
  activeUserId: string | null;
}
