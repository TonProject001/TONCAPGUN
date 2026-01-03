import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import LoanManager from './components/LoanManager';
import { Loan } from './types';
import { LayoutDashboard, FileText, Settings, BadgeDollarSign, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'LOANS'>('DASHBOARD');
  const [loans, setLoans] = useState<Loan[]>([]);
  
  // Load from LocalStorage on mount
  useEffect(() => {
    const savedLoans = localStorage.getItem('toncapgun_data');
    if (savedLoans) {
      try {
        setLoans(JSON.parse(savedLoans));
      } catch (e) {
        console.error("Failed to parse loans", e);
      }
    }
  }, []);

  // Save to LocalStorage whenever loans change
  useEffect(() => {
    localStorage.setItem('toncapgun_data', JSON.stringify(loans));
  }, [loans]);

  const addLoan = (loan: Loan) => {
    setLoans(prev => [loan, ...prev]);
  };

  const updateLoan = (updatedLoan: Loan) => {
    setLoans(prev => prev.map(l => l.id === updatedLoan.id ? updatedLoan : l));
  };

  const deleteLoan = (id: string) => {
    setLoans(prev => prev.filter(l => l.id !== id));
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans pb-24 md:pb-0 md:pl-64">
      {/* Mobile Header */}
      <div className="md:hidden p-4 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur z-20">
        <h1 className="text-xl font-bold tracking-wider text-white flex items-center gap-2">
            <BadgeDollarSign className="text-blue-500"/>
            TONCAPGUN
        </h1>
        <div className="px-2 py-1 bg-zinc-800 rounded-full text-[10px] text-zinc-400">
            Offline Mode
        </div>
      </div>

      {/* Sidebar (Desktop) */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-zinc-950 border-r border-zinc-800 hidden md:flex flex-col z-10">
        <div className="p-6 border-b border-zinc-800">
          <h1 className="text-2xl font-bold tracking-wider text-white flex items-center gap-2">
            <BadgeDollarSign className="w-8 h-8 text-blue-500"/>
            TONCAPGUN
          </h1>
          <p className="text-xs text-zinc-500 mt-1">ระบบจัดการเงินกู้ (ส่วนตัว)</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('DASHBOARD')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'DASHBOARD' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            ภาพรวม
          </button>
          <button 
            onClick={() => setActiveTab('LOANS')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'LOANS' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'}`}
          >
            <FileText className="w-5 h-5" />
            รายการเงินกู้
          </button>
        </nav>
        <div className="p-4 border-t border-zinc-800">
            <div className="flex items-center gap-3 px-4 py-3 text-zinc-500 text-sm">
                <Settings className="w-4 h-4" />
                เวอร์ชั่น 1.3.0 (Local)
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        {activeTab === 'DASHBOARD' && (
          <div className="animate-fade-in">
             <header className="mb-8 flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-white">ภาพรวมระบบ</h2>
                    <p className="text-zinc-400">สรุปยอดปล่อยกู้และดอกเบี้ยทั้งหมด</p>
                </div>
             </header>
             <Dashboard loans={loans} />
          </div>
        )}
        
        {activeTab === 'LOANS' && (
          <div className="animate-fade-in">
             <header className="mb-8">
                <h2 className="text-3xl font-bold text-white">รายการเงินกู้</h2>
                <p className="text-zinc-400">จัดการสัญญาและบันทึกการชำระเงิน</p>
             </header>
            <LoanManager 
              loans={loans} 
              onAddLoan={addLoan} 
              onUpdateLoan={updateLoan} 
              onDeleteLoan={deleteLoan}
            />
          </div>
        )}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full bg-zinc-950 border-t border-zinc-800 p-4 flex justify-around md:hidden z-20 pb-safe">
        <button 
          onClick={() => setActiveTab('DASHBOARD')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'DASHBOARD' ? 'text-blue-500' : 'text-zinc-500'}`}
        >
          <LayoutDashboard className="w-6 h-6" />
          <span className="text-[10px]">ภาพรวม</span>
        </button>
        <button 
           onClick={() => setActiveTab('LOANS')}
           className={`flex flex-col items-center gap-1 ${activeTab === 'LOANS' ? 'text-blue-500' : 'text-zinc-500'}`}
        >
          <FileText className="w-6 h-6" />
          <span className="text-[10px]">รายการ</span>
        </button>
      </nav>
    </div>
  );
};

export default App;