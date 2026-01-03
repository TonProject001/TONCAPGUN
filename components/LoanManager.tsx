import React, { useState, useRef } from 'react';
import { Loan, LoanTerm, BorrowerType, Transaction } from '../types';
import { Plus, Search, User, Users, FileText, Bell, BellOff, X, Upload, ChevronRight, Check, Trash2, Edit, Calendar, Save, XCircle } from 'lucide-react';

interface LoanManagerProps {
  loans: Loan[];
  onAddLoan: (loan: Loan) => void;
  onUpdateLoan: (loan: Loan) => void;
  onDeleteLoan: (id: string) => void;
}

const LoanManager: React.FC<LoanManagerProps> = ({ loans, onAddLoan, onUpdateLoan, onDeleteLoan }) => {
  const [view, setView] = useState<'LIST' | 'FORM' | 'DETAIL'>('LIST');
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [filter, setFilter] = useState('');

  // Form States
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [interest, setInterest] = useState('');
  const [term, setTerm] = useState<LoanTerm>('1_MONTH');
  const [type, setType] = useState<BorrowerType>('INDIVIDUAL');
  const [startDateInput, setStartDateInput] = useState('');
  const [repaymentDayInput, setRepaymentDayInput] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);

  // Repayment State
  const [repayAmount, setRepayAmount] = useState('');
  const [repayDate, setRepayDate] = useState(new Date().toISOString().split('T')[0]);
  const [repaySlip, setRepaySlip] = useState<string | null>(null);
  const repayFileRef = useRef<HTMLInputElement>(null);

  // Transaction Editing State
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [editTxAmount, setEditTxAmount] = useState('');
  const [editTxDate, setEditTxDate] = useState('');

  const resetForm = () => {
    setName('');
    setAmount('');
    setInterest('');
    setTerm('1_MONTH');
    setType('INDIVIDUAL');
    setStartDateInput(new Date().toISOString().split('T')[0]);
    setRepaymentDayInput('');
    setSlipPreview(null);
  };

  const handleAddNewClick = () => {
    setSelectedLoan(null);
    resetForm();
    setView('FORM');
  };

  const handleEditClick = (loan: Loan) => {
    setSelectedLoan(loan);
    setName(loan.borrowerName);
    setAmount(loan.amount.toString());
    setInterest(loan.totalInterest.toString());
    setTerm(loan.term);
    setType(loan.borrowerType);
    setStartDateInput(new Date(loan.startDate).toISOString().split('T')[0]);
    setRepaymentDayInput(loan.repaymentDay ? loan.repaymentDay.toString() : '');
    setSlipPreview(null); 
    setView('FORM');
  };

  const handleDeleteClick = (loan: Loan) => {
    if (window.confirm(`ยืนยันการลบข้อมูลของ "${loan.borrowerName}"? ข้อมูลทั้งหมดจะหายไปและไม่สามารถกู้คืนได้`)) {
        onDeleteLoan(loan.id);
        if (selectedLoan?.id === loan.id) {
            setSelectedLoan(null);
        }
        setView('LIST');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setPreview: (s: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateLoanStatus = (loan: Loan, transactions: Transaction[]): 'ACTIVE' | 'CLOSED' => {
      const totalRepaid = transactions
        .filter(t => t.type === 'REPAYMENT')
        .reduce((sum, t) => sum + t.amount, 0);
      return totalRepaid >= (loan.amount + loan.totalInterest) ? 'CLOSED' : 'ACTIVE';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const principal = parseFloat(amount);
    const totalInterest = parseFloat(interest);
    const start = new Date(startDateInput);
    const repayDay = repaymentDayInput ? parseInt(repaymentDayInput) : undefined;
    
    if (selectedLoan) {
        // UPDATE Existing Loan
        const newTransactions = selectedLoan.transactions.map(t => {
            if (t.type === 'LEND' && t.id.startsWith('init-')) {
                return { ...t, amount: principal, date: start.toISOString() };
            }
            return t;
        });

        const updatedLoan: Loan = {
            ...selectedLoan,
            borrowerName: name,
            borrowerType: type,
            amount: principal,
            totalInterest: totalInterest,
            term: term,
            startDate: start.toISOString(),
            repaymentDay: repayDay,
            transactions: newTransactions,
            status: calculateLoanStatus({ ...selectedLoan, amount: principal, totalInterest: totalInterest }, newTransactions)
        };
        onUpdateLoan(updatedLoan);
        setSelectedLoan(updatedLoan);
        setView('DETAIL');
    } else {
        // CREATE New Loan
        const newLoan: Loan = {
            id: Date.now().toString(),
            borrowerName: name,
            borrowerType: type,
            amount: principal,
            interestRate: 0,
            totalInterest: totalInterest,
            term: term,
            startDate: start.toISOString(),
            repaymentDay: repayDay,
            status: 'ACTIVE',
            notificationsEnabled: true,
            transactions: slipPreview ? [{
                id: `init-${Date.now()}`,
                date: start.toISOString(),
                amount: principal,
                type: 'LEND',
                slipUrl: slipPreview
            }] : []
        };
        onAddLoan(newLoan);
        resetForm();
        setView('LIST');
    }
  };

  const handleAddRepayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;

    const transaction: Transaction = {
      id: Date.now().toString(),
      date: new Date(repayDate).toISOString(),
      amount: parseFloat(repayAmount),
      type: 'REPAYMENT',
      slipUrl: repaySlip || undefined
    };

    const newTransactions = [transaction, ...selectedLoan.transactions];
    // Sort transactions by date descending (newest first)
    newTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const updatedLoan = {
      ...selectedLoan,
      transactions: newTransactions,
      status: calculateLoanStatus(selectedLoan, newTransactions)
    };

    onUpdateLoan(updatedLoan);
    setSelectedLoan(updatedLoan);
    setRepayAmount('');
    setRepayDate(new Date().toISOString().split('T')[0]); // Reset to today
    setRepaySlip(null);
  };

  const handleDeleteTransaction = (txId: string) => {
    if (!selectedLoan) return;
    if (!window.confirm("ยืนยันการลบรายการนี้?")) return;

    const newTransactions = selectedLoan.transactions.filter(t => t.id !== txId);
    const updatedLoan = {
        ...selectedLoan,
        transactions: newTransactions,
        status: calculateLoanStatus(selectedLoan, newTransactions)
    };
    onUpdateLoan(updatedLoan);
    setSelectedLoan(updatedLoan);
  };

  const startEditTransaction = (tx: Transaction) => {
    setEditingTxId(tx.id);
    setEditTxAmount(tx.amount.toString());
    setEditTxDate(new Date(tx.date).toISOString().split('T')[0]); // YYYY-MM-DD
  };

  const saveEditTransaction = (txId: string) => {
    if (!selectedLoan) return;
    
    const newTransactions = selectedLoan.transactions.map(t => {
        if (t.id === txId) {
            return {
                ...t,
                amount: parseFloat(editTxAmount),
                date: new Date(editTxDate).toISOString()
            };
        }
        return t;
    });
    
    // Sort again in case date changed
    newTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const updatedLoan = {
        ...selectedLoan,
        transactions: newTransactions,
        status: calculateLoanStatus(selectedLoan, newTransactions)
    };

    onUpdateLoan(updatedLoan);
    setSelectedLoan(updatedLoan);
    setEditingTxId(null);
  };

  const toggleNotification = (loan: Loan) => {
    onUpdateLoan({ ...loan, notificationsEnabled: !loan.notificationsEnabled });
    if (selectedLoan && selectedLoan.id === loan.id) {
        setSelectedLoan({ ...selectedLoan, notificationsEnabled: !loan.notificationsEnabled });
    }
  };

  const filteredLoans = loans.filter(l => l.borrowerName.toLowerCase().includes(filter.toLowerCase()));

  // -- RENDER HELPERS --

  const renderStatus = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">กำลังผ่อน</span>;
      case 'CLOSED': return <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">ปิดบัญชี</span>;
      case 'OVERDUE': return <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">ค้างชำระ</span>;
      default: return null;
    }
  };

  const getTermLabel = (t: LoanTerm) => {
    const map: Record<LoanTerm, string> = {
        '1_MONTH': 'รายเดือน',
        '3_MONTHS': '3 เดือน',
        '5_MONTHS': '5 เดือน',
        '10_MONTHS': '10 เดือน',
        'CUSTOM': 'กำหนดเอง'
    };
    return map[t];
  };

  if (view === 'FORM') {
    return (
      <div className="max-w-2xl mx-auto bg-zinc-900 p-6 rounded-xl border border-zinc-800">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">{selectedLoan ? 'แก้ไขข้อมูล' : 'สร้างสัญญาเงินกู้ใหม่'}</h2>
          <button onClick={() => selectedLoan ? setView('DETAIL') : setView('LIST')} className="p-2 hover:bg-zinc-800 rounded-full">
            <X className="w-6 h-6 text-zinc-400" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">ชื่อผู้กู้</label>
            <input 
              required
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors"
              placeholder="เช่น สมชาย ใจดี"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">ประเภท</label>
              <select 
                value={type} 
                onChange={e => setType(e.target.value as BorrowerType)}
                className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white outline-none"
              >
                <option value="INDIVIDUAL">บุคคลเดี่ยว</option>
                <option value="GROUP">กลุ่ม/แก๊ง</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">ระยะเวลา</label>
              <select 
                value={term} 
                onChange={e => setTerm(e.target.value as LoanTerm)}
                className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white outline-none"
              >
                <option value="1_MONTH">รายเดือน</option>
                <option value="3_MONTHS">3 เดือน</option>
                <option value="5_MONTHS">5 เดือน</option>
                <option value="10_MONTHS">10 เดือน</option>
                <option value="CUSTOM">อื่นๆ</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm text-zinc-400 mb-1">วันที่ปล่อยกู้</label>
                <input 
                    type="date"
                    required
                    value={startDateInput}
                    onChange={e => setStartDateInput(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white outline-none [color-scheme:dark]"
                />
             </div>
             <div>
                <label className="block text-sm text-zinc-400 mb-1">ชำระทุกวันที่ (เลือกได้)</label>
                <input 
                    type="number"
                    min="1"
                    max="31"
                    value={repaymentDayInput}
                    onChange={e => setRepaymentDayInput(e.target.value)}
                    placeholder="เช่น 1, 15, 25"
                    className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white outline-none"
                />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">ยอดเงินต้น (บาท)</label>
              <input 
                required
                type="number" 
                value={amount} 
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white outline-none"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">ดอกเบี้ยรวม (บาท)</label>
              <input 
                required
                type="number" 
                value={interest} 
                onChange={e => setInterest(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white outline-none"
                placeholder="ระบุจำนวนเงิน"
              />
            </div>
          </div>

          {!selectedLoan && (
            <div>
              <label className="block text-sm text-zinc-400 mb-1">แนบสลิปการโอนเงินให้ผู้กู้</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-800 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-zinc-600 transition-colors"
              >
                {slipPreview ? (
                  <img src={slipPreview} alt="Slip" className="max-h-40 rounded shadow-md" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-zinc-500 mb-2" />
                    <span className="text-zinc-500 text-sm">คลิกเพื่ออัพโหลดรูปภาพ</span>
                  </>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, setSlipPreview)}
                />
              </div>
            </div>
          )}

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors mt-4">
            {selectedLoan ? 'บันทึกการแก้ไข' : 'สร้างสัญญา'}
          </button>
        </form>
      </div>
    );
  }

  if (view === 'DETAIL' && selectedLoan) {
    const totalRepaid = selectedLoan.transactions
      .filter(t => t.type === 'REPAYMENT')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalDue = selectedLoan.amount + selectedLoan.totalInterest;
    const progress = Math.min((totalRepaid / totalDue) * 100, 100);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Column */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-bold text-white">{selectedLoan.borrowerName}</h2>
                            {renderStatus(selectedLoan.status)}
                        </div>
                        <p className="text-zinc-400 text-sm mt-1 flex items-center gap-2">
                            {selectedLoan.borrowerType === 'GROUP' ? <Users className="w-4 h-4"/> : <User className="w-4 h-4"/>}
                            {getTermLabel(selectedLoan.term)}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => toggleNotification(selectedLoan)}
                            className={`p-2 rounded-lg transition-colors ${selectedLoan.notificationsEnabled ? 'bg-blue-500/10 text-blue-500' : 'bg-zinc-800 text-zinc-500'}`}
                            title="การแจ้งเตือน"
                        >
                            {selectedLoan.notificationsEnabled ? <Bell className="w-5 h-5"/> : <BellOff className="w-5 h-5"/>}
                        </button>
                        <button 
                            onClick={() => handleEditClick(selectedLoan)}
                            className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                            title="แก้ไขข้อมูล"
                        >
                            <Edit className="w-5 h-5"/>
                        </button>
                        <button 
                            onClick={() => handleDeleteClick(selectedLoan)}
                            className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                            title="ลบข้อมูล"
                        >
                            <Trash2 className="w-5 h-5"/>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                    <div className="bg-black/40 p-3 rounded-lg flex items-center gap-3">
                        <div className="p-2 bg-zinc-800 rounded-full text-zinc-400">
                             <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-zinc-500 text-xs">วันที่กู้</p>
                            <p className="text-zinc-200">{new Date(selectedLoan.startDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric'})}</p>
                        </div>
                    </div>
                    <div className="bg-black/40 p-3 rounded-lg flex items-center gap-3">
                        <div className="p-2 bg-zinc-800 rounded-full text-zinc-400">
                             <Bell className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-zinc-500 text-xs">กำหนดชำระ</p>
                            <p className="text-zinc-200">
                                {selectedLoan.repaymentDay ? `ทุกวันที่ ${selectedLoan.repaymentDay}` : 'ไม่ได้ระบุ'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2 text-zinc-400">
                        <span>ชำระแล้ว ฿{totalRepaid.toLocaleString()}</span>
                        <span>ยอดรวม ฿{totalDue.toLocaleString()}</span>
                    </div>
                    <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 border-t border-zinc-800 pt-4">
                    <div>
                        <p className="text-zinc-500 text-xs">เงินต้น</p>
                        <p className="text-white font-mono">฿{selectedLoan.amount.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-zinc-500 text-xs">ดอกเบี้ย</p>
                        <p className="text-emerald-400 font-mono">+฿{selectedLoan.totalInterest.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-zinc-500 text-xs">คงเหลือ</p>
                        <p className="text-yellow-400 font-mono">฿{Math.max(0, totalDue - totalRepaid).toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                <h3 className="text-lg font-semibold text-white mb-4">ประวัติการทำรายการ</h3>
                <div className="space-y-4">
                    {selectedLoan.transactions.map((t) => (
                        <div key={t.id} className="p-3 bg-black rounded-lg border border-zinc-800 transition-colors hover:border-zinc-700">
                            {editingTxId === t.id ? (
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <input 
                                            type="date" 
                                            value={editTxDate} 
                                            onChange={e => setEditTxDate(e.target.value)}
                                            className="bg-zinc-900 border border-zinc-700 rounded p-1 text-sm text-white w-full [color-scheme:dark]"
                                        />
                                        <input 
                                            type="number" 
                                            value={editTxAmount} 
                                            onChange={e => setEditTxAmount(e.target.value)}
                                            className="bg-zinc-900 border border-zinc-700 rounded p-1 text-sm text-white w-full"
                                        />
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <button onClick={() => setEditingTxId(null)} className="p-1 rounded bg-zinc-800 text-zinc-400"><XCircle className="w-4 h-4"/></button>
                                        <button onClick={() => saveEditTransaction(t.id)} className="p-1 rounded bg-blue-600 text-white"><Save className="w-4 h-4"/></button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${t.type === 'REPAYMENT' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                            {t.type === 'REPAYMENT' ? <Check className="w-4 h-4"/> : <Upload className="w-4 h-4"/>}
                                        </div>
                                        <div>
                                            <p className="text-white text-sm">{t.type === 'REPAYMENT' ? 'รับชำระเงิน' : 'โอนเงินให้กู้'}</p>
                                            <p className="text-zinc-500 text-xs">{new Date(t.date).toLocaleDateString('th-TH')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className={`font-mono font-medium ${t.type === 'REPAYMENT' ? 'text-emerald-400' : 'text-white'}`}>
                                                {t.type === 'REPAYMENT' ? '+' : '-'}฿{t.amount.toLocaleString()}
                                            </p>
                                            {t.slipUrl && (
                                                <span className="text-xs text-blue-400 cursor-pointer hover:underline" onClick={() => {
                                                    const w = window.open("");
                                                    w?.document.write(`<img src="${t.slipUrl}" />`);
                                                }}>ดูสลิป</span>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                             <button onClick={() => startEditTransaction(t)} className="text-zinc-500 hover:text-white p-1">
                                                 <Edit className="w-3 h-3" />
                                             </button>
                                             <button onClick={() => handleDeleteTransaction(t.id)} className="text-zinc-500 hover:text-red-400 p-1">
                                                 <Trash2 className="w-3 h-3" />
                                             </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {selectedLoan.transactions.length === 0 && (
                        <p className="text-center text-zinc-500 py-4">ยังไม่มีรายการ</p>
                    )}
                </div>
            </div>
        </div>

        {/* Action Column */}
        <div className="space-y-6">
             <button onClick={() => setView('LIST')} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-lg transition-colors">
                กลับหน้ารายการ
            </button>

            <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                <h3 className="text-lg font-semibold text-white mb-4">บันทึกการรับเงินคืน</h3>
                <form onSubmit={handleAddRepayment} className="space-y-4">
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">วันที่รับเงิน</label>
                        <input 
                            type="date" 
                            required
                            value={repayDate}
                            onChange={(e) => setRepayDate(e.target.value)}
                            className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white outline-none [color-scheme:dark]"
                        />
                    </div>
                    <div>
                         <label className="block text-sm text-zinc-400 mb-1">จำนวนเงิน</label>
                         <input 
                            type="number" 
                            required
                            value={repayAmount}
                            onChange={(e) => setRepayAmount(e.target.value)}
                            placeholder="จำนวนเงินที่ได้รับ"
                            className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white outline-none"
                        />
                    </div>
                     <div 
                        onClick={() => repayFileRef.current?.click()}
                        className="border border-dashed border-zinc-800 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-zinc-600"
                    >
                        {repaySlip ? (
                            <div className="flex items-center gap-2 text-emerald-400">
                                <Check className="w-4 h-4" />
                                <span className="text-xs">แนบสลิปแล้ว</span>
                            </div>
                        ) : (
                            <span className="text-zinc-500 text-xs">แนบสลิปการโอน</span>
                        )}
                        <input 
                            type="file" 
                            ref={repayFileRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, setRepaySlip)}
                        />
                    </div>
                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-lg transition-colors">
                        บันทึกยอด
                    </button>
                </form>
            </div>
        </div>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-zinc-900 p-4 rounded-xl border border-zinc-800">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            type="text" 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="ค้นหาชื่อผู้กู้..." 
            className="w-full bg-black border border-zinc-800 rounded-lg py-2 pl-10 pr-4 text-sm text-white outline-none focus:border-zinc-600"
          />
        </div>
        <button 
          onClick={handleAddNewClick}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          ปล่อยกู้
        </button>
      </div>

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-zinc-950 border-b border-zinc-800">
            <tr>
              <th className="p-4 text-xs font-medium text-zinc-500">ชื่อผู้กู้</th>
              <th className="p-4 text-xs font-medium text-zinc-500">ยอดกู้</th>
              <th className="p-4 text-xs font-medium text-zinc-500">สถานะ</th>
              <th className="p-4 text-xs font-medium text-zinc-500 hidden md:table-cell">ประเภท</th>
              <th className="p-4 text-xs font-medium text-zinc-500"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {filteredLoans.map((loan) => (
              <tr 
                key={loan.id} 
                onClick={() => { setSelectedLoan(loan); setView('DETAIL'); }}
                className="hover:bg-zinc-800/50 cursor-pointer transition-colors"
              >
                <td className="p-4">
                  <p className="text-white font-medium">{loan.borrowerName}</p>
                  <p className="text-zinc-500 text-xs md:hidden">{getTermLabel(loan.term)}</p>
                </td>
                <td className="p-4 text-zinc-300 font-mono">฿{loan.amount.toLocaleString()}</td>
                <td className="p-4">{renderStatus(loan.status)}</td>
                <td className="p-4 hidden md:table-cell">
                    <span className="flex items-center gap-1 text-zinc-400 text-sm">
                        {loan.borrowerType === 'GROUP' ? <Users className="w-3 h-3"/> : <User className="w-3 h-3"/>}
                        {loan.borrowerType === 'GROUP' ? 'กลุ่ม' : 'เดี่ยว'}
                    </span>
                </td>
                <td className="p-4 text-right">
                  <ChevronRight className="w-5 h-5 text-zinc-600 inline-block" />
                </td>
              </tr>
            ))}
            {filteredLoans.length === 0 && (
                <tr>
                    <td colSpan={5} className="p-8 text-center text-zinc-500">
                        ไม่พบข้อมูล
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LoanManager;