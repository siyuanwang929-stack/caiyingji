
import React, { useState, useEffect, useMemo } from 'react';
import { AppState, User, Transaction, TransactionType } from './types';
import { calculateBalanceAt, getMonthlyReports, canSettleInterest, MONTHLY_RATE } from './services/ledgerService';
import TransactionForm from './components/TransactionForm';
import HistoryTable from './components/HistoryTable';
import MonthlySummary from './components/MonthlySummary';
import SpreadsheetView from './components/SpreadsheetView';

const STORAGE_KEY = 'ledger_guard_db';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          activeUserId: parsed.activeUserId || parsed.users[0]?.id || null
        };
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }
    return {
      users: [
        { id: '1', name: '闫弘毅', createdAt: Date.now() },
        { id: '2', name: '闫心悦', createdAt: Date.now() }
      ],
      transactions: [],
      activeUserId: '1'
    };
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'history' | 'summary' | 'excel'>('summary');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const activeUser = useMemo(() => 
    state.users.find(u => u.id === state.activeUserId), 
    [state.users, state.activeUserId]
  );

  const currentBalance = useMemo(() => 
    state.activeUserId ? calculateBalanceAt(state.transactions, state.activeUserId) : 0,
    [state.transactions, state.activeUserId]
  );

  const reports = useMemo(() => 
    state.activeUserId ? getMonthlyReports(state.transactions, state.activeUserId) : [],
    [state.transactions, state.activeUserId]
  );

  const currentMonthStats = useMemo(() => {
    if (reports.length === 0) return { deposits: 0, withdrawals: 0, interest: 0 };
    return reports[reports.length - 1];
  }, [reports]);

  const handleAddTransaction = (amount: number, type: TransactionType, remarks: string, date: string) => {
    if (!state.activeUserId) return;

    const newTx: Transaction = {
      id: Math.random().toString(36).substring(2, 9),
      userId: state.activeUserId,
      amount,
      type,
      timestamp: new Date(date).getTime(),
      remarks
    };

    setState(prev => ({
      ...prev,
      transactions: [...prev.transactions, newTx]
    }));
    setShowAddForm(false);
  };

  const handleSettleInterest = (report: any) => {
    if (!state.activeUserId) return;

    const [year, month] = report.month.split('-').map(Number);
    if (!canSettleInterest(state.transactions, state.activeUserId, year, month - 1)) {
      alert("该月份利息已经结算过了，不可重复操作。");
      return;
    }

    const interestAmount = (report.openingBalance + report.deposits - report.withdrawals) * MONTHLY_RATE;
    const lastDayOfMonth = new Date(year, month, 0, 23, 59, 59).getTime();

    const interestTx: Transaction = {
      id: `INT-${report.month}-${state.activeUserId}`,
      userId: state.activeUserId,
      amount: interestAmount,
      type: TransactionType.INTEREST,
      timestamp: lastDayOfMonth,
      remarks: `自动利息结算: ${report.month}`,
      settlementMonth: report.month
    };

    setState(prev => ({
      ...prev,
      transactions: [...prev.transactions, interestTx]
    }));
  };

  const handleAddUser = () => {
    const name = prompt("请输入新用户名:");
    if (name && name.trim()) {
      const newUser: User = {
        id: Math.random().toString(36).substring(2, 9),
        name: name.trim(),
        createdAt: Date.now()
      };
      setState(prev => ({
        ...prev,
        users: [...prev.users, newUser],
        activeUserId: newUser.id
      }));
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase">财盈记</h1>
            <p className="text-xs text-slate-400 font-medium">10% 年化月复利账本</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            {state.users.map(u => (
              <button
                key={u.id}
                onClick={() => { setState(prev => ({ ...prev, activeUserId: u.id })); setShowAddForm(false); }}
                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${state.activeUserId === u.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {u.name}
              </button>
            ))}
            <button 
              onClick={handleAddUser}
              className="px-3 py-2 text-slate-400 hover:text-blue-600 transition-colors"
              title="新增用户"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* 余额汇总卡片 */}
          <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 rounded-[2rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                <p className="text-blue-100 text-sm font-semibold mb-2 flex items-center gap-2 opacity-80">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                  当前账户结余 ({activeUser?.name})
                </p>
                <h2 className="text-5xl md:text-6xl font-black tracking-tighter">
                  <span className="text-3xl font-medium mr-1 text-blue-200">￥</span>
                  {currentBalance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                </h2>
              </div>
              
              <button 
                onClick={() => setShowAddForm(true)}
                className="group bg-white text-blue-600 px-8 py-4 rounded-2xl font-black text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                <svg className="w-6 h-6 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                存取资金
              </button>
            </div>

            {/* 本月速览 */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 pt-8 border-t border-white/10 relative z-10">
              <div className="space-y-1">
                <p className="text-blue-200 text-xs font-bold uppercase tracking-widest">本月存入</p>
                <p className="text-xl font-bold">+￥{currentMonthStats.deposits.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="space-y-1">
                <p className="text-blue-200 text-xs font-bold uppercase tracking-widest">本月支取</p>
                <p className="text-xl font-bold">-￥{currentMonthStats.withdrawals.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="space-y-1 col-span-2 md:col-span-1">
                <p className="text-emerald-300 text-xs font-bold uppercase tracking-widest">累计利息</p>
                <p className="text-xl font-bold text-emerald-300">￥{currentMonthStats.interest.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>

            {/* 装饰背景 */}
            <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
            <div className="absolute -left-16 -top-16 w-48 h-48 bg-indigo-400/20 rounded-full blur-2xl"></div>
          </div>

          {/* 选项卡导航 */}
          <div className="flex items-center justify-between px-2">
            <div className="flex flex-wrap gap-2 bg-white/50 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-sm">
              <button
                onClick={() => setActiveTab('summary')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'summary' ? 'bg-white text-blue-600 shadow-md ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                月度概览
              </button>
              <button
                onClick={() => setActiveTab('excel')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'excel' ? 'bg-white text-blue-600 shadow-md ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                年度表格
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white text-blue-600 shadow-md ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                交易流水
              </button>
            </div>
            
            <div className="hidden lg:flex items-center gap-2 text-xs font-bold text-slate-400 bg-white px-4 py-2 rounded-xl border border-slate-200 uppercase tracking-widest shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              实时复利计息中
            </div>
          </div>

          {/* 内容区域 */}
          <div className="transition-all duration-300">
            {activeTab === 'summary' ? (
              <MonthlySummary reports={reports} onSettle={handleSettleInterest} />
            ) : activeTab === 'excel' ? (
              activeUser && <SpreadsheetView transactions={state.transactions} user={activeUser} />
            ) : (
              <HistoryTable transactions={state.transactions.filter(t => t.userId === state.activeUserId)} />
            )}
          </div>
        </div>
      </main>

      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-hidden">
          <div className="w-full max-w-md animate-in fade-in zoom-in duration-300">
            <TransactionForm 
              onAdd={handleAddTransaction} 
              onCancel={() => setShowAddForm(false)} 
            />
          </div>
        </div>
      )}

      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-[10px] md:text-xs text-slate-400 font-bold tracking-widest uppercase">
        安全性说明：所有财务数据仅存储于您的浏览器本地缓存 (LocalStorage)，本应用不涉及任何联网行为。
      </footer>
    </div>
  );
};

export default App;
