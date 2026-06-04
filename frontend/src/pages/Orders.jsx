import { useState, useEffect, useCallback } from 'react';
import { orderService } from '../services';
import { ClipboardList, ChevronDown, ChevronUp, Package, Calendar, DollarSign } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const statusConfig = {
  COMPLETED: { label: 'Completed', cls: 'badge-green' },
  PENDING: { label: 'Pending', cls: 'badge-yellow' },
  FAILED: { label: 'Failed', cls: 'badge-red' },
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const fetchOrders = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await orderService.getUserOrders({ page, limit: 10 });
      setOrders(res.data.data.orders);
      setPagination(res.data.data.pagination);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  if (loading) return <LoadingSpinner fullScreen text="Loading orders..." />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-primary-500/20 border border-primary-500/30 rounded-xl flex items-center justify-center">
          <ClipboardList className="w-5 h-5 text-primary-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Order History</h1>
          <p className="text-dark-400 text-sm">{pagination.total} order{pagination.total !== 1 ? 's' : ''} total</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-24">
          <ClipboardList className="w-16 h-16 text-dark-700 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-dark-400">No orders yet</h2>
          <p className="text-dark-500 mt-2">Your orders will appear here after checkout</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const { label, cls } = statusConfig[order.status] || statusConfig.PENDING;
            const isExpanded = expandedId === order.id;

            return (
              <div key={order.id} className="glass-card overflow-hidden animate-fade-in">
                {/* Order header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  className="w-full p-5 flex items-center gap-4 hover:bg-dark-700/20 transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-dark-700 rounded-xl flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 text-dark-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-white">Order #{order.id}</p>
                      <span className={cls}>{label}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-dark-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span>·</span>
                      <span>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-bold text-white text-lg">${parseFloat(order.totalPrice).toFixed(2)}</p>
                  </div>

                  {isExpanded
                    ? <ChevronUp className="w-5 h-5 text-dark-400 shrink-0" />
                    : <ChevronDown className="w-5 h-5 text-dark-400 shrink-0" />
                  }
                </button>

                {/* Expanded items */}
                {isExpanded && (
                  <div className="border-t border-dark-700/50 px-5 pb-5 pt-4 animate-fade-in">
                    <h3 className="text-sm font-medium text-dark-400 mb-3 uppercase tracking-wider">Items</h3>
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between py-2 border-b border-dark-700/30 last:border-0">
                          <div>
                            <p className="text-sm font-medium text-dark-200">{item.product?.name || 'Product'}</p>
                            <p className="text-xs text-dark-500">{item.product?.category} · Qty: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-white">${(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
                            <p className="text-xs text-dark-500">${parseFloat(item.price).toFixed(2)} each</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-4 pt-3 border-t border-dark-700">
                      <span className="font-bold text-dark-300">Total</span>
                      <span className="font-bold text-primary-400">${parseFloat(order.totalPrice).toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => fetchOrders(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="btn-secondary btn-sm disabled:opacity-40"
              >← Prev</button>
              <span className="text-dark-400 text-sm">Page {pagination.page} of {pagination.totalPages}</span>
              <button
                onClick={() => fetchOrders(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="btn-secondary btn-sm disabled:opacity-40"
              >Next →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Orders;
