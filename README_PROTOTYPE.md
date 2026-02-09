# Rental & Sales Marketplace - Prototype & User Flows

## 🎨 DESIGN PROTOTYPE

### Design System
- **Primary Color**: Blue (#3B82F6)
- **Secondary Color**: Light Blue (#60A5FA)
- **Success**: Green (#10B981)
- **Warning**: Yellow (#F59E0B)
- **Error**: Red (#EF4444)
- **Background**: White (#FFFFFF) / Dark (#1F2937)
- **Text**: Gray (#374151) / White (#FFFFFF)

### Typography
- **Headings**: Bold, 24-48px
- **Body**: Regular, 14-16px
- **Small**: Regular, 12-14px
- **Font**: Inter, System Fonts

### Spacing
- **Padding**: 4px, 8px, 12px, 16px, 24px, 32px
- **Margin**: 4px, 8px, 16px, 24px, 32px
- **Gap**: 8px, 16px, 24px

---

## 📱 SCREEN LAYOUTS

### 1. HOME PAGE
```
┌─────────────────────────────────────┐
│ [Logo] [Search Bar]    [Login/User] │
├─────────────────────────────────────┤
│                                     │
│  🎯 Isoko ry'u Rwanda               │
│  Marketplace for Rwanda             │
│                                     │
│  [Rent] ⚪ [Buy]                    │
│                                     │
├─────────────────────────────────────┤
│ [Advanced Search Filters]           │
├─────────────────────────────────────┤
│ 📊 Stats: Products | Users | Rating │
├─────────────────────────────────────┤
│ 🏷️ Categories (Horizontal Scroll)   │
├─────────────────────────────────────┤
│ [All] [Featured] [Trending]         │
│                                     │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐       │
│ │Img │ │Img │ │Img │ │Img │       │
│ │📦  │ │📦  │ │📦  │ │📦  │       │
│ └────┘ └────┘ └────┘ └────┘       │
│                                     │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐       │
│ │Img │ │Img │ │Img │ │Img │       │
│ │📦  │ │📦  │ │📦  │ │📦  │       │
│ └────┘ └────┘ └────┘ └────┘       │
├─────────────────────────────────────┤
│ 🌟 Why Choose Us Section            │
└─────────────────────────────────────┘
```

### 2. PRODUCT VIEW PAGE
```
┌─────────────────────────────────────┐
│ [← Back]              [❤️] [Share]  │
├─────────────────────────────────────┤
│ 🏷️ Categories Scroll Bar            │
├─────────────────────────────────────┤
│ ┌──────────┐  Product Details       │
│ │          │  Title: Toyota RAV4    │
│ │  Image   │  ⭐ 4.8 (120 reviews)  │
│ │  Gallery │  📍 Kigali, Gasabo     │
│ │          │                        │
│ └──────────┘  ┌──────────────────┐  │
│ [🖼️][🖼️][🖼️]  │ 50,000 RWF/day  │  │
│               │ ✅ Available      │  │
│               │ 💰 Deposit: 100K │  │
│               │ ⚡ Instant Book  │  │
│               │ 👁️ 245 | ❤️ 45   │  │
│               └──────────────────┘  │
│               [📅 Book Now]         │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 💬 Message Seller               │ │
│ │ [Type message...]               │ │
│ │ [Send]                          │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 👤 Seller Info                      │
│ [Avatar] John Doe ✓                 │
│ ⭐ 4.9 | 50 reviews                 │
│                                     │
│ [Description][Features][Reviews]    │
│                                     │
│ 📦 Related Products                 │
│ [Product][Product][Product]         │
└─────────────────────────────────────┘
```

### 3. BOOKING FLOW
```
Step 1: Date Selection
┌─────────────────────────────────────┐
│ Booking: Toyota RAV4               │
│ [■■■□] Progress                    │
├─────────────────────────────────────┤
│ 📅 Select Dates                     │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │   Calendar Component            │ │
│ │   [Select Start & End Date]     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Start: Jan 15, 2024                 │
│ End: Jan 20, 2024                   │
│ Total Days: 5                       │
│                                     │
│ [Continue →]                        │
└─────────────────────────────────────┘

Step 2: Delivery
┌─────────────────────────────────────┐
│ Booking: Toyota RAV4               │
│ [■■■■] Progress                    │
├─────────────────────────────────────┤
│ 🚚 Delivery Method                  │
│                                     │
│ ⚪ Pickup (Free)                    │
│    📍 Kigali, Gasabo                │
│                                     │
│ ⚪ Delivery (5,000 RWF)             │
│    [Enter Address]                  │
│                                     │
│ 📝 Notes (Optional)                 │
│ [Special instructions...]           │
│                                     │
│ [← Back] [Continue →]               │
└─────────────────────────────────────┘

Step 3: Payment
┌─────────────────────────────────────┐
│ Booking: Toyota RAV4               │
│ [■■■■] Progress                    │
├─────────────────────────────────────┤
│ 💳 Payment Method                   │
│                                     │
│ ⚪ MTN Mobile Money                 │
│ ⚪ Airtel Money                     │
│ ⚪ Wallet (Balance: 100K)           │
│                                     │
│ 📱 Phone: [+250788123456]           │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Rental: 250,000 RWF             │ │
│ │ Deposit: 100,000 RWF            │ │
│ │ Delivery: 5,000 RWF             │ │
│ │ Service Fee: 12,500 RWF         │ │
│ │ ─────────────────────           │ │
│ │ Total: 367,500 RWF              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 🛡️ Secured by Escrow               │
│                                     │
│ [← Back] [Pay Now]                  │
└─────────────────────────────────────┘

Step 4: Confirmation
┌─────────────────────────────────────┐
│ ✅ Payment Successful!              │
├─────────────────────────────────────┤
│                                     │
│        ✓                            │
│    [Success Icon]                   │
│                                     │
│ Booking ID: #12345                  │
│ Status: Confirmed                   │
│ Total Paid: 367,500 RWF             │
│                                     │
│ [View Booking] [Done]               │
└─────────────────────────────────────┘
```

### 4. SELLER DASHBOARD
```
┌─────────────────────────────────────┐
│ Seller Dashboard                    │
├─────────────────────────────────────┤
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐       │
│ │ 12 │ │ 8  │ │ 25 │ │450K│       │
│ │List│ │Act │ │Comp│ │Rev │       │
│ └────┘ └────┘ └────┘ └────┘       │
├─────────────────────────────────────┤
│ [Active][Pending][Completed]        │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📦 Order #123                   │ │
│ │ Toyota RAV4                     │ │
│ │ Customer: Jane Doe              │ │
│ │ Amount: 250,000 RWF             │ │
│ │ Status: Pending                 │ │
│ │ [Approve] [Reject]              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📦 Order #124                   │ │
│ │ Honda Civic                     │ │
│ │ Customer: John Smith            │ │
│ │ Amount: 180,000 RWF             │ │
│ │ Status: Active                  │ │
│ │ [Confirm Delivery]              │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 5. ADMIN DASHBOARD
```
┌─────────────────────────────────────┐
│ 🛡️ Admin Dashboard                  │
├─────────────────────────────────────┤
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐       │
│ │1.2K│ │850 │ │ 45 │ │25M │       │
│ │User│ │Prod│ │Pend│ │Rev │       │
│ └────┘ └────┘ └────┘ └────┘       │
├─────────────────────────────────────┤
│ [Users][Products][Roles][Logs]      │
│                                     │
│ User Management                     │
│ ┌─────────────────────────────────┐ │
│ │ 👤 John Doe                     │ │
│ │ john@email.com                  │ │
│ │ Role: Seller                    │ │
│ │ [Verify][Ban][Assign Role]      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Product Approval                    │
│ ┌─────────────────────────────────┐ │
│ │ 📦 Toyota RAV4                  │ │
│ │ Seller: Jane Doe                │ │
│ │ Price: 50,000 RWF/day           │ │
│ │ [Approve][Reject][Delete]       │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## 🔄 USER FLOWS

### BUYER FLOW

#### 1. Registration & Login
```
Start → Landing Page
  ↓
Click "Sign Up"
  ↓
Enter Details (Name, Email, Phone, Password)
  ↓
Verify Phone (OTP)
  ↓
Account Created
  ↓
Login → Dashboard
```

#### 2. Browse & Search Products
```
Home Page
  ↓
[Option A] Browse Categories
  ↓
Select Category → View Products
  ↓
[Option B] Use Search Bar
  ↓
Enter Keywords + Filters
  ↓
View Search Results
  ↓
Click Product → Product Details
```

#### 3. Rent/Buy Product
```
Product Details Page
  ↓
Select Mode (Rent/Buy)
  ↓
Click "Book Now"
  ↓
[If Rent] Select Dates
  ↓
Choose Delivery Method
  ↓
Enter Delivery Address (if delivery)
  ↓
Select Payment Method
  ↓
Review Order Summary
  ↓
Confirm Payment
  ↓
Payment Processing
  ↓
Booking Confirmed
  ↓
Receive Confirmation Email/SMS
```

#### 4. Track Order
```
My Bookings Page
  ↓
View Booking List
  ↓
Click Booking → View Details
  ↓
Track Status (Pending → Confirmed → Active → Completed)
  ↓
[If Issue] File Dispute
  ↓
[If Completed] Leave Review
```

#### 5. Message Seller
```
Product Page
  ↓
Click "Message Seller"
  ↓
Type Message
  ↓
Send Message
  ↓
Receive Reply Notification
  ↓
Continue Conversation
```

---

### SELLER FLOW

#### 1. Seller Verification
```
Register Account
  ↓
Navigate to "Become Seller"
  ↓
Upload ID Document
  ↓
Take Selfie with ID
  ↓
Enter Business Details
  ↓
Capture GPS Location
  ↓
Submit Verification
  ↓
Wait for Admin Approval (24-48h)
  ↓
Receive Approval Notification
  ↓
Seller Account Activated
```

#### 2. Add Product Listing
```
Seller Dashboard
  ↓
Click "Add Listing"
  ↓
Step 1: Upload Images (min 3)
  ↓
Step 2: Enter Details
  - Title
  - Description
  - Category
  - Condition
  - Features
  ↓
Step 3: Set Pricing
  - Rent Price
  - Buy Price
  - Deposit
  - Location
  ↓
Submit for Approval
  ↓
Wait for Admin Review
  ↓
Product Approved → Listed
```

#### 3. Manage Orders
```
Seller Dashboard
  ↓
View Active Orders
  ↓
[New Order] Receive Notification
  ↓
Review Order Details
  ↓
[Option A] Approve Order
  ↓
Prepare Product
  ↓
Deliver/Handover Product
  ↓
Confirm Delivery
  ↓
Escrow Released → Payment Received
  ↓
[Option B] Reject Order
  ↓
Provide Reason
  ↓
Order Cancelled
```

#### 4. Handle Disputes
```
Receive Dispute Notification
  ↓
View Dispute Details
  ↓
Review Evidence
  ↓
Respond to Dispute
  ↓
Communicate with Admin
  ↓
[Resolution] Accept/Contest
  ↓
Dispute Closed
```

---

### ADMIN FLOW

#### 1. User Management
```
Admin Dashboard
  ↓
Navigate to "Users"
  ↓
View User List
  ↓
[Action A] Verify User
  - Review Documents
  - Approve/Reject
  ↓
[Action B] Ban User
  - Enter Reason
  - Confirm Ban
  ↓
[Action C] Assign Role
  - Select Role
  - Confirm Assignment
```

#### 2. Product Approval
```
Admin Dashboard
  ↓
Navigate to "Products"
  ↓
View Pending Products
  ↓
Click Product → Review Details
  ↓
Check Images, Description, Pricing
  ↓
[Option A] Approve
  - Product Goes Live
  - Notify Seller
  ↓
[Option B] Reject
  - Enter Rejection Reason
  - Notify Seller
  ↓
[Option C] Delete
  - Confirm Deletion
  - Remove Product
```

#### 3. Dispute Resolution
```
Admin Dashboard
  ↓
Navigate to "Disputes"
  ↓
View Dispute Queue
  ↓
Click Dispute → Review Case
  ↓
Review Evidence from Both Parties
  ↓
Communicate with Buyer & Seller
  ↓
Make Decision:
  - Full Refund
  - Partial Refund
  - No Refund
  ↓
Execute Resolution
  ↓
Close Dispute
  ↓
Notify Both Parties
```

#### 4. Payment Management
```
Admin Dashboard
  ↓
Navigate to "Payments"
  ↓
View Transaction List
  ↓
[Action A] Process Refund
  - Select Transaction
  - Enter Amount
  - Confirm Refund
  ↓
[Action B] Approve Payout
  - Review Seller Request
  - Verify Delivery
  - Release Payment
  ↓
[Action C] Investigate Fraud
  - Flag Transaction
  - Review Details
  - Take Action
```

---

## 🎯 KEY USER JOURNEYS

### Journey 1: First-Time Buyer
```
1. Discover Platform (Google/Social Media)
2. Browse Products (No Login Required)
3. Find Desired Product
4. Click "Book Now" → Prompted to Login
5. Quick Registration (2 minutes)
6. Complete Booking
7. Make Payment
8. Receive Confirmation
9. Track Order
10. Receive Product
11. Leave Review
```

### Journey 2: Becoming a Seller
```
1. Register as Buyer
2. Explore Platform
3. Decide to Sell
4. Click "Become Seller"
5. Complete Verification (10 minutes)
6. Wait for Approval (24-48 hours)
7. Receive Approval
8. Add First Product
9. Wait for Product Approval
10. Product Goes Live
11. Receive First Order
12. Complete Transaction
13. Receive Payment
```

### Journey 3: Dispute Resolution
```
1. Buyer Receives Damaged Product
2. Navigate to "My Bookings"
3. Click Order → "File Dispute"
4. Select Dispute Type
5. Upload Evidence (Photos)
6. Submit Dispute
7. Admin Reviews Case
8. Admin Contacts Seller
9. Seller Responds
10. Admin Makes Decision
11. Refund Processed
12. Dispute Closed
13. Both Parties Notified
```

---

## 📊 INTERACTION PATTERNS

### Click Interactions
- **Primary Actions**: Large buttons, high contrast
- **Secondary Actions**: Outlined buttons
- **Destructive Actions**: Red buttons with confirmation
- **Quick Actions**: Icon buttons with tooltips

### Hover States
- **Cards**: Lift effect, shadow increase
- **Buttons**: Color darken, scale slightly
- **Links**: Underline, color change
- **Images**: Zoom effect, overlay

### Loading States
- **Buttons**: Spinner icon, disabled state
- **Pages**: Skeleton screens
- **Images**: Blur-up effect
- **Lists**: Progressive loading

### Error States
- **Forms**: Red border, error message below
- **Pages**: Error icon, retry button
- **Toasts**: Red background, error icon
- **Inline**: Red text, warning icon

### Success States
- **Forms**: Green checkmark
- **Pages**: Success icon, confirmation message
- **Toasts**: Green background, success icon
- **Inline**: Green text, checkmark icon

---

## 🎨 ANIMATION GUIDELINES

### Page Transitions
- **Duration**: 200-300ms
- **Easing**: ease-in-out
- **Type**: Fade, slide

### Modal/Dialog
- **Entry**: Scale up + fade in (200ms)
- **Exit**: Scale down + fade out (150ms)

### Dropdown/Menu
- **Entry**: Slide down + fade in (150ms)
- **Exit**: Slide up + fade out (100ms)

### Toast Notifications
- **Entry**: Slide in from right (200ms)
- **Exit**: Slide out to right (150ms)
- **Auto-dismiss**: 3-5 seconds

### Loading Spinners
- **Rotation**: Continuous, 1s per rotation
- **Pulse**: 1.5s cycle

---

## 📱 RESPONSIVE BEHAVIOR

### Mobile (< 768px)
- Single column layout
- Bottom navigation
- Hamburger menu
- Full-width cards
- Stacked forms
- Touch-optimized buttons (min 44px)

### Tablet (768px - 1024px)
- Two column layout
- Side navigation
- Grid cards (2 columns)
- Responsive forms

### Desktop (> 1024px)
- Multi-column layout
- Persistent navigation
- Grid cards (3-4 columns)
- Inline forms
- Hover effects

---

## 🎯 PROTOTYPE LINKS

### Figma Design
Original Design: https://www.figma.com/design/BMaqX3Kktz2cxG5SqmRhvZ/Rental---Sales-Marketplace

### Key Screens
1. Home Page
2. Product Listing
3. Product Details
4. Booking Flow
5. User Dashboard
6. Seller Dashboard
7. Admin Dashboard
8. Messages
9. Wallet
10. Profile

---

## 🔍 USABILITY TESTING SCENARIOS

### Scenario 1: Rent a Car
```
Task: Find and rent a Toyota RAV4 for 5 days
Success Criteria:
- Find product in < 2 minutes
- Complete booking in < 5 minutes
- Understand pricing breakdown
- Receive confirmation
```

### Scenario 2: Become a Seller
```
Task: Register as seller and list first product
Success Criteria:
- Complete verification in < 10 minutes
- Upload product in < 5 minutes
- Understand approval process
- Receive approval notification
```

### Scenario 3: Resolve Dispute
```
Task: File dispute for damaged product
Success Criteria:
- Find dispute option easily
- Upload evidence successfully
- Understand resolution process
- Receive resolution notification
```

---

**Total Screens**: 50+
**User Flows**: 15+
**Interactions**: 100+
**Animations**: 20+
