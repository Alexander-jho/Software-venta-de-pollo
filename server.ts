import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'pollo-erp-secret-key-2024';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- AUTH MIDDLEWARE ---
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (e) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  const isAdmin = (req: any, res: any, next: any) => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden: Admin access required' });
    next();
  };

  // --- API ROUTES ---

  // Auth
  app.post('/api/auth/register', async (req, res) => {
    const { email, password, name, role } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { email, password: hashedPassword, name, role: role || 'EMPLEADO' }
      });
      res.json({ message: 'User created' });
    } catch (e) {
      res.status(400).json({ error: 'User already exists' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET);
    res.json({ token, user: { id: user.id, name: user.name, role: user.role, email: user.email } });
  });

  // Products
  app.get('/api/products', authenticate, async (req, res) => {
    const products = await prisma.product.findMany();
    res.json(products);
  });

  app.post('/api/products', authenticate, async (req, res) => {
    const product = await prisma.product.create({ data: req.body });
    res.json(product);
  });

  app.patch('/api/products/:id', authenticate, async (req, res) => {
    const product = await prisma.product.update({ 
      where: { id: req.params.id },
      data: req.body 
    });
    res.json(product);
  });

  // Inventory
  app.get('/api/inventory/stats', authenticate, async (req, res) => {
    const stats = await prisma.product.findMany({
      select: { name: true, currentStock: true, unit: true, category: true }
    });
    res.json(stats);
  });

  // Production (Desposte)
  app.post('/api/production', authenticate, async (req, res) => {
    const { inputProductId, inputQuantity, outputs } = req.body;
    // outputs: Array<{ productId: string, quantity: float }>

    try {
      await prisma.$transaction(async (tx) => {
        // 1. Check input stock
        const inputProduct = await tx.product.findUnique({ where: { id: inputProductId } });
        if (!inputProduct || inputProduct.currentStock < inputQuantity) {
          throw new Error('Insufficient stock for production');
        }

        // 2. Reduce input stock
        await tx.product.update({
          where: { id: inputProductId },
          data: { currentStock: { decrement: inputQuantity } }
        });

        // 3. Register production input transaction
        await tx.inventoryTransaction.create({
          data: {
            productId: inputProductId,
            type: 'PRODUCTION_OUT',
            quantity: inputQuantity,
            price: inputProduct.costPrice,
            date: new Date(),
          }
        });

        // 4. Calculate cost per output (proportional by weight for simplicity, or keep same cost)
        const totalOutputWeight = outputs.reduce((acc: number, o: any) => acc + o.quantity, 0);
        const costBasis = inputProduct.costPrice * inputQuantity;

        // 5. Update outputs
        for (const output of outputs) {
          const outputProduct = await tx.product.findUnique({ where: { id: output.productId } });
          const proportionalCost = (output.quantity / totalOutputWeight) * costBasis / output.quantity;
          
          await tx.product.update({
            where: { id: output.productId },
            data: { 
              currentStock: { increment: output.quantity },
              costPrice: proportionalCost // Update cost price based on production
            }
          });

          await tx.inventoryTransaction.create({
            data: {
              productId: output.productId,
              type: 'PRODUCTION_IN',
              quantity: output.quantity,
              price: proportionalCost,
              date: new Date(),
            }
          });
        }

        // 6. Record Production event
        await tx.production.create({
          data: {
            inputProductId,
            inputQuantity,
            costPerKg: inputProduct.costPrice
          }
        });
      });
      res.json({ message: 'Production processed successfully' });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Purchases
  app.post('/api/purchases', authenticate, async (req, res) => {
    const { supplierName, invoiceNumber, paymentType, items } = req.body;
    // items: Array<{ productId: string, quantity: number, unitPrice: number }>

    try {
      const purchase = await prisma.$transaction(async (tx) => {
        const total = items.reduce((acc: number, item: any) => acc + (item.quantity * item.unitPrice), 0);
        
        const p = await tx.purchase.create({
          data: {
            supplierName,
            invoiceNumber,
            paymentType,
            total,
            items: {
              create: items.map((item: any) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.quantity * item.unitPrice
              }))
            }
          }
        });

        // Update inventory and costs
        for (const item of items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { 
              currentStock: { increment: item.quantity },
              costPrice: item.unitPrice // Update to latest purchase price
            }
          });

          await tx.inventoryTransaction.create({
            data: {
              productId: item.productId,
              type: 'PURCHASE',
              quantity: item.quantity,
              price: item.unitPrice,
              referenceId: p.id
            }
          });
        }

        // Cash flow record if PAID (CONTADO)
        if (paymentType === 'CONTADO') {
          await tx.cashTransaction.create({
            data: {
              type: 'EXPENSE',
              amount: total,
              description: `Compra Pollo - Factura ${invoiceNumber}`,
              category: 'COMPRA'
            }
          });
        }

        return p;
      });
      res.json(purchase);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Sales
  app.post('/api/sales', authenticate, async (req, res) => {
    const { customerName, invoiceNumber, paymentType, items } = req.body;

    try {
      const sale = await prisma.$transaction(async (tx) => {
        const total = items.reduce((acc: number, item: any) => acc + (item.quantity * item.unitPrice), 0);
        
        // Check stock first
        for (const item of items) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (!product || product.currentStock < item.quantity) {
            throw new Error(`Insufficient stock for product: ${product?.name || item.productId}`);
          }
        }

        const s = await tx.sale.create({
          data: {
            customerName,
            invoiceNumber,
            paymentType,
            total,
            items: {
              create: items.map((item: any) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.quantity * item.unitPrice
              }))
            }
          }
        });

        // Update inventory
        for (const item of items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { decrement: item.quantity } }
          });

          await tx.inventoryTransaction.create({
            data: {
              productId: item.productId,
              type: 'SALE',
              quantity: item.quantity,
              price: item.unitPrice,
              referenceId: s.id
            }
          });
        }

        // Cash flow record if PAID (CONTADO)
        if (paymentType === 'CONTADO') {
          await tx.cashTransaction.create({
            data: {
              type: 'INCOME',
              amount: total,
              description: `Venta Pollo - Factura ${invoiceNumber}`,
              category: 'VENTA'
            }
          });
        }

        return s;
      });
      res.json(sale);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Dashboard Stats
  app.get('/api/dashboard/summary', authenticate, async (req, res) => {
    const [sales, purchases, cashFlow, products] = await Promise.all([
      prisma.sale.findMany(),
      prisma.purchase.findMany(),
      prisma.cashTransaction.findMany(),
      prisma.product.findMany()
    ]);

    const totalSales = sales.reduce((acc, s) => acc + s.total, 0);
    const totalPurchases = purchases.reduce((acc, p) => acc + p.total, 0);
    const currentBalance = cashFlow.reduce((acc, t) => t.type === 'INCOME' ? acc + t.amount : acc - t.amount, 0);
    
    // Profit Calculation (Simple)
    const inventoryValue = products.reduce((acc, p) => acc + (p.currentStock * p.costPrice), 0);

    res.json({
      totalSales,
      totalPurchases,
      currentBalance,
      inventoryValue,
      salesCount: sales.length,
      purchaseCount: purchases.length
    });
  });

  // Cash Flow
  app.get('/api/cash-flow', authenticate, async (req, res) => {
    const transactions = await prisma.cashTransaction.findMany({ orderBy: { date: 'desc' } });
    res.json(transactions);
  });

  // Employees
  app.get('/api/employees', authenticate, async (req, res) => {
    const employees = await prisma.employee.findMany();
    res.json(employees);
  });

  app.post('/api/employees/advance', authenticate, async (req, res) => {
    const { employeeId, amount } = req.body;
    const employee = await prisma.employee.update({
      where: { id: employeeId },
      data: { advances: { increment: amount } }
    });
    
    await prisma.cashTransaction.create({
      data: {
        type: 'EXPENSE',
        amount,
        description: `Adelanto nómina - ${employee.name}`,
        category: 'ADELANTO'
      }
    });

    res.json(employee);
  });

  app.get('/api/debug/users', async (req, res) => {
    const users = await prisma.user.findMany({ select: { email: true, role: true, name: true } });
    res.json(users);
  });

  // --- VITE MIDDLEWARE ---
  const isProd = process.env.NODE_ENV === 'production';
  console.log(`Running in ${isProd ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // --- AUTO SEED ---
  const seedIfEmpty = async () => {
    try {
      const userCount = await prisma.user.count();
      if (userCount === 0) {
        console.log('Seeding database...');
        const adminPass = await bcrypt.hash('admin123', 10);
        await prisma.user.create({
          data: {
            email: 'admin@polloerp.com',
            name: 'Administrador ERP',
            password: adminPass,
            role: 'ADMIN'
          }
        });
        
        const empPass = await bcrypt.hash('emp123', 10);
        await prisma.user.create({
          data: {
            email: 'empleado@polloerp.com',
            name: 'Vendedor 01',
            password: empPass,
            role: 'EMPLEADO'
          }
        });

        const initialProducts = [
          { name: 'Pollo Entero', sku: 'P-ENT-001', category: 'POLLO_ENTERO', unit: 'KG', currentStock: 100, costPrice: 9000, sellingPrice: 12000 },
          { name: 'Pechuga', sku: 'P-PEC-001', category: 'DESPRESADO', unit: 'KG', currentStock: 20, costPrice: 12000, sellingPrice: 16000 },
          { name: 'Pernil', sku: 'P-PER-001', category: 'DESPRESADO', unit: 'KG', currentStock: 30, costPrice: 8000, sellingPrice: 11000 },
        ];

        for (const p of initialProducts) {
          await prisma.product.create({ data: p });
        }
        console.log('Seed completed');
      }
    } catch (err) {
      console.error('Seed failed:', err);
    }
  };
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ERP Server running on http://localhost:${PORT}`);
    // Run seed after server is listening
    seedIfEmpty();
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
