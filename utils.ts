
export const formatHKD = (amount: number) => {
  return new Intl.NumberFormat('en-HK', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const generateId = () => Math.random().toString(36).substring(2, 9);

export const getTodayStr = () => new Date().toISOString().split('T')[0];
