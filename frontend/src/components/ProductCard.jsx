import { ShoppingCart, Plus, Package } from 'lucide-react';
import { formatINR } from '../utils/currency';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const categoryColors = {
  'Electronics': 'badge-blue',
  'Clothing': 'badge-purple',
  'Books': 'badge-yellow',
  'Food & Beverages': 'badge-green',
  'Sports': 'badge-red',
  'Accessories': 'badge-yellow',
};

const ProductCard = ({ product }) => {
  const { addItem } = useCart();
  const { isAdmin } = useAuth();

  const handleAddToCart = async () => {
    try {
      await addItem(product.id, 1);
      toast.success(`${product.name} added to cart!`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add to cart';
      toast.error(msg);
    }
  };

  const isOutOfStock = product.availableStock === 0;
  const isLowStock = product.availableStock > 0 && product.availableStock <= 10;

  return (
    <div className="glass-card flex flex-col gap-4 hover:border-primary-500/30 hover:shadow-card-hover transition-all duration-300 animate-fade-in group overflow-hidden p-5">
      {/* Image Section */}
      <div className="w-[calc(100%+40px)] h-40 bg-dark-800 rounded-t-xl overflow-hidden shrink-0 flex items-center justify-center relative -mt-5 -mx-5 mb-1">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <Package className="w-12 h-12 text-dark-600" />
        )}
        <div className="absolute top-3 right-3">
          <span className={`${categoryColors[product.category] || 'badge-blue'} shadow-lg backdrop-blur-md bg-dark-900/80`}>
            {product.category}
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-2 px-1">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-dark-100 text-sm leading-tight line-clamp-2 group-hover:text-primary-300 transition-colors">
            {product.name}
          </h3>
          <p className="text-xs text-dark-500 mt-1 font-mono truncate">{product.barcode}</p>
        </div>
      </div>

      {/* Price */}
      <div className="flex items-end justify-between px-1">
        <div>
          <p className="text-2xl font-bold text-white">{formatINR(product.price)}</p>
          <div className="flex items-center gap-2 mt-1">
            {isOutOfStock ? (
              <span className="text-xs text-red-400 font-medium">Out of stock</span>
            ) : isLowStock ? (
              <span className="text-xs text-yellow-400 font-medium">Only {product.availableStock} left!</span>
            ) : (
              <span className="text-xs text-dark-500">{product.availableStock} in stock</span>
            )}
          </div>
        </div>

        {/* Stock indicator bar */}
        <div className="w-16">
          <div className="w-full bg-dark-700 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${
                isOutOfStock ? 'bg-red-500 w-0' :
                isLowStock ? 'bg-yellow-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min((product.availableStock / 100) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      {!isAdmin && (
        <div className="px-1 mt-auto">
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-2.5 mt-auto"
          >
            {isOutOfStock ? (
              'Out of Stock'
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add to Cart
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductCard;
