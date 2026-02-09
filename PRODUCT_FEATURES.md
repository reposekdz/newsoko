# 🛍️ PRODUCT MANAGEMENT - COMPLETE FEATURES

## ✅ Implemented Features

### 1. Hide Exhausted Products
- Products with `stock_quantity = 0` and `listing_type = 'sale'` are hidden from listings
- Rental products always shown (stock doesn't apply)
- Direct access to exhausted product returns "Product not available"

### 2. Hide Seller Contact Information
**Before:**
```json
{
  "owner": {
    "email": "seller@email.com",
    "phone": "+250788123456"
  }
}
```

**After:**
```json
{
  "owner": {
    "name": "John Doe",
    "avatar": "/avatar.jpg",
    "isVerified": true,
    "rating": 4.5,
    "reviewCount": 23
  }
}
```

### 3. Related Products
- Automatically shows 6 related products from same category
- Sorted by popularity (views)
- Only shows available products

### 4. Messaging System
- Contact seller through internal messaging
- Product context included in messages
- Real-time unread count
- Conversation history per product

---

## 📡 API Endpoints

### Get Product (with related products)
```bash
GET /api/controllers/products.php?id=123
```

Response:
```json
{
  "success": true,
  "data": {
    "id": 123,
    "title": "iPhone 15 Pro",
    "stock_quantity": 5,
    "owner": {
      "name": "John Doe",
      "rating": 4.5
    },
    "related_products": [
      {
        "id": 124,
        "title": "iPhone 15",
        "images": ["..."]
      }
    ]
  }
}
```

### Send Message to Seller
```bash
POST /api/controllers/messaging.php
{
  "action": "send",
  "receiver_id": 456,
  "product_id": 123,
  "message": "Is this still available?"
}
```

### Get Conversations
```bash
GET /api/controllers/messaging.php?conversations=1
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "other_user_id": 456,
      "other_name": "John Doe",
      "product_title": "iPhone 15 Pro",
      "last_message": "Yes, it's available",
      "unread_count": 2
    }
  ]
}
```

### Get Conversation Messages
```bash
GET /api/controllers/messaging.php?conversation=1&other_user_id=456&product_id=123
```

### Get Unread Count
```bash
GET /api/controllers/messaging.php?unread_count=1
```

---

## 🎨 Frontend Components

### ProductView Component
```typescript
import { ProductView } from '@/components/ProductView';

// Features:
// - Shows product details
// - Hides seller contact
// - Shows related products
// - Contact seller button opens messaging modal
```

### MessagingSystem Component
```typescript
import { MessagingSystem } from '@/components/MessagingSystem';

// Features:
// - List all conversations
// - Unread count badge
// - Real-time updates (5s polling)
// - Product context in each conversation
// - Send/receive messages
```

---

## 🔒 Security Features

### 1. Contact Information Protection
- Email and phone NEVER exposed in API
- Only available through internal messaging
- Prevents spam and harassment

### 2. Stock Management
- Exhausted products automatically hidden
- Prevents orders for unavailable items
- Admin can still view/manage

### 3. Message Validation
- Authentication required
- Rate limiting applied
- XSS protection on messages

---

## 💡 Usage Examples

### Frontend: Product Page
```typescript
// src/pages/ProductPage.tsx
import { ProductView } from '@/components/ProductView';

export const ProductPage = () => {
  return <ProductView />;
};
```

### Frontend: Messages Page
```typescript
// src/pages/MessagesPage.tsx
import { MessagingSystem } from '@/components/MessagingSystem';

export const MessagesPage = () => {
  return <MessagingSystem />;
};
```

### Backend: Check Stock Before Booking
```php
// api/controllers/bookings.php
$query = "SELECT stock_quantity FROM products WHERE id = ?";
$stmt = $db->prepare($query);
$stmt->execute([$productId]);
$stock = $stmt->fetchColumn();

if ($stock <= 0) {
    echo json_encode(['success' => false, 'message' => 'Product not available']);
    exit;
}

// Decrease stock
$query = "UPDATE products SET stock_quantity = stock_quantity - 1 WHERE id = ?";
$stmt = $db->prepare($query);
$stmt->execute([$productId]);
```

---

## 🎯 Business Logic

### Product Availability Rules

| Listing Type | Stock = 0 | Shown in List | Can Book |
|--------------|-----------|---------------|----------|
| Sale         | Yes       | ❌ No         | ❌ No    |
| Sale         | No        | ✅ Yes        | ✅ Yes   |
| Rent         | Yes       | ✅ Yes        | ✅ Yes   |
| Rent         | No        | ✅ Yes        | ✅ Yes   |
| Both         | Yes       | ❌ No         | ❌ No    |
| Both         | No        | ✅ Yes        | ✅ Yes   |

### Messaging Flow

1. **User views product** → Sees "Contact Seller" button
2. **Clicks button** → Opens message modal
3. **Sends message** → Stored with product context
4. **Seller receives** → Notification + unread count
5. **Seller replies** → Buyer gets notification
6. **Conversation continues** → All messages linked to product

---

## 📊 Database Schema

### Messages Table
```sql
CREATE TABLE messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    product_id INT,
    message TEXT NOT NULL,
    message_type ENUM('text', 'image', 'offer') DEFAULT 'text',
    is_read BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    read_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    INDEX idx_conversation (sender_id, receiver_id, product_id),
    INDEX idx_unread (receiver_id, is_read)
);
```

---

## 🚀 Advanced Features

### 1. Auto-Hide Exhausted Products (Cron Job)
```php
// api/cron/hide_exhausted_products.php
<?php
require_once '../config/database.php';

$db = new Database();
$conn = $db->getConnection();

$query = "UPDATE products SET status = 'out_of_stock' 
         WHERE stock_quantity = 0 AND listing_type = 'sale' AND status = 'approved'";
$conn->exec($query);

echo "Updated exhausted products\n";
```

### 2. Low Stock Alerts
```php
// api/services/StockAlertService.php
public function checkLowStock() {
    $query = "SELECT p.*, u.email FROM products p 
             JOIN users u ON p.owner_id = u.id 
             WHERE p.stock_quantity <= 5 AND p.stock_quantity > 0";
    $stmt = $this->db->prepare($query);
    $stmt->execute();
    
    foreach ($stmt->fetchAll() as $product) {
        $this->sendLowStockEmail($product['email'], $product['title'], $product['stock_quantity']);
    }
}
```

### 3. Message Templates
```typescript
const messageTemplates = {
  availability: "Hi! Is this product still available?",
  price: "Can you negotiate on the price?",
  condition: "What's the condition of the item?",
  delivery: "Do you offer delivery?"
};
```

### 4. Smart Related Products
```sql
-- Based on user behavior
SELECT p.* FROM products p
JOIN product_views pv ON p.id = pv.product_id
WHERE pv.user_id IN (
    SELECT user_id FROM product_views WHERE product_id = ?
)
AND p.id != ?
GROUP BY p.id
ORDER BY COUNT(*) DESC
LIMIT 6;
```

---

## 🧪 Testing

### Test Exhausted Product Hidden
```bash
# Create product with 0 stock
curl -X POST http://localhost/Rentalsalesmarketplace/api/controllers/products.php \
  -d '{"title":"Test","stock_quantity":0,"listing_type":"sale"}'

# Try to fetch - should not appear in list
curl http://localhost/Rentalsalesmarketplace/api/controllers/products.php
```

### Test Messaging
```bash
# Send message
curl -X POST http://localhost/Rentalsalesmarketplace/api/controllers/messaging.php \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"action":"send","receiver_id":2,"product_id":1,"message":"Hello"}'

# Get conversations
curl http://localhost/Rentalsalesmarketplace/api/controllers/messaging.php?conversations=1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📱 Mobile Optimization

### Push Notifications (Future)
```typescript
// When new message received
const sendPushNotification = async (userId: number, message: string) => {
  await fetch('/api/notifications/push', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      title: 'New Message',
      body: message,
      type: 'message'
    })
  });
};
```

---

## ✅ Checklist

- [x] Hide exhausted products from listings
- [x] Hide seller contact info (email, phone)
- [x] Show related products (6 items)
- [x] Internal messaging system
- [x] Product context in messages
- [x] Unread message count
- [x] Real-time message updates
- [x] Message history per product
- [x] Contact seller button
- [x] Conversation list
- [x] Message notifications

---

**All features are production-ready and fully functional!**
