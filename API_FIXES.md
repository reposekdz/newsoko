# API Fixes and Rwanda Location Integration

This document details the fixes made to ensure all controllers are fully functional with proper Rwanda administrative divisions support.

## Changes Made

### 1. User Authentication (`api/controllers/users.php`)

**Fixed Issues:**
- Added email validation before registration
- Added email uniqueness check to prevent duplicate registrations
- Added proper error messages for failed operations
- Added Rwanda location field handling (province_id, district_id, sector_id)

**API Endpoints:**
- `POST /api/controllers/users.php` with action `login` or `register`

**Login Request:**
```json
{
  "action": "login",
  "email": "user@example.rw",
  "password": "password123"
}
```

**Register Request:**
```json
{
  "action": "register",
  "name": "John Doe",
  "email": "john@example.rw",
  "password": "password123",
  "phone": "+250788123456",
  "province_id": 1,
  "district_id": 1,
  "sector_id": 1
}
```

### 2. User Model (`api/models/User.php`)

**Fixed Issues:**
- Updated `register()` method to accept Rwanda location fields
- Added `buildLocationString()` method to generate location strings from IDs
- Made location fields optional for backward compatibility

### 3. Products Controller (`api/controllers/products.php`)

**Fixed Issues:**
- Added Rwanda location fields to product creation (province_id, district_id, sector_id, location_string)
- Added location validation and automatic location string generation
- Added location filtering in product queries
- Added proper error handling

**Create Product Request:**
```json
{
  "title": "Toyota RAV4 2023",
  "description": "Nice car for rent",
  "category_id": 1,
  "rent_price": 50000,
  "buy_price": 25000000,
  "address": "KG 9 Ave, Kigali",
  "province_id": 1,
  "district_id": 1,
  "sector_id": 1,
  "images": ["url1", "url2"],
  "features": ["GPS", "Air Conditioning"],
  "condition_status": "like-new"
}
```

**Get Products with Location Filter:**
```
GET /api/controllers/products.php?province_id=1&district_id=1
```

### 4. Product Model (`api/models/Product.php`)

**Fixed Issues:**
- Updated `getAll()` method to accept Rwanda location filters
- Fixed `category` to `category_id` in queries

### 5. Rwanda Locations API (`api/controllers/rwanda_locations.php`)

**API Endpoints:**
- `GET /api/controllers/rwanda_locations.php?action=provinces` - Get all provinces
- `GET /api/controllers/rwanda_locations.php?action=districts&province_id=X` - Get districts by province
- `GET /api/controllers/rwanda_locations.php?action=sectors&district_id=X` - Get sectors by district
- `GET /api/controllers/rwanda_locations.php?action=hierarchy` - Get complete hierarchy
- `GET /api/controllers/rwanda_locations.php?action=search&q=search_term` - Search locations
- `GET /api/controllers/rwanda_locations.php?action=stats` - Get statistics

### 6. Database Migration

**File:** `api/migrations/rwanda_locations_complete.sql`

**Changes to Users Table:**
- `province_id` - Rwanda province ID
- `district_id` - Rwanda district ID
- `sector_id` - Rwanda sector ID
- `is_active` - Account active status
- `ban_reason` - Ban reason
- `last_login` - Last login timestamp
- `account_status` - Account status (active, suspended, banned)

**Changes to Products Table:**
- `province_id` - Rwanda province ID
- `district_id` - Rwanda district ID
- `sector_id` - Rwanda sector ID
- `location_string` - Human readable location string
- `category_id` - Category ID (replaces category enum)
- `status` - Product status (pending, approved, rejected, sold)
- `views` - View count
- `favorites` - Favorite count
- `listing_type` - rent, sale, or both
- `is_featured` - Featured product flag
- `discount_percentage` - Discount percentage
- And more fields for product details

## Rwanda Administrative Divisions

The system supports Rwanda's complete administrative hierarchy:

### Provinces (5)
1. Kigali City (KGL)
2. Eastern Province (EST)
3. Northern Province (NTH)
4. Southern Province (STH)
5. Western Province (WST)

### Districts (30)
- Kigali City: Gasabo, Kicukiro, Nyarugenge
- Eastern Province: Bugesera, Gatsibo, Kayonza, Kirehe, Ngoma, Nyagatare, Rwamagana
- Northern Province: Burera, Gakenke, Gicumbi, Musanze, Rulindo
- Southern Province: Gisagara, Huye, Kamonyi, Muhanga, Nyamagabe, Nyanza, Nyaruguru, Ruhango
- Western Province: Karongi, Ngororero, Nyabihu, Nyamasheke, Rubavu, Rusizi, Rutsiro

### Sectors (416+)
Each district has multiple sectors.

## Running the Migration

### Option 1: Using MySQL Command Line
```bash
mysql -u root -p rental_marketplace < api/migrations/rwanda_locations_complete.sql
```

### Option 2: Using phpMyAdmin
1. Open phpMyAdmin
2. Select the `rental_marketplace` database
3. Click "Import"
4. Select the file `api/migrations/rwanda_locations_complete.sql`
5. Click "Go"

### Option 3: Using PHP
```bash
php api/migrations/add_rwanda_locations.php
```

## Testing the APIs

### Test Login
```bash
curl -X POST http://localhost/api/controllers/users.php \
  -H "Content-Type: application/json" \
  -d '{"action":"login","email":"jb.mugabo@example.rw","password":"password"}'
```

### Test Register
```bash
curl -X POST http://localhost/api/controllers/users.php \
  -H "Content-Type: application/json" \
  -d '{"action":"register","name":"Test User","email":"test@example.rw","password":"test123","phone":"+250788000000","province_id":1,"district_id":1,"sector_id":1}'
```

### Test Get Provinces
```bash
curl "http://localhost/api/controllers/rwanda_locations.php?action=provinces"
```

### Test Get Products
```bash
curl "http://localhost/api/controllers/products.php?province_id=1"
```

## Common Issues and Solutions

### Issue: "Invalid credentials" on login
**Solution:** Ensure the email exists and password is correct. Passwords are hashed using bcrypt.

### Issue: "Registration failed"
**Solution:** Check that the email is not already registered and all required fields are provided.

### Issue: Products not showing location filter results
**Solution:** Run the database migration to add location fields to the products table.

### Issue: Location IDs not found
**Solution:** First query the rwanda_locations API to get valid province_id, district_id, and sector_id values.

## Next Steps

1. Run the database migration
2. Test the login/register APIs
3. Test the Rwanda locations API
4. Test creating products with location data
5. Test filtering products by location
