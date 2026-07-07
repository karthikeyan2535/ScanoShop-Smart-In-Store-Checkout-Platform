import { useState, useRef, useEffect, useCallback } from 'react';
import { scanService, productService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ScanLine, CheckCircle2, AlertCircle, Barcode, Loader2, X, Tag, Package, Camera, CameraOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { formatINR } from '../utils/currency';

const Scan = () => {
  const { isAdmin } = useAuth();
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [scannedItems, setScannedItems] = useState([]);
  const [lastResult, setLastResult] = useState(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [adminProductData, setAdminProductData] = useState(null);
  const [isExistingProduct, setIsExistingProduct] = useState(false);
  const inputRef = useRef(null);
  const { fetchCart } = useCart();
  
  const lastScanTimeRef = useRef(0);
  const SCAN_COOLDOWN = 3000;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const playSuccessSound = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.5;
      audio.play();
    } catch (err) {
      console.log('Audio play failed', err);
    }
  };

  const processScan = useCallback(async (code) => {
    if (!code.trim() || loading) return;
    
    const now = Date.now();
    if (now - lastScanTimeRef.current < SCAN_COOLDOWN) {
      // Ignore scan due to cooldown
      return;
    }
    lastScanTimeRef.current = now;

    setLoading(true);
    setLastResult(null);

    if (isAdmin) {
      try {
        const res = await productService.getByBarcode(code.trim());
        const prod = res.data.data;
        setAdminProductData({
          id: prod.id,
          name: prod.name,
          price: prod.price,
          availableStock: prod.availableStock,
          category: prod.category,
          barcode: prod.barcode,
          imageUrl: prod.imageUrl || ''
        });
        setIsExistingProduct(true);
        playSuccessSound();
        setBarcode('');
      } catch (err) {
        if (err.response?.status === 404) {
          setAdminProductData({ name: '', price: '', availableStock: '', category: '', barcode: code.trim(), imageUrl: '' });
          setIsExistingProduct(false);
          playSuccessSound();
          setBarcode('');
        } else {
          toast.error('Failed to check product');
        }
      } finally {
        setLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      return;
    }

    try {
      const res = await scanService.scan(code.trim());
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
      playSuccessSound();
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
  }, [fetchCart, loading]);

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isExistingProduct) {
        await productService.update(adminProductData.id, adminProductData);
        toast.success(`Product "${adminProductData.name}" updated!`);
      } else {
        await productService.create(adminProductData);
        toast.success(`Product "${adminProductData.name}" created!`);
      }
      setAdminProductData(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    processScan(barcode);
  };

  useEffect(() => {
    let scanner = null;
    
    if (scannerActive) {
      scanner = new Html5QrcodeScanner(
        "reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 150 },
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
          rememberLastUsedCamera: true
        },
        /* verbose= */ false
      );
      
      scanner.render(
        (decodedText) => {
          setBarcode(decodedText);
          processScan(decodedText);
        },
        (error) => {
          // Ignore frequent error callbacks
        }
      );
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [scannerActive, processScan]);



  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500/20 to-accent-500/20 border border-primary-500/30 rounded-3xl mb-4">
          <ScanLine className="w-10 h-10 text-primary-400" />
        </div>
        <h1 className="text-3xl font-bold text-white">Barcode Scanner</h1>
        <p className="text-dark-400 mt-2">Scan product barcodes or enter manually</p>
      </div>

      <div className="glass-card p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-6 mb-6">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white mb-4">Camera Scanner</h2>
            {scannerActive ? (
              <div className="rounded-xl overflow-hidden border border-dark-600 bg-dark-800">
                <div id="reader" className="w-full"></div>
                <div className="p-4 flex justify-center">
                  <button 
                    onClick={() => setScannerActive(false)} 
                    className="btn-secondary flex items-center gap-2"
                  >
                    <CameraOff className="w-4 h-4" /> Stop Scanner
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-48 rounded-xl border border-dashed border-dark-600 bg-dark-800/50 flex flex-col items-center justify-center gap-4">
                <Camera className="w-10 h-10 text-dark-500" />
                <button 
                  onClick={() => setScannerActive(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" /> Start Scanner
                </button>
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white mb-4">Manual Entry</h2>
            <form onSubmit={handleManualSubmit} className="flex gap-3">
              <div className="relative flex-1">
                <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  ref={inputRef}
                  type="text"
                  className="input pl-12 text-lg font-mono tracking-widest w-full"
                  placeholder="Barcode..."
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  disabled={loading}
                />
              </div>
              <button type="submit" disabled={loading || !barcode.trim()} className="btn-primary px-6 flex items-center gap-2 min-w-[100px] justify-center">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
              </button>
            </form>

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
                      {formatINR(lastResult.product.price)} · Qty in cart: {lastResult.cartItem.quantity}
                    </p>
                  )}
                </div>
              </div>
            )}


          </div>
        </div>
      </div>

      {isAdmin && adminProductData && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">
              {isExistingProduct ? 'Update Inventory' : 'Add New Product'}
            </h2>
            <button onClick={() => setAdminProductData(null)} className="text-dark-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleAdminSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">Name</label>
                <input required type="text" className="input w-full" value={adminProductData.name} onChange={e => setAdminProductData({...adminProductData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">Barcode</label>
                <input required type="text" className="input w-full" value={adminProductData.barcode} onChange={e => setAdminProductData({...adminProductData, barcode: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">Price</label>
                <input required type="number" step="0.01" className="input w-full" value={adminProductData.price} onChange={e => setAdminProductData({...adminProductData, price: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">Stock</label>
                <input required type="number" className="input w-full" value={adminProductData.availableStock} onChange={e => setAdminProductData({...adminProductData, availableStock: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">Category</label>
                <input required type="text" className="input w-full" value={adminProductData.category} onChange={e => setAdminProductData({...adminProductData, category: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">Image URL (optional)</label>
                <input type="text" className="input w-full" value={adminProductData.imageUrl} onChange={e => setAdminProductData({...adminProductData, imageUrl: e.target.value})} placeholder="https://..." />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex justify-center">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Product'}
            </button>
          </form>
        </div>
      )}

      {!isAdmin && scannedItems.length > 0 && (
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
                  <p className="font-bold text-white">{formatINR(product.price)}</p>
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
