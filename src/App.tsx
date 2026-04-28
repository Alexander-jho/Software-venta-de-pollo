import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Truck, 
  Scissors, 
  Wallet, 
  Users, 
  LogOut, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft,
  ChevronRight,
  TrendingUp,
  Beef,
  Menu,
  X,
  User as UserIcon,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- UTILS ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CO', { 
    style: 'currency', 
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount);
};

// --- AUTH CONTEXT ---
const AuthContext = createContext<any>(null);

const useAuth = () => useContext(AuthContext);

// --- API CLIENT ---
const API = {
  get: async (url: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('API Error');
    return res.json();
  },
  post: async (url: string, data: any) => {
    const token = localStorage.getItem('token');
    const res = await fetch(url, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'API Error');
    }
    return res.json();
  }
};

// --- COMPONENTS ---

const Card = ({ children, className, title }: any) => (
  <div className={cn("bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden", className)}>
    {title && (
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800">{title}</h3>
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color }: any) => (
  <Card className="hover:border-primary/20 transition-all cursor-default group">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
        {trend && (
          <div className={cn("flex items-center mt-2 text-xs font-medium", trend === 'up' ? 'text-emerald-600' : 'text-rose-600')}>
            {trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownLeft className="w-3 h-3 mr-1" />}
            {trendValue} vs mes anterior
          </div>
        )}
      </div>
      <div className={cn("p-3 rounded-xl bg-slate-50 group-hover:scale-110 transition-transform", color)}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </Card>
);

const Button = ({ children, className, variant = 'primary', ...props }: any) => {
  const variants: any = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200',
    secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-200',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
  };

  return (
    <button 
      className={cn(
        "px-4 py-2 rounded-lg font-medium transition-all text-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:active:scale-100", 
        variants[variant], 
        className
      )} 
      {...props}
    >
      {children}
    </button>
  );
};

const Input = ({ label, icon: Icon, ...props }: any) => (
  <div className="space-y-1.5">
    {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />}
      <input 
        className={cn(
          "w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm",
          Icon && "pl-10"
        )} 
        {...props} 
      />
    </div>
  </div>
);

// --- PAGES ---

const Dashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [recentSales, setRecentSales] = useState([]);

  useEffect(() => {
    API.get('/api/dashboard/summary').then(setStats);
    // Mimic historical data for charts
    // In production this would come from the backend
  }, []);

  const chartData = [
    { name: 'Lun', ventas: 1200000, compras: 800000 },
    { name: 'Mar', ventas: 1500000, compras: 1000000 },
    { name: 'Mie', ventas: 900000, compras: 1200000 },
    { name: 'Jue', ventas: 1800000, compras: 600000 },
    { name: 'Vie', ventas: 2100000, compras: 900000 },
    { name: 'Sab', ventas: 2500000, compras: 1500000 },
    { name: 'Dom', ventas: 1700000, compras: 0 },
  ];

  if (!stats) return <div className="flex items-center justify-center h-64">Cargando datos...</div>;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Panel de Control</h1>
          <p className="text-slate-500">Bienvenido al sistema contable de PolloERP.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={TrendingUp}>Reporte Semanal</Button>
          <Button variant="primary" icon={Plus}>Nueva Venta</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Ventas Totales" 
          value={formatCurrency(stats.totalSales)} 
          icon={ShoppingCart} 
          trend="up" 
          trendValue="12%" 
          color="text-indigo-600" 
        />
        <StatCard 
          title="Caja Actual" 
          value={formatCurrency(stats.currentBalance)} 
          icon={Wallet} 
          trend="down" 
          trendValue="5%" 
          color="text-emerald-600" 
        />
        <StatCard 
          title="Valor Inventario" 
          value={formatCurrency(stats.inventoryValue)} 
          icon={Package} 
          color="text-amber-600" 
        />
        <StatCard 
          title="Ventas Realizadas" 
          value={stats.salesCount} 
          icon={TrendingUp} 
          trend="up" 
          trendValue="8%" 
          color="text-indigo-600" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card title="Flujo de Caja Semanal" className="lg:col-span-2">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="ventas" name="Ventas" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="compras" name="Compras" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Distribución de Activos">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Caja', value: stats.currentBalance },
                    { name: 'Inventario', value: stats.inventoryValue },
                    { name: 'Cuentas por Cobrar', value: 1200000 },
                  ]}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#4f46e5" />
                  <Cell fill="#10b981" />
                  <Cell fill="#f59e0b" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-2 mt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-600" /> Caja</span>
              <span className="font-semibold">{formatCurrency(stats.currentBalance)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Inventario</span>
              <span className="font-semibold">{formatCurrency(stats.inventoryValue)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500" /> CXC</span>
              <span className="font-semibold">{formatCurrency(1200000)}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const InventoryPage = () => {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', sku: '', category: 'POLLO_ENTERO', sellingPrice: 0 });

  const fetchProducts = () => API.get('/api/products').then(setProducts);

  useEffect(() => { fetchProducts(); }, []);

  const handleCreate = async (e: any) => {
    e.preventDefault();
    await API.post('/api/products', newProduct);
    setShowForm(false);
    fetchProducts();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventario</h1>
          <p className="text-slate-500">Gestión de productos y stock en tiempo real.</p>
        </div>
        <Button onClick={() => setShowForm(true)} icon={Plus}>Nuevo Producto</Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card title="Agregar Nuevo Producto">
              <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input label="Nombre" value={newProduct.name} onChange={(e:any) => setNewProduct({...newProduct, name: e.target.value})} required />
                <Input label="SKU / Código" value={newProduct.sku} onChange={(e:any) => setNewProduct({...newProduct, sku: e.target.value})} required />
                <Input label="Precio Venta (x KG)" type="number" value={newProduct.sellingPrice} onChange={(e:any) => setNewProduct({...newProduct, sellingPrice: parseFloat(e.target.value)})} required />
                <div className="flex items-end gap-2">
                  <Button type="submit" className="flex-1">Guardar</Button>
                  <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Costo Prom.</th>
                <th className="px-6 py-4">Precio Venta</th>
                <th className="px-6 py-4">Valor Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p: any) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 font-medium text-slate-900">{p.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{p.sku}</td>
                  <td className={cn("px-6 py-4 text-sm font-semibold", p.currentStock < 10 ? 'text-rose-600' : 'text-slate-700')}>
                    {p.currentStock.toFixed(2)} {p.unit}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{formatCurrency(p.costPrice)}</td>
                  <td className="px-6 py-4 text-sm text-indigo-600 font-medium">{formatCurrency(p.sellingPrice)}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">{formatCurrency(p.currentStock * p.costPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const SalesPage = ({ onToast }: any) => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState<any[]>([]);
  const [customer, setCustomer] = useState('');
  const [paymentType, setPaymentType] = useState('CONTADO');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get('/api/products').then(setProducts);
  }, []);

  const addToCart = (product: any, qty: number) => {
    if (qty <= 0) return;
    if (product.currentStock < qty) {
      alert('Stock insuficiente');
      return;
    }

    const existing = cart.find(i => i.id === product.id);
    if (existing) {
      setCart(cart.map(i => i.id === product.id ? { ...i, qty: i.qty + qty } : i));
    } else {
      setCart([...cart, { ...product, qty }]);
    }
  };

  const calculateTotal = () => cart.reduce((acc, i) => acc + (i.qty * i.sellingPrice), 0);

  const handleSubmit = async () => {
    if (!customer || cart.length === 0) return;
    setLoading(true);
    try {
      await API.post('/api/sales', {
        customerName: customer,
        invoiceNumber: `V-${Date.now().toString().slice(-6)}`,
        paymentType,
        items: cart.map(i => ({ productId: i.id, quantity: i.qty, unitPrice: i.sellingPrice }))
      });
      setCart([]);
      setCustomer('');
      alert('Venta registrada con éxito');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <Card title="Seleccionar Productos">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {products.map((p: any) => (
              <div key={p.id} className="p-4 border border-slate-100 rounded-xl hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <h4 className="font-semibold text-slate-800">{p.name}</h4>
                  <p className="text-xs text-slate-500 mb-2">Stock: {p.currentStock.toFixed(2)} {p.unit}</p>
                  <p className="text-lg font-bold text-indigo-600">{formatCurrency(p.sellingPrice)}</p>
                </div>
                <div className="mt-4 flex gap-2">
                  <input type="number" defaultValue={1} className="w-16 border rounded bg-slate-50 px-2 text-sm" id={`qty-${p.id}`} />
                  <Button 
                    className="flex-1" 
                    onClick={() => {
                      const input = document.getElementById(`qty-${p.id}`) as HTMLInputElement;
                      addToCart(p, parseFloat(input.value));
                    }}
                  >
                    Añadir
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card title="Detalle Factura">
          <div className="space-y-4">
            <Input label="Cliente" placeholder="Ej: Juan Perez" value={customer} onChange={(e:any) => setCustomer(e.target.value)} />
            <div className="space-y-1.5 text-sm">
              <label className="font-medium text-slate-700">Tipo Pago</label>
              <div className="flex gap-2">
                <button 
                  className={cn("flex-1 py-2 rounded-lg border text-xs font-semibold", paymentType === 'CONTADO' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200')}
                  onClick={() => setPaymentType('CONTADO')}
                >
                  EFECTIVO
                </button>
                <button 
                  className={cn("flex-1 py-2 rounded-lg border text-xs font-semibold", paymentType === 'CREDITO' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200')}
                  onClick={() => setPaymentType('CREDITO')}
                >
                  CRÉDITO
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-100 pt-4">
              {cart.map((item: any) => (
                <div key={item.id} className="py-3 flex justify-between items-center text-sm">
                  <div>
                    <span className="font-medium block">{item.name}</span>
                    <span className="text-slate-500">{item.qty} {item.unit} x {formatCurrency(item.sellingPrice)}</span>
                  </div>
                  <span className="font-bold">{formatCurrency(item.qty * item.sellingPrice)}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t-2 border-slate-100 space-y-2">
              <div className="flex justify-between text-slate-500 text-sm italic">
                <span>Subtotal</span>
                <span>{formatCurrency(calculateTotal())}</span>
              </div>
              <div className="flex justify-between text-slate-900 text-xl font-black">
                <span>TOTAL</span>
                <span>{formatCurrency(calculateTotal())}</span>
              </div>
            </div>

            <Button 
              className="w-full mt-6 py-4 text-lg" 
              disabled={loading || cart.length === 0 || !customer}
              onClick={handleSubmit}
            >
              {loading ? 'Procesando...' : 'Finalizar Venta'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

const ProductionPage = () => {
  const [products, setProducts] = useState([]);
  const [inputProduct, setInputProduct] = useState('');
  const [inputQty, setInputQty] = useState(0);
  const [outputs, setOutputs] = useState<any[]>([]); // [{ id: '', qty: 0 }]
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get('/api/products').then(setProducts);
  }, []);

  const availableOutputs = products.filter((p:any) => p.id !== inputProduct);

  const handleAddOutput = () => setOutputs([...outputs, { id: '', qty: 0 }]);

  const handleSubmit = async () => {
    if (!inputProduct || inputQty <= 0 || outputs.length === 0) return;
    setLoading(true);
    try {
      await API.post('/api/production', {
        inputProductId: inputProduct,
        inputQuantity: inputQty,
        outputs: outputs.map(o => ({ productId: o.id, quantity: o.qty }))
      });
      setInputProduct('');
      setInputQty(0);
      setOutputs([]);
      alert('Desposte procesado con éxito');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Módulo de Desposte (Producción)</h1>
        <p className="text-slate-500">Transforma pollo entero en partes. El sistema distribuirá el costo automáticamente.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card title="Entrada (Materia Prima)">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Producto a Despostar</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm"
                value={inputProduct}
                onChange={(e) => setInputProduct(e.target.value)}
              >
                <option value="">Seleccionar...</option>
                {products.filter((p:any) => p.currentStock > 0).map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.currentStock.toFixed(2)} {p.unit})</option>
                ))}
              </select>
            </div>
            <Input label="Cantidad (KG)" type="number" value={inputQty} onChange={(e:any) => setInputQty(parseFloat(e.target.value))} />
          </div>
        </Card>

        <Card title="Salida (Productos Finales)">
          <div className="space-y-4">
            {outputs.map((output, idx) => (
              <div key={idx} className="flex gap-2 items-end group">
                <div className="flex-1 space-y-1.5">
                  {idx === 0 && <label className="text-sm font-medium text-slate-700">Producto Resultante</label>}
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm"
                    value={output.id}
                    onChange={(e) => {
                      const newOutputs = [...outputs];
                      newOutputs[idx].id = e.target.value;
                      setOutputs(newOutputs);
                    }}
                  >
                    <option value="">Seleccionar...</option>
                    {availableOutputs.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="w-24 space-y-1.5">
                  {idx === 0 && <label className="text-sm font-medium text-slate-700">KGs</label>}
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm"
                    value={output.qty}
                    onChange={(e) => {
                      const newOutputs = [...outputs];
                      newOutputs[idx].qty = parseFloat(e.target.value);
                      setOutputs(newOutputs);
                    }}
                  />
                </div>
                <Button 
                  variant="ghost" 
                  className="px-2 text-rose-500 hover:bg-rose-50"
                  onClick={() => setOutputs(outputs.filter((_, i) => i !== idx))}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button variant="secondary" className="w-full dashed border-slate-300 py-4 border-dashed" onClick={handleAddOutput}>
              <Plus className="w-4 h-4 mr-2" /> Añadir Producto
            </Button>
          </div>
        </Card>
      </div>

      <div className="flex justify-end p-6 bg-indigo-50 rounded-xl border border-indigo-100">
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-xs font-semibold text-indigo-600 block uppercase">Mermas / Desperdicio</span>
            <span className="text-xl font-bold text-slate-900">
              {(inputQty - outputs.reduce((acc, o) => acc + (o.qty || 0), 0)).toFixed(2)} KG
            </span>
          </div>
          <Button 
            className="px-12 py-3 text-lg" 
            disabled={loading || !inputProduct || inputQty <= 0 || outputs.length === 0}
            onClick={handleSubmit}
          >
            {loading ? 'Procesando...' : 'Registrar Desposte'}
          </Button>
        </div>
      </div>
    </div>
  );
};

const LoginPage = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (e: any) {
      setError('Credenciales inválidas');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <Card className="p-8 space-y-8">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-white rotate-12 shadow-xl">
              <Beef className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">PolloERP</h1>
            <p className="text-slate-500">Sistema Contable de Despresado</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-rose-50 text-rose-600 rounded-lg text-sm text-center">{error}</div>}
            <Input label="Email" type="email" value={email} onChange={(e:any) => setEmail(e.target.value)} required />
            <Input label="Contraseña" type="password" value={password} onChange={(e:any) => setPassword(e.target.value)} required />
            <Button className="w-full py-3" type="submit">Iniciar Sesión</Button>
          </form>

          <p className="text-xs text-center text-slate-400">
            Powered by PolloERP Technology v1.0
          </p>
        </Card>
      </motion.div>
    </div>
  );
};

// --- LAYOUT ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-medium",
      active 
        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
        : "text-slate-500 hover:bg-slate-50 hover:text-indigo-600"
    )}
  >
    <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", active && "text-white")} />
    <span>{label}</span>
    {active && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
  </button>
);

const AppLayout = ({ children, activePage, setActivePage }: any) => {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Panel' },
    { id: 'inventory', icon: Package, label: 'Inventario' },
    { id: 'sales', icon: ShoppingCart, label: 'Ventas' },
    { id: 'purchases', icon: Truck, label: 'Compras' },
    { id: 'production', icon: Scissors, label: 'Desposte' },
    { id: 'caja', icon: Wallet, label: 'Caja' },
    { id: 'employees', icon: Users, label: 'Personal', adminOnly: true },
  ];

  const filteredItems = menuItems.filter(item => !item.adminOnly || user?.role === 'ADMIN');

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden md:flex flex-col bg-white border-r border-slate-200 transition-all duration-300 z-30 sticky top-0 h-screen",
        collapsed ? "w-20" : "w-64"
      )}>
        <div className="p-6 flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg text-white">
            <Beef className="w-6 h-6" />
          </div>
          {!collapsed && <span className="text-xl font-bold text-slate-800 tracking-tight">PolloERP</span>}
        </div>

        <nav className="flex-1 px-3 space-y-1 py-4">
          {filteredItems.map(item => (
            <SidebarItem 
              key={item.id} 
              active={activePage === item.id} 
              {...item} 
              onClick={() => setActivePage(item.id)} 
              collapsed={collapsed}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className={cn("bg-slate-50 rounded-2xl p-4 flex items-center gap-3", collapsed && "justify-center px-0")}>
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 font-bold shadow-sm">
              {user?.name?.[0].toUpperCase()}
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
                <div className="flex items-center gap-1 text-[10px] uppercase font-black text-slate-400">
                  <ShieldCheck className="w-3 h-3 text-indigo-500" /> {user?.role}
                </div>
              </div>
            )}
          </div>
          <button 
            onClick={logout}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 mt-4 text-rose-500 hover:bg-rose-50 rounded-xl transition-all text-sm font-medium",
              collapsed && "justify-center"
            )}
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-slate-100 rounded-lg md:hidden">
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-sm border-l border-slate-200 pl-4 text-slate-400 hidden sm:block">
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold ring-1 ring-emerald-100">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              SISTEMA CONECTADO
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

// --- MAIN APP ---

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [activePage, setActivePage] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
    setLoading(false);

    // Initial check connection
    fetch('/api/auth/login').catch(err => {
      console.log('Server starting up...');
    });
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    });
    if (!res.ok) throw new Error('Failed');
    const data = await res.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Inicializando ERP...</div>;

  if (!user) return (
    <AuthContext.Provider value={{ login }}>
      <LoginPage />
    </AuthContext.Provider>
  );

  return (
    <AuthContext.Provider value={{ user, logout }}>
      <AppLayout activePage={activePage} setActivePage={setActivePage}>
        {activePage === 'dashboard' && <Dashboard />}
        {activePage === 'inventory' && <InventoryPage />}
        {activePage === 'sales' && <SalesPage />}
        {activePage === 'production' && <ProductionPage />}
        {activePage === 'purchases' && <div className="text-center py-20 text-slate-400">Módulo de Compras en construcción...</div>}
        {activePage === 'caja' && <div className="text-center py-20 text-slate-400">Módulo de Caja en construcción...</div>}
        {activePage === 'employees' && <div className="text-center py-20 text-slate-400">Módulo de Personal en construcción...</div>}
      </AppLayout>
    </AuthContext.Provider>
  );
}
