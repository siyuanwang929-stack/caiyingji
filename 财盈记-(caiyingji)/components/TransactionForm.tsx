
import React, { useState } from 'react';
import { TransactionType } from '../types';

interface TransactionFormProps {
  onAdd: (amount: number, type: TransactionType, remarks: string, date: string) => void;
  onCancel: () => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onAdd, onCancel }) => {
  const today = new Date().toISOString().split('T')[0];
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.DEPOSIT);
  const [remarks, setRemarks] = useState('');
  const [date, setDate] = useState(today);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;
    
    // 验证日期是否为未来日期
    if (date > today) {
      alert('无法选择未来日期，请重新选择');
      return;
    }
    
    const finalAmount = type === TransactionType.WITHDRAWAL ? -numAmount : numAmount;
    onAdd(finalAmount, type, remarks, date);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl shadow-lg border border-slate-200">
      <h3 className="text-xl font-bold text-slate-800">新增交易记录</h3>
      
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">交易类型</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setType(TransactionType.DEPOSIT)}
            className={`py-2 px-4 rounded-lg border transition-all ${type === TransactionType.DEPOSIT ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-semibold' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
          >
            存款
          </button>
          <button
            type="button"
            onClick={() => setType(TransactionType.WITHDRAWAL)}
            className={`py-2 px-4 rounded-lg border transition-all ${type === TransactionType.WITHDRAWAL ? 'bg-rose-50 border-rose-500 text-rose-700 font-semibold' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
          >
            取款
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">金额 (￥)</label>
        <input
          type="number"
          step="0.01"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="0.00"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">日期</label>
        <input
          type="date"
          required
          max={today}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">备注</label>
        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-20"
          placeholder="添加备注信息..."
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-medium hover:bg-slate-200 transition-colors"
        >
          取消
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-md"
        >
          保存记录
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;
