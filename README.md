GenzMart – E-Commerce Backend
=============================

Objective
---------

**GenzMart** is a scalable and secure **eCommerce backend**, built with **Express.js**, **Prisma ORM**, **PostgreSQL**, and **pnpm**.It includes full support for **Stripe** and **SSLCommerz** payment gateways and follows a fully modular architecture for long-term maintainability.

Features
--------

### 1\. Modular Architecture

GenzMart is organized into separate feature-based modules:

*   **Auth**
    
*   **User**
    
*   **Product**
    
*   **Product Review**
    
*   **Category**
    
*   **Brand**
    
*   **Coupon**
    
*   **Order**
    
*   **Payment**
    
*   **Blog Category**
    
*   **Blog Post**
    
*   **Meta**
    

Each module contains its own routes, controllers, services, and validations.

### 2\. Authentication & Authorization

*   Secure user login and registration using **JWT**
    
*   Password hashing with **bcryptjs**
    
*   Role-based access (Admin / Customer)
    
*   Cookie-based token handling
    
*   API rate limiting for sensitive endpoints
    

### 3\. Database & ORM

*   Backed by **PostgreSQL**
    
*   Managed through **Prisma ORM** with TypeScript
    
*   Modular schema files auto-merged using a custom build step
    
*   Clean relational modeling for all entities
    

### 4\. Product & Catalog Management

*   Add, update, delete, and manage products
    
*   Category hierarchy and brand support
    
*   Pagination, filtering, and search
    
*   Image upload and optimization via **Cloudinary**
    
*   Stock and variant management
    

### 5\. Order & Return Management

*   Full order lifecycle: Pending → Confirmed → Shipped → Delivered
    
*   Return module for refund and replacement workflows
    
*   Invoice and tracking support
    

### 6\. Payment Integration

#### Stripe

*   Payment Intent creation
    
*   Secure order confirmation
    
*   Webhook support
    

#### SSLCommerz

*   Local payment gateway for Bangladesh
    
*   Hosted payment gateway flow
    
*   Transaction validation
    
*   Order status synchronization
    

### 7\. Coupon & Discount System

*   Percentage and fixed discount types
    
*   Usage limit and expiry validation
    
*   Applied during checkout
    

### 8\. Shipping & Delivery

*   Shipping zones and dynamic cost calculation
    
*   Delivery time estimation
    

### 9\. Review System

*   Only verified buyers can post reviews
    
*   Rating and review moderation
    
*   Average rating API endpoints
    

### 10\. Blog & Content Management

*   Blog categories and blog posts module
    
*   SEO-friendly slugs
    
*   Meta module for site-wide metadata
    

### 11\. Validation & Error Handling

*   All inputs validated through **Zod**
    
*   Centralized error handler
    
*   Fully typed responses
    

Tech Stack
----------

*   Node.js
    
*   Express.js (v5)
    
*   Prisma ORM
    
*   PostgreSQL
    
*   pnpm
    
*   Stripe
    
*   SSLCommerz
    
*   Cloudinary
    
*   Zod
    
*   bcryptjs
    
*   JWT
    
*   Nodemailer
    

### 📁 Project Structure (Simplified)
----------

src

├── modules

│ ├── auth

│ ├── product

│ ├── order

│ ├── payment

│ ├── brand

│ ├── category

│ ├── blogCategory

│ ├── blogPost

│ ├── coupon

│ ├── shipping

│ ├── return

│ ├── meta

│ └── user

├── utils

├── helpers

├── app.ts

└── server.ts

### 🛠 Installation & Setup

1\. Clone Repository

git clone https://github.com/your-username/genzmart-backend.git

cd genzmart-backend

2\. Install Dependencies

pnpm install

3\. Generate Prisma Schema

pnpm prisma:generate

4\. Run Migrations

pnpm prisma:migrate

5\. Start Development Server

pnpm dev

### 🔐 Environment Variables

Create a .env file:

DATABASE\_URL="postgresql://..."

JWT\_SECRET="your\_jwt\_secret"

JWT\_EXPIRES\_IN="7d"

STRIPE\_SECRET\_KEY=""

STRIPE\_WEBHOOK\_SECRET=""

SSL\_STORE\_ID=""

SSL\_STORE\_PASSWORD=""

SSL\_STORE\_URL=""

CLOUDINARY\_CLOUD\_NAME=""

CLOUDINARY\_API\_KEY=""

CLOUDINARY\_API\_SECRET=""

MAIL\_USER=""

MAIL\_PASS=""

### 📘 API Standards

RESTful endpoints

Zod request validation

Global error handler

Consistent response structure

### 📈 Future Roadmap

GenZMart is designed to grow. Upcoming planned modules include:

Product Inventory System

Real-time stock tracking

Stock logs

Low-stock alerts

Product Variant System

Size, color, material variations

SKU-wise inventory

Advanced Invoice System

Printable invoices

Tax/VAT calculation

Integrated email delivery

Return & Refund Workflow

Advanced return approval

Partial refund logic

Return item tracking

Delivery/Shipping Automation

Multi-vendor shipping service support

Real-time delivery updates

Product Manager Dashboard

Product creation

Variant and inventory management

Bulk upload

Customer Support Dashboard

Ticket creation

Order issue handling

Customer communication logs

### 🤝 Contributing

Pull requests are welcome.

For major changes, please open an issue first to discuss what you would like to change.