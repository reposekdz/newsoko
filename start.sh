#!/bin/bash

echo "==================================="
echo "Rental Marketplace - Quick Start"
echo "==================================="
echo ""

echo "Step 1: Starting XAMPP..."
echo "Please ensure XAMPP is running with Apache and MySQL"
echo ""

echo "Step 2: Database Setup"
echo "1. Open http://localhost/phpmyadmin"
echo "2. Click 'Import' tab"
echo "3. Choose file: api/database.sql"
echo "4. Click 'Go'"
echo ""

echo "Step 3: Installing dependencies..."
npm install

echo ""
echo "Step 4: Starting development server..."
npm run dev

echo ""
echo "==================================="
echo "Application is ready!"
echo "Frontend: http://localhost:5173"
echo "Backend API: http://localhost/Rentalsalesmarketplace/api/controllers/"
echo "==================================="
