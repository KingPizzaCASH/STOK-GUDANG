
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  History, 
  Layers, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search,
  Trash2,
  Edit2,
  AlertCircle,
  TrendingUp,
  FileDown,
  Sparkles,
  Menu,
  X,
  AlertTriangle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { storageService } from './services/storage';
import { getInventoryInsights } from './services/gemini';
import { Product, Transaction, Category, TransactionType, AIInsight } from './types';

// --- Sub-components ---

const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start justify-between">
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      {trend && (
        <p className={`text-xs mt-2 font-medium flex items-center ${trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
          {trend} dibanding bulan lalu
        </p>
      )}
    </div>
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
  </div>
);

const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, type = 'danger' }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200 shadow-2xl">
        <div className="p-6 text-center">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${type === 'danger' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-500 text-sm">{message}</p>
        </div>
        <div className="flex border-t">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-4 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors border-r"
          >
            Batal
          </button>
          <button 
            onClick={() => { onConfirm(); onClose(); }}
            className={`flex-1 px-4 py-4 text-sm font-semibold text-white transition-colors ${type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}`}
          >
            Ya, Hapus
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'history' | 'categories'>('dashboard');
  const [data, setData] = useState(storageService.loadData());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // AI Insight State
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // Form States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [txType, setTxType] = useState<TransactionType>(TransactionType.IN);

  // Confirmation Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean,
    title: string,
    message: string,
    onConfirm: () => void,
    type?: 'danger' | 'warning'
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'danger'
  });

  // Persistence
  useEffect(() => {
    storageService.saveData(data);
  }, [data]);

  const loadAIInsights = async () => {
    setIsLoadingAI(true);
    const insight = await getInventoryInsights(data.products, data.transactions);
    setAiInsight(insight);
    setIsLoadingAI(false);
  };

  useEffect(() => {
    loadAIInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calculations
  const totalStockValue = useMemo(() => 
    data.products.reduce((acc, p) => acc + (p.price * p.stock), 0), [data.products]
  );
  
  const lowStockCount = useMemo(() => 
    data.products.filter(p => p.stock <= p.minStock).length, [data.products]
  );

  const stockChartData = useMemo(() => 
    data.products.slice(0, 5).map(p => ({ name: p.name, stock: p.stock })), [data.products]
  );

  // Handlers
  const handleAddProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newProduct: Product = {
      id: editingProduct?.id || Math.random().toString(36).substr(2, 9),
      sku: formData.get('sku') as string,
      name: formData.get('name') as string,
      categoryId: formData.get('categoryId') as string,
      price: Number(formData.get('price')),
      stock: editingProduct ? editingProduct.stock : Number(formData.get('stock')),
      minStock: Number(formData.get('minStock')),
      description: formData.get('description') as string,
      updatedAt: new Date().toISOString()
    };

    if (editingProduct) {
      setData(prev => ({
        ...prev,
        products: prev.products.map(p => p.id === editingProduct.id ? newProduct : p)
      }));
    } else {
      setData(prev => ({
        ...prev,
        products: [...prev.products, newProduct]
      }));
    }
    
    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  const openDeleteProductConfirm = (id: string) => {
    const product = data.products.find(p => p.id === id);
    setConfirmConfig({
      isOpen: true,
      title: 'Hapus Produk?',
      message: `Anda akan menghapus "${product?.name}". Tindakan ini juga akan menghapus seluruh riwayat transaksi terkait.`,
      type: 'danger',
      onConfirm: () => {
        setData(prev => ({
          ...prev,
          products: prev.products.filter(p => p.id !== id),
          transactions: prev.transactions.filter(t => t.productId !== id)
        }));
      }
    });
  };

  const openDeleteCategoryConfirm = (id: string) => {
    const category = data.categories.find(c => c.id === id);
    const productCount = data.products.filter(p => p.categoryId === id).length;
    
    setConfirmConfig({
      isOpen: true,
      title: 'Hapus Kategori?',
      message: `Anda akan menghapus kategori "${category?.name}". ${productCount > 0 ? `${productCount} produk dalam kategori ini akan kehilangan kategorinya.` : ''}`,
      type: 'danger',
      onConfirm: () => {
        setData(prev => ({
          ...prev,
          categories: prev.categories.filter(c => c.id !== id),
          products: prev.products.map(p => p.categoryId === id ? { ...p, categoryId: '' } : p)
        }));
      }
    });
  };

  const handleTransaction = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const qty = Number(formData.get('quantity'));
    const prodId = formData.get('productId') as string;

    const targetProduct = data.products.find(p => p.id === prodId);
    if (!targetProduct) return;

    if (txType === TransactionType.OUT && targetProduct.stock < qty) {
      alert('Stok tidak mencukupi!');
      return;
    }

    const newTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      productId: prodId,
      type: txType,
      quantity: qty,
      reason: formData.get('reason') as string,
      date: new Date().toISOString()
    };

    setData(prev => ({
      ...prev,
      products: prev.products.map(p => 
        p.id === prodId 
          ? { ...p, stock: txType === TransactionType.IN ? p.stock + qty : p.stock - qty, updatedAt: new Date().toISOString() }
          : p
      ),
      transactions: [...prev.transactions, newTx]
    }));

    setIsTxModalOpen(false);
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "stokpro_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r transform transition-transform duration-200 ease-in-out md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl">
              <Package className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">StokPro</h1>
          </div>
          
          <nav className="flex-1 px-4 space-y-1">
            <button 
              onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </button>
            <button 
              onClick={() => { setActiveTab('inventory'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'inventory' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <Package className="w-5 h-5" />
              <span className="font-medium">Inventaris</span>
            </button>
            <button 
              onClick={() => { setActiveTab('history'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'history' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <History className="w-5 h-5" />
              <span className="font-medium">Riwayat</span>
            </button>
            <button 
              onClick={() => { setActiveTab('categories'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'categories' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <Layers className="w-5 h-5" />
              <span className="font-medium">Kategori</span>
            </button>
          </nav>

          <div className="p-4 border-t">
            <button 
              onClick={handleExport}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <FileDown className="w-4 h-4" />
              Ekspor Data
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 transition-all duration-200">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 hover:bg-gray-100 rounded-lg">
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-semibold capitalize">{activeTab}</h2>
          </div>
          <div className="flex items-center gap-3">
             <button 
              onClick={() => { setIsTxModalOpen(true); setTxType(TransactionType.IN); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
            >
              <Plus className="w-4 h-4" />
              Stok Masuk
            </button>
          </div>
        </header>

        <div className="p-4 md:p-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                  title="Total Aset" 
                  value={`Rp ${totalStockValue.toLocaleString('id-ID')}`} 
                  icon={TrendingUp} 
                  color="bg-emerald-100 text-emerald-600"
                  trend="+12%"
                />
                <StatCard 
                  title="Jenis Produk" 
                  value={data.products.length} 
                  icon={Package} 
                  color="bg-blue-100 text-blue-600"
                />
                <StatCard 
                  title="Stok Menipis" 
                  value={lowStockCount} 
                  icon={AlertCircle} 
                  color="bg-amber-100 text-amber-600"
                />
                <StatCard 
                  title="Transaksi (Bulan ini)" 
                  value={data.transactions.length} 
                  icon={History} 
                  color="bg-purple-100 text-purple-600"
                />
              </div>

              {/* AI Insights Bar */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-1 shadow-xl">
                <div className="bg-white/95 rounded-xl p-6 flex flex-col md:flex-row items-center gap-6">
                  <div className="bg-indigo-100 p-4 rounded-2xl">
                    <Sparkles className="w-8 h-8 text-indigo-600 animate-pulse" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h4 className="text-lg font-bold text-gray-900 flex items-center justify-center md:justify-start gap-2">
                      Analisis AI Pintar
                      <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">BETA</span>
                    </h4>
                    {isLoadingAI ? (
                      <p className="text-gray-500 text-sm mt-1 animate-pulse">Menghitung data optimal...</p>
                    ) : aiInsight ? (
                      <div>
                        <p className="text-gray-700 mt-1">{aiInsight.message}</p>
                        <p className="text-sm font-medium text-indigo-600 mt-2">💡 Saran: {aiInsight.suggestion}</p>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm mt-1">Data belum dianalisis oleh AI.</p>
                    )}
                  </div>
                  <button 
                    onClick={loadAIInsights}
                    disabled={isLoadingAI}
                    className="px-6 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-black transition-all disabled:opacity-50"
                  >
                    Refresh Insight
                  </button>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-bold mb-6">Stok Produk Terbanyak</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stockChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                          cursor={{fill: '#f9fafb'}}
                          contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                        />
                        <Bar dataKey="stock" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
                  <h3 className="text-lg font-bold mb-6">Status Ketersediaan</h3>
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Aman', value: data.products.length - lowStockCount },
                              { name: 'Kritis', value: lowStockCount },
                            ]}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            <Cell fill="#3b82f6" />
                            <Cell fill="#ef4444" />
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-full mt-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-full" /> Stok Aman</span>
                        <span className="font-bold">{data.products.length - lowStockCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-full" /> Stok Kritis</span>
                        <span className="font-bold">{lowStockCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input 
                    type="text" 
                    placeholder="Cari SKU atau nama produk..." 
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <button 
                  onClick={() => { setEditingProduct(null); setIsProductModalOpen(true); }}
                  className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-xl font-medium hover:bg-black transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Produk Baru
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                  <thead className="bg-gray-50/50 border-b">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Produk</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Kategori</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Harga</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Stok</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{product.name}</div>
                          <div className="text-xs text-gray-400 font-mono uppercase">{product.sku}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                            {data.categories.find(c => c.id === product.categoryId)?.name || 'Tanpa Kategori'}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium">Rp {product.price.toLocaleString('id-ID')}</td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-gray-900">{product.stock} unit</div>
                          <div className="text-[10px] text-gray-400">Min. {product.minStock}</div>
                        </td>
                        <td className="px-6 py-4">
                          {product.stock <= 0 ? (
                            <span className="px-2 py-1 bg-red-100 text-red-600 rounded-lg text-xs font-bold">Habis</span>
                          ) : product.stock <= product.minStock ? (
                            <span className="px-2 py-1 bg-amber-100 text-amber-600 rounded-lg text-xs font-bold">Kritis</span>
                          ) : (
                            <span className="px-2 py-1 bg-green-100 text-green-600 rounded-lg text-xs font-bold">Aman</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => { setEditingProduct(product); setIsProductModalOpen(true); }}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => openDeleteProductConfirm(product.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                  <thead className="bg-gray-50/50 border-b">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Waktu</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Tipe</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Produk</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Jumlah</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {[...data.transactions].reverse().map((tx) => {
                      const prod = data.products.find(p => p.id === tx.productId);
                      return (
                        <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {new Date(tx.date).toLocaleDateString('id-ID')} {new Date(tx.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-6 py-4">
                            {tx.type === TransactionType.IN ? (
                              <span className="flex items-center gap-1.5 text-green-600 text-sm font-bold">
                                <ArrowUpRight className="w-4 h-4" /> Masuk
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-red-600 text-sm font-bold">
                                <ArrowDownLeft className="w-4 h-4" /> Keluar
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-900">{prod?.name || 'Produk Dihapus'}</td>
                          <td className="px-6 py-4 font-bold">{tx.quantity} unit</td>
                          <td className="px-6 py-4 text-sm text-gray-500 italic">{tx.reason || '-'}</td>
                        </tr>
                      );
                    })}
                    {data.transactions.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">Belum ada transaksi</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
               {data.categories.map(cat => (
                 <div key={cat.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group">
                   <div className="flex items-center gap-4">
                     <div className="bg-gray-100 p-3 rounded-xl">
                       <Layers className="w-6 h-6 text-gray-600" />
                     </div>
                     <div>
                       <h4 className="font-bold text-gray-900">{cat.name}</h4>
                       <p className="text-xs text-gray-500">{data.products.filter(p => p.categoryId === cat.id).length} Produk</p>
                     </div>
                   </div>
                   <button 
                    onClick={() => openDeleteCategoryConfirm(cat.id)}
                    className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                 </div>
               ))}
               <button 
                 onClick={() => {
                   const name = prompt('Nama kategori baru:');
                   if (name) {
                     const newCat: Category = { id: Math.random().toString(36).substr(2, 9), name };
                     setData(prev => ({ ...prev, categories: [...prev.categories, newCat] }));
                   }
                 }}
                 className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex items-center justify-center gap-2 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-all"
               >
                 <Plus className="w-5 h-5" />
                 Tambah Kategori
               </button>
            </div>
          )}
        </div>
      </main>

      {/* --- Modals --- */}

      {/* Product Modal */}
      <Modal 
        isOpen={isProductModalOpen} 
        onClose={() => setIsProductModalOpen(false)} 
        title={editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
      >
        <form onSubmit={handleAddProduct} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk</label>
              <input name="name" defaultValue={editingProduct?.name} required className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <input name="sku" defaultValue={editingProduct?.sku} required className="w-full px-4 py-2 border rounded-xl font-mono uppercase outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              <select name="categoryId" defaultValue={editingProduct?.categoryId} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Tanpa Kategori</option>
                {data.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Harga (Rp)</label>
              <input type="number" name="price" defaultValue={editingProduct?.price} required className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stok Awal</label>
              <input type="number" name="stock" defaultValue={editingProduct?.stock} disabled={!!editingProduct} required className="w-full px-4 py-2 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Min. Stok (Alert)</label>
              <input type="number" name="minStock" defaultValue={editingProduct?.minStock} required className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
              <textarea name="description" defaultValue={editingProduct?.description} rows={3} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="pt-4">
            <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
              {editingProduct ? 'Simpan Perubahan' : 'Tambah Produk'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Transaction Modal */}
      <Modal 
        isOpen={isTxModalOpen} 
        onClose={() => setIsTxModalOpen(false)} 
        title={txType === TransactionType.IN ? 'Tambah Stok' : 'Kurangi Stok'}
      >
        <form onSubmit={handleTransaction} className="space-y-4">
          <div className="flex p-1 bg-gray-100 rounded-xl mb-4">
            <button 
              type="button" 
              onClick={() => setTxType(TransactionType.IN)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${txType === TransactionType.IN ? 'bg-white shadow-sm text-green-600' : 'text-gray-500'}`}
            >
              Masuk
            </button>
            <button 
              type="button" 
              onClick={() => setTxType(TransactionType.OUT)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${txType === TransactionType.OUT ? 'bg-white shadow-sm text-red-600' : 'text-gray-500'}`}
            >
              Keluar
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Produk</label>
            <select 
              name="productId" 
              required 
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Pilih --</option>
              {data.products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.stock} tersedia)</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah</label>
            <input type="number" name="quantity" min="1" required className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alasan/Keterangan</label>
            <input name="reason" placeholder="Contoh: Restock bulanan, Penjualan, dsb." className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="pt-4">
            <button 
              type="submit" 
              className={`w-full py-3 text-white rounded-xl font-bold transition-all shadow-lg ${txType === TransactionType.IN ? 'bg-green-600 hover:bg-green-700 shadow-green-100' : 'bg-red-600 hover:bg-red-700 shadow-red-100'}`}
            >
              Konfirmasi {txType === TransactionType.IN ? 'Stok Masuk' : 'Stok Keluar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
      />
    </div>
  );
}
