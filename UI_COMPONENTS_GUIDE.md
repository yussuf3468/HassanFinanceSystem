# UI Components Enhancement Guide

## Overview

The Horumar eCommerce platform now includes a comprehensive set of modern UI components to enhance user experience.

## New UI Components

### 1. **Dialog** (`src/components/ecommerce/Dialog.tsx`)

Modal dialog component for displaying content in an overlay.

**Usage:**

```tsx
import Dialog from "./ecommerce/Dialog";

<Dialog
  isOpen={isOpen}
  onClose={onClose}
  title="Dialog Title"
  size="lg" // 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton={true}
>
  {/* Dialog content */}
</Dialog>;
```

**Features:**

- Responsive sizes (sm to full)
- Backdrop click to close
- ESC key support
- Prevents body scroll when open
- Smooth animations

---

### 2. **Drawer** (`src/components/ecommerce/Drawer.tsx`)

Side panel component for navigation or content 
.

**Usage:**

```tsx
import Drawer from "./ecommerce/Drawer";

<Drawer
  isOpen={isOpen}
  onClose={onClose}
  title="Shopping Cart"
  position="right" // 'left' | 'right'
  size="md" // 'sm' | 'md' | 'lg'
>
  {/* Drawer content */}
</Drawer>;
```

**Features:**

- Slide-in animations
- Left or right positioning
- Responsive widths
- Header with title and close button

---

### 3. **Tooltip** (`src/components/ecommerce/Tooltip.tsx`)

Contextual information on hover.

**Usage:**

```tsx
import Tooltip from "./ecommerce/Tooltip";

<Tooltip content="Helpful text" position="top">
  <button>Hover me</button>
</Tooltip>;
```

**Features:**

- 4 positions (top, bottom, left, right)
- Customizable delay
- Arrow indicator
- Smooth fade-in animation

---

### 4. **Avatar** (`src/components/ecommerce/Avatar.tsx`)

User profile image component.

**Usage:**

```tsx
import Avatar from "./ecommerce/Avatar";

<Avatar
  src={imageUrl}
  alt="User Name"
  size="md" // 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  fallback="JD" // Initials fallback
  status="online" // 'online' | 'offline' | 'busy'
/>;
```

**Features:**

- Multiple sizes
- Fallback to initials or icon
- Status indicator
- Gradient background

---

### 5. **Alert** (`src/components/ecommerce/Alert.tsx`)

Notification and alert messages.

**Usage:**

```tsx
import Alert from "./ecommerce/Alert";

<Alert
  variant="info" // 'info' | 'success' | 'warning' | 'error'
  title="Alert Title"
  onClose={() => {}}
>
  Alert message content
</Alert>;
```

**Features:**

- 4 semantic variants
- Optional title and icon
- Closeable with callback
- Themed colors

---

### 6. **Spinner** (`src/components/ecommerce/Spinner.tsx`)

Loading indicator component.

**Usage:**

```tsx
import Spinner from "./ecommerce/Spinner";

<Spinner
  size="md" // 'sm' | 'md' | 'lg' | 'xl'
  color="primary" // 'primary' | 'white' | 'slate'
  text="Loading..."
  fullScreen={false}
/>;
```

**Features:**

- Multiple sizes and colors
- Optional loading text
- Full-screen mode
- Smooth rotation animation

---

### 7. **Breadcrumbs** (`src/components/ecommerce/Breadcrumbs.tsx`)

Navigation breadcrumb trail.

**Usage:**

```tsx
import Breadcrumbs from "./ecommerce/Breadcrumbs";

<Breadcrumbs
  items={[
    { label: "Home", onClick: () => navigate("/") },
    { label: "Products", onClick: () => navigate("/products") },
    { label: "Details" },
  ]}
  showHome={true}
/>;
```

**Features:**

- Home icon option
- Click handlers
- Active state styling
- Chevron separators

---

### 8. **Tabs** (`src/components/ecommerce/Tabs.tsx`)

Tabbed content organizer.

**Usage:**

```tsx
import Tabs, { Tab } from "./ecommerce/Tabs";

const tabs: Tab[] = [
  {
    id: "tab1",
    label: "Details",
    icon: <Icon />,
    content: <div>Tab 1 content</div>,
    badge: 5, // Optional badge
  },
  // ... more tabs
];

<Tabs
  tabs={tabs}
  activeTab={activeTab}
  onChange={setActiveTab}
  variant="default" // 'default' | 'pills' | 'underline'
/>;
```

**Features:**

- 3 visual variants
- Optional icons and badges
- Controlled component
- Smooth transitions

---

## Enhanced Components

### **CartSidebar**

Now uses the Drawer component with improved UI:

- Clean product cards
- Tooltip-enhanced quantity controls
- Badge for cart total
- Alert for free shipping info
- Better loading states

### **ProductQuickView**

Upgraded to use Dialog with enhanced features:

- Tabbed additional information (Details, Shipping, Returns)
- Tooltip on action buttons
- Badge system for product status
- Alert for stock notifications
- Improved image zoom

### **CheckoutModal**

Modernized with Dialog component:

- Step-by-step form layout
- Icon-enhanced input fields
- Payment method selection grid
- Order summary with badges
- Secure checkout alert
- Loading states with Spinner

---

## Setting Up Featured Products

### Database Setup

**1. Run the SQL Migration:**

```bash
# In Supabase SQL Editor, run:
cat SUPABASE_PATCH_add_published_featured.sql
```

Or manually execute:

```sql
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;

-- Mark some products as featured
UPDATE public.products
SET featured = true
WHERE id IN (SELECT id FROM public.products LIMIT 4);
```

**2. Mark Products as Featured:**

- Via Supabase Dashboard: Edit product rows and set `featured = true`
- Via Admin Panel: Add a toggle in your product management interface
- Via SQL: `UPDATE products SET featured = true WHERE id = 'product-id';`

### Frontend Display

Featured products automatically appear in:

- **Hero Section**: Rotates through featured items
- **Featured Products Section**: Shows up to 8 featured products
- **Product Cards**: Display a "Featured" badge

---

## Animation System

All new components use consistent animations defined in `tailwind.config.js`:

```javascript
{
  animation: {
    'fade-in': 'fadeIn 0.2s ease-in-out',
    'scale-in': 'scaleIn 0.2s ease-in-out',
    'slide-in-right': 'slideInRight 0.3s ease-out',
    'slide-in-left': 'slideInLeft 0.3s ease-out',
  }
}
```

---

## Best Practices

1. **Use semantic variants**: Choose Alert/Badge variants that match the message type
2. **Tooltip placement**: Position tooltips to avoid covering important UI
3. **Dialog sizes**: Use appropriate sizes to avoid overwhelming content
4. **Loading states**: Always show Spinner during async operations
5. **Accessibility**: All components support keyboard navigation and screen readers

---

## Component Composition

Example of combining multiple UI components:

```tsx
<Dialog isOpen={isOpen} onClose={onClose} title="Product Details">
  <div className="p-6">
    <Breadcrumbs items={breadcrumbItems} />

    <Alert variant="warning" title="Limited Stock">
      Only 3 items remaining in stock
    </Alert>

    <Tabs tabs={productTabs} activeTab={activeTab} onChange={setActiveTab} />

    <div className="flex gap-2">
      <Tooltip content="Save for later">
        <button className="...">
          <Heart />
        </button>
      </Tooltip>

      <Button variant="primary" isLoading={isAdding}>
        <ShoppingCart className="w-4 h-4" />
        Add to Cart
      </Button>
    </div>

    {isLoading && <Spinner fullScreen text="Loading details..." />}
  </div>
</Dialog>
```

---

## Troubleshooting

**Featured Products Not Showing?**

1. Verify `featured` column exists: `SELECT featured FROM products LIMIT 1;`
2. Check if any products are marked: `SELECT COUNT(*) FROM products WHERE featured = true;`
3. Ensure frontend filters correctly: `products.filter(p => p.featured)`

**Components Not Rendering?**

1. Check imports are correct
2. Verify Tailwind config includes animations
3. Clear build cache: `npm run build`

---

## Migration Checklist

- [x] Install new UI components
- [x] Update Tailwind configuration with animations
- [x] Migrate CartSidebar to use Drawer
- [x] Upgrade ProductQuickView with Dialog
- [x] Enhance CheckoutModal with new components
- [ ] Run featured products SQL migration
- [ ] Mark products as featured in database
- [ ] Test all components in browser
- [ ] Verify mobile responsiveness

---

## Next Steps

1. Run the featured products SQL migration (if not done)
2. Mark 4-8 products as featured in your database
3. Test the checkout flow with new components
4. Customize colors/styling to match branding
5. Add unit tests for new components
