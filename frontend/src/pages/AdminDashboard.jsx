import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../services';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Package, ShoppingBag, Users, DollarSign, AlertTriangle,
  TrendingUp, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatINR } from '../utils/currency';
import toast from 'react-hot-toast';

const statusConfig = {
  COMPLETED: { label: 'Completed', cls: 'badge-green', color: '#10b981' },
  PENDING: { label: 'Pending', cls: 'badge-yellow', color: '#f59e0b' },
  FAILED: { label: 'Failed', cls: 'badge-red', color: '#ef4444' },
};

const StatCard = ({ icon: Icon, label, value, sub, color = 'primary' }) => {
  const colors = {
    primary: 'from-primary-500/20 to-primary-600/10 border-primary-500/30 text-primary-400',
    green: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400',
    yellow: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 text-yellow-400',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
  };

  return (
    <div className={`glass-card p-6 bg-gradient-to-br ${colors[color]} hover:shadow-card-hover transition-all duration-300 group`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-dark-400 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
          {sub && <p className="text-xs text-dark-500 mt-1">{sub}</p>}
        </div>
        <div className={`w-12 h-12 bg-gradient-to-br ${colors[color]} border rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPagination, setOrdersPagination] = useState({ total: 0, totalPages: 1 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await adminService.getStats();
      setStats(res.data.data);
    } catch {
      toast.error('Failed to load stats');
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchOrders = useCallback(async (page = 1) => {
    setLoadingOrders(true);
    try {
      const res = await adminService.getAllOrders({ page, limit: 15, status: statusFilter || undefined });
      setOrders(res.data.data.orders);
      setOrdersPagination(res.data.data.pagination);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoadingOrders(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchOrders(1); setOrdersPage(1); }, [fetchOrders]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchOrders(ordersPage)]);
    setRefreshing(false);
    toast.success('Dashboard refreshed');
  };

  if (loadingStats) return <LoadingSpinner fullScreen text="Loading dashboard..." />;

  // Chart data from stats
  const pieData = stats?.ordersByStatus?.map(({ status, _count }) => ({
    name: statusConfig[status]?.label || status,
    value: _count.id,
    color: statusConfig[status]?.color || '#64748b',
  })) || [];

  const lowStockData = stats?.lowStockProducts?.slice(0, 8).map((p) => ({
    name: p.name.length > 12 ? p.name.substring(0, 12) + '…' : p.name,
    stock: p.availableStock,
  })) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-dark-400 mt-1">Real-time system overview</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5 mb-8">
        <StatCard
          icon={Package}
          label="Total Products"
          value={stats?.totalProducts?.toLocaleString() || '0'}
          sub={`${stats?.lowStockProducts?.length || 0} low stock`}
          color="primary"
        />
        <StatCard
          icon={ShoppingBag}
          label="Completed Orders"
          value={stats?.totalOrders?.toLocaleString() || '0'}
          color="green"
        />
        <StatCard
          icon={Users}
          label="Registered Users"
          value={stats?.totalUsers?.toLocaleString() || '0'}
          color="purple"
        />
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={formatINR(stats?.totalRevenue || 0, true)}
          sub={`${stats?.successfulPayments || 0} successful, ${stats?.failedPayments || 0} failed payments`}
          color="yellow"
        />
        <StatCard
          icon={RefreshCw}
          label="Redis Cache"
          value={`${stats?.cacheStats?.hits || 0} Hits`}
          sub={`${stats?.cacheStats?.misses || 0} Misses`}
          color="primary"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Order Status Pie */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-400" />
            Orders by Status
          </h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#f1f5f9' }}
                />
                <Legend
                  formatter={(value) => <span className="text-dark-300 text-sm">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-dark-500">No order data yet</div>
          )}
        </div>

        {/* Low Stock Bar */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            Low Stock Alert
          </h2>
          {lowStockData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={lowStockData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#f1f5f9' }}
                />
                <Bar dataKey="stock" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center">
              <div className="text-center">
                <Package className="w-10 h-10 text-emerald-500/40 mx-auto mb-2" />
                <p className="text-emerald-400 text-sm font-medium">All products well-stocked!</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders + All Orders Table */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h2 className="text-lg font-bold text-white">All Orders</h2>
          <select
            className="input w-40 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>

        {loadingOrders ? (
          <LoadingSpinner size="md" text="Loading orders..." />
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-dark-500">No orders found</div>
        ) : (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const { label, cls } = statusConfig[order.status] || statusConfig.PENDING;
                    const isExpanded = expandedOrder === order.id;

                    return (
                      <>
                        <tr key={order.id}>
                          <td className="font-mono text-primary-400">#{order.id}</td>
                          <td>
                            <div>
                              <p className="font-medium text-dark-100">{order.user?.name}</p>
                              <p className="text-xs text-dark-500">{order.user?.email}</p>
                            </div>
                          </td>
                          <td>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</td>
                          <td className="font-bold text-white">{formatINR(order.totalPrice)}</td>
                          <td><span className={cls}>{label}</span></td>
                          <td className="text-dark-500 text-xs">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td>
                            <button
                              onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                              className="btn-ghost p-1"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${order.id}-expanded`}>
                            <td colSpan={7} className="bg-dark-800/50 px-4 py-3">
                              <div className="text-sm space-y-1">
                                {order.items.map((item) => (
                                  <div key={item.id} className="flex justify-between text-dark-300">
                                    <span>{item.product?.name} × {item.quantity}</span>
                                    <span>{formatINR(parseFloat(item.price) * item.quantity)}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {ordersPagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-5">
                <button
                  onClick={() => { setOrdersPage(p => p - 1); fetchOrders(ordersPage - 1); }}
                  disabled={ordersPage === 1}
                  className="btn-secondary btn-sm disabled:opacity-40"
                >← Prev</button>
                <span className="text-dark-400 text-sm">
                  Page {ordersPage} of {ordersPagination.totalPages}
                </span>
                <button
                  onClick={() => { setOrdersPage(p => p + 1); fetchOrders(ordersPage + 1); }}
                  disabled={ordersPage === ordersPagination.totalPages}
                  className="btn-secondary btn-sm disabled:opacity-40"
                >Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
