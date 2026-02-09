# UI Components Library Documentation

## 📦 Complete Component Inventory

---

## 🎨 DESIGN SYSTEM

### Color Palette
- **Primary**: Main brand color (Blue)
- **Secondary**: Accent color
- **Muted**: Subtle backgrounds
- **Destructive**: Error/danger states
- **Success**: Success states (Green)
- **Warning**: Warning states (Yellow)

### Typography
- **Font Family**: System fonts, Inter
- **Sizes**: xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl
- **Weights**: normal, medium, semibold, bold

### Spacing
- **Scale**: 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64

---

## 🧩 BASE UI COMPONENTS

### 1. **Button** (`button.tsx`)
```typescript
Variants: default, destructive, outline, secondary, ghost, link
Sizes: default, sm, lg, icon
Features:
- Loading state
- Disabled state
- Icon support
- Full width option
```

### 2. **Input** (`input.tsx`)
```typescript
Types: text, email, password, number, tel, url, search
Features:
- Placeholder
- Disabled state
- Error state
- Icon prefix/suffix
- Auto-complete
```

### 3. **Textarea** (`textarea.tsx`)
```typescript
Features:
- Resizable
- Row count
- Character limit
- Auto-grow
```

### 4. **Select** (`select.tsx`)
```typescript
Features:
- Single/Multi select
- Search functionality
- Custom options
- Grouped options
- Disabled options
```

### 5. **Checkbox** (`checkbox.tsx`)
```typescript
States: checked, unchecked, indeterminate
Features:
- Label support
- Disabled state
- Custom styling
```

### 6. **Radio Group** (`radio-group.tsx`)
```typescript
Features:
- Single selection
- Horizontal/Vertical layout
- Disabled options
- Custom styling
```

### 7. **Switch** (`switch.tsx`)
```typescript
Features:
- On/Off toggle
- Disabled state
- Label support
- Size variants
```

### 8. **Slider** (`slider.tsx`)
```typescript
Features:
- Single/Range slider
- Min/Max values
- Step increment
- Value display
```

---

## 📋 LAYOUT COMPONENTS

### 9. **Card** (`card.tsx`)
```typescript
Components:
- Card: Main container
- CardHeader: Top section
- CardTitle: Title text
- CardDescription: Subtitle
- CardContent: Main content
- CardFooter: Bottom section

Features:
- Hover effects
- Border variants
- Shadow levels
```

### 10. **Tabs** (`tabs.tsx`)
```typescript
Components:
- Tabs: Container
- TabsList: Tab buttons container
- TabsTrigger: Individual tab
- TabsContent: Tab panel

Features:
- Horizontal/Vertical
- Active state
- Disabled tabs
- Icon support
```

### 11. **Accordion** (`accordion.tsx`)
```typescript
Features:
- Single/Multiple expand
- Animated transitions
- Custom icons
- Nested accordions
```

### 12. **Separator** (`separator.tsx`)
```typescript
Orientations: horizontal, vertical
Features:
- Custom thickness
- Custom color
- Decorative option
```

### 13. **Scroll Area** (`scroll-area.tsx`)
```typescript
Features:
- Custom scrollbar
- Horizontal/Vertical
- Auto-hide scrollbar
- Smooth scrolling
```

---

## 🎭 OVERLAY COMPONENTS

### 14. **Dialog** (`dialog.tsx`)
```typescript
Components:
- Dialog: Container
- DialogTrigger: Open button
- DialogContent: Modal content
- DialogHeader: Top section
- DialogTitle: Title
- DialogDescription: Description
- DialogFooter: Bottom section

Features:
- Backdrop blur
- Close on outside click
- Escape key close
- Size variants
- Animations
```

### 15. **Sheet** (`sheet.tsx`)
```typescript
Positions: top, right, bottom, left
Features:
- Slide animations
- Backdrop
- Close button
- Custom width/height
```

### 16. **Popover** (`popover.tsx`)
```typescript
Features:
- Positioning (top, bottom, left, right)
- Auto-positioning
- Arrow indicator
- Click/Hover trigger
```

### 17. **Tooltip** (`tooltip.tsx`)
```typescript
Features:
- Positioning
- Delay options
- Custom styling
- Arrow indicator
```

### 18. **Alert Dialog** (`alert-dialog.tsx`)
```typescript
Components:
- AlertDialog
- AlertDialogTrigger
- AlertDialogContent
- AlertDialogHeader
- AlertDialogTitle
- AlertDialogDescription
- AlertDialogFooter
- AlertDialogAction
- AlertDialogCancel

Features:
- Confirmation dialogs
- Destructive actions
- Custom buttons
```

### 19. **Drawer** (`drawer.tsx`)
```typescript
Features:
- Mobile-optimized
- Swipe to close
- Snap points
- Backdrop
```

---

## 📊 DATA DISPLAY COMPONENTS

### 20. **Table** (`table.tsx`)
```typescript
Components:
- Table: Container
- TableHeader: Header row
- TableBody: Body rows
- TableFooter: Footer row
- TableRow: Single row
- TableHead: Header cell
- TableCell: Data cell
- TableCaption: Table caption

Features:
- Sortable columns
- Selectable rows
- Pagination
- Responsive
- Striped rows
```

### 21. **Badge** (`badge.tsx`)
```typescript
Variants: default, secondary, destructive, outline
Features:
- Icon support
- Removable
- Custom colors
- Size variants
```

### 22. **Avatar** (`avatar.tsx`)
```typescript
Components:
- Avatar: Container
- AvatarImage: Image
- AvatarFallback: Fallback text/icon

Features:
- Size variants
- Status indicator
- Group avatars
- Custom shapes
```

### 23. **Progress** (`progress.tsx`)
```typescript
Features:
- Percentage display
- Color variants
- Animated
- Indeterminate state
```

### 24. **Skeleton** (`skeleton.tsx`)
```typescript
Features:
- Loading placeholder
- Animated pulse
- Custom shapes
- Multiple variants
```

### 25. **Chart** (`chart.tsx`)
```typescript
Types:
- Line Chart
- Bar Chart
- Pie Chart
- Area Chart
- Donut Chart

Features:
- Responsive
- Interactive tooltips
- Legend
- Custom colors
- Animations
```

---

## 🎯 NAVIGATION COMPONENTS

### 26. **Breadcrumb** (`breadcrumb.tsx`)
```typescript
Features:
- Separator customization
- Active state
- Truncation
- Icon support
```

### 27. **Pagination** (`pagination.tsx`)
```typescript
Features:
- Page numbers
- Previous/Next
- First/Last
- Ellipsis
- Custom page size
```

### 28. **Navigation Menu** (`navigation-menu.tsx`)
```typescript
Features:
- Dropdown menus
- Mega menu
- Active state
- Icons
- Nested menus
```

### 29. **Menubar** (`menubar.tsx`)
```typescript
Features:
- Horizontal menu
- Dropdown submenus
- Keyboard navigation
- Shortcuts display
```

### 30. **Context Menu** (`context-menu.tsx`)
```typescript
Features:
- Right-click menu
- Nested items
- Separators
- Icons
- Shortcuts
```

### 31. **Dropdown Menu** (`dropdown-menu.tsx`)
```typescript
Features:
- Trigger button
- Menu items
- Separators
- Checkboxes
- Radio items
- Sub-menus
```

### 32. **Sidebar** (`sidebar.tsx`)
```typescript
Features:
- Collapsible
- Fixed/Sticky
- Icons
- Nested items
- Active state
```

---

## 📝 FORM COMPONENTS

### 33. **Form** (`form.tsx`)
```typescript
Features:
- Form validation
- Error messages
- Field labels
- Help text
- Required indicators
- Form state management
```

### 34. **Label** (`label.tsx`)
```typescript
Features:
- Associated with inputs
- Required indicator
- Custom styling
- Disabled state
```

### 35. **Calendar** (`calendar.tsx`)
```typescript
Features:
- Date picker
- Range selection
- Min/Max dates
- Disabled dates
- Multiple months
- Localization
```

### 36. **Input OTP** (`input-otp.tsx`)
```typescript
Features:
- Multiple input fields
- Auto-focus next
- Paste support
- Numeric only
- Custom length
```

### 37. **Command** (`command.tsx`)
```typescript
Features:
- Command palette
- Search functionality
- Keyboard shortcuts
- Grouped items
- Icons
```

---

## 🎨 FEEDBACK COMPONENTS

### 38. **Alert** (`alert.tsx`)
```typescript
Variants: default, destructive, success, warning
Components:
- Alert: Container
- AlertTitle: Title
- AlertDescription: Description

Features:
- Icons
- Dismissible
- Custom colors
```

### 39. **Toast** (`sonner.tsx`)
```typescript
Types: success, error, warning, info, loading
Features:
- Auto-dismiss
- Action buttons
- Position options
- Stacking
- Custom duration
```

### 40. **Hover Card** (`hover-card.tsx`)
```typescript
Features:
- Hover trigger
- Delay options
- Positioning
- Rich content
- Animations
```

---

## 🎪 ADVANCED COMPONENTS

### 41. **Carousel** (`carousel.tsx`)
```typescript
Features:
- Auto-play
- Navigation arrows
- Dots indicator
- Swipe support
- Infinite loop
- Custom transitions
```

### 42. **Collapsible** (`collapsible.tsx`)
```typescript
Features:
- Expand/Collapse
- Animated transitions
- Trigger button
- Custom content
```

### 43. **Resizable** (`resizable.tsx`)
```typescript
Features:
- Drag to resize
- Min/Max sizes
- Horizontal/Vertical
- Handle customization
```

### 44. **Toggle** (`toggle.tsx`)
```typescript
Features:
- On/Off state
- Icon support
- Size variants
- Disabled state
```

### 45. **Toggle Group** (`toggle-group.tsx`)
```typescript
Features:
- Single/Multiple selection
- Icon buttons
- Size variants
- Disabled options
```

### 46. **Aspect Ratio** (`aspect-ratio.tsx`)
```typescript
Ratios: 16/9, 4/3, 1/1, 21/9
Features:
- Responsive
- Custom ratios
- Image container
```

---

## 🏗️ CUSTOM BUSINESS COMPONENTS

### 47. **Product Card** (`ProductCard.tsx`)
```typescript
Features:
- Product image
- Title & description
- Price display (rent/buy)
- Rating stars
- Wishlist button
- Quick view
- Condition badge
- Location display
- Availability status
```

### 48. **Booking Calendar** (`BookingCalendar.tsx`)
```typescript
Features:
- Date range selection
- Blocked dates
- Price per day
- Availability indicator
- Multi-month view
- Booking summary
```

### 49. **Booking Modal** (`BookingModal.tsx`)
```typescript
Features:
- Multi-step form
- Date selection
- Delivery options
- Payment method
- Price breakdown
- Terms acceptance
- Confirmation screen
```

### 50. **Advanced Search Bar** (`AdvancedSearchBar.tsx`)
```typescript
Features:
- Text search
- Category filter
- Price range slider
- Location filter
- Condition filter
- Sort options
- Save search
- Recent searches
```

### 51. **Category Filter** (`CategoryFilter.tsx`)
```typescript
Features:
- Category icons
- Subcategories
- Active state
- Count badges
- Horizontal scroll
```

### 52. **Product Comparison** (`ProductComparison.tsx`)
```typescript
Features:
- Side-by-side view
- Feature comparison
- Price comparison
- Rating comparison
- Add/Remove products
- Export comparison
```

### 53. **Reviews & Ratings** (`ReviewsRatings.tsx`)
```typescript
Features:
- Star rating
- Review text
- User info
- Review date
- Helpful votes
- Photo reviews
- Filter by rating
- Sort options
```

### 54. **Wishlist Manager** (`WishlistManager.tsx`)
```typescript
Features:
- Product grid
- Remove items
- Share wishlist
- Move to cart
- Price alerts
- Availability alerts
```

### 55. **Wallet Management** (`WalletManagement.tsx`)
```typescript
Features:
- Balance display
- Top-up form
- Withdrawal form
- Transaction history
- Payment methods
- Auto-reload
```

### 56. **Notifications Center** (`NotificationsCenter.tsx`)
```typescript
Features:
- Notification list
- Mark as read
- Filter by type
- Delete notifications
- Real-time updates
- Notification settings
```

### 57. **Messages Page** (`MessagesPage.tsx`)
```typescript
Features:
- Conversation list
- Chat interface
- Message input
- File attachments
- Read receipts
- Typing indicator
- Search messages
```

### 58. **Seller Verification** (`SellerVerification.tsx`)
```typescript
Features:
- Document upload
- Selfie capture
- Business info form
- GPS location
- Verification status
- Resubmit option
```

### 59. **Dispute Management** (`DisputeManagement.tsx`)
```typescript
Features:
- File dispute form
- Dispute list
- Dispute chat
- Evidence upload
- Status tracking
- Resolution options
```

### 60. **Auction Marketplace** (`AuctionMarketplace.tsx`)
```typescript
Features:
- Live auctions grid
- Bid form
- Bid history
- Time remaining
- Auto-refresh
- Winning status
- Auction details
```

### 61. **Escrow Progress Tracker** (`EscrowProgressTracker.tsx`)
```typescript
Features:
- Payment status
- Delivery status
- Confirmation status
- Timeline view
- Status badges
- Action buttons
```

### 62. **Shipping Tracker** (`ShippingTracker.tsx`)
```typescript
Features:
- Tracking number
- Status timeline
- Location updates
- Estimated delivery
- Carrier info
- Contact support
```

### 63. **Support Ticket System** (`SupportTicketSystem.tsx`)
```typescript
Features:
- Create ticket
- Ticket list
- Ticket details
- Reply to ticket
- Attach files
- Status updates
- Priority levels
```

### 64. **Referral Program** (`ReferralProgram.tsx`)
```typescript
Features:
- Referral code
- Share buttons
- Referral stats
- Earnings display
- Referral history
- Reward tiers
```

### 65. **Promo Code Manager** (`PromoCodeManager.tsx`)
```typescript
Features:
- Apply promo code
- Code validation
- Discount display
- Available codes
- Code history
- Terms & conditions
```

### 66. **Activity Timeline** (`ActivityTimeline.tsx`)
```typescript
Features:
- Chronological events
- Event icons
- Event details
- Filter by type
- Date grouping
- Export timeline
```

### 67. **Seller Performance Dashboard** (`SellerPerformanceDashboard.tsx`)
```typescript
Features:
- Sales metrics
- Revenue charts
- Product performance
- Customer ratings
- Response time
- Conversion rate
- Top products
```

### 68. **Payment Analytics Dashboard** (`PaymentAnalyticsDashboard.tsx`)
```typescript
Features:
- Revenue charts
- Payment methods
- Transaction volume
- Refund rate
- Commission breakdown
- Export reports
```

### 69. **Platform Analytics Dashboard** (`PlatformAnalyticsDashboard.tsx`)
```typescript
Features:
- User growth
- Product listings
- Transaction volume
- Revenue trends
- Category distribution
- Geographic data
```

### 70. **Fraud Detection Dashboard** (`FraudDetectionDashboard.tsx`)
```typescript
Features:
- Risk scores
- Suspicious activities
- Fraud alerts
- Investigation tools
- Blacklist management
- Fraud patterns
```

### 71. **Admin User Management** (`AdminUserManagement.tsx`)
```typescript
Features:
- User list
- User details
- Ban/Suspend
- Verify users
- Role assignment
- Activity logs
- Bulk actions
```

### 72. **Admin Product Approval** (`AdminProductApproval.tsx`)
```typescript
Features:
- Pending products
- Product details
- Approve/Reject
- Rejection reasons
- Bulk approval
- Product analytics
```

### 73. **Admin Dispute Resolution** (`AdminDisputeResolution.tsx`)
```typescript
Features:
- Dispute queue
- Case details
- Evidence review
- Mediation chat
- Resolution actions
- Dispute analytics
```

### 74. **Admin Payment Management** (`AdminPaymentManagement.tsx`)
```typescript
Features:
- Transaction list
- Payment details
- Refund processing
- Payout approval
- Payment analytics
- Fraud detection
```

### 75. **Admin System Settings** (`AdminSystemSettings.tsx`)
```typescript
Features:
- General settings
- Payment settings
- Email templates
- SMS settings
- Security settings
- API configuration
```

### 76. **Categories Management** (`CategoriesManagement.tsx`)
```typescript
Features:
- Category list
- Add category
- Edit category
- Delete category
- Category hierarchy
- Icon management
```

### 77. **Subscription Plans** (`SubscriptionPlans.tsx`)
```typescript
Features:
- Plan comparison
- Feature list
- Pricing display
- Subscribe button
- Current plan
- Upgrade/Downgrade
```

### 78. **Location Selector** (`LocationSelector.tsx`)
```typescript
Features:
- Address search
- Map view
- GPS location
- Address autocomplete
- Save locations
- Recent locations
```

### 79. **Image with Fallback** (`ImageWithFallback.tsx`)
```typescript
Features:
- Lazy loading
- Fallback image
- Error handling
- Loading state
- Responsive
```

### 80. **Empty State** (`EmptyState.tsx`)
```typescript
Types: products, messages, bookings, notifications
Features:
- Custom icon
- Title & description
- Action button
- Illustration
```

---

## 🎨 COMPONENT PATTERNS

### Composition Pattern
```typescript
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>
```

### Controlled Components
```typescript
const [value, setValue] = useState('')
<Input value={value} onChange={(e) => setValue(e.target.value)} />
```

### Compound Components
```typescript
<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>
```

---

## 🎯 COMPONENT USAGE STATISTICS

- **Total Components**: 80+
- **Base UI Components**: 46
- **Business Components**: 34
- **Layout Components**: 13
- **Form Components**: 15
- **Navigation Components**: 7
- **Feedback Components**: 4
- **Data Display Components**: 8

---

## 📱 RESPONSIVE BREAKPOINTS

```typescript
sm: 640px   // Mobile
md: 768px   // Tablet
lg: 1024px  // Desktop
xl: 1280px  // Large Desktop
2xl: 1536px // Extra Large
```

---

## 🎨 THEMING

### Light Mode
- Background: White
- Foreground: Dark Gray
- Primary: Blue
- Secondary: Light Blue

### Dark Mode
- Background: Dark Gray
- Foreground: White
- Primary: Light Blue
- Secondary: Dark Blue

---

## ♿ ACCESSIBILITY

All components include:
- ARIA labels
- Keyboard navigation
- Focus indicators
- Screen reader support
- Color contrast compliance
- Semantic HTML

---

## 🚀 PERFORMANCE

- **Lazy Loading**: Components loaded on demand
- **Code Splitting**: Separate bundles
- **Tree Shaking**: Remove unused code
- **Memoization**: Prevent unnecessary re-renders
- **Virtual Scrolling**: Large lists optimization

---

## 📚 COMPONENT LIBRARY

**Framework**: React + TypeScript
**Styling**: Tailwind CSS
**Icons**: Lucide React
**Animations**: Framer Motion
**Forms**: React Hook Form
**Validation**: Zod
**Charts**: Recharts
**Date**: date-fns
