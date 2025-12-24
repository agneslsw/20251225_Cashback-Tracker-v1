
import React, { useState } from 'react';
import { Card, RebateConfig } from '../types';
import { generateId } from '../utils';

interface Props {
  cards: Card[];
  setCards: React.Dispatch<React.SetStateAction<Card[]>>;
  merchantTypes: string[];
  setMerchantTypes: React.Dispatch<React.SetStateAction<string[]>>;
  rebateConfigs: RebateConfig[];
  setRebateConfigs: React.Dispatch<React.SetStateAction<RebateConfig[]>>;
}

const SettingsTab: React.FC<Props> = ({ 
  cards, setCards, merchantTypes, setMerchantTypes, rebateConfigs, setRebateConfigs 
}) => {
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [showAddMerchantInput, setShowAddMerchantInput] = useState(false);
  const [collapsedCards, setCollapsedCards] = useState<Set<string>>(new Set());
  
  // Card Form State
  const [newCardName, setNewCardName] = useState('');
  const [newCardBalance, setNewCardBalance] = useState('');
  const [newBasicRebate, setNewBasicRebate] = useState('0');
  const [newMerchantRebates, setNewMerchantRebates] = useState<Record<string, string>>({});
  
  // Merchant Input State
  const [newMerchantType, setNewMerchantType] = useState('');

  const toggleCollapse = (id: string) => {
    const next = new Set(collapsedCards);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setCollapsedCards(next);
  };

  const openAddModal = () => {
    setEditingCardId(null);
    setNewCardName('');
    setNewCardBalance('');
    setNewBasicRebate('0');
    setNewMerchantRebates({});
    setShowAddCardModal(true);
  };

  const openEditModal = (card: Card) => {
    setEditingCardId(card.id);
    const config = rebateConfigs.find(rc => rc.cardId === card.id);
    setNewCardName(card.name);
    setNewCardBalance(card.startingCashback.toString());
    setNewBasicRebate(config?.basicRebate.toString() || '0');
    
    const mRebates: Record<string, string> = {};
    if (config?.merchantTypeRebates) {
      Object.entries(config.merchantTypeRebates).forEach(([key, val]) => {
        mRebates[key] = val.toString();
      });
    }
    setNewMerchantRebates(mRebates);
    setShowAddCardModal(true);
  };

  const handleSaveCard = () => {
    if (!newCardName) {
      alert("Card Name is required");
      return;
    }

    const cid = editingCardId || generateId();
    const rebateVal = parseFloat(newBasicRebate) || 0;
    const balanceVal = parseFloat(newCardBalance) || 0;

    const merchantRebatesObj: Record<string, number> = {};
    merchantTypes.forEach(m => {
      if (newMerchantRebates[m]) {
        merchantRebatesObj[m] = parseFloat(newMerchantRebates[m]);
      }
    });

    const newCard: Card = {
      id: cid,
      name: newCardName,
      startingCashback: balanceVal
    };

    const newConfig: RebateConfig = {
      cardId: cid,
      basicRebate: rebateVal,
      merchantTypeRebates: merchantRebatesObj
    };

    if (editingCardId) {
      setCards(cards.map(c => c.id === cid ? newCard : c));
      setRebateConfigs(rebateConfigs.map(rc => rc.cardId === cid ? newConfig : rc));
    } else {
      setCards([...cards, newCard]);
      setRebateConfigs([...rebateConfigs, newConfig]);
    }
    
    setShowAddCardModal(false);
  };

  const removeCard = (id: string) => {
    if (confirm("Remove this card and all its settings?")) {
      setCards(cards.filter(c => c.id !== id));
      setRebateConfigs(rebateConfigs.filter(rc => rc.cardId !== id));
    }
  };

  const addMerchantType = () => {
    if (!newMerchantType || merchantTypes.includes(newMerchantType)) return;
    setMerchantTypes([...merchantTypes, newMerchantType]);
    setNewMerchantType('');
    setShowAddMerchantInput(false);
  };

  const removeMerchantType = (m: string) => {
    if (confirm(`Remove ${m}?`)) {
      setMerchantTypes(merchantTypes.filter(i => i !== m));
    }
  };

  const updateRebate = (cardId: string, field: 'basic' | string, value: string) => {
    const val = parseFloat(value) || 0;
    setRebateConfigs(prev => prev.map(rc => {
      if (rc.cardId !== cardId) return rc;
      if (field === 'basic') return { ...rc, basicRebate: val };
      return { 
        ...rc, 
        merchantTypeRebates: { ...rc.merchantTypeRebates, [field]: val } 
      };
    }));
  };

  return (
    <div className="space-y-10 font-['Aptos','Inter',sans-serif]">
      {/* Cards Section */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-light text-[#2d2d2d]">Cards</h2>
          <button 
            onClick={openAddModal}
            className="text-[10px] uppercase tracking-widest text-[#b4a088] font-bold border border-[#b4a088] px-3 py-1 rounded-full hover:bg-[#b4a088] hover:text-white transition-all font-normal"
          >
            + Add Card
          </button>
        </div>
        
        <div className="space-y-3">
          {cards.map(c => (
            <div key={c.id} className="flex items-center justify-between p-3 bg-white border border-[#e8e6e1] rounded-2xl minimal-shadow">
              <span className="text-xs font-normal text-[#2d2d2d]">{c.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-[#717171] font-normal">${c.startingCashback.toFixed(0)} start</span>
                <button onClick={() => openEditModal(c)} className="text-[#b4a088] hover:opacity-70">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button onClick={() => removeCard(c.id)} className="text-red-300 hover:text-red-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
          {cards.length === 0 && (
            <div className="py-4 text-center text-[10px] text-[#717171] italic">No cards added yet.</div>
          )}
        </div>
      </section>

      {/* Merchant Types Section */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-light text-[#2d2d2d]">Merchant Types</h2>
          {!showAddMerchantInput && (
            <button 
              onClick={() => setShowAddMerchantInput(true)}
              className="text-[10px] uppercase tracking-widest text-[#b4a088] font-bold border border-[#b4a088] px-3 py-1 rounded-full hover:bg-[#b4a088] hover:text-white transition-all font-normal"
            >
              + Add Type
            </button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {merchantTypes.map(m => (
            <div key={m} className="px-3 py-1.5 bg-white border border-[#e8e6e1] rounded-full text-[10px] text-[#717171] flex items-center gap-2 font-normal">
              {m}
              <button onClick={() => removeMerchantType(m)} className="hover:text-red-400">×</button>
            </div>
          ))}
          {showAddMerchantInput && (
            <div className="flex items-center px-3 py-1 border border-[#b4a088] rounded-full bg-white">
              <input 
                placeholder="Name..." 
                value={newMerchantType} 
                autoFocus
                onChange={e => setNewMerchantType(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addMerchantType()}
                className="w-16 text-[9px] bg-white outline-none font-normal placeholder:text-[9px]"
              />
              <button onClick={addMerchantType} className="text-[#b4a088] ml-1 font-bold text-[10px]">OK</button>
              <button onClick={() => setShowAddMerchantInput(false)} className="text-[#717171] ml-2 font-bold text-[10px]">×</button>
            </div>
          )}
        </div>
      </section>

      {/* Rebate Matrix Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-light text-[#2d2d2d]">Rebate Matrix</h2>
        <div className="space-y-6">
          {cards.map(c => {
            const config = rebateConfigs.find(rc => rc.cardId === c.id) || { basicRebate: 0, merchantTypeRebates: {} };
            const isCollapsed = collapsedCards.has(c.id);
            return (
              <div key={c.id} className="bg-white border border-[#e8e6e1] rounded-2xl p-4 minimal-shadow space-y-3">
                <div 
                  className="flex justify-between items-center border-b border-[#fcfbf7] pb-2 cursor-pointer"
                  onClick={() => toggleCollapse(c.id)}
                >
                  <h4 className="text-[10px] uppercase tracking-widest text-[#b4a088] font-bold">{c.name}</h4>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`w-3 h-3 text-[#717171] transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`} 
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                
                {!isCollapsed && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-[#717171] font-normal uppercase tracking-widest">Basic Rebate %</span>
                      <input 
                        type="number" 
                        step="0.01" 
                        value={config.basicRebate} 
                        onChange={e => updateRebate(c.id, 'basic', e.target.value)}
                        className="w-16 text-right border-b border-[#f0eee9] outline-none bg-white text-[9px] font-normal py-0.5"
                      />
                    </div>
                    {merchantTypes.map(m => (
                      <div key={m} className="flex justify-between items-center pl-2">
                        <span className="text-[9px] text-[#717171] font-normal">{m}</span>
                        <input 
                          type="number" 
                          step="0.01" 
                          placeholder={config.basicRebate.toString()}
                          value={config.merchantTypeRebates[m] ?? ''} 
                          onChange={e => updateRebate(c.id, m, e.target.value)}
                          className="w-16 text-right border-b border-[#fcfbf7] text-[#b4a088] outline-none bg-white text-[9px] font-normal py-0.5"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Card Modal (Add/Edit) */}
      {showAddCardModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[60] flex items-end sm:items-center justify-center p-4 font-['Aptos','Inter',sans-serif]">
          <div className="bg-[#fcfbf7] w-full max-w-md h-[90vh] flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden border border-[#e8e6e1] animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#e8e6e1] bg-white shrink-0">
              <h3 className="text-[11px] font-light uppercase tracking-wider">{editingCardId ? 'Edit Card' : 'New Card'}</h3>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 no-scrollbar">
              <div className="w-full">
                <label className="block text-[9px] uppercase tracking-widest text-[#717171] mb-1 font-normal">Card Name</label>
                <input 
                  placeholder="e.g. HSBC Red"
                  value={newCardName} 
                  onChange={e => setNewCardName(e.target.value)}
                  className="w-full bg-white border border-[#e8e6e1] rounded-lg px-2 py-0.5 outline-none focus:border-[#b4a088] text-[9px] text-left"
                />
              </div>
              <div className="w-full">
                <label className="block text-[9px] uppercase tracking-widest text-[#717171] mb-1 font-normal">Starting Balance</label>
                <input 
                  type="number"
                  placeholder="0"
                  value={newCardBalance} 
                  onChange={e => setNewCardBalance(e.target.value)}
                  className="w-full bg-white border border-[#e8e6e1] rounded-lg px-2 py-0.5 outline-none focus:border-[#b4a088] text-[9px] text-left"
                />
              </div>

              <div className="pt-4 border-t border-[#e8e6e1] space-y-4">
                <h4 className="text-[9px] uppercase tracking-widest text-[#b4a088] font-bold">Rebate Matrix</h4>
                <div className="w-full">
                  <label className="block text-[9px] uppercase tracking-widest text-[#717171] mb-1 font-normal">Basic Rebate %</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={newBasicRebate} 
                    onChange={e => setNewBasicRebate(e.target.value)}
                    className="w-full bg-white border border-[#e8e6e1] rounded-lg px-2 py-0.5 outline-none focus:border-[#b4a088] text-[9px] text-left"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-[9px] uppercase tracking-widest text-[#717171] mb-1 font-normal">Merchant Specific (%)</label>
                  {merchantTypes.map(m => (
                    <div key={m} className="flex justify-between items-center bg-white p-2 border border-[#e8e6e1] rounded-lg">
                      <span className="text-[9px] text-[#717171] font-normal">{m}</span>
                      <input 
                        type="number"
                        step="0.01"
                        placeholder={newBasicRebate}
                        value={newMerchantRebates[m] || ''}
                        onChange={e => setNewMerchantRebates({...newMerchantRebates, [m]: e.target.value})}
                        className="w-16 text-right text-[9px] bg-white outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Fixed Footer */}
            <div className="p-4 border-t border-[#e8e6e1] bg-white shrink-0">
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowAddCardModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[#e8e6e1] text-[#717171] text-xs font-normal"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveCard}
                  className="flex-[2] px-4 py-2.5 rounded-xl bg-[#b4a088] text-white text-xs font-normal"
                >
                  {editingCardId ? 'Save Changes' : 'Create Card'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsTab;
