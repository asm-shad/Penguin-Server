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
    

Environment Variables
---------------------

Create a .env file:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   DATABASE_URL=  JWT_SECRET=  CLOUDINARY_CLOUD_NAME=  CLOUDINARY_API_KEY=  CLOUDINARY_API_SECRET=  STRIPE_SECRET_KEY=  STRIPE_WEBHOOK_SECRET=  SSLC_STORE_ID=  SSLC_STORE_PASS=  SSLC_SUCCESS_URL=  SSLC_FAIL_URL=  SSLC_CANCEL_URL=  PORT=5000   `

Installation & Setup
--------------------

### 1\. Clone Repository

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   git clone https://github.com//genzmart-backend.git  cd genzmart-backend   `

### 2\. Install Dependencies

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   pnpm install   `

### 3\. Prisma Setup

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   pnpm run build:schema  pnpm run prisma:generate  pnpm run prisma:migrate   `

### 4\. Start Development Server

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   pnpm run dev   `

### 5\. Production Build

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   pnpm run build  pnpm start   `

Available Scripts
-----------------

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   pnpm run dev                # Development server  pnpm run build              # Build TypeScript  pnpm run start              # Run production build  pnpm run build:schema       # Merge modular Prisma schemas  pnpm run prisma:generate    # Generate Prisma client  pnpm run prisma:migrate     # Run database migrations  pnpm run stripe:webhook     # Stripe webhook listener   `