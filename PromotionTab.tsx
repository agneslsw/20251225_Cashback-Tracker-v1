
import React, { useState } from 'react';
import { Promotion, Card, Transaction, OneTimePromo } from '../types';
import { generateId, getTodayStr, formatHKD } from '../utils';

interface Props {
  promotions: Promotion[];
  setPromotions: React.Dispatch<React.SetStateAction<Promotion[]>>;
  oneTimePromos: OneTimePromo[];
  setOneTimePromos: React.Dispatch<React.SetStateAction<OneTimePromo[]>>;
  merchantTypes: string[];
  cards: Card[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  transactions: Transaction[];
}

const PromotionTab: React.FC<Props> = ({ 
  promotions, setPromotions, oneTimePromos, setOneTimePromos, 
  merchantTypes, cards, setTransactions, transactions 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showOneTimeModal, setShowOneTimeModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingDetailsId, setViewingDetailsId] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // Form states for Campaign
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(getTodayStr());
  const [endDate, setEndDate] = useState(getTodayStr());
  const [rebateByDate, setRebateByDate] = useState(getTodayStr());
  const [additionalRebate, setAdditionalRebate] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [maxCashback, setMaxCashback] = useState('');
  const [targetMerchantTypes, setTargetMerchantTypes] = useState<string[]>(['All']);
  const [rebateMerchantTypes, setRebateMerchantTypes] = useState<string[]>([]);
  const [eligibleCardIds, setEligibleCardIds] = useState<string[]>([]);

  // One-time promo form states
  const [otTitle, setOtTitle] = useState('');
  const [otStart, setOtStart] = useState(getTodayStr());
  const [otEnd, setOtEnd] = useState(getTodayStr());
  const [otRebate, setOtRebate] = useState('');
  const [otCardId, setOtCardId] = useState('');

  const today = getTodayStr();

  const toggleSection = (id: string) => {
    const next = new Set(collapsedSections);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCollapsedSections(next);
  };

  const getFilteredTransactions = (promo: Promotion) => {
    return transactions.filter((tx) => {
      const txDate = new Date(tx.date);
      const start = new Date(promo.startDate);
      const end = new Date(promo.endDate);
      const inRange = txDate >= start && txDate <= end;
      const cardEligible = promo.eligibleCardIds.length === 0 || promo.eligibleCardIds.includes(tx.cardId);
      // Check for target spending type match
      const typeMatch = promo.targetMerchantTypes.includes('All') || 
                       tx.merchantTypes.some(mt => promo.targetMerchantTypes.includes(mt));
      
      return tx.status === 'Confirmed' && inRange && typeMatch && !tx.isRedemption && !tx.isCashbackIn && cardEligible;
    });
  };

  const calculatePromoMetrics = (promo: Promotion) => {
    const relevantTxs = getFilteredTransactions(promo);
    const spending = relevantTxs.reduce((acc, tx) => acc + tx.amount, 0);
    
    // Rebate only applies if it matches rebateMerchantTypes (or if rebateMerchantTypes is empty, assume it applies to all target spending)
    const rawRebate = relevantTxs.reduce((acc, tx) => {
      const isRebateType = promo.rebateMerchantTypes.length === 0 || 
                          tx.merchantTypes.some(mt => promo.rebateMerchantTypes.includes(mt));
      return acc + (isRebateType ? tx.amount * (promo.additionalRebate / 100) : 0);
    }, 0);

    const earnedRebate = promo.maxCashback ? Math.min(rawRebate, promo.maxCashback) : rawRebate;
    return { spending, earnedRebate };
  };

  const handleCampaignPaid = (promo: Promotion, amount: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Confirm $${formatHKD(amount)} rebate for "${promo.title}"?`)) {
      const creditTx: Transaction = {
        id: generateId(),
        date: getTodayStr(),
        description: `Promo: ${promo.title}`,
        cardId: promo.eligibleCardIds[0] || cards[0]?.id || '',
        amount,
        status: 'Confirmed',
        merchantTypes: [],
        rebatePercent: 0,
        isRedemption: false,
        isCashbackIn: true
      };
      setTransactions(prev => [creditTx, ...prev]);
      setPromotions(prev => prev.map(p => p.id === promo.id ? { ...p, isPaidOff: true } : p));
    }
  };

  const handleOneTimePaid = (promo: OneTimePromo) => {
    if (promo.isPaidOff) return;
    if (confirm(`Complete payout for "${promo.title}"?`)) {
      const creditTx: Transaction = {
        id: generateId(),
        date: getTodayStr(),
        description: `One-time: ${promo.title}`,
        cardId: promo.eligibleCardIds[0],
        amount: promo.rebateAmount,
        status: 'Confirmed',
        merchantTypes: [],
        rebatePercent: 0,
        isRedemption: false,
        isCashbackIn: true
      };
      setTransactions(prev => [creditTx, ...prev]);
      setOneTimePromos(prev => prev.map(p => p.id === promo.id ? { ...p, isPaidOff: true } : p));
    }
  };

  const handleSavePromo = () => {
    if (!title || !additionalRebate) return alert("Required fields missing");
    const data: Promotion = {
      id: editingId || generateId(),
      title, startDate, endDate, rebateByDate,
      additionalRebate: parseFloat(additionalRebate),
      targetAmount: targetAmount ? parseFloat(targetAmount) : undefined,
      maxCashback: maxCashback ? parseFloat(maxCashback) : undefined,
      targetMerchantTypes,
      rebateMerchantTypes,
      eligibleCardIds
    };
    if (editingId) setPromotions(promotions.map(p => p.id === editingId ? data : p));
    else setPromotions([...promotions, data]);
    setShowModal(false);
    resetPromoForm();
  };

  const resetPromoForm = () => {
    setEditingId(null); setTitle(''); setStartDate(today); setEndDate(today); setRebateByDate(today);
    setAdditionalRebate(''); setTargetAmount(''); setMaxCashback(''); setTargetMerchantTypes(['All']); 
    setRebateMerchantTypes([]); setEligibleCardIds([]);
  };

  const handleSaveOneTime = () => {
    if (!otTitle || !otRebate || !otCardId) return alert("Required fields missing");
    const data: OneTimePromo = {
      id: generateId(),
      title: otTitle, startDate: otStart, endDate: otEnd,
      rebateAmount: parseFloat(otRebate),
      eligibleCardIds: [otCardId],
      isPaidOff: false
    };
    setOneTimePromos([...oneTimePromos, data]);
    setShowOneTimeModal(false);
    resetOneTimeForm();
  };

  const resetOneTimeForm = () => {
    setOtTitle(''); setOtStart(today); setOtEnd(today); setOtRebate(''); setOtCardId('');
  };

  const toggleTargetMerchant = (m: string) => {
    if (m === 'All') {
      setTargetMerchantTypes(['All']);
      return;
    }
    let next = targetMerchantTypes.filter(x => x !== 'All');
    if (next.includes(m)) {
      next = next.filter(x => x !== m);
      if (next.length === 0) next = ['All'];
    } else {
      next.push(m);
    }
    setTargetMerchantTypes(next);
  };

  const toggleRebateMerchant = (m: string) => {
    if (rebateMerchantTypes.includes(m)) {
      setRebateMerchantTypes(rebateMerchantTypes.filter(x => x !== m));
    } else {
      setRebateMerchantTypes([...rebateMerchantTypes, m]);
    }
  };

  // Grouping logic based on user request:
  // Today in [start, end] -> On-going
  // Today > end AND today <= rebate_by_date -> Pending Reward
  // Today > rebate_by_date -> Past Campaigns
  const ongoing = promotions.filter(p => today >= p.startDate && today <= p.endDate);
  const pending = promotions.filter(p => today > p.endDate && (p.rebateByDate ? today <= p.rebateByDate : true));
  const past = promotions.filter(p => p.rebateByDate ? today > p.rebateByDate : false);

  const SectionHeader: React.FC<{ title: string; id: string; count: number }> = ({ title, id, count }) => (
    <button 
      onClick={() => toggleSection(id)}
      className="flex justify-between items-center w-full px-2 py-2 border-b border-[#e8e6e1] bg-[#fcfbf7] mb-2"
    >
      <span className="text-[10px] uppercase tracking-widest text-[#717171] font-bold">{title} ({count})</span>
      <div className="flex items-center gap-1.5">
        <svg xmlns="http://www.w3.org/2000/svg" className={`w-3 h-3 text-[#b4a088] transition-transform ${collapsedSections.has(id) ? '-rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </div>
    </button>
  );

  const PromoCard: React.FC<{ promo: Promotion }> = ({ promo }) => {
    const { spending, earnedRebate } = calculatePromoMetrics(promo);
    const target = promo.targetAmount || 0;
    const progress = target > 0 ? Math.min(100, (spending / target) * 100) : 100;
    const metTarget = target > 0 ? spending >= target : true;

    return (
      <div className={`p-4 bg-white rounded-2xl border ${promo.isPaidOff ? 'opacity-70 border-green-200 bg-green-50/10' : 'border-[#e8e6e1] minimal-shadow'} space-y-3 transition-transform active:scale-[0.98]`}>
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-[11px] font-semibold text-[#2d2d2d]">{promo.title}</h4>
            <div className="text-[8px] text-[#717171] uppercase tracking-tighter mt-1">{promo.startDate} - {promo.endDate}</div>
            <div className="text-[8px] text-[#b4a088] font-medium mt-0.5">Rebate By: {promo.rebateByDate}</div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[9px] text-[#b4a088] font-bold">+{promo.additionalRebate}%</span>
          </div>
        </div>
        {target > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-[9px] text-[#717171]">
              <span>Spent: ${formatHKD(spending)}</span>
              <span>Goal: ${formatHKD(target)}</span>
            </div>
            <div className="h-1 w-full bg-[#fcfbf7] rounded-full overflow-hidden border border-[#f0eee9]">
              <div className="h-full bg-[#b4a088]" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        )}
        <div className="flex justify-between items-center pt-1">
          <span className="text-[9px] font-medium text-[#b4a088]">Exp. Rebate: ${formatHKD(earnedRebate)}</span>
          {!promo.isPaidOff ? (
            <button 
              disabled={!metTarget}
              onClick={(e) => handleCampaignPaid(promo, earnedRebate, e)}
              className={`px-3 py-1 text-[9px] rounded-full transition-all border ${metTarget ? 'bg-white border-[#b4a088] text-[#b4a088] hover:bg-[#b4a088] hover:text-white' : 'bg-gray-50 border-gray-100 text-gray-300'}`}
            >
              Confirm Paid
            </button>
          ) : (
            <div className="px-3 py-1 text-[9px] rounded-full bg-green-500 text-white border border-green-500 font-medium">Paid Off</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 font-['Aptos','Inter',sans-serif] pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-light text-[#2d2d2d]">Campaigns</h2>
        <button onClick={() => { resetPromoForm(); setShowModal(true); }} className="bg-[#b4a088] text-white px-4 py-1.5 rounded-full text-xs hover:opacity-90 font-normal shadow-sm">+ New Promo</button>
      </div>

      <div className="space-y-6">
        <div>
          <SectionHeader title="On-going" id="ongoing" count={ongoing.length} />
          {!collapsedSections.has('ongoing') && <div className="space-y-4">{ongoing.map(p => <PromoCard key={p.id} promo={p} />)}</div>}
        </div>
        <div>
          <SectionHeader title="Pending Reward" id="pending" count={pending.length} />
          {!collapsedSections.has('pending') && <div className="space-y-4">{pending.map(p => <PromoCard key={p.id} promo={p} />)}</div>}
        </div>
        <div>
          <SectionHeader title="Past Campaigns" id="past" count={past.length} />
          {!collapsedSections.has('past') && <div className="space-y-4">{past.map(p => <PromoCard key={p.id} promo={p} />)}</div>}
        </div>
      </div>

      <div className="pt-8 border-t border-[#e8e6e1]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-light text-[#2d2d2d]">One-time Promo</h2>
          <button onClick={() => { resetOneTimeForm(); setShowOneTimeModal(true); }} className="text-[#b4a088] text-[10px] uppercase font-bold tracking-widest">+ New Task</button>
        </div>
        <div className="space-y-2">
          {oneTimePromos.map(p => (
            <div 
              key={p.id} 
              onClick={() => handleOneTimePaid(p)}
              className={`flex items-center gap-3 p-4 bg-white rounded-2xl border transition-all ${p.isPaidOff ? 'opacity-50 border-green-100' : 'border-[#e8e6e1] minimal-shadow cursor-pointer'}`}
            >
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${p.isPaidOff ? 'bg-green-500 border-green-500' : 'bg-white border-[#e8e6e1]'}`}>
                {p.isPaidOff && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
              </div>
              <div className="flex-1">
                <div className={`text-[11px] font-semibold ${p.isPaidOff ? 'line-through text-[#717171]' : ''}`}>{p.title}</div>
                <div className="text-[8px] text-[#717171] uppercase tracking-tighter">{p.startDate} - {p.endDate} • {cards.find(c => c.id === p.eligibleCardIds[0])?.name || 'Any'}</div>
              </div>
              <div className="text-[11px] font-bold text-[#b4a088]">${formatHKD(p.rebateAmount)}</div>
            </div>
          ))}
          {oneTimePromos.length === 0 && <div className="text-center py-6 text-[10px] text-[#717171] italic">No active one-time tasks.</div>}
        </div>
      </div>

      {/* Campaign Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[60] flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#fcfbf7] w-full max-w-md h-[90vh] flex flex-col rounded-t-3xl border border-[#e8e6e1] animate-in slide-in-from-bottom duration-300 overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e8e6e1] bg-white shrink-0"><h3 className="text-[11px] font-light uppercase tracking-wider text-[#2d2d2d]">New Campaign</h3></div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5 no-scrollbar">
              <div><label className="text-[9px] uppercase tracking-widest text-[#717171] mb-1 block font-normal">Title</label><input placeholder="e.g. Overseas Shopping" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-white border border-[#e8e6e1] rounded-lg px-2 py-1 text-[9px] outline-none focus:border-[#b4a088]" /></div>
              
              <div className="flex gap-2">
                <div className="flex-1"><label className="text-[9px] uppercase tracking-widest text-[#717171] mb-1 block font-normal">Start</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-white border border-[#e8e6e1] rounded-lg px-2 py-1 text-[9px] appearance-none" /></div>
                <div className="flex-1"><label className="text-[9px] uppercase tracking-widest text-[#717171] mb-1 block font-normal">End</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-white border border-[#e8e6e1] rounded-lg px-2 py-1 text-[9px] appearance-none" /></div>
              </div>

              <div><label className="text-[9px] uppercase tracking-widest text-[#717171] mb-1 block font-normal">Rebate By Date</label><input type="date" value={rebateByDate} onChange={e => setRebateByDate(e.target.value)} className="w-full bg-white border border-[#e8e6e1] rounded-lg px-2 py-1 text-[9px] appearance-none" /></div>

              <div className="flex gap-2">
                <div className="flex-1"><label className="text-[9px] uppercase tracking-widest text-[#717171] mb-1 block font-normal">Additional Rebate %</label><input type="number" step="0.01" value={additionalRebate} onChange={e => setAdditionalRebate(e.target.value)} className="w-full bg-white border border-[#e8e6e1] rounded-lg px-2 py-1 text-[9px]" /></div>
                <div className="flex-1"><label className="text-[9px] uppercase tracking-widest text-[#717171] mb-1 block font-normal">Max Cap ($)</label><input type="number" step="0.01" value={maxCashback} onChange={e => setMaxCashback(e.target.value)} className="w-full bg-white border border-[#e8e6e1] rounded-lg px-2 py-1 text-[9px]" /></div>
              </div>

              <div><label className="text-[9px] uppercase tracking-widest text-[#717171] mb-1 block font-normal">Target Spending ($)</label><input type="number" step="0.01" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} className="w-full bg-white border border-[#e8e6e1] rounded-lg px-2 py-1 text-[9px]" /></div>

              <div>
                <label className="text-[9px] uppercase tracking-widest text-[#717171] mb-1 block font-normal">Merchant Type for Target Spending</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  <button onClick={() => toggleTargetMerchant('All')} className={`px-2 py-0.5 rounded-full text-[8px] border font-normal transition-all ${targetMerchantTypes.includes('All') ? 'bg-[#b4a088] text-white border-[#b4a088]' : 'bg-white text-[#717171] border-[#e8e6e1]'}`}>All</button>
                  {merchantTypes.map(m => (
                    <button key={m} onClick={() => toggleTargetMerchant(m)} className={`px-2 py-0.5 rounded-full text-[8px] border font-normal transition-all ${targetMerchantTypes.includes(m) ? 'bg-[#b4a088] text-white border-[#b4a088]' : 'bg-white text-[#717171] border-[#e8e6e1]'}`}>{m}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[9px] uppercase tracking-widest text-[#717171] mb-1 block font-normal">Merchant Type for Additional Rebate</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {merchantTypes.map(m => (
                    <button key={m} onClick={() => toggleRebateMerchant(m)} className={`px-2 py-0.5 rounded-full text-[8px] border font-normal transition-all ${rebateMerchantTypes.includes(m) ? 'bg-[#b4a088] text-white border-[#b4a088]' : 'bg-white text-[#717171] border-[#e8e6e1]'}`}>{m}</button>
                  ))}
                </div>
                <p className="text-[7px] text-[#717171] mt-1 italic">* If none selected, applies to all matching target spending.</p>
              </div>

              <div>
                <label className="text-[9px] uppercase tracking-widest text-[#717171] mb-1 block font-normal">Eligible Cards</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {cards.map(c => (
                    <button key={c.id} onClick={() => setEligibleCardIds(prev => prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id])} className={`px-2 py-0.5 rounded-full text-[8px] border font-normal transition-all ${eligibleCardIds.includes(c.id) ? 'bg-[#b4a088] text-white border-[#b4a088]' : 'bg-white text-[#717171] border-[#e8e6e1]'}`}>{c.name}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-[#e8e6e1] bg-white flex gap-3 shrink-0">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 text-[10px] border border-[#e8e6e1] rounded-xl text-[#717171] font-normal">Cancel</button>
              <button onClick={handleSavePromo} className="flex-[2] px-4 py-2.5 text-[10px] bg-[#b4a088] text-white rounded-xl font-normal">Save Campaign</button>
            </div>
          </div>
        </div>
      )}

      {/* One-time Modal */}
      {showOneTimeModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[60] flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#fcfbf7] w-full max-w-md h-[80vh] flex flex-col rounded-t-3xl border border-[#e8e6e1] animate-in slide-in-from-bottom duration-300 overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e8e6e1] bg-white flex justify-between items-center"><h3 className="text-[11px] font-light uppercase tracking-wider text-[#2d2d2d]">New One-time Promo</h3></div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
              <div><label className="text-[9px] uppercase tracking-widest text-[#717171] mb-1 block font-normal">Title</label><input value={otTitle} onChange={e => setOtTitle(e.target.value)} className="w-full bg-white border border-[#e8e6e1] rounded-lg px-2 py-1 text-[9px] outline-none" /></div>
              <div className="flex gap-2">
                <div className="flex-1"><label className="text-[9px] uppercase tracking-widest text-[#717171] mb-1 block font-normal">Start</label><input type="date" value={otStart} onChange={e => setOtStart(e.target.value)} className="w-full bg-white border border-[#e8e6e1] rounded-lg px-2 py-1 text-[9px] appearance-none" /></div>
                <div className="flex-1"><label className="text-[9px] uppercase tracking-widest text-[#717171] mb-1 block font-normal">End</label><input type="date" value={otEnd} onChange={e => setOtEnd(e.target.value)} className="w-full bg-white border border-[#e8e6e1] rounded-lg px-2 py-1 text-[9px] appearance-none" /></div>
              </div>
              <div><label className="text-[9px] uppercase tracking-widest text-[#717171] mb-1 block font-normal">Rebate Amount ($)</label><input type="number" step="0.01" value={otRebate} onChange={e => setOtRebate(e.target.value)} className="w-full bg-white border border-[#e8e6e1] rounded-lg px-2 py-1 text-[9px]" /></div>
              <div><label className="text-[9px] uppercase tracking-widest text-[#717171] mb-1 block font-normal">Eligible Card</label>
                <select value={otCardId} onChange={e => setOtCardId(e.target.value)} className="w-full bg-white border border-[#e8e6e1] rounded-lg px-2 py-1 text-[9px] outline-none bg-transparent">
                  <option value="">Select Card</option>
                  {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="p-4 border-t border-[#e8e6e1] bg-white flex gap-3 shrink-0">
              <button onClick={() => setShowOneTimeModal(false)} className="flex-1 px-4 py-2.5 text-[10px] border border-[#e8e6e1] rounded-xl text-[#717171] font-normal">Cancel</button>
              <button onClick={handleSaveOneTime} className="flex-[2] px-4 py-2.5 text-[10px] bg-[#b4a088] text-white rounded-xl font-normal">Save Task</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromotionTab;
