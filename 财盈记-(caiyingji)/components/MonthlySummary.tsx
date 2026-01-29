
import React from 'react';
import { MonthlyReport } from '../types';

interface MonthlySummaryProps {
  reports: MonthlyReport[];
  onSettle: (report: MonthlyReport) => void;
}

const MonthlySummary: React.FC<MonthlySummaryProps> = ({ reports, onSettle }) => {
  const currentMonth = new Date().toISOString().substring(0, 7);

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <p className="text-slate-400 font-bold">暂无月度结算记录</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
      {[...reports].reverse().map((report) => (
        <div 
          key={report.month} 
          className={`group p-6 rounded-[2rem] border-2 transition-all hover:-translate-y-1 hover:shadow-xl bg-white ${report.isSettled ? 'border-blue-50 shadow-sm' : 'border-slate-100 shadow-sm'}`}
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h4 className="font-black text-slate-800 text-2xl tracking-tight">{report.month}</h4>
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">账务周期结算</p>
            </div>
            {report.isSettled ? (
              <div className="flex flex-col items-end">
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-lg shadow-blue-200">已入账</span>
              </div>
            ) : (
               report.month < currentMonth && (
                <button
                  onClick={() => onSettle(report)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-black transition-all shadow-lg shadow-emerald-100 active:scale-95"
                >
                  结算利息
                </button>
               )
            )}
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm font-bold text-slate-400">
              <span>期初余额</span>
              <span className="text-slate-600">￥{report.openingBalance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold">
              <span className="text-emerald-500">本月存款 (+)</span>
              <span className="text-emerald-600">+￥{report.deposits.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold">
              <span className="text-rose-400">本月取款 (-)</span>
              <span className="text-rose-500">-￥{report.withdrawals.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className={`flex justify-between items-center text-sm font-bold p-2 rounded-xl ${report.interest > 0 ? 'bg-blue-50 text-blue-600' : 'text-slate-400'}`}>
              <span>结算利息</span>
              <span>+￥{report.interest.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="pt-4 border-t border-slate-50 flex justify-between items-end">
              <span className="text-xs font-black text-slate-400 uppercase">期末终值</span>
              <span className="text-xl font-black text-slate-900">￥{report.closingBalance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MonthlySummary;
