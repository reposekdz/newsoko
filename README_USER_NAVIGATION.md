# User Navigation Guide - All Roles

## 🎯 BUYER/RENTER NAVIGATION

### Main Navigation Menu
```
┌─────────────────────────────────────────────┐
│ [Logo] [Search]  [Home][Explore][Messages]  │
│                  [Bookings][Wallet][Profile] │
└─────────────────────────────────────────────┘
```

### 1. HOME PAGE - Starting Point
**URL**: `/`
**What Buyer Sees**:
- Search bar at top
- Rent/Buy toggle switch
- Category icons (horizontal scroll)
- Product grid (Featured, Trending, All)
- Stats (Total Products, Users, Rating)

**Actions Available**:
- Switch between Rent/Buy mode
- Search products
- Filter by category
- Click product card → View details
- Add to wishlist (heart icon)

---

### 2. PRODUCT DETAILS PAGE
**URL**: `/product/:id`
**Navigation**: Click any product card

**What Buyer Sees**:
```
┌─────────────────────────────────────┐
│ [← Back]           [❤️ Save][Share] │
├─────────────────────────────────────┤
│ [Image Gallery]                     │
│ Product Title                       │
│ ⭐ 4.8 (120 reviews)                │
│ 📍 Location                         │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ 50,000 RWF/day              │   │
│ │ [📅 Book Now / 🛒 Buy Now]  │   │
│ └─────────────────────────────┘   │
│                                     │
│ [Message Seller]                    │
│ Seller Info                         │
│ [Description][Features][Reviews]    │
└─────────────────────────────────────┘
```

**Actions Available**:
- View image gallery
- Read description/features
- Check reviews
- Message seller
- Click "Book Now" → Booking flow
- Add to wishlist
- Share product

---

### 3. BOOKING FLOW (4 Steps)
**URL**: `/booking/:productId`
**Navigation**: Click "Book Now" button

**Step 1 - Date Selection** (Rent only):
- Calendar to select dates
- Shows total days
- Price calculation
- [Continue] button

**Step 2 - Delivery**:
- Choose Pickup (Free) or Delivery (5,000 RWF)
- Enter delivery address if needed
- Add notes
- [Back][Continue] buttons

**Step 3 - Payment**:
- Select payment method (MTN/Airtel/Wallet)
- Enter phone number
- View price breakdown
- [Back][Pay Now] buttons

**Step 4 - Confirmation**:
- Success message
- Booking ID
- [View Booking][Done] buttons

---

### 4. MY BOOKINGS PAGE
**URL**: `/bookings`
**Navigation**: Top menu → "Bookings"

**What Buyer Sees**:
```
┌─────────────────────────────────────┐
│ My Bookings                         │
├─────────────────────────────────────┤
│ [All][Pending][Confirmed][Completed]│
│                                     │
│ ┌─────────────────────────────────┐│
│ │ [Product Image]                 ││
│ │ Product Title                   ││
│ │ Booking ID: #123                ││
│ │ Status: Confirmed               ││
│ │ Amount: 250,000 RWF             ││
│ │ [View Details][Cancel]          ││
│ └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

**Actions Available**:
- Filter by status tabs
- View booking details
- Cancel booking (if pending/confirmed)
- Complete booking
- Leave review (if completed)
- File dispute

---

### 5. MESSAGES PAGE
**URL**: `/messages`
**Navigation**: Top menu → "Messages"

**What Buyer Sees**:
```
┌──────────────┬──────────────────────┐
│ Conversations│ Chat Window          │
│              │                      │
│ [Search]     │ [Seller Name]        │
│              │                      │
│ ● John Doe   │ Message bubbles...   │
│   Last msg   │                      │
│              │                      │
│   Jane Smith │ [Type message...]    │
│   Last msg   │ [Send]               │
└──────────────┴──────────────────────┘
```

**Actions Available**:
- Search conversations
- Select conversation
- Send messages
- View message history
- Attach files

---

### 6. WALLET PAGE
**URL**: `/wallet`
**Navigation**: Top menu → "Wallet"

**What Buyer Sees**:
```
┌─────────────────────────────────────┐
│ Available Balance                   │
│ 450,000 RWF                         │
│                                     │
│ [Top Up] [Withdraw]                 │
├─────────────────────────────────────┤
│ Transaction History                 │
│ ↑ +50,000 RWF - Booking refund     │
│ ↓ -250,000 RWF - Booking payment   │
└─────────────────────────────────────┘
```

**Actions Available**:
- Top up wallet (MTN/Airtel)
- Withdraw funds
- View transaction history

---

### 7. PROFILE PAGE
**URL**: `/profile`
**Navigation**: Top menu → Profile icon

**What Buyer Sees**:
- Profile photo and info
- Stats (Bookings, Reviews, Wishlist)
- [My Rentals][My Listings][Wallet] tabs
- Edit profile button
- Settings button

**Actions Available**:
- Edit profile
- View booking history
- Manage wishlist
- Change settings
- Logout

---

### 8. DASHBOARD PAGE
**URL**: `/dashboard`
**Navigation**: Top menu → "Dashboard"

**Tabs Available**:
- Notifications
- Wallet
- Wishlist
- Support
- Analytics
- Reviews
- Disputes
- Referrals
- Promo Codes
- Saved Searches
- Activity Timeline

---

## 🏪 SELLER NAVIGATION

### Main Navigation Menu
```
┌─────────────────────────────────────────────┐
│ [Logo] [Search]  [Home][My Products][Orders]│
│                  [Messages][Analytics][Menu] │
└─────────────────────────────────────────────┘
```

### 1. SELLER VERIFICATION (First Time)
**URL**: `/seller-verification`
**Navigation**: Click "Become Seller"

**What Seller Sees**:
```
┌─────────────────────────────────────┐
│ Become a Verified Seller            │
├─────────────────────────────────────┤
│ Document Type: [Dropdown]           │
│ Document Number: [Input]            │
│ Upload Document: [File]             │
│ Selfie with ID: [Camera/File]       │
│ Business Name: [Input]              │
│ Business Address: [Textarea]        │
│ [📍 Get GPS Location]               │
│                                     │
│ [Submit Verification]               │
└─────────────────────────────────────┘
```

**Steps**:
1. Select document type
2. Enter document number
3. Upload document photo
4. Take selfie with document
5. Enter business details (optional)
6. Capture GPS location
7. Submit → Wait 24-48h for approval

---

### 2. ADD LISTING PAGE
**URL**: `/add-listing`
**Navigation**: Seller menu → "Add Listing"

**3-Step Process**:

**Step 1 - Images**:
```
┌─────────────────────────────────────┐
│ Upload Product Images               │
│ [■■□] Progress                      │
├─────────────────────────────────────┤
│ [Image] [Image] [Image] [+Upload]   │
│ Minimum 3 images required           │
│                                     │
│ [Continue]                          │
└─────────────────────────────────────┘
```

**Step 2 - Details**:
```
┌─────────────────────────────────────┐
│ Product Details                     │
│ [■■■□] Progress                     │
├─────────────────────────────────────┤
│ Title: [Input]                      │
│ Description: [Textarea]             │
│ Category: [Dropdown]                │
│ Condition: [Dropdown]               │
│ Features: [Input]                   │
│                                     │
│ [Back] [Continue]                   │
└─────────────────────────────────────┘
```

**Step 3 - Pricing**:
```
┌─────────────────────────────────────┐
│ Pricing & Location                  │
│ [■■■■] Progress                     │
├─────────────────────────────────────┤
│ Location: [Input]                   │
│ Rent Price/day: [Input] RWF        │
│ Buy Price: [Input] RWF (optional)   │
│ Security Deposit: [Input] RWF       │
│                                     │
│ ℹ️ 10% commission on rentals        │
│                                     │
│ [Back] [Submit]                     │
└─────────────────────────────────────┘
```

---

### 3. SELLER ORDER MANAGEMENT
**URL**: `/seller/orders`
**Navigation**: Top menu → "Orders"

**What Seller Sees**:
```
┌─────────────────────────────────────┐
│ Order Management                    │
├─────────────────────────────────────┤
│ Stats: [12 Pending][8 Active]       │
│       [25 Completed][450K Revenue]  │
├─────────────────────────────────────┤
│ [Active][Pending][Completed]        │
│                                     │
│ ┌─────────────────────────────────┐│
│ │ Order #123 - Pending            ││
│ │ Product: Toyota RAV4            ││
│ │ Customer: Jane Doe              ││
│ │ Amount: 250,000 RWF             ││
│ │ Commission: -25,000 RWF         ││
│ │ Your Payout: 225,000 RWF        ││
│ │ [Approve] [Reject]              ││
│ └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

**Actions Available**:
- View orders by status
- Approve/Reject pending orders
- Confirm delivery (releases escrow)
- View order details
- Message customer
- Track payment status

---

### 4. SELLER PERFORMANCE DASHBOARD
**URL**: `/seller/performance`
**Navigation**: Menu → "Analytics"

**What Seller Sees**:
- Revenue charts (daily/weekly/monthly)
- Product performance metrics
- Customer ratings
- Response time
- Conversion rate
- Top products
- Sales trends

---

### 5. MY PRODUCTS PAGE
**URL**: `/seller/products`
**Navigation**: Top menu → "My Products"

**What Seller Sees**:
```
┌─────────────────────────────────────┐
│ My Products                         │
│ [+ Add New Product]                 │
├─────────────────────────────────────┤
│ [All][Active][Pending][Inactive]    │
│                                     │
│ ┌─────────────────────────────────┐│
│ │ [Image] Toyota RAV4             ││
│ │ Status: Active                  ││
│ │ Price: 50,000 RWF/day           ││
│ │ Views: 245 | Bookings: 12       ││
│ │ [Edit][Delete][View Stats]      ││
│ └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

**Actions Available**:
- Add new product
- Edit product
- Delete product
- View product stats
- Toggle availability
- View bookings for product

---

## 👨💼 ADMIN NAVIGATION

### Main Navigation Menu
```
┌─────────────────────────────────────────────┐
│ [Logo] 🛡️ ADMIN PANEL                       │
│ [Dashboard][Users][Products][Payments]      │
│ [Disputes][Reports][Settings]               │
└─────────────────────────────────────────────┘
```

### 1. ADMIN DASHBOARD
**URL**: `/admin/dashboard`
**Navigation**: Default admin landing page

**What Admin Sees**:
```
┌─────────────────────────────────────┐
│ Admin Dashboard                     │
├─────────────────────────────────────┤
│ [1,200 Users][850 Products]         │
│ [45 Pending][25M Revenue]           │
├─────────────────────────────────────┤
│ [Users][Products][Roles][Categories]│
│ [Logs]                              │
│                                     │
│ Recent Activity:                    │
│ • User registered                   │
│ • Product approved                  │
│ • Payment processed                 │
└─────────────────────────────────────┘
```

**Quick Stats**:
- Total users
- Total products
- Pending approvals
- Total revenue
- Active disputes

---

### 2. USER MANAGEMENT
**URL**: `/admin/users`
**Navigation**: Admin menu → "Users"

**What Admin Sees**:
```
┌─────────────────────────────────────┐
│ User Management                     │
│ [Search users...]                   │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐│
│ │ 👤 John Doe                     ││
│ │ john@email.com                  ││
│ │ Role: Seller | Status: Active   ││
│ │ [Verify][Ban][Assign Role][View]││
│ └─────────────────────────────────┘│
│                                     │
│ ┌─────────────────────────────────┐│
│ │ 👤 Jane Smith                   ││
│ │ jane@email.com                  ││
│ │ Role: Buyer | Status: Active    ││
│ │ [Verify][Ban][Assign Role][View]││
│ └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

**Actions Available**:
- Search users
- View user details
- Verify users
- Ban/Suspend users
- Assign roles
- View user activity
- Delete users

---

### 3. PRODUCT APPROVAL
**URL**: `/admin/products/pending`
**Navigation**: Admin menu → "Products"

**What Admin Sees**:
```
┌─────────────────────────────────────┐
│ Product Approval Queue              │
│ 45 products pending approval        │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐│
│ │ [Images] Toyota RAV4            ││
│ │ Seller: John Doe                ││
│ │ Category: Vehicles              ││
│ │ Rent: 50,000 RWF/day            ││
│ │ Buy: 2,500,000 RWF              ││
│ │                                 ││
│ │ [View Full Details]             ││
│ │ [✓ Approve][✗ Reject][Delete]  ││
│ └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

**Actions Available**:
- Review product details
- View images
- Check pricing
- Approve product
- Reject with reason
- Delete product
- Bulk approve/reject

---

### 4. PAYMENT MANAGEMENT
**URL**: `/admin/payments`
**Navigation**: Admin menu → "Payments"

**What Admin Sees**:
```
┌─────────────────────────────────────┐
│ Payment Management                  │
├─────────────────────────────────────┤
│ [All][Pending][Completed][Refunds]  │
│                                     │
│ Transaction #12345                  │
│ Buyer: Jane → Seller: John          │
│ Amount: 250,000 RWF                 │
│ Status: Escrow Held                 │
│ [View][Release][Refund]             │
│                                     │
│ Transaction #12346                  │
│ Buyer: Mike → Seller: Sarah         │
│ Amount: 180,000 RWF                 │
│ Status: Completed                   │
│ [View Details]                      │
└─────────────────────────────────────┘
```

**Actions Available**:
- View all transactions
- Monitor escrow status
- Process refunds
- Approve payouts
- Investigate fraud
- Generate reports

---

### 5. DISPUTE RESOLUTION
**URL**: `/admin/disputes`
**Navigation**: Admin menu → "Disputes"

**What Admin Sees**:
```
┌─────────────────────────────────────┐
│ Dispute Resolution                  │
├─────────────────────────────────────┤
│ [Open][Under Review][Resolved]      │
│                                     │
│ ┌─────────────────────────────────┐│
│ │ Dispute #D123                   ││
│ │ Type: Product Damaged           ││
│ │ Booking: #12345                 ││
│ │ Filed by: Jane Doe              ││
│ │ Against: John Doe               ││
│ │ Status: Open                    ││
│ │ [Review Case]                   ││
│ └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

**Dispute Review Flow**:
1. Click "Review Case"
2. View evidence from both parties
3. Chat with buyer and seller
4. Make decision:
   - Full refund
   - Partial refund
   - No refund
5. Execute resolution
6. Close dispute

---

### 6. VERIFICATION MANAGEMENT
**URL**: `/admin/verifications`
**Navigation**: Admin menu → "Verifications"

**What Admin Sees**:
```
┌─────────────────────────────────────┐
│ Seller Verification Queue           │
│ 12 pending verifications            │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐│
│ │ John Doe                        ││
│ │ Document: National ID           ││
│ │ Number: 1234567890123456        ││
│ │ [View Document][View Selfie]    ││
│ │ Business: Tech Store            ││
│ │ Location: Kigali, Gasabo        ││
│ │ [✓ Approve][✗ Reject]           ││
│ └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

**Actions Available**:
- Review documents
- Verify selfie photos
- Check GPS location
- Approve verification
- Reject with reason
- Request additional info

---

### 7. SYSTEM SETTINGS
**URL**: `/admin/settings`
**Navigation**: Admin menu → "Settings"

**Settings Categories**:
- General Settings
- Payment Configuration
- Commission Rates
- Email Templates
- SMS Settings
- Security Settings
- Category Management
- Role Management

---

## 📱 MOBILE BOTTOM NAVIGATION

### For Buyers/Renters:
```
┌─────────────────────────────────────┐
│                                     │
│         [Content Area]              │
│                                     │
├─────────────────────────────────────┤
│ [🏠 Home][🔍 Search][💬 Chat]       │
│ [📦 Bookings][👤 Profile]           │
└─────────────────────────────────────┘
```

### For Sellers:
```
┌─────────────────────────────────────┐
│                                     │
│         [Content Area]              │
│                                     │
├─────────────────────────────────────┤
│ [🏠 Home][📦 Products][📋 Orders]   │
│ [💬 Chat][📊 Analytics]             │
└─────────────────────────────────────┘
```

---

## 🔄 COMMON USER FLOWS

### BUYER: Rent a Product
```
Home → Search/Browse → Product Details → 
Book Now → Select Dates → Choose Delivery → 
Pay → Confirmation → My Bookings
```

### SELLER: List a Product
```
Become Seller → Verify Identity → Wait Approval →
Add Listing → Upload Images → Enter Details → 
Set Pricing → Submit → Wait Product Approval → 
Product Live
```

### SELLER: Fulfill Order
```
Orders Page → View New Order → Approve → 
Prepare Product → Deliver → Confirm Delivery → 
Payment Released → Wallet
```

### ADMIN: Approve Product
```
Admin Dashboard → Products → Pending Queue →
Select Product → Review Details → Approve/Reject →
Notify Seller
```

### ADMIN: Resolve Dispute
```
Admin Dashboard → Disputes → Select Dispute →
Review Evidence → Chat with Parties → 
Make Decision → Execute Resolution → Close
```

---

## 🎯 KEY PAGES SUMMARY

| Role | Main Pages | Count |
|------|-----------|-------|
| **Buyer** | Home, Search, Product View, Bookings, Messages, Wallet, Profile, Dashboard | 8 |
| **Seller** | Verification, Add Listing, My Products, Orders, Performance, Messages, Wallet | 7 |
| **Admin** | Dashboard, Users, Products, Payments, Disputes, Verifications, Settings | 7 |

**Total Unique Pages**: 22+
**Total Navigation Paths**: 50+
**Total Actions**: 100+
