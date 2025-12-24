
import React from 'react';
import { Card, Transaction, Promotion } from '../types';
import { formatHKD } from '../utils';

interface Props {
  cards: Card[];
  setCards: React.Dispatch<React.SetStateAction<Card[]>>;
  transactions: Transaction[];
  promotions: Promotion[];
}

const SummaryTab: React.FC<Props> = ({ cards, setCards, transactions, promotions }) => {
  
  const calculateCardCashback = (card: Card) => {
    // Only use Confirmed transactions for calculations
    const cardTxs = transactions.filter(tx => tx.cardId === card.id && tx.status === 'Confirmed');
    
    const earned = cardTxs.reduce((acc, tx) => {
      if (tx.isRedemption || tx.isCashbackIn) return acc;
      return acc + (tx.amount * (tx.rebatePercent / 100));
    }, 0);

    const manualCredits = cardTxs.reduce((acc, tx) => {
      if (tx.isCashbackIn) return acc + tx.amount;
      return acc;
    }, 0);

    const redeemed = cardTxs.reduce((acc, tx) => {
      if (tx.isRedemption) return acc + tx.amount;
      return acc;
    }, 0);
    
    return card.manualOverride ?? (card.startingCashback + earned + manualCredits - redeemed);
  };

  const handleManualOverride = (cardId: string, value: string) => {
    const val = parseFloat(value);
    setCards(prev => prev.map(c => 
      c.id === cardId ? { ...c, manualOverride: isNaN(val) ? undefined : val } : c
    ));
  };

  const renderPromoProgress = (promo: Promotion) => {
    const relevantTxs = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      const start = new Date(promo.startDate);
      const end = new Date(promo.endDate);
      const inRange = txDate >= start && txDate <= end;
      const cardEligible = promo.eligibleCardIds.length === 0 || promo.eligibleCardIds.includes(tx.cardId);
      const typeMatch = promo.targetMerchantTypes.includes('All') || 
                       tx.merchantTypes.some(mt => promo.targetMerchantTypes.includes(mt));
      
      return tx.status === 'Confirmed' && inRange && typeMatch && cardEligible && !tx.isRedemption && !tx.isCashbackIn;
    });

    const currentSpending = relevantTxs.reduce((acc, tx) => acc + tx.amount, 0);
    const target = promo.targetAmount || 0;
    const progressPercent = target > 0 ? Math.min(100, (currentSpending / target) * 100) : 100;

    return (
      <div key={promo.id} className="p-4 bg-white rounded-2xl border border-[#e8e6e1] minimal-shadow space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-xs font-semibold text-[#2d2d2d]">{promo.title}</h4>
            <p className="text-[9px] text-[#717171] uppercase tracking-tighter mt-1 font-normal">
              {promo.startDate.slice(5)} to {promo.endDate.slice(5)}
            </p>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-[#b4a088] font-bold">+{promo.additionalRebate}% Rebate</div>
          </div>
        </div>

        {target > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between items-end text-[10px] font-normal">
              <span className="text-[#717171]">Spending Progress</span>
              <span className="text-[#2d2d2d]">${formatHKD(currentSpending)} / ${formatHKD(target)}</span>
            </div>
            <div className="h-1.5 w-full bg-[#fcfbf7] rounded-full overflow-hidden border border-[#f0eee9]">
              <div className="h-full bg-[#b4a088]" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const activePromos = promotions.filter(p => new Date(p.endDate) >= new Date());

  return (
    <div className="space-y-8 font-['Aptos','Inter',sans-serif]">
      <section className="space-y-4">
        <h2 className="text-xl font-light text-[#2d2d2d]">Wallet Balance</h2>
        <div className="bg-white rounded-2xl border border-[#e8e6e1] minimal-shadow overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-[#fcfbf7] border-b border-[#e8e6e1]">
              <tr>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest text-[#717171] font-normal">Card Name</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest text-[#717171] font-normal text-right">Available</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8e6e1]">
              {cards.map(card => {
                const balance = calculateCardCashback(card);
                return (
                  <tr key={card.id}>
                    <td className="px-4 py-4">
                      <div className="text-xs font-normal">{card.name}</div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <input 
                        type="number" 
                        step="0.01"
                        value={balance.toFixed(2)}
                        onChange={(e) => handleManualOverride(card.id, e.target.value)}
                        className="w-24 bg-white border-b border-transparent focus:border-[#e8e6e1] text-right font-normal text-[#2d2d2d] outline-none focus:text-[#b4a088] text-sm"
                      />
                    </td>
                  </tr>
                );
              })}
              {cards.length === 0 && (
                <tr><td colSpan={2} className="px-4 py-10 text-center text-[#717171] italic text-xs font-normal">No cards configured.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-[9px] text-[#717171] italic">* Only confirmed transactions contribute to the available balance.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-light text-[#2d2d2d]">Promo Progress</h2>
        <div className="space-y-4">
          {activePromos.length === 0 ? (
            <div className="p-10 text-center text-[#717171] italic text-xs bg-white rounded-2xl border border-dashed border-[#e8e6e1] font-normal">No active promotions tracked.</div>
          ) : (
            activePromos.map(renderPromoProgress)
          )}
        </div>
      </section>
    </div>
  );
};

export default SummaryTab;
