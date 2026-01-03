import React, { useState } from 'react';
import { Loan, DashboardStats } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Wallet, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { analyzePortfolio } from '../services/geminiService';

interface DashboardProps {
  loans: Loan[];
}

const Dashboard: React.FC<DashboardProps> = ({ loans }) => {
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);

  const stats: DashboardStats = loans.reduce((acc, loan) => {
    const repaid = loan.transactions
      .filter(t => t.type === 'REPAYMENT')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Status Logic for Stats
    const isClosed = loan.status === 'CLOSED';
    
    if (!isClosed) {
      acc.activeLoansCount++;
      acc.totalLent += loan.amount;
      // Pending = (Principal + Interest) - Repaid
      // Ensure we don't go negative if they overpaid
      const pending = Math.max(0, (loan.amount + loan.totalInterest) - repaid);
      acc.totalPending += pending;
      // Expected Interest from Active loans
      acc.totalInterestExpected += loan.totalInterest;
    } else {
      // For closed loans, we assume the profit is the Total Interest defined
      // Or we could calculate (Repaid - Principal)
      acc.totalRealizedInterest += loan.totalInterest;
    }
    
    return acc;
  }, { totalLent: 0, totalInterestExpected: 0, totalRealizedInterest: 0, totalPending: 0, activeLoansCount: 0 });

  const chartData = loans.map(l => ({
    name: l.borrowerName.substring(0, 10),
    amount: l.amount,
    status: l.status
  }));

  const handleAiAnalyze = async () => {
    setLoadingAi(true);
    const result = await analyzePortfolio(loans);
    setAiAnalysis(result);
    setLoadingAi(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Principal */}
        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-zinc-400 text-sm">ยอดปล่อยกู้ (Active)</p>
              <h3 className="text-2xl font-bold text-white mt-2">฿{stats.totalLent.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Wallet className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Realized Interest (Closed) */}
        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-zinc-400 text-sm">ดอกเบี้ยที่ปิดแล้ว</p>
              <h3 className="text-2xl font-bold text-emerald-400 mt-2">฿{stats.totalRealizedInterest.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
        </div>
        
        {/* Expected Interest (Active) */}
        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-zinc-400 text-sm">ดอกเบี้ยรอเก็บ (Active)</p>
              <h3 className="text-2xl font-bold text-zinc-300 mt-2">฿{stats.totalInterestExpected.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-zinc-800 rounded-lg">
              <TrendingUp className="w-6 h-6 text-zinc-400" />
            </div>
          </div>
        </div>

        {/* Total Pending Amount */}
        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-zinc-400 text-sm">ยอดรอเก็บคืนทั้งหมด</p>
              <h3 className="text-2xl font-bold text-yellow-400 mt-2">฿{stats.totalPending.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <AlertCircle className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* AI Analysis Button (Full width on mobile, auto on large) */}
        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 md:col-span-2 lg:col-span-4 cursor-pointer group" onClick={handleAiAnalyze}>
           <div className="flex justify-between items-center">
            <div>
              <p className="text-zinc-400 text-sm group-hover:text-purple-400 transition-colors">วิเคราะห์พอร์ตโฟลิโอ (AI)</p>
              <h3 className="text-xl font-bold text-purple-400 mt-2 flex items-center gap-2">
                {loadingAi ? 'กำลังวิเคราะห์...' : 'ขอคำแนะนำจาก AI'}
              </h3>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-all">
              <Sparkles className="w-6 h-6 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {aiAnalysis && (
        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 animate-fade-in">
          <h3 className="text-lg font-semibold text-purple-400 mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Gemini Analysis
          </h3>
          <div className="prose prose-invert max-w-none text-sm text-zinc-300 whitespace-pre-line">
            {aiAnalysis}
          </div>
        </div>
      )}

      <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
        <h3 className="text-lg font-semibold text-white mb-6">กราฟยอดเงินกู้รายบุคคล</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#71717a" fontSize={12} />
              <YAxis stroke="#71717a" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
              />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.status === 'OVERDUE' ? '#ef4444' : '#3b82f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;