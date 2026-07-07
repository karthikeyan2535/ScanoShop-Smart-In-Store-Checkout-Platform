import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { paymentService } from '../services';
import {
  ShoppingCart, Minus, Plus, Trash2, ArrowRight, ShoppingBag,
  Loader2, Package
} from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatINR } from '../utils/currency';

const Cart = () => {
  const { cart, loading, updateItem, removeItem, clearCart, itemCount } = useCart();
  const { isAdmin } = useAuth();
  const [checkingOut, setCheckingOut] = useState(false);
  const navigate = useNavigate();

  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const handleQuantityChange = async (item, delta) => {
    const newQty = item.quantity + delta;
    if (newQty < 1) {
      await removeItem(item.id);
      toast.success('Item removed');
    } else {
      try {
        await updateItem(item.id, newQty);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Update failed');
      }
    }
  };

  const handleRemove = async (item) => {
    await removeItem(item.id);
    toast.success(`"${item.product.name}" removed`);
  };

  const handleCheckout = async () => {
    setCheckingOut(true);
    try {
      // 1. Create order on backend (returns Razorpay order id)
      const res = await paymentService.createOrder();
      const { order, razorpayOrder } = res.data.data;

      // 2. Open Razorpay checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'dummy_key_id',
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'ScanoShop',
        description: 'Smart In-Store Checkout',
        order_id: razorpayOrder.id,
        handler: async (response) => {
          try {
            // 3. Verify payment on success
            const verifyData = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: order.id,
            };
            await paymentService.verifyPayment(verifyData);
            toast.success(`Payment successful! Order #${order.id} placed.`);
            await clearCart(); // Local context state update
            navigate(`/orders`);
          } catch (err) {
            toast.error(err.response?.data?.message || 'Payment verification failed');
          }
        },
        theme: {
          color: '#8b5cf6', // primary-500
        },
      };

      if (options.key === 'dummy_key_id' || !options.key) {
        // Mock success without opening Razorpay popup
        setTimeout(() => {
          options.handler({
            razorpay_order_id: razorpayOrder.id,
            razorpay_payment_id: `pay_mock_${Date.now()}`,
            razorpay_signature: 'mock_signature'
          });
        }, 1500); // 1.5s delay to simulate network
        return;
      }

      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', function (response) {
        toast.error('Payment failed. Please try again.');
        console.error(response.error);
      });

      rzp.open();

    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate checkout');
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen text="Loading cart..." />;

  const items = cart?.items || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-primary-500/20 border border-primary-500/30 rounded-xl flex items-center justify-center">
          <ShoppingCart className="w-5 h-5 text-primary-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Your Cart</h1>
          <p className="text-dark-400 text-sm">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-24">
          <ShoppingBag className="w-20 h-20 text-dark-700 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-dark-300 mb-2">Your cart is empty</h2>
          <p className="text-dark-500 mb-8">Add some products to get started</p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/products" className="btn-primary flex items-center gap-2">
              <Package className="w-4 h-4" /> Browse Products
            </Link>
            <Link to="/scan" className="btn-secondary flex items-center gap-2">
              Scan Items
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => (
              <div key={item.id} className="glass-card p-4 flex items-center gap-4 hover:border-dark-600 transition-all duration-200 animate-fade-in">
                {/* Product icon */}
                <div className="w-14 h-14 bg-dark-700 rounded-xl flex items-center justify-center shrink-0">
                  <Package className="w-7 h-7 text-dark-400" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-dark-100 text-sm truncate">{item.product.name}</h3>
                  <p className="text-xs text-dark-500 mt-0.5">{item.product.category}</p>
                  <p className="text-primary-400 font-bold mt-1">{formatINR(item.product.price)}</p>
                </div>

                {/* Quantity controls */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleQuantityChange(item, -1)}
                    className="w-8 h-8 bg-dark-700 hover:bg-dark-600 border border-dark-600 rounded-lg flex items-center justify-center text-dark-300 hover:text-white transition-all active:scale-90"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center font-bold text-white tabular-nums">{item.quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(item, 1)}
                    disabled={item.quantity >= item.product.availableStock}
                    className="w-8 h-8 bg-dark-700 hover:bg-dark-600 border border-dark-600 rounded-lg flex items-center justify-center text-dark-300 hover:text-white transition-all active:scale-90 disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Subtotal */}
                <div className="text-right shrink-0 min-w-[70px]">
                  <p className="font-bold text-white text-sm">
                    {formatINR(parseFloat(item.product.price) * item.quantity)}
                  </p>
                </div>

                {/* Remove */}
                <button
                  onClick={() => handleRemove(item)}
                  className="w-8 h-8 text-dark-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg flex items-center justify-center transition-all shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {/* Clear cart */}
            <button
              onClick={async () => {
                if (window.confirm('Clear entire cart?')) {
                  await clearCart();
                  toast.success('Cart cleared');
                }
              }}
              className="text-sm text-dark-500 hover:text-red-400 transition-colors mt-2 flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear all items
            </button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6 sticky top-24">
              <h2 className="text-lg font-bold text-white mb-5">Order Summary</h2>

              <div className="space-y-3 text-sm">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-dark-400">
                    <span className="truncate flex-1 mr-2">{item.product.name} ×{item.quantity}</span>
                    <span className="shrink-0">{formatINR(parseFloat(item.product.price) * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dark-700 mt-5 pt-5">
                <div className="flex justify-between mb-1">
                  <span className="text-dark-400">Subtotal</span>
                  <span className="text-dark-200">{formatINR(cart.total || 0)}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-dark-400">GST (0%)</span>
                  <span className="text-dark-200">₹0.00</span>
                </div>
                <div className="flex justify-between mt-4 pt-4 border-t border-dark-700">
                  <span className="font-bold text-white text-lg">Total</span>
                  <span className="font-bold text-primary-400 text-lg">{formatINR(cart.total || 0)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={checkingOut}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-6 text-base py-4"
              >
                {checkingOut ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                ) : (
                  <>Place Order <ArrowRight className="w-5 h-5" /></>
                )}
              </button>

              <Link to="/products" className="block text-center text-sm text-dark-500 hover:text-primary-400 transition-colors mt-4">
                ← Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
