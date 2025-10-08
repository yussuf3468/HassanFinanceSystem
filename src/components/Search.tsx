import { useState, useEffect } from 'react';
import {
  Search as SearchIcon,
  Filter,
  TrendingUp,
  Package,
  DollarSign,
  BarChart3,
  Eye,
  Sparkles,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Product, Sale } from '../types';

export default function Search() {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productStats, setProductStats] = useState<{
    totalSales: number;
    totalProfit: number;
    totalQuantitySold: number;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.product_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
      setSelectedProduct(null);
      setProductStats(null);
    }
  }, [searchTerm, products]);

  async function loadData() {
    try {
      const [productsRes, salesRes] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('sales').select('*'),
      ]);

      if (productsRes.error) throw productsRes.error;
      if (salesRes.error) throw salesRes.error;

      setProducts(productsRes.data || []);
      setSales(salesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  function handleSelectProduct(product: Product) {
    setSelectedProduct(product);
    setSearchTerm('');
    setFilteredProducts(products);

    const productSales = sales.filter((s) => s.product_id === product.id);
    const totalSales = productSales.reduce((sum, s) => sum + s.total_sale, 0);
    const totalProfit = productSales.reduce((sum, s) => sum + s.profit, 0);
    const totalQuantitySold = productSales.reduce(
      (sum, s) => sum + s.quantity_sold,
      0
    );

    setProductStats({
      totalSales,
      totalProfit,
      totalQuantitySold,
    });
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-3 sm:p-6'>
      <div className='max-w-7xl mx-auto space-y-4 sm:space-y-8'>
        {/* Mobile-Optimized Header Section */}
        <div className='relative overflow-hidden bg-white rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl border border-slate-200/60'>
          <div className='absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-indigo-600/5'></div>
          <div className='absolute top-0 right-0 w-32 h-32 sm:w-64 sm:h-64 bg-gradient-to-bl from-purple-200/30 to-transparent rounded-full blur-2xl sm:blur-3xl'></div>
          <div className='absolute bottom-0 left-0 w-24 h-24 sm:w-48 sm:h-48 bg-gradient-to-tr from-blue-200/30 to-transparent rounded-full blur-xl sm:blur-2xl'></div>

          <div className='relative z-10 p-4 sm:p-8 lg:p-12'>
            <div className='flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-4 sm:mb-6'>
              <div className='bg-gradient-to-r from-blue-500 to-purple-600 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-lg flex-shrink-0'>
                <SearchIcon className='w-6 h-6 sm:w-8 sm:h-8 text-white' />
              </div>
              <div className='flex-1 min-w-0'>
                <h1 className='text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-slate-900 via-blue-700 to-purple-700 bg-clip-text text-transparent leading-tight'>
                  Smart Product Search
                </h1>
                <p className='text-slate-600 text-sm sm:text-lg mt-1 sm:mt-2 flex flex-col sm:flex-row sm:items-center sm:space-x-2'>
                  <span className='flex items-center space-x-2'>
                    <Sparkles className='w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 flex-shrink-0' />
                    <span>Discover insights and analytics</span>
                  </span>
                  <span className='hidden sm:inline text-slate-400'></span>
                  <span className='text-xs sm:text-sm text-slate-500 mt-1 sm:mt-0'>for your inventory</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile-First Enhanced Search Section */}
        <div className='bg-white rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-xl border border-slate-200/60 overflow-hidden backdrop-blur-sm'>
          <div className='bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 p-0.5 sm:p-1'>
            <div className='bg-white rounded-[15px] sm:rounded-[22px] p-4 sm:p-8'>
              <div className='flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-4 sm:mb-6'>
                <div className='bg-gradient-to-r from-blue-100 to-purple-100 p-2 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0'>
                  <Filter className='w-5 h-5 sm:w-6 sm:h-6 text-blue-600' />
                </div>
                <div className='flex-1 min-w-0'>
                  <h2 className='text-xl sm:text-2xl font-bold text-slate-800'>
                    Search & Filter
                  </h2>
                  <p className='text-slate-600 text-sm sm:text-base'>
                    Find products instantly with smart search
                  </p>
                </div>
              </div>

              <div className='relative group'>
                <div className='absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl sm:rounded-2xl blur-lg sm:blur-xl group-focus-within:blur-md sm:group-focus-within:blur-lg transition-all duration-300'></div>
                <div className='relative'>
                  <SearchIcon className='absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-300' />
                  <input
                    type='text'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder='Search products, ID, category...'
                    className='w-full pl-12 sm:pl-16 pr-4 sm:pr-6 py-4 sm:py-5 bg-white border-2 border-slate-200 rounded-xl sm:rounded-2xl focus:ring-2 sm:focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-base sm:text-lg placeholder:text-slate-400 shadow-md sm:shadow-lg hover:shadow-lg sm:hover:shadow-xl transition-all duration-300 font-medium'
                  />
                </div>
              </div>

              {/* Mobile-Optimized Search Results */}
              {filteredProducts.length > 0 && (
                <div className='mt-6 sm:mt-8'>
                  <div className='bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 border border-slate-200'>
                    {searchTerm ? (
                      <div className='flex items-start sm:items-center space-x-3'>
                        <div className='bg-blue-500 p-2 rounded-lg flex-shrink-0'>
                          <TrendingUp className='w-4 h-4 sm:w-5 sm:h-5 text-white' />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <p className='font-semibold text-slate-800 text-sm sm:text-base'>
                            Found {filteredProducts.length} product(s)
                          </p>
                          <p className='text-slate-600 text-xs sm:text-sm leading-tight'>
                            Matching '{searchTerm}' - Tap any product for detailed analytics
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className='flex items-start sm:items-center space-x-3'>
                        <div className='bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg flex-shrink-0'>
                          <Package className='w-4 h-4 sm:w-5 sm:h-5 text-white' />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <p className='font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-sm sm:text-base'>
                            All {filteredProducts.length} Products
                          </p>
                          <p className='text-slate-600 text-xs sm:text-sm leading-tight'>
                            Browse your complete inventory - Start typing to search
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-h-80 sm:max-h-96 overflow-y-auto pr-1 sm:pr-2 scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-slate-100'>
                    {filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleSelectProduct(product)}
                        className='group bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 hover:shadow-lg sm:hover:shadow-xl hover:scale-[1.01] sm:hover:scale-[1.02] transition-all duration-300 text-left hover:border-blue-300 relative overflow-hidden'
                      >
                        <div className='absolute inset-0 bg-gradient-to-r from-blue-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl sm:rounded-2xl'></div>

                        <div className='relative z-10 flex items-center space-x-3 sm:space-x-4'>
                          {product.image_url ? (
                            <div className='relative flex-shrink-0'>
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className='w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg sm:rounded-xl shadow-sm sm:shadow-md group-hover:shadow-md sm:group-hover:shadow-lg transition-shadow duration-300'
                              />
                              <div className='absolute inset-0 bg-gradient-to-t from-black/5 to-transparent rounded-lg sm:rounded-xl group-hover:from-black/10 transition-all duration-300'></div>
                            </div>
                          ) : (
                            <div className='w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:from-blue-100 group-hover:to-purple-100 transition-all duration-300 flex-shrink-0'>
                              <Package className='w-5 h-5 sm:w-6 sm:h-6 text-slate-400 group-hover:text-blue-500' />
                            </div>
                          )}
                          <div className='flex-1 min-w-0'>
                            <p className='font-semibold text-slate-800 group-hover:text-blue-700 transition-colors duration-300 truncate text-sm sm:text-base'>
                              {product.name}
                            </p>
                            <p className='text-xs sm:text-sm text-slate-500 group-hover:text-slate-600 transition-colors duration-300 truncate'>
                              ID: {product.product_id}
                            </p>
                            <div className='flex flex-col sm:flex-row sm:items-center sm:space-x-2 mt-1 sm:mt-2 space-y-1 sm:space-y-0'>
                              <span className='inline-flex items-center px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 group-hover:bg-blue-200 transition-colors duration-300 w-fit'>
                                {product.category}
                              </span>
                              <span className='text-xs sm:text-sm font-bold text-emerald-600'>
                                KES {product.selling_price.toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className='opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-shrink-0'>
                            <Eye className='w-4 h-4 sm:w-5 sm:h-5 text-blue-500' />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
