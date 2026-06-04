import { ShoppingCart, Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';
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

  const handleAddToCart = async () => {
    try {
      await addItem(product.id, 1);
      toast.success(`${product.name} added to cart!`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add to cart';
      toast.error(msg);
    }
  };

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 10;

  return (
    <div className="glass-card p-5 flex flex-col gap-4 hover:border-primary-500/30 hover:shadow-card-hover transition-all duration-300 animate-fade-in group">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-dark-100 text-sm leading-tight line-clamp-2 group-hover:text-primary-300 transition-colors">
            {product.name}
          </h3>
          <p className="text-xs text-dark-500 mt-1 font-mono truncate">{product.barcode}</p>
        </div>
        <span className={`${categoryColors[product.category] || 'badge-blue'} shrink-0`}>
          {product.category}
        </span>
      </div>

      {/* Price */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-white">${parseFloat(product.price).toFixed(2)}</p>
          <div className="flex items-center gap-2 mt-1">
            {isOutOfStock ? (
              <span className="text-xs text-red-400 font-medium">Out of stock</span>
            ) : isLowStock ? (
              <span className="text-xs text-yellow-400 font-medium">Only {product.stock} left!</span>
            ) : (
              <span className="text-xs text-dark-500">{product.stock} in stock</span>
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
              style={{ width: `${Math.min((product.stock / 100) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Add to cart */}
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
  );
};

export default ProductCard;
