/**
 * Format a number as Indian Rupees using the Indian numbering system.
 * e.g. 1299.99 → "₹1,299.99"  |  150000 → "₹1,50,000.00"
 *
 * @param {number|string} amount
 * @param {boolean} [compact=false]  If true, shows ₹1.3L / ₹2.5Cr for large numbers
 * @returns {string}
 */
export const formatINR = (amount, compact = false) => {
  const num = parseFloat(amount) || 0;

  if (compact) {
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)}Cr`;
    if (num >= 100000)   return `₹${(num / 100000).toFixed(2)}L`;
    if (num >= 1000)     return `₹${(num / 1000).toFixed(1)}K`;
  }

  return num.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
