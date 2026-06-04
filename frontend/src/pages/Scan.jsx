import { useState, useRef, useEffect } from 'react';
import { scanService } from '../services';
import { useCart } from '../context/CartContext';
import { ScanLine, CheckCircle2, AlertCircle, Barcode, Loader2, X, Tag, Package } from 'lucide-react';
import toast from 'react-hot-toast';

const Scan = () => {
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [scannedItems, setScannedItems] = useState([]);
  const [lastResult, setLastResult] = useState(null); // { success, product, message }
  const inputRef = useRef(null);
  const { fetchCart } = useCart();

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    setLoading(true);
    setLastResult(null);
    try {
      const res = await scanService.scan(barcode.trim());
      const { product, cartItem } = res.data.data;
      const result = { success: true, product, cartItem, message: res.data.message };
      setLastResult(result);

      setScannedItems((prev) => {
        const existing = prev.findIndex((i) => i.product.id === product.id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = { ...updated[existing], cartItem };
          return updated;
        }
        return [{ product, cartItem, scannedAt: new Date() }, ...prev];
      });

      await fetchCart();
      toast.success(`"${product.name}" added!`);
      setBarcode('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Scan failed';
      setLastResult({ success: false, message: msg });
      toast.error(msg);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // Quick-scan barcodes for demo
  const demoBarcodes = ['PHONE-001', 'AUDIO-001', 'BOOK-001', 'FOOD-002', 'SHOE-001', 'LAPTOP-001'];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500/20 to-accent-500/20 border border-primary-500/30 rounded-3xl mb-4">
          <ScanLine className="w-10 h-10 text-primary-400" />
        </div>
        <h1 className="text-3xl font-bold text-white">Barcode Scanner</h1>
        <p className="text-dark-400 mt-2">Scan product barcodes to add them to your cart instantly</p>
      </div>

      {/* Scanner input */}
      <div className="glass-card p-6 mb-6">
        <form onSubmit={handleScan} className="flex gap-3">
          <div className="relative flex-1">
            <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
            <input
              ref={inputRef}
              type="text"
              className="input pl-12 text-lg font-mono tracking-widest"
              placeholder="Enter or scan barcode..."
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              disabled={loading}
            />
            {barcode && (
              <button type="button" onClick={() => setBarcode('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button type="submit" disabled={loading || !barcode.trim()} className="btn-primary px-8 flex items-center gap-2 min-w-[120px] justify-center">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
            {loading ? 'Scanning...' : 'Scan'}
          </button>
        </form>

        {/* Result feedback */}
        {lastResult && (
          <div className={`mt-4 p-4 rounded-xl border flex items-start gap-3 animate-slide-up ${
            lastResult.success
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-red-500/10 border-red-500/30'
          }`}>
            {lastResult.success
              ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              : <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            }
            <div>
              <p className={`font-medium text-sm ${lastResult.success ? 'text-emerald-300' : 'text-red-300'}`}>
                {lastResult.message}
              </p>
              {lastResult.success && (
                <p className="text-dark-400 text-xs mt-0.5">
                  ${parseFloat(lastResult.product.price).toFixed(2)} · Qty in cart: {lastResult.cartItem.quantity}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Demo barcodes */}
        <div className="mt-5">
          <p className="text-xs text-dark-500 mb-2 font-medium uppercase tracking-wider">Quick Demo Barcodes</p>
          <div className="flex flex-wrap gap-2">
            {demoBarcodes.map((code) => (
              <button
                key={code}
                onClick={() => setBarcode(code)}
                className="px-3 py-1.5 bg-dark-700/50 hover:bg-dark-600/50 border border-dark-600 rounded-lg text-xs font-mono text-dark-300 hover:text-white transition-all duration-200"
              >
                {code}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scanned items list */}
      {scannedItems.length > 0 && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Scanned This Session</h2>
            <span className="badge-blue">{scannedItems.length} items</span>
          </div>
          <div className="space-y-3">
            {scannedItems.map(({ product, cartItem, scannedAt }) => (
              <div key={product.id} className="flex items-center gap-4 p-3 bg-dark-700/30 rounded-xl border border-dark-700 hover:border-dark-600 transition-colors">
                <div className="w-10 h-10 bg-primary-500/10 border border-primary-500/20 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-dark-100 text-sm truncate">{product.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-mono text-dark-500">{product.barcode}</span>
                    <span className="text-dark-600">·</span>
                    <Tag className="w-3 h-3 text-dark-500" />
                    <span className="text-xs text-dark-500">{product.category}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-white">${parseFloat(product.price).toFixed(2)}</p>
                  <p className="text-xs text-dark-500">Qty: {cartItem.quantity}</p>
                </div>
                <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Scan;
