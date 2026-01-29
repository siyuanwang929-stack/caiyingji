
import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, User } from '../types';

interface SpreadsheetViewProps {
  transactions: Transaction[];
  user: User;
}

const SpreadsheetView: React.FC<SpreadsheetViewProps> = ({ transactions, user }) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // 提取交易中存在的所有年份
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(currentYear);
    transactions.forEach(t => years.add(new Date(t.timestamp).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions, currentYear]);

  // 计算每个月的数据
  const monthlyData = useMemo(() => {
    const data = Array.from({ length: 12 }, (_, i) => {
      const monthIndex = i; // 0-11
      const startOfMonth = new Date(selectedYear, monthIndex, 1).getTime();
      const endOfMonth = new Date(selectedYear, monthIndex + 1, 0, 23, 59, 59, 999).getTime();

      // 该月之前的所有交易计算期初
      const openingBalance = transactions
        .filter(t => t.userId === user.id && t.timestamp < startOfMonth)
        .reduce((sum, t) => sum + t.amount, 0);

      // 该月的存取交易（不含利息）
      const dailyTxs = transactions
        .filter(t => t.userId === user.id && t.timestamp >= startOfMonth && t.timestamp <= endOfMonth && t.type !== TransactionType.INTEREST)
        .sort((a, b) => a.timestamp - b.timestamp);

      // 该月的利息交易
      const interestAmount = transactions
        .filter(t => t.userId === user.id && t.timestamp >= startOfMonth && t.timestamp <= endOfMonth && t.type === TransactionType.INTEREST)
        .reduce((sum, t) => sum + t.amount, 0);

      const incomeSubtotal = dailyTxs.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
      const expenseSubtotal = dailyTxs.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0);
      
      const subtotal = incomeSubtotal + expenseSubtotal;
      const monthlyTotal = subtotal + interestAmount;
      const closingBalance = openingBalance + monthlyTotal;

      return {
        openingBalance,
        dailyTxs,
        incomeSubtotal,
        expenseSubtotal,
        interestAmount,
        monthlyTotal,
        closingBalance
      };
    });
    return data;
  }, [transactions, user.id, selectedYear]);

  // 确定存取明细的最大行数（至少显示 5 行）
  const maxTxRows = Math.max(5, ...monthlyData.map(d => d.dailyTxs.length));

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <h3 className="text-xl font-black text-slate-800 tracking-tight">
          {user.name} 账户年度概览 {selectedYear}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-500 uppercase">查看年份:</span>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-white border border-slate-300 rounded-lg px-3 py-1 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
          >
            {availableYears.map(y => <option key={y} value={y}>{y} 年</option>)}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full text-[11px] lg:text-xs font-bold border-collapse table-auto">
          <thead>
            <tr>
              <th className="border border-slate-300 bg-[#c9e4d6] px-2 py-2 w-[80px] text-center">月份</th>
              {Array.from({ length: 12 }, (_, i) => (
                <th key={i} className="border border-slate-300 bg-[#c9e4d6] px-1 py-2 text-center min-w-[50px]">{i + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* 期初金额 */}
            <tr>
              <td className="border border-slate-300 bg-[#f9e9ae] px-2 py-2 text-center">期初金额</td>
              {monthlyData.map((d, i) => (
                <td key={i} className="border border-slate-300 bg-[#f9e9ae] px-0.5 py-2 text-center">
                  {d.openingBalance !== 0 ? d.openingBalance.toFixed(0) : ''}
                </td>
              ))}
            </tr>

            {/* 日常存取明细行 */}
            {Array.from({ length: maxTxRows }, (_, rowIndex) => (
              <tr key={rowIndex}>
                {rowIndex === 0 && (
                  <td rowSpan={maxTxRows} className="border border-slate-300 bg-slate-50 px-2 py-2 text-center align-middle whitespace-pre-wrap">
                    日常存取
                  </td>
                )}
                {monthlyData.map((d, colIndex) => {
                  const tx = d.dailyTxs[rowIndex];
                  return (
                    <td key={colIndex} className="border border-slate-300 px-0.5 py-1.5 h-8 text-center relative font-medium">
                      {tx && (
                        <span className={tx.amount < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(0)}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* 收入小计 */}
            <tr className="bg-emerald-50/50">
              <td className="border border-slate-300 px-2 py-2 text-center text-emerald-700">收入小计</td>
              {monthlyData.map((d, i) => (
                <td key={i} className="border border-slate-300 px-0.5 py-2 text-center font-black text-emerald-600">
                  {d.incomeSubtotal !== 0 ? '+' + d.incomeSubtotal.toFixed(0) : ''}
                </td>
              ))}
            </tr>

            {/* 支出小计 */}
            <tr className="bg-rose-50/50">
              <td className="border border-slate-300 px-2 py-2 text-center text-rose-700">支出小计</td>
              {monthlyData.map((d, i) => (
                <td key={i} className="border border-slate-300 px-0.5 py-2 text-center font-black text-rose-600">
                  {d.expenseSubtotal !== 0 ? d.expenseSubtotal.toFixed(0) : ''}
                </td>
              ))}
            </tr>

            {/* 当月利息 */}
            <tr>
              <td className="border border-slate-300 px-2 py-2 text-center">当月利息</td>
              {monthlyData.map((d, i) => (
                <td key={i} className="border border-slate-300 px-0.5 py-2 text-center text-blue-600">
                  {d.interestAmount > 0 ? d.interestAmount.toFixed(1) : ''}
                </td>
              ))}
            </tr>

            {/* 当月总计 */}
            <tr>
              <td className="border border-slate-300 bg-[#e1c5e6] px-2 py-2 text-center text-[#7c3aed]">当月总计</td>
              {monthlyData.map((d, i) => (
                <td key={i} className="border border-slate-300 bg-[#e1c5e6] px-0.5 py-2 text-center">
                  {d.monthlyTotal !== 0 ? d.monthlyTotal.toFixed(1) : ''}
                </td>
              ))}
            </tr>

            {/* 当月可用余额 */}
            <tr>
              <td className="border border-slate-300 bg-[#f1c3bc] px-2 py-2 text-center text-rose-900">当月可用余额</td>
              {monthlyData.map((d, i) => (
                <td key={i} className="border border-slate-300 bg-[#f1c3bc] px-0.5 py-2 text-center font-black">
                  {d.closingBalance !== 0 ? d.closingBalance.toFixed(0) : ''}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <div className="p-4 bg-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center border-t border-slate-200">
        说明：表格根据屏幕自动适配。建议在大屏幕上查看完整年度概览。收入小计仅统计正向存入，支出小计仅统计负向支取。
      </div>
    </div>
  );
};

export default SpreadsheetView;
