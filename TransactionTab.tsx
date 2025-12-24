
import React, { useState } from 'react';
import { Transaction, Card, RebateConfig, Status } from '../types';
import { generateId, getTodayStr, formatHKD } from '../utils';

interface Props {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  cards: Card[];
  merchantTypes: string[];
  rebateConfigs: RebateConfig[];
}

const TransactionTab: React.FC<Props> = ({ transactions, setTransactions, cards, merchantTypes, rebateConfigs }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isRedemption, setIsRedemption] = useState(false);
  const [isCashbackIn, setIsCashbackIn] = useState(false);

  // Form State
  const [date, setDate] = useState(getTodayStr());
  const [desc, setDesc] = useState('');
  const [cardId, setCardId] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<Status>('Pending');
  const [selectedMerchants, setSelectedMerchants] = useState<string[]>([]);
  const [rebateOverride, setRebateOverride] = useState<string>('');

  const calculateSuggestedRebate = (cid: string, merchants: string[]) => {
    const config = rebateConfigs.find(c => c.cardId === cid);
    if (!config) return 0;
    let maxRebate = config.basicRebate;
    merchants.forEach(m => {
      if (config.merchantTypeRebates[m] !== undefined) {
        maxRebate = Math.max(maxRebate, config.merchantTypeRebates[m]);
      }
    });
    return maxRebate;
  };

  const handleCardChange = (cid: string) => {
    setCardId(cid);
    if (!isRedemption && !isCashbackIn) {
      const suggested = calculateSuggestedRebate(cid, selectedMerchants);
      setRebateOverride(suggested.toString());
    }
  };

  const handleMerchantToggle = (m: string) => {
    const newMerchants = selectedMerchants.includes(m)
      ? selectedMerchants.filter(i => i !== m)
      : [...selectedMerchants, m];
    setSelectedMerchants(newMerchants);
    if (!isRedemption && !isCashbackIn) {
      const suggested = calculateSuggestedRebate(cardId, newMerchants);
      setRebateOverride(suggested.toString());
    }
  };

  const openEdit = (tx: Transaction) => {
    setEditingId(tx.id);
    setDate(tx.date);
    setDesc(tx.description);
    setCardId(tx.cardId);
    setAmount(tx.amount.toString());
    setStatus(tx.status);
    setSelectedMerchants(tx.merchantTypes);
    setRebateOverride(tx.rebatePercent.toString());
    setIsRedemption(tx.isRedemption);
    setIsCashbackIn(!!tx.isCashbackIn);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!cardId || !amount || !desc) {
      alert("Please fill in basic details.");
      return;
    }
    const txData: Transaction = {
      id: editingId || generateId(),
      date,
      description: desc,
      cardId,
      amount: parseFloat(amount),
      status,
      merchantTypes: selectedMerchants,
      rebatePercent: (isRedemption || isCashbackIn) ? 0 : parseFloat(rebateOverride) || 0,
      isRedemption,
      isCashbackIn
    };

    if (editingId) {
      setTransactions(transactions.map(t => t.id === editingId ? txData : t));
    } else {
      setTransactions([txData, ...transactions]);
    }
    
    resetForm();
    setShowModal(false);
  };

  const resetForm = () => {
    setEditingId(null);
    setDate(getTodayStr());
    setDesc('');
    setCardId('');
    setAmount('');
    setStatus('Pending');
    setSelectedMerchants([]);
    setRebateOverride('');
    setIsRedemption(false);
    setIsCashbackIn(false);
  };

  const getStatusStyle = (s: Status) => {
    switch(s) {
      case 'Confirmed': return 'bg-green-50 text-green-600 border-green-100';
      case 'Pending': return 'bg-yellow-50 text-yellow-600 border-yellow-100';
      default: return 'bg-gray-50 text-gray-500 border-gray-100';
    }
  };

  return (
    <div className="space-y-6 font-['Aptos','Inter',sans-serif]">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-light text-[#2d2d2d]">History</h2>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-[#b4a088] text-white px-4 py-1.5 rounded-full text-xs hover:opacity-90 transition-opacity minimal-shadow font-normal"
        >
          + Add
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#e8e6e1] minimal-shadow overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#fcfbf7] border-b border-[#e8e6e1]">
                <th className="px-4 py-3 text-[9px] uppercase tracking-wider text-[#717171] font-normal">Date</th>
                <th className="px-4 py-3 text-[9px] uppercase tracking-wider text-[#717171] font-normal">Details</th>
                <th className="px-4 py-3 text-[9px] uppercase tracking-wider text-[#717171] font-normal text-right">Amount</th>
                <th className="px-4 py-3 text-[9px] uppercase tracking-wider text-[#717171] font-normal text-right">Rebate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8e6e1]">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-[#717171] italic text-xs font-normal">No records found.</td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const expRebate = tx.isRedemption || tx.isCashbackIn ? 0 : (tx.amount * (tx.rebatePercent / 100));
                  return (
                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-4 py-4 text-[10px] text-[#717171] whitespace-nowrap">{tx.date.slice(5)}</td>
                      <td className="px-4 py-4 min-w-[120px]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-normal text-[#2d2d2d] truncate max-w-[80px]">{tx.description}</span>
                          <button onClick={() => openEdit(tx)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[#b4a088]">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] text-[#b4a088] uppercase tracking-tighter">
                            {tx.isRedemption ? 'Spent' : tx.isCashbackIn ? 'Credit' : cards.find(c => c.id === tx.cardId)?.name || 'N/A'}
                          </span>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded-full border ${getStatusStyle(tx.status)}`}>{tx.status}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className={`text-xs font-normal ${tx.isRedemption ? 'text-red-400' : tx.isCashbackIn ? 'text-green-500' : 'text-[#2d2d2d]'}`}>
                          {tx.isRedemption ? '-' : tx.isCashbackIn ? '+' : ''}${formatHKD(tx.amount)}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="text-[10px] font-normal text-[#b4a088]">
                          {expRebate > 0 ? `$${formatHKD(expRebate)}` : '-'}
                        </div>
                        {expRebate > 0 && <div className="text-[8px] text-[#717171] font-normal">{tx.rebatePercent}%</div>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[60] flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#fcfbf7] w-full max-w-md flex flex-col h-[85vh] rounded-t-3xl sm:rounded-3xl overflow-hidden animate-in slide-in-from-bottom duration-300 border border-[#e8e6e1]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#e8e6e1] bg-white shrink-0 flex justify-between items-center">
              <h3 className="text-[11px] font-light text-[#2d2d2d] uppercase tracking-wider">{editingId ? 'Edit Entry' : 'New Entry'}</h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="text-[8px] text-[#717171] uppercase tracking-widest font-normal">Redeem</span>
                  <input type="checkbox" checked={isRedemption} onChange={e => { setIsRedemption(e.target.checked); if(e.target.checked) setIsCashbackIn(false); }} className="w-3 h-3 accent-[#b4a088] bg-white border-[#e8e6e1]" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[8px] text-[#717171] uppercase tracking-widest font-normal">Credit</span>
                  <input type="checkbox" checked={isCashbackIn} onChange={e => { setIsCashbackIn(e.target.checked); if(e.target.checked) setIsRedemption(false); }} className="w-3 h-3 accent-green-500 bg-white border-[#e8e6e1]" />
                </div>
              </div>
            </div>

            {/* Scrollable Middle Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
              <div className="w-full">
                <label className="block text-[9px] uppercase tracking-widest text-[#717171] mb-1 font-normal">Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-white border border-[#e8e6e1] rounded-lg px-2 py-0.5 outline-none focus:border-[#b4a088] text-[9px] text-left appearance-none" />
              </div>
              
              <div className="w-full">
                <label className="block text-[9px] uppercase tracking-widest text-[#717171] mb-1 font-normal">Description</label>
                <input placeholder="Transaction details..." value={desc} onChange={e => setDesc(e.target.value)} className="w-full bg-white border border-[#e8e6e1] rounded-lg px-2 py-0.5 outline-none focus:border-[#b4a088] text-[9px] text-left" />
              </div>

              <div className="w-full">
                <label className="block text-[9px] uppercase tracking-widest text-[#717171] mb-1 font-normal">Credit Card</label>
                <select value={cardId} onChange={e => handleCardChange(e.target.value)} className="w-full bg-white border border-[#e8e6e1] rounded-lg px-2 py-0.5 outline-none focus:border-[#b4a088] text-[9px] text-left">
                  <option value="">Select Card</option>
                  {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="w-full">
                <label className="block text-[9px] uppercase tracking-widest text-[#717171] mb-1 font-normal">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value as Status)} className="w-full bg-white border border-[#e8e6e1] rounded-lg px-2 py-0.5 outline-none focus:border-[#b4a088] text-[9px] text-left">
                  <option>Pending</option>
                  <option>Confirmed</option>
                  <option>TBC</option>
                </select>
              </div>

              <div className="w-full">
                <label className="block text-[9px] uppercase tracking-widest text-[#717171] mb-1 font-normal">Amount (HKD)</label>
                <input type="number" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-white border border-[#e8e6e1] rounded-lg px-2 py-0.5 outline-none focus:border-[#b4a088] text-left text-[9px] font-normal" />
              </div>

              {(!isRedemption && !isCashbackIn) && (
                <>
                  <div className="w-full">
                    <label className="block text-[9px] uppercase tracking-widest text-[#717171] mb-1 font-normal">Merchant Type</label>
                    <div className="flex flex-wrap gap-1.5 py-1">
                      {merchantTypes.map(m => (
                        <button key={m} onClick={() => handleMerchantToggle(m)} className={`px-2 py-0.5 rounded-full text-[9px] border transition-all font-normal ${selectedMerchants.includes(m) ? 'bg-[#b4a088] text-white border-[#b4a088]' : 'bg-white text-[#717171] border-[#e8e6e1]'}`}>{m}</button>
                      ))}
                    </div>
                  </div>

                  <div className="w-full">
                    <label className="block text-[9px] uppercase tracking-widest text-[#717171] mb-1 font-normal">Rebate (%)</label>
                    <input type="number" step="0.01" value={rebateOverride} onChange={e => setRebateOverride(e.target.value)} className="w-full bg-white border border-[#e8e6e1] rounded-lg px-2 py-0.5 outline-none focus:border-[#b4a088] text-left text-[9px]" />
                  </div>
                </>
              )}
            </div>

            {/* Sticky Modal Footer */}
            <div className="p-4 border-t border-[#e8e6e1] bg-white shrink-0">
              <div className="flex gap-3">
                <button onClick={() => { resetForm(); setShowModal(false); }} className="flex-1 px-4 py-2.5 rounded-xl border border-[#e8e6e1] text-[#717171] text-xs font-normal">Cancel</button>
                <button onClick={handleSave} className="flex-[2] px-4 py-2.5 rounded-xl bg-[#b4a088] text-white text-xs font-normal">Save Entry</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionTab;
