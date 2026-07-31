# ShowroomOS Dashboard

A multi-tenant Dealership Management System (DMS) web application built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, and **SWR**.

---

## 🚀 Features & Modules

- 📊 **Dashboard Overview**: Key Performance Indicators (KPIs), sales analytics, revenue trends, and operational activity summaries.
- 🚗 **Vehicle Management**: Inventory tracking, vehicle details, statuses, specs, and stock filtering.
- 🤝 **Sales Management**: Deal flow tracking, sales transactions, customer assignment, and revenue generation.
- 🛒 **Purchases Management**: Vehicle acquisition records, vendor tracking, and procurement costs.
- 📑 **Accounting & Ledger**: Financial overview, General Ledger entries, chart of accounts, and financial reports.
- 💳 **Payments**: Track inbound customer payments and outbound vendor transactions.
- 🧾 **Expenses**: Operating expenses, reconditioning costs, and overhead expense tracking.
- 👥 **Contacts Directory**: Centralized directory for dealership customers, vendors, and leads.
- 🔐 **User Management**: Role-Based Access Control (RBAC), team permissions, and staff onboarding.
- ⚙️ **Admin Console**: SuperAdmin tenant organization management, multi-tenancy controls, and subscription management.
- 🛠️ **Settings**: Organization preferences, dealership details, and portal configurations.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Data Fetching**: [SWR](https://swr.vercel.app/) & [Axios](https://axios-http.com/)
- **Testing**: [Jest](https://jestjs.io/) & [React Testing Library](https://testing-library.com/react)

---

## 📦 Getting Started

### Prerequisites

Ensure you have Node.js (v18+) and npm installed on your machine.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ShowroomApps/dashboard.git
   cd dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` (or create `.env.local`):
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3002](http://localhost:3002) in your browser to view the application.

---

## 🧪 Running Tests

To run the test suite:
```bash
npm test
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (dashboard)/       # Authenticated dashboard routes (vehicles, sales, admin, etc.)
│   ├── login/             # Authentication page
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Entry redirect / landing
├── components/
│   ├── layout/            # Sidebar, TopBar, Header layouts
│   └── ui/                # Reusable UI components (Button, Modal, DataTable, KPICard, etc.)
├── lib/
│   ├── api.ts             # Axios API instance & interceptors
│   ├── auth-context.tsx   # Auth context provider
│   ├── format.ts          # Utility formatters (currency, dates, badges)
│   ├── toast-context.tsx  # Global notification toasts
│   └── use-swr-hooks.ts   # Custom SWR hooks for data fetching
└── styles/
    └── globals.css        # Tailwind & global stylesheet
```

---

## 📄 License

This project is proprietary and confidential to **ShowroomApps**.
