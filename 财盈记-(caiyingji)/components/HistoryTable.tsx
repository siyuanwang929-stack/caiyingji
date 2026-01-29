
import React from 'react';
import { Transaction, TransactionType } from '../types';

interface HistoryTableProps {
  transactions: Transaction[];
}

const HistoryTable: React.FC<HistoryTableProps> = ({ transactions }) => {
  const sorted = [...transactions].sort((a, b) => b.timestamp - a.timestamp);

  const getBadgeClass = (type: TransactionType) => {
    switch (type) {
      case TransactionType.DEPOSIT: return 'bg-emerald-100 text-emerald-700';
      case TransactionType.WITHDRAWAL: return 'bg-rose-100 text-rose-700';
      case TransactionType.INTEREST: return 'bg-blue-100 text-blue-700';
      case TransactionType.CORRECTION: return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getTypeText = (type: TransactionType) => {
    switch (type) {
      case TransactionType.DEPOSIT: return '存款';
      case TransactionType.WITHDRAWAL: return '取款';
      case TransactionType.INTEREST: return '利息结算';
      case TransactionType.CORRECTION: return '修正记录';
      default: return type;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">交易日期</th>
              <th className="px-6 py-4">类型</th>
              <th className="px-6 py-4">备注</th>
              <th className="px-6 py-4 text-right">金额 (￥)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {sorted.map((tx) => (
              <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                  {new Date(tx.timestamp).toLocaleDateString('zh-CN')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getBadgeClass(tx.type)}`}>
                    {getTypeText(tx.type)}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500 max-w-xs truncate">
                  {tx.remarks || '-'}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-right font-semibold ${tx.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {tx.amount >= 0 ? '+' : ''}{tx.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                  暂无交易记录
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoryTable;
