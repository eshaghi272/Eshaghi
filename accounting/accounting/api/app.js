// 📁 مسیر: /api/app.js

import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { pathToFileURL } from 'url';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

import { swaggerOptions } from './swaggerOptions.js';

// 🧩 Routers
import authRouter from './routes/auth.routes.js';
import userRouter from './routes/user.routes.js';
import bankTransactionRouter from './routes/bankTransaction.routes.js';

dotenv.config();

// 🔧 Express setup
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(morgan('dev'));

// 📚 Swagger setup
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ✅ HEALTH CHECK - در بالای همه routeها قرار دهید
app.get('/api/health', (req, res) => {
  console.log('✅ Health check requested');
  res.status(200).json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 🧪 Router validator
function assertRouter(name, router) {
  if (!router || typeof router.handle !== 'function') {
    console.error(`❌ ${name} معتبر نیست.`, router);
    process.exit(1);
  }
  console.log(`✅ Mounted [${name}]`);
  return router;
}

// 📦 Static route definitions
const staticRoutes = [
  ['accountsRouter', '/api/accounts', './routes/accounts.routes.js'],
  ['bankAccountsRouter', '/api/bankaccounts', './routes/bankAccounts.routes.js'],
  ['subsidiaryRouter', '/api/subsidiaries', './routes/subsidiaryAccounts.routes.js'],
  ['subsidiaryAccountsRouter', '/api/subsidiaryaccounts', './routes/subsidiaryAccounts.routes.js'],
  ['journalLinesRouter', '/api/journal-lines', './routes/journalLines.routes.js'],
  ['itemGroupRouter', '/api/itemgroups', './routes/itemGroup.routes.js'],
  ['itemsRouter', '/api/items', './routes/items.routes.js'],
  ['purchaseRouter', '/api/purchases', './routes/purchase.routes.js'],
  ['salesRouter', '/api/sales', './routes/sales.routes.js'],
  ['salesInvoiceRouter', '/api/salesinvoices', './routes/salesInvoice.routes.js'],
  ['salesLinesRouter', '/api/saleslines', './routes/salesLines.routes.js'],
  ['stockTransactionRouter', '/api/stocktransactions', './routes/stockTransaction.routes.js'],
  ['warehousesRouter', '/api/warehouses', './routes/warehouses.routes.js'],
  ['personsRouter', '/api/persons', './routes/persons.routes.js'],
  ['userGroupsRouter', '/api/usergroups', './routes/userGroups.routes.js'],
  ['userRolesRouter', '/api/userroles', './routes/userRoles.routes.js'],
  ['userPermissionsRouter', '/api/user-permissions', './routes/userPermissions.routes.js'],
  ['systemSettingsRouter', '/api/system-settings', './routes/systemSettings.routes.js'],
  ['companiesRouter', '/api/companies', './routes/companies.routes.js'],
  ['contactMessagesRouter', '/api/contact-messages', './routes/contactMessages.routes.js'],
  ['inventoryRouter', '/api/inventory', './routes/inventory.routes.js'],
  ['payrollRouter', '/api/payroll', './routes/payroll.routes.js'],
  ['payrollNewRouter', '/api/payroll-new', './routes/payrollNew.routes.js'],
  ['payrollOvertimeRouter', '/api/payroll-overtime', './routes/payrollOvertime.routes.js'],
  ['closingRouter', '/api/closing', './routes/closing.routes.js'],
  ['openingRouter', '/api/opening', './routes/opening.routes.js'],
  ['financialStatementsRouter', '/api/financialStatements', './routes/financialStatements.routes.js'],
  ['kardexRouter', '/api/kardex', './routes/kardex.routes.js'],
  ['contactRoutes', '/api/contact', './routes/contact.routes.js'],
  ['accountGroupsRouter', '/api/accountgroups', './routes/accountGroups.routes.js'],
  ['accountingRoutes', '/api/accounting', './routes/accounting.routes.js'],
  ['priceRouter', '/api/price', './routes/price.routes.js'],
  ['fiscalYearRouter', '/api/fiscal-year', './routes/fiscalYear.routes.js'],
  ['fixedAssetsRouter', '/api/fixedassets', './routes/fixedAssets.routes.js'],
  ['trialbalanceRoutes', '/api/trialbalance', './routes/trialbalance.routes.js'],
  ['journalentriesRoutes', '/api/journalentries', './routes/journalentries.routes.js'],
  ['lookupRoutes', '/api/lookup', './routes/lookup.routes.js'],
  ['layoutRoutes', '/api/layout', './routes/layout.routes.js'],
  ['dashboardRoutes', '/api/dashboard', './routes/dashboard.routes.js']
];

// 🚀 Mount all routes
async function mountRoutes() {
  try {
    for (const [name, mountPath, file] of staticRoutes) {
      const fullPath = pathToFileURL(path.resolve(file)).href;
      const mod = await import(fullPath);
      const router = mod.default || mod.router || mod;
      app.use(mountPath, assertRouter(name, router));
    }

    // 🔐 Special routers
    app.use('/api/auth', assertRouter('authRouter', authRouter));
    app.use('/api/bank-transactions', assertRouter('bankTransactionRouter', bankTransactionRouter));
    app.use('/api/users', assertRouter('userRouter', userRouter));

    // ✅ Root health check
    app.get('/', (_, res) => res.send('سرور فعال است ✅'));

    // ✅ اضافه کردن health check در مسیرهای مختلف برای اطمینان
    app.get('/health', (req, res) => {
      res.status(200).json({ 
        status: 'ok', 
        message: 'Server is running',
        timestamp: new Date().toISOString()
      });
    });

    // ❌ 404 handler (این باید آخرین middleware باشد)
    app.use((req, res) => {
      console.log(`❌ 404 - مسیر یافت نشد: ${req.method} ${req.originalUrl}`);
      res.status(404).json({ 
        error: 'مسیر مورد نظر پیدا نشد',
        path: req.originalUrl,
        method: req.method
      });
    });

    // ❗ Global error handler
    app.use((err, req, res, next) => {
      console.error('❌ خطای سرور:', err);
      res.status(500).json({ 
        error: 'خطای داخلی سرور', 
        details: process.env.NODE_ENV === 'development' ? err.message : undefined 
      });
    });

    console.log('🎯 همه routes با موفقیت mount شدند');

  } catch (err) {
    console.error('❌ خطا در mount کردن مسیرها:', err);
    process.exit(1);
  }
}

await mountRoutes();

export default app;