# Admin Dashboard - Full Feature Documentation

## Overview
The newsoko admin dashboard provides comprehensive management capabilities for the entire marketplace platform.

## Features Implemented

### 1. User Management
- View all users with detailed information
- Verify/unverify users
- Ban/unban users with reasons
- Delete users permanently
- Assign roles to users
- Send notifications to users
- Track user activity

### 2. Product Management
- Approve/reject pending products
- Edit product details
- Delete products
- Bulk operations on products
- View product statistics
- Monitor product performance

### 3. Booking Management
- View all bookings
- Cancel bookings
- Process refunds
- Track booking status
- Monitor revenue and fees

### 4. Dispute Resolution
- View all disputes
- Resolve disputes with detailed resolutions
- Track dispute history
- Notify involved parties

### 5. Review Moderation
- View all reviews
- Delete inappropriate reviews
- Monitor review quality

### 6. Category Management
- Create new categories
- Edit existing categories
- Delete categories
- Manage category hierarchy
- Track products per category

### 7. System Settings
- Configure platform fees
- Set booking limits
- Manage system parameters
- Update contact information

### 8. Activity Logs
- Track all admin actions
- Monitor system changes
- Audit trail for compliance

### 9. Analytics & Stats
- Real-time dashboard statistics
- User metrics
- Product metrics
- Revenue tracking
- Platform fees monitoring

## API Endpoints

### Admin Stats
```
GET /api/controllers/admin_advanced.php?action=stats
```

### User Management
```
GET /api/controllers/admin_advanced.php?action=users
POST /api/controllers/admin_advanced.php
  - action: verify_user, ban_user, unban_user, delete_user, assign_role
```

### Product Management
```
GET /api/controllers/admin_advanced.php?action=pending_approvals
POST /api/controllers/admin_advanced.php
  - action: approve_product, reject_product, delete_product
```

### Booking Management
```
GET /api/controllers/admin_advanced.php?action=bookings
POST /api/controllers/admin_advanced.php
  - action: refund_booking, cancel_booking
```

### Dispute Management
```
GET /api/controllers/admin_advanced.php?action=disputes
POST /api/controllers/admin_advanced.php
  - action: resolve_dispute
```

### Category Management
```
GET /api/controllers/admin_advanced.php?action=categories
POST /api/controllers/admin_advanced.php
  - action: create_category, update_category, delete_category
```

### System Settings
```
GET /api/controllers/admin_advanced.php?action=system_settings
POST /api/controllers/admin_advanced.php
  - action: update_setting
```

### Notifications
```
POST /api/controllers/admin_advanced.php
  - action: send_notification
```

## Database Setup

1. Run the migration script:
```sql
mysql -u root -p newsoko < api/database/migrations/admin_advanced.sql
```

2. Create a super admin user:
```sql
UPDATE users SET is_admin = 1 WHERE email = 'admin@newsoko.rw';
```

## Security Features

- JWT token authentication
- Admin role verification
- Activity logging for all actions
- IP address tracking
- User agent logging

## Usage

1. Login as admin user
2. Navigate to admin dashboard via the admin icon in header
3. Access different management sections via tabs
4. Perform actions with real-time feedback
5. All actions are logged automatically

## Permissions

- Super Admin: Full access to all features
- Admin: Manage users, products, bookings
- Moderator: Moderate content and reviews
- Support: Handle disputes and customer support

## Notifications

Automated notifications are sent for:
- User verification
- Account bans/unbans
- Product approvals/rejections
- Dispute resolutions
- Booking refunds
- System announcements

## Best Practices

1. Always provide reasons for bans and rejections
2. Review disputes thoroughly before resolution
3. Monitor activity logs regularly
4. Keep system settings updated
5. Process refunds promptly
6. Maintain clear communication with users
