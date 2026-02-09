# Database Setup Guide

## Step-by-Step Instructions

### 1. Start XAMPP
- Open XAMPP Control Panel
- Click "Start" for Apache
- Click "Start" for MySQL
- Wait until both show "Running" status

### 2. Access phpMyAdmin
- Open your browser
- Go to: `http://localhost/phpmyadmin`
- You should see the phpMyAdmin interface

### 3. Import Database

#### Option A: Create Database First (Recommended)
1. Click "New" in the left sidebar
2. Enter database name: `rental_marketplace`
3. Choose collation: `utf8mb4_general_ci`
4. Click "Create"
5. Click on the newly created `rental_marketplace` database
6. Click "Import" tab at the top
7. Click "Choose File"
8. Navigate to: `C:\xampp\htdocs\Rentalsalesmarketplace\api\database.sql`
9. Click "Go" at the bottom
10. Wait for success message

#### Option B: Import Directly
1. Click "Import" tab at the top
2. Click "Choose File"
3. Navigate to: `C:\xampp\htdocs\Rentalsalesmarketplace\api\database.sql`
4. Click "Go" at the bottom
5. Wait for success message

### 4. Verify Database
After import, you should see:
- Database: `rental_marketplace`
- Tables:
  - `users` (3 rows)
  - `products` (6 rows)
  - `bookings` (0 rows initially)
  - `reviews` (0 rows initially)
  - `messages` (0 rows initially)

### 5. Test Database Connection
- Open: `http://localhost/Rentalsalesmarketplace/api/controllers/products.php`
- You should see JSON response with products
- If you see products data, database is working correctly!

## Troubleshooting

### Error: "Access denied for user 'root'@'localhost'"
**Solution**: Update database credentials in `api/config/database.php`
```php
private $username = "root";
private $password = ""; // Your MySQL password
```

### Error: "Unknown database 'rental_marketplace'"
**Solution**: The database wasn't created. Follow Option A above.

### Error: "Table already exists"
**Solution**: 
1. Drop existing database: Click on `rental_marketplace` → Operations → Drop
2. Re-import the SQL file

### Error: "Cannot connect to MySQL"
**Solution**: 
1. Ensure MySQL is running in XAMPP
2. Check if port 3306 is not blocked
3. Restart MySQL service in XAMPP

## Database Configuration

Default settings in `api/config/database.php`:
```php
Host: localhost
Database: rental_marketplace
Username: root
Password: (empty)
Port: 3306
```

If your XAMPP uses different settings, update the file accordingly.

## Sample Data Included

### Users (3)
- Jean Baptiste Mugabo (Verified)
- Marie Claire Uwase (Verified)
- Patrick Nshimiyimana (Not verified)

### Products (6)
- Toyota RAV4 2023 (Vehicle)
- MacBook Pro M3 (Electronics)
- Canon EOS R5 (Electronics)
- House in Kicukiro (House)
- Wedding Dress (Clothing)
- Power Tools Set (Tools)

All passwords are hashed with bcrypt.
Default password for all users: `password`

## Next Steps

After successful database setup:
1. Run `npm install` in project directory
2. Run `npm run dev` to start frontend
3. Open `http://localhost:5173`
4. Browse products from real database!

---

**Need Help?** Check IMPLEMENTATION.md for complete documentation.
