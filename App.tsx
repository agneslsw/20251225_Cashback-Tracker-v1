
import React, { useState, useEffect } from 'react';
import { Tab, Card, Transaction, Promotion, RebateConfig, OneTimePromo } from './types';
import { ICONS, DEFAULT_MERCHANT_TYPES } from './constants';
import TransactionTab from './TransactionTab';
import SummaryTab from './SummaryTab';
import PromotionTab from './PromotionTab';
import SettingsTab from './SettingsTab';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Transactions);
  const [cards, setCards] = useState<Card[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [oneTimePromos, setOneTimePromos] = useState<OneTimePromo[]>([]);
  const [merchantTypes, setMerchantTypes] = useState<string[]>(DEFAULT_MERCHANT_TYPES);
  const [rebateConfigs, setRebateConfigs] = useState<RebateConfig[]>([]);

  // Local Storage persistence
  useEffect(() => {
    const saved = localStorage.getItem('kakeibo_data');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.cards) setCards(data.cards);
        if (data.transactions) setTransactions(data.transactions);
        if (data.promotions) setPromotions(data.promotions);
        if (data.oneTimePromos) setOneTimePromos(data.oneTimePromos);
        if (data.merchantTypes) setMerchantTypes(data.merchantTypes);
        if (data.rebateConfigs) setRebateConfigs(data.rebateConfigs);
      } catch (e) {
        console.error("Error loading data", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('kakeibo_data', JSON.stringify({
      cards, transactions, promotions, oneTimePromos, merchantTypes, rebateConfigs
    }));
  }, [cards, transactions, promotions, oneTimePromos, merchantTypes, rebateConfigs]);

  const renderTabContent = () => {
    switch (activeTab) {
      case Tab.Transactions:
        return (
          <TransactionTab 
            transactions={transactions} 
            setTransactions={setTransactions} 
            cards={cards} 
            merchantTypes={merchantTypes} 
            rebateConfigs={rebateConfigs} 
          />
        );
      case Tab.Summary:
        return (
          <SummaryTab 
            cards={cards} 
            setCards={setCards}
            transactions={transactions} 
            promotions={promotions} 
          />
        );
      case Tab.Promotion:
        return (
          <PromotionTab 
            promotions={promotions} 
            setPromotions={setPromotions} 
            oneTimePromos={oneTimePromos}
            setOneTimePromos={setOneTimePromos}
            merchantTypes={merchantTypes} 
            cards={cards}
            setTransactions={setTransactions}
            transactions={transactions}
          />
        );
      case Tab.Settings:
        return (
          <SettingsTab 
            cards={cards} 
            setCards={setCards} 
            merchantTypes={merchantTypes} 
            setMerchantTypes={setMerchantTypes} 
            rebateConfigs={rebateConfigs} 
            setRebateConfigs={setRebateConfigs} 
          />
        );
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#fcfbf7] font-['Aptos','Inter',sans-serif]">
      {/* Header */}
      <header className="px-6 py-4 bg-white border-b border-[#e8e6e1] z-10 shrink-0">
        <h1 className="text-sm font-normal tracking-wide text-[#2d2d2d]">Agnes’s Cashback Tracker</h1>
        <p className="text-[9px] text-[#717171] uppercase tracking-wider mt-0.5">{activeTab}</p>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 no-scrollbar">
        <div className="max-w-md mx-auto px-4 py-6">
          {renderTabContent()}
        </div>
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-white/95 backdrop-blur-md rounded-full border border-[#e8e6e1] minimal-shadow z-50 flex items-center justify-around py-3 px-2">
        {(Object.values(Tab) as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex flex-col items-center justify-center transition-all duration-300 w-16 ${
              activeTab === tab ? 'text-[#b4a088] scale-105' : 'text-[#a0a0a0]'
            }`}
          >
            {ICONS[tab]}
            <span className="text-[9px] mt-1 font-normal">{tab}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
