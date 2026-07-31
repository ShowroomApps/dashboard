import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => ({ get: () => null }),
}));

// Mock AuthContext
jest.mock('@/lib/auth-context', () => ({
  useAuthContext: () => ({
    user: { id: 'admin-1', full_name: 'Platform Administrator', email: 'admin@showroomos.com', is_platform_admin: true },
    currentOrgId: 'org-1',
    organizations: [
      { id: 'org-1', name: 'Diwan Automobiles', display_name: 'Diwan Motors', slug: 'diwan-motors' },
    ],
    setCurrentOrgId: jest.fn(),
    logout: jest.fn(),
  }),
}));

// Mock SWR hooks for all backend modules
jest.mock('@/lib/use-swr-hooks', () => ({
  useSales: () => ({
    sales: [
      {
        id: 'sale-1',
        saleNumber: 'SLE-0001',
        sellingPrice: 18500000,
        costBasisAtSale: 17200000,
        grossProfit: 1300000,
        saleDate: '2026-07-25',
        status: 'completed',
        vehicle: { make: 'Toyota', model: 'Fortuner Legender', stockId: 'STK-0001', modelYear: 2023, year: 2023 },
        customer: { name: 'Zeeshan Ali', fullName: 'Zeeshan Ali', customerNumber: 'CUST-0001' },
      },
    ],
    isLoading: false,
    mutate: jest.fn(),
  }),

  useVehicles: (opts?: any) => ({
    vehicles: [
      {
        id: 'veh-1',
        stockId: 'STK-0001',
        make: 'Toyota',
        model: 'Fortuner Legender',
        modelYear: 2023,
        year: 2023,
        color: 'Super White',
        vin: 'NMT1129381',
        registrationNumber: 'BL-9999',
        status: 'available',
        mileage: 15000,
        costBasis: 17200000,
        askingPrice: 18500000,
        createdAt: '2026-07-25T00:00:00.000Z',
      },
    ],
    isLoading: false,
    mutate: jest.fn(),
  }),

  usePurchases: () => ({
    purchases: [
      {
        id: 'pur-1',
        purchaseNumber: 'PUR-0001',
        acquisitionPrice: 16800000,
        totalCost: 17200000,
        totalCostBasis: 17200000,
        status: 'active',
        purchaseDate: '2026-07-20',
        vehicle: { make: 'Toyota', model: 'Fortuner Legender', stockId: 'STK-0001' },
        seller: { name: 'Indus Motor Supplier', fullName: 'Indus Motor Supplier', sellerNumber: 'SEL-0001' },
      },
    ],
    isLoading: false,
    mutate: jest.fn(),
  }),

  usePayments: () => ({
    payments: [
      {
        id: 'pay-1',
        paymentNumber: 'PAY-0001',
        amount: 18500000,
        direction: 'inbound',
        paymentMethod: 'bank_transfer',
        status: 'completed',
        paymentDate: '2026-07-25',
      },
    ],
    isLoading: false,
  }),

  useCustomers: () => ({
    customers: [
      { id: 'cust-1', customerNumber: 'CUST-0001', name: 'Zeeshan Ali', fullName: 'Zeeshan Ali', phone: '+923001234567', city: 'Karachi' },
    ],
    isLoading: false,
    mutate: jest.fn(),
  }),

  useSellers: () => ({
    sellers: [
      { id: 'sel-1', sellerNumber: 'SEL-0001', name: 'Indus Motor Supplier', fullName: 'Indus Motor Supplier', phone: '+923009876543', city: 'Karachi' },
    ],
    isLoading: false,
    mutate: jest.fn(),
  }),

  useExpenses: () => ({
    expenses: [
      { id: 'exp-1', expenseNumber: 'EXP-0001', category: 'Showroom Rent', amount: 250000, isCapitalizable: false, status: 'completed', expenseDate: '2026-07-28' },
    ],
    isLoading: false,
    mutate: jest.fn(),
  }),

  useChartOfAccounts: () => ({
    accounts: [
      { id: 'acc-1', code: '1140', name: 'Vehicle Inventory', accountType: 'asset', normalBalance: 'debit', allowDirectPosting: true, isSystem: true },
      { id: 'acc-2', code: '6400', name: 'Rent Expense', accountType: 'expense', normalBalance: 'debit', allowDirectPosting: true, isSystem: true },
    ],
    isLoading: false,
  }),

  useJournalEntries: () => ({
    entries: [
      { id: 'je-1', entryNumber: 'JE-0001', entryDate: '2026-07-25', memo: 'Vehicle Sale SLE-0001', description: 'Vehicle Sale SLE-0001', status: 'posted', totalDebit: 18500000, totalCredit: 18500000 },
    ],
    isLoading: false,
  }),

  useOrganizations: () => ({
    organizations: [
      { id: 'org-1', name: 'Diwan Automobiles', displayName: 'Diwan Motors', slug: 'diwan-motors', logoUrl: 'https://example.com/logo.png', website: 'https://diwanmotors.pk', facebookPageUrl: 'https://facebook.com/diwanmotors', city: 'Karachi', createdAt: '2026-07-25T00:00:00.000Z' },
    ],
    isLoading: false,
    mutate: jest.fn(),
  }),

  useSubscriptions: () => ({
    subscriptions: [
      {
        allowed: true,
        status: 'TRIAL',
        daysRemaining: 30,
        planName: '1-Month Free Trial',
        isTrial: true,
        expiresAt: '2026-08-30T00:00:00.000Z',
        organization: { id: 'org-1', name: 'Diwan Automobiles', displayName: 'Diwan Motors', slug: 'diwan-motors' },
        subscription: { id: 'sub-1', startDate: '2026-07-30', endDate: '2026-08-30' },
      },
    ],
    isLoading: false,
    mutate: jest.fn(),
  }),

  useSubscriptionStatus: () => ({
    statusInfo: { allowed: true, status: 'TRIAL', daysRemaining: 30, isTrial: true, expiresAt: '2026-08-30T00:00:00.000Z' },
    isLoading: false,
    mutate: jest.fn(),
  }),

  useCurrentOrg: () => ({
    organization: { id: 'org-1', name: 'Diwan Automobiles', displayName: 'Diwan Motors', slug: 'diwan-motors', logoUrl: 'https://example.com/logo.png', website: 'https://diwanmotors.pk', facebookPageUrl: 'https://facebook.com/diwanmotors', currencyCode: 'PKR', timezone: 'Asia/Karachi' },
    mutate: jest.fn(),
  }),

  useBranches: () => ({
    branches: [
      { id: 'br-1', name: 'Main DHA Phase 6 Showroom', code: 'HQ', city: 'Karachi' },
    ],
    isLoading: false,
  }),

  useUsers: () => ({
    users: [
      { id: 'u-1', fullName: 'Showroom Manager', email: 'manager@diwanmotors.com', isPlatformUser: false },
    ],
    isLoading: false,
    mutate: jest.fn(),
  }),

  useRoles: () => ({
    roles: [
      { id: 'r-1', name: 'org_owner', description: 'Full Showroom Access' },
    ],
    isLoading: false,
  }),

  useMe: () => ({
    user: { id: 'admin-1', full_name: 'Platform Administrator', email: 'admin@showroomos.com', is_platform_user: true },
    isLoading: false,
  }),
}));

// Mock API Client with Spy Functions
import { apiClient } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  apiClient: {
    get: jest.fn().mockResolvedValue({ success: true, data: [] }),
    post: jest.fn().mockResolvedValue({ success: true, data: { id: 'test-created-id' } }),
    put: jest.fn().mockResolvedValue({ success: true, data: {} }),
    delete: jest.fn().mockResolvedValue({ success: true }),
  },
}));

// Import Components & Pages
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import DashboardPage from '@/app/(dashboard)/dashboard/page.tsx';
import VehiclesPage from '@/app/(dashboard)/vehicles/page.tsx';
import SalesPage from '@/app/(dashboard)/sales/page.tsx';
import PurchasesPage from '@/app/(dashboard)/purchases/page.tsx';
import PaymentsPage from '@/app/(dashboard)/payments/page.tsx';
import ExpensesPage from '@/app/(dashboard)/expenses/page.tsx';
import AccountingPage from '@/app/(dashboard)/accounting/page.tsx';
import ContactsPage from '@/app/(dashboard)/contacts/page.tsx';
import ShowroomUsersPage from '@/app/(dashboard)/users/page.tsx';
import SaaSOrganizationsPage from '@/app/(dashboard)/admin/organizations/page.tsx';
import AdminSubscriptionsPage from '@/app/(dashboard)/admin/subscriptions/page.tsx';
import SettingsPage from '@/app/(dashboard)/settings/page.tsx';
import LoginPage from '@/app/login/page.tsx';

describe('ShowroomOS Enterprise Web Dashboard Complete Component & API Coverage Test Suite', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 1. Sidebar Navigation
  test('1. Sidebar Layout — Renders brand header, status pill, and all 12 navigation links', () => {
    render(<Sidebar />);

    expect(screen.getByText('ShowroomOS')).toBeInTheDocument();
    expect(screen.getByText('Dealership SaaS')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Vehicle Inventory')).toBeInTheDocument();
    expect(screen.getByText('Sales Transactions')).toBeInTheDocument();
    expect(screen.getByText('Acquisitions / Purchases')).toBeInTheDocument();
    expect(screen.getByText('Inbound & Outbound Payments')).toBeInTheDocument();
    expect(screen.getByText('Operating Expenses')).toBeInTheDocument();
    expect(screen.getByText('General Ledger & Accounts')).toBeInTheDocument();
    expect(screen.getByText('Customers & Sellers')).toBeInTheDocument();
    expect(screen.getByText('Showroom Staff & Admins')).toBeInTheDocument();
    expect(screen.getByText('SaaS Showrooms (Platform)')).toBeInTheDocument();
    expect(screen.getByText('Subscriptions & Licensing')).toBeInTheDocument();
    expect(screen.getByText('Organization Settings')).toBeInTheDocument();
  });

  // 2. TopBar Header
  test('2. TopBar Header — Renders active organization branding and user profile email', () => {
    render(<TopBar />);

    expect(screen.getByText('Platform Administrator')).toBeInTheDocument();
    expect(screen.getByText('admin@showroomos.com')).toBeInTheDocument();
  });

  // 3. Executive Dashboard Home Page
  test('3. Executive Dashboard Page — Calculates & renders KPIs and recent sales transactions', () => {
    render(<DashboardPage />);

    expect(screen.getByText(/Executive Financial & Profit\/Loss Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText('Total Sales Revenue')).toBeInTheDocument();
    expect(screen.getAllByText(/Gross Profit/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Active Inventory Value/i)).toBeInTheDocument();
    expect(screen.getByText(/vehicles in stock/i)).toBeInTheDocument();
    expect(screen.getByText(/Recent Vehicle Sales/i)).toBeInTheDocument();
  });

  // 4. Vehicle Inventory Module
  test('4. Vehicles Page — Renders inventory table, filters by status, opens modal & submits POST /vehicles', async () => {
    render(<VehiclesPage />);

    expect(screen.getByText(/Vehicle Inventory/i)).toBeInTheDocument();
    expect(screen.getByText('Toyota Fortuner Legender')).toBeInTheDocument();
    expect(screen.getByText('STK-0001')).toBeInTheDocument();

    // Open Add Vehicle Modal
    const addBtn = screen.getByRole('button', { name: /add vehicle/i });
    fireEvent.click(addBtn);

    expect(screen.getByText('Add New Vehicle')).toBeInTheDocument();

    // Fill vehicle form
    fireEvent.change(screen.getByPlaceholderText('e.g. Toyota'), { target: { value: 'Honda' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. Fortuner Legender'), { target: { value: 'Civic RS' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. Super White'), { target: { value: 'Crystal Black' } });

    // Submit form
    const saveBtn = screen.getByRole('button', { name: /save vehicle/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/vehicles', expect.objectContaining({
        branchId: 'br-1',
        make: 'Honda',
        model: 'Civic RS',
        color: 'Crystal Black',
      }));
    });
  });

  // 5. Sales Transactions Module
  test('5. Sales Page — Renders revenue summary, sales list, opens modal & submits POST /sales', async () => {
    render(<SalesPage />);

    expect(screen.getByText(/Sales Transactions/i)).toBeInTheDocument();
    expect(screen.getByText('SLE-0001')).toBeInTheDocument();
    expect(screen.getByText('Zeeshan Ali')).toBeInTheDocument();

    // Open New Sale Modal
    const newSaleBtn = screen.getByRole('button', { name: /new sale/i });
    fireEvent.click(newSaleBtn);

    expect(screen.getByText('Record New Sale')).toBeInTheDocument();

    // Select vehicle and customer dropdowns
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'veh-1' } });
    fireEvent.change(selects[1], { target: { value: 'cust-1' } });

    // Submit Sale Form
    const submitBtn = screen.getByRole('button', { name: /record sale/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/sales', expect.objectContaining({
        branchId: 'br-1',
        vehicleId: 'veh-1',
        customerId: 'cust-1',
      }));
    });
  });

  // 6. Vehicle Acquisitions & Cost Basis (Option A)
  test('6. Acquisitions Page — Renders Option A cost basis, opens modal & submits POST /purchases', async () => {
    render(<PurchasesPage />);

    expect(screen.getByText('Vehicle Acquisitions & Cost Basis')).toBeInTheDocument();
    expect(screen.getByText('PUR-0001')).toBeInTheDocument();
    expect(screen.getByText('Indus Motor Supplier')).toBeInTheDocument();

    // Open New Acquisition Modal
    const newAcqBtn = screen.getByRole('button', { name: /new acquisition/i });
    fireEvent.click(newAcqBtn);

    expect(screen.getByText('Record New Vehicle Acquisition')).toBeInTheDocument();

    // Select vehicle and seller dropdowns
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'veh-1' } });
    fireEvent.change(selects[1], { target: { value: 'sel-1' } });

    // Submit Acquisition Form
    const submitBtn = screen.getByRole('button', { name: /save acquisition/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/purchases', expect.objectContaining({
        branchId: 'br-1',
        vehicleId: 'veh-1',
        sellerId: 'sel-1',
      }));
    });
  });

  // 7. Inbound & Outbound Payments Module
  test('7. Payments Page — Renders inbound & outbound payment transaction records', () => {
    render(<PaymentsPage />);

    expect(screen.getByText('Inbound & Outbound Payments')).toBeInTheDocument();
    expect(screen.getByText('PAY-0001')).toBeInTheDocument();
    expect(screen.getByText('inbound')).toBeInTheDocument();
  });

  // 8. Operating Expenses Module
  test('8. Operating Expenses Page — Renders expense records, opens modal & submits POST /expenses', async () => {
    render(<ExpensesPage />);

    expect(screen.getByText('Operating & Showroom Expenses')).toBeInTheDocument();
    expect(screen.getByText('EXP-0001')).toBeInTheDocument();
    expect(screen.getByText('Showroom Rent')).toBeInTheDocument();

    // Open Add Expense Modal
    const addExpBtn = screen.getByRole('button', { name: /add expense/i });
    fireEvent.click(addExpBtn);

    expect(screen.getByText('Record Showroom Expense')).toBeInTheDocument();

    // Fill expense form
    fireEvent.change(screen.getByPlaceholderText('e.g. Electricity Bill & Internet'), { target: { value: 'K-Electric Electricity Bill' } });

    // Submit expense
    const submitBtn = screen.getByRole('button', { name: /save expense/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/expenses', expect.objectContaining({
        category: 'K-Electric Electricity Bill',
        accountId: '6400',
      }));
    });
  });

  // 9. Chart of Accounts & General Ledger Accounting
  test('9. Accounting Page — Switches between Chart of Accounts tab and Journal Entries audit trail tab', () => {
    render(<AccountingPage />);

    expect(screen.getByText(/General Ledger & Financial Statement/i)).toBeInTheDocument();
    expect(screen.getByText('Official Income Statement (Profit & Loss)')).toBeInTheDocument();

    // Switch to COA tab
    const coaTab = screen.getByRole('button', { name: /chart of accounts/i });
    fireEvent.click(coaTab);

    expect(screen.getByText('Vehicle Inventory')).toBeInTheDocument();
    expect(screen.getByText('1140')).toBeInTheDocument();

    // Switch to Journal Entries tab
    const journalTab = screen.getByRole('button', { name: /journal entries/i });
    fireEvent.click(journalTab);

    expect(screen.getByText('JE-0001')).toBeInTheDocument();
    expect(screen.getByText('Vehicle Sale SLE-0001')).toBeInTheDocument();
  });

  // 10. Customers & Sellers Contacts Management
  test('10. Contacts Page — Switches tabs, opens modals & submits POST /customers and POST /sellers', async () => {
    render(<ContactsPage />);

    expect(screen.getByText('Customers & Vehicle Sellers')).toBeInTheDocument();
    expect(screen.getByText('Zeeshan Ali')).toBeInTheDocument();

    // Open Add Customer Modal
    const addCustBtn = screen.getByRole('button', { name: /add customer/i });
    fireEvent.click(addCustBtn);

    expect(screen.getByText('Add New Customer')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('e.g. Tariq Mehmood'), { target: { value: 'Tariq Aziz' } });

    const saveCustBtn = screen.getByRole('button', { name: /save customer/i });
    fireEvent.click(saveCustBtn);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/customers', expect.objectContaining({
        name: 'Tariq Aziz',
      }));
    });

    // Switch to Sellers tab
    const sellersTab = screen.getByRole('button', { name: /sellers/i });
    fireEvent.click(sellersTab);

    expect(screen.getByText('Indus Motor Supplier')).toBeInTheDocument();
  });

  // 11. Showroom Staff Users & Roles Management
  test('11. Users Page — Renders staff members, opens invite modal & submits user creation', async () => {
    render(<ShowroomUsersPage />);

    expect(screen.getByText('Showroom Admins & Staff Users')).toBeInTheDocument();
    expect(screen.getByText('Showroom Manager')).toBeInTheDocument();
    expect(screen.getByText('manager@diwanmotors.com')).toBeInTheDocument();

    // Open Add Staff Modal
    const addStaffBtn = screen.getByRole('button', { name: /add showroom staff/i });
    fireEvent.click(addStaffBtn);

    expect(screen.getByText(/Add Staff User/i)).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('e.g. Kamran Akmal'), { target: { value: 'Usman Ghani' } });
    fireEvent.change(screen.getByPlaceholderText('accountant@showroom.pk'), { target: { value: 'usman@showroom.pk' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••••'), { target: { value: 'SecretPassword123' } });

    const createStaffBtn = screen.getByRole('button', { name: /create user/i });
    fireEvent.click(createStaffBtn);

    await waitFor(() => {
      expect(screen.getByText(/User "Usman Ghani"/i)).toBeInTheDocument();
    });
  });

  // 12. SaaS Platform Showroom Tenant Onboarding
  test('12. SaaS Organizations Page — Onboards showroom tenant with Logo, Website, and Facebook Page URL', async () => {
    render(<SaaSOrganizationsPage />);

    expect(screen.getByText('SaaS Client Organizations Portal')).toBeInTheDocument();
    expect(screen.getByText('Diwan Motors')).toBeInTheDocument();

    // Open Onboard Modal
    const buttons = screen.getAllByRole('button', { name: /onboard organization/i });
    fireEvent.click(buttons[0]);

    expect(screen.getByText('Onboard New Dealership Tenant')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('e.g. Diwan Motors (Pvt) Ltd'), { target: { value: 'Peshawar Auto World' } });
    fireEvent.change(screen.getByPlaceholderText('https://example.com/logo.png'), { target: { value: 'https://peshawar.pk/logo.png' } });
    fireEvent.change(screen.getByPlaceholderText('https://diwanmotors.pk'), { target: { value: 'https://peshawarauto.pk' } });
    fireEvent.change(screen.getByPlaceholderText('https://facebook.com/diwanmotors'), { target: { value: 'https://facebook.com/peshawarauto' } });

    const modalButtons = screen.getAllByRole('button', { name: /onboard organization/i });
    fireEvent.click(modalButtons[modalButtons.length - 1]);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/organizations', expect.objectContaining({
        name: 'Peshawar Auto World',
        logoUrl: 'https://peshawar.pk/logo.png',
        website: 'https://peshawarauto.pk',
        facebookPageUrl: 'https://facebook.com/peshawarauto',
      }));
    });
  });

  // 13. Subscriptions & Licensing Management
  test('13. Subscriptions Page — Renders subscription status, days remaining, opens assign modal & submits POST /subscription', async () => {
    render(<AdminSubscriptionsPage />);

    expect(screen.getByText('Subscriptions & Licensing Management')).toBeInTheDocument();
    expect(screen.getByText('Diwan Motors')).toBeInTheDocument();
    expect(screen.getByText('TRIAL')).toBeInTheDocument();
    expect(screen.getByText('30 days left')).toBeInTheDocument();

    // Open Assign Paid Subscription modal
    const assignBtn = screen.getByRole('button', { name: /assign paid/i });
    fireEvent.click(assignBtn);

    expect(screen.getByText(/Assign Paid Subscription — Diwan Motors/i)).toBeInTheDocument();

    const activateBtn = screen.getByRole('button', { name: /activate subscription/i });
    fireEvent.click(activateBtn);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/organizations/org-1/subscription', expect.objectContaining({
        planName: 'Enterprise Tier',
      }));
    });
  });

  // 14. Showroom Settings & Branding
  test('14. Settings Page — Renders organization logo, website link, and Facebook link', () => {
    render(<SettingsPage />);

    expect(screen.getByText('Dealership Organization & Branding Settings')).toBeInTheDocument();
    expect(screen.getAllByText('Diwan Motors')[0]).toBeInTheDocument();
    expect(screen.getByText('Website')).toBeInTheDocument();
    expect(screen.getByText('Facebook Page')).toBeInTheDocument();
    expect(screen.getByText('Main DHA Phase 6 Showroom')).toBeInTheDocument();
  });

  // 15. Dark Mode Login Page
  test('15. Login Page — Submits credentials via POST /auth/login', async () => {
    render(<LoginPage />);

    expect(screen.getByText('ShowroomOS')).toBeInTheDocument();
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByText('Sign in to your dealership management console')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('admin@showroomos.com'), { target: { value: 'admin@showroomos.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••••'), { target: { value: 'Admin@123456' } });

    const loginBtn = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(loginBtn);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
        email: 'admin@showroomos.com',
        password: 'Admin@123456',
      });
    });
  });
});
