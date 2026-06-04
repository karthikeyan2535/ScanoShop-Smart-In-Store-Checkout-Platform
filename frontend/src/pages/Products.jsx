import { useState, useEffect, useCallback } from 'react';
import { productService } from '../services';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Search, Filter, Plus, Edit2, Trash2, X, ChevronLeft, ChevronRight,
  Package, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY_FORM = { name: '', price: '', stock: '', barcode: '', category: '' };

const Products = () => {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 12, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await productService.getAll({ search, category, page, limit: 12 });
      setProducts(res.data.data.products);
      setPagination(res.data.data.pagination);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => {
    const timer = setTimeout(() => fetchProducts(1), 300);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  useEffect(() => {
    productService.getCategories().then((r) => setCategories(r.data.data));
  }, []);

  const openModal = (product = null) => {
    setEditProduct(product);
    setForm(product ? { name: product.name, price: product.price, stock: product.stock, barcode: product.barcode, category: product.category } : EMPTY_FORM);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editProduct) {
        await productService.update(editProduct.id, form);
        toast.success('Product updated!');
      } else {
        await productService.create(form);
        toast.success('Product created!');
      }
      setShowModal(false);
      fetchProducts(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    try {
      await productService.delete(product.id);
      toast.success('Product deleted');
      fetchProducts(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Products</h1>
          <p className="text-dark-400 mt-1">{pagination.total} products available</p>
        </div>
        {isAdmin && (
          <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
          <input
            type="text"
            className="input pl-11"
            placeholder="Search products, barcodes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="relative sm:w-48">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
          <select
            className="input pl-11 appearance-none cursor-pointer"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="glass-card p-5 space-y-3 animate-pulse">
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-3 w-1/2" />
              <div className="skeleton h-8 w-full mt-4" />
              <div className="skeleton h-10 w-full" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-24">
          <Package className="w-16 h-16 text-dark-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-dark-400">No products found</h3>
          <p className="text-dark-500 mt-2">Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {products.map((p) => (
              <div key={p.id} className="relative group">
                <ProductCard product={p} />
                {isAdmin && (
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button onClick={() => openModal(p)} className="w-7 h-7 bg-dark-700 hover:bg-primary-600 rounded-lg flex items-center justify-center text-dark-300 hover:text-white transition-all">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(p)} className="w-7 h-7 bg-dark-700 hover:bg-red-600 rounded-lg flex items-center justify-center text-dark-300 hover:text-white transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                onClick={() => fetchProducts(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="btn-secondary btn-sm flex items-center gap-1 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <span className="text-dark-400 text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchProducts(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="btn-secondary btn-sm flex items-center gap-1 disabled:opacity-40"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Admin Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-card w-full max-w-md p-6 animate-bounce-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">{editProduct ? 'Edit Product' : 'New Product'}</h2>
              <button onClick={() => setShowModal(false)} className="btn-ghost p-2"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { key: 'name', label: 'Product Name', type: 'text', placeholder: 'e.g. iPhone 15 Pro' },
                { key: 'barcode', label: 'Barcode', type: 'text', placeholder: 'e.g. PHONE-001' },
                { key: 'category', label: 'Category', type: 'text', placeholder: 'e.g. Electronics' },
                { key: 'price', label: 'Price ($)', type: 'number', placeholder: '0.00', step: '0.01', min: '0' },
                { key: 'stock', label: 'Stock Quantity', type: 'number', placeholder: '0', min: '0' },
              ].map(({ key, label, ...rest }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">{label}</label>
                  <input
                    className="input"
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    required
                    {...rest}
                  />
                </div>
              ))}

              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {editProduct ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
