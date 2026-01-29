
import { Transaction, TransactionType, User, MonthlyReport } from '../types';

export const ANNUAL_RATE = 0.10; // 10% 年利率
export const MONTHLY_RATE = ANNUAL_RATE / 12; // 月利率

/**
 * 计算用户在特定时间点的余额
 */
export const calculateBalanceAt = (transactions: Transaction[], userId: string, endTime?: number): number => {
  return transactions
    .filter(t => t.userId === userId && (!endTime || t.timestamp <= endTime))
    .reduce((sum, t) => sum + t.amount, 0);
};

/**
 * 按月分组生成账务报表
 */
export const getMonthlyReports = (transactions: Transaction[], userId: string): MonthlyReport[] => {
  const userTransactions = transactions
    .filter(t => t.userId === userId)
    .sort((a, b) => a.timestamp - b.timestamp);

  if (userTransactions.length === 0) return [];

  const firstTx = userTransactions[0];
  const lastTx = userTransactions[userTransactions.length - 1];
  
  const reports: MonthlyReport[] = [];
  const start = new Date(firstTx.timestamp);
  const end = new Date(); 

  let currentYear = start.getFullYear();
  let currentMonth = start.getMonth();

  let runningBalance = 0;

  while (
    currentYear < end.getFullYear() || 
    (currentYear === end.getFullYear() && currentMonth <= end.getMonth())
  ) {
    const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const startOfMonth = new Date(currentYear, currentMonth, 1).getTime();
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999).getTime();

    const monthTxs = userTransactions.filter(t => t.timestamp >= startOfMonth && t.timestamp <= endOfMonth);
    
    const openingBalance = runningBalance;
    const deposits = monthTxs.filter(t => t.type === TransactionType.DEPOSIT || (t.type === TransactionType.CORRECTION && t.amount > 0))
      .reduce((sum, t) => sum + t.amount, 0);
    const withdrawals = monthTxs.filter(t => t.type === TransactionType.WITHDRAWAL || (t.type === TransactionType.CORRECTION && t.amount < 0))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const interest = monthTxs.find(t => t.type === TransactionType.INTEREST)?.amount || 0;
    
    // 利息计算逻辑：利息基于本月存取款后的“月终结算前”余额
    const balanceBeforeInterest = openingBalance + deposits - withdrawals;
    const closingBalance = balanceBeforeInterest + interest;

    reports.push({
      month: monthStr,
      openingBalance,
      deposits,
      withdrawals,
      interest,
      closingBalance,
      isSettled: monthTxs.some(t => t.type === TransactionType.INTEREST)
    });

    runningBalance = closingBalance;

    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
  }

  return reports;
};

/**
 * 防重复结算检查
 */
export const canSettleInterest = (transactions: Transaction[], userId: string, year: number, month: number): boolean => {
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  return !transactions.some(t => t.userId === userId && t.type === TransactionType.INTEREST && t.settlementMonth === monthStr);
};
