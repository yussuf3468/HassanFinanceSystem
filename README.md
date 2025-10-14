# Hassan Financial System 💼

A comprehensive financial management system for Hassan Muse BookShop with a modern dark glassmorphic UI.

## ✨ Features

### 📊 Core Functionality

- **Inventory Management** - Track products, stock levels, and reorder alerts
- **Sales Management** - Process sales, manage orders, and track revenue
- **Financial Tracking**
  - Initial Investment tracking
  - Debt Management with payment schedules
  - Expense Management and categorization
  - Comprehensive financial reports
- **Customer Portal** - Modern e-commerce interface for customers
- **Order Management** - Track orders from placement to delivery
- **User Authentication** - Secure login and role-based access

### 🎨 Modern Dark Glassmorphic UI

- Beautiful dark theme with glassmorphic effects
- Smooth animations and transitions
- Responsive design for all devices
- Component-specific color theming:
  - Emerald/Green for investments
  - Red/Rose for debts
  - Purple/Blue for general UI
- Backdrop blur and translucent panels
- Gradient accents and hover effects

## 🚀 Tech Stack

- **Frontend:** React 18 + TypeScript
- **Styling:** Tailwind CSS 3
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Build Tool:** Vite
- **Icons:** Lucide React
- **State Management:** React Context API

## 📦 Installation

1. Clone the repository:

```bash
git clone https://github.com/yussuf3468/HassanFinanceSystem.git
cd HassanFinanceSystem/bookStore
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
   Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up the database:

- Run the SQL scripts in order:
  1. `SUPABASE_FULL_BOOTSTRAP.sql` - Main database schema
  2. `SUPABASE_FINANCIALS.sql` - Financial tables
  3. `SUPABASE_PATCH_*.sql` - Any patches as needed

5. Start the development server:

```bash
npm run dev
```

## 🏗️ Project Structure

```
bookStore/
├── src/
│   ├── components/           # React components
│   │   ├── Dashboard.tsx     # Main dashboard
│   │   ├── Inventory.tsx     # Product management
│   │   ├── Sales.tsx         # Sales tracking
│   │   ├── InitialInvestment.tsx  # Investment tracking
│   │   ├── DebtManagement.tsx     # Debt tracking
│   │   ├── ExpenseManagement.tsx  # Expense tracking
│   │   ├── CustomerStoreNew.tsx   # Customer interface
│   │   └── ...
│   ├── contexts/            # React contexts
│   ├── lib/                 # Utilities and configs
│   ├── types/               # TypeScript types
│   └── styles/              # Style utilities
├── public/                  # Static assets
└── SQL scripts/             # Database setup scripts
```

## 📱 Key Components

### Admin Dashboard

- **StatCards** - Real-time financial metrics
- **Reports** - Comprehensive financial reports
- **User Activity** - Track system usage

### Inventory Management

- Product CRUD operations
- Image upload and management
- Stock level alerts
- Category management
- Detailed product view modal

### Financial Management

- **Initial Investment** - Track startup capital and sources
- **Debt Management** - Monitor loans and repayment schedules
- **Expense Management** - Categorize and track business expenses
- Real-time financial analytics

### Customer Store

- Beautiful product showcase
- Advanced search with suggestions
- Shopping cart with glassmorphic design
- Checkout with delivery address selector
- Order tracking

## 🎨 Design System

### Colors

- **Background:** Dark gradient (`from-slate-900 via-purple-900 to-slate-900`)
- **Glass Panels:** `bg-white/10 backdrop-blur-xl border-white/20`
- **Text Hierarchy:**
  - Primary: `text-white`
  - Secondary: `text-slate-300`
  - Tertiary: `text-slate-400`
- **Accents:**
  - Investment: Emerald/Green
  - Debts: Red/Rose
  - General: Purple/Blue

### Components

- Glassmorphic cards with backdrop blur
- Gradient buttons and badges
- Smooth hover transitions
- Responsive layouts

## 🔐 Security

- Row Level Security (RLS) policies on all tables
- Secure authentication with Supabase Auth
- Role-based access control
- Protected admin routes

## 📈 Future Enhancements

- [ ] Mobile apps (iOS/Android)
- [ ] Advanced analytics and AI insights
- [ ] Barcode scanning for inventory
- [ ] Email notifications
- [ ] Multi-language support (Somali/English)
- [ ] PDF report generation
- [ ] Integration with payment gateways

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is private and proprietary to Hassan Muse BookShop.

## 👨‍💻 Developer

Created by Yussuf

- GitHub: [@yussuf3468](https://github.com/yussuf3468)

## 🙏 Acknowledgments

- Built with React and TypeScript
- Styled with Tailwind CSS
- Powered by Supabase
- Icons by Lucide

---

**Hassan Financial System** - Modern, Beautiful, and Powerful Financial Management 💼✨
