# Rental & Sales Marketplace - Full Stack Application

## Setup Instructions

### 1. Database Setup
1. Start XAMPP (Apache and MySQL)
2. Open phpMyAdmin (http://localhost/phpmyadmin)
3. Import the database:
   - Click "Import" tab
   - Choose file: `api/database.sql`
   - Click "Go"

### 2. Backend Setup
The PHP backend is already configured in the `api` folder:
- `api/config/database.php` - Database connection
- `api/models/` - Data models
- `api/controllers/` - API endpoints

API Endpoints:
- GET `http://localhost/Rentalsalesmarketplace/api/controllers/products.php` - Get all products
- GET `http://localhost/Rentalsalesmarketplace/api/controllers/products.php?id=1` - Get product by ID
- GET `http://localhost/Rentalsalesmarketplace/api/controllers/products.php?stats=1` - Get statistics
- POST `http://localhost/Rentalsalesmarketplace/api/controllers/users.php` - Login/Register

### 3. Frontend Setup
```bash
npm install
npm run dev
```

## Features Implemented

### ✅ Full-Page Modern Product View
- Large image gallery with thumbnails
- Detailed product information
- Owner contact details
- Tabbed interface (Description, Features, Reviews)
- Wishlist and share functionality
- Direct booking/purchase buttons

### ✅ Enhanced Home Page
- Real-time statistics from database
- Advanced search with filters
- Category selection
- Loading states
- Responsive grid layout
- Live data from MySQL

### ✅ Real Database Integration
- MySQL database with proper schema
- PHP REST API backend
- User authentication ready
- Product CRUD operations
- Real users and products (no mock data)

### ✅ Database Tables
- `users` - User accounts with verification
- `products` - Product listings with all details
- `bookings` - Rental/purchase bookings
- `reviews` - Product reviews
- `messages` - User messaging

## Default Test Users
- Email: jb.mugabo@example.rw | Password: password
- Email: mc.uwase@example.rw | Password: password
- Email: p.nshimiyimana@example.rw | Password: password

## Technology Stack
- **Frontend**: React + TypeScript + Vite
- **Backend**: PHP 8+ with PDO
- **Database**: MySQL
- **UI**: Tailwind CSS + shadcn/ui
- **Server**: XAMPP (Apache + MySQL)
