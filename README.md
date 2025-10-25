# Multi-Vendor E-commerce Platform

A modern e-commerce platform that supports multiple vendors, real-time cart updates, wishlists, and a seamless checkout process.

## Features

### Authentication
- User authentication (Sign Up/Sign In)
- Vendor authentication with separate dashboard
- Secure authentication powered by Firebase

### Product Management
- Comprehensive product listing
- Category-wise browsing (Men's/Women's)
- Advanced filtering options
- Dynamic sorting capabilities
- Detailed product pages with specifications

### Shopping Features
- Real-time cart management
  - Add/Remove items
  - Quantity updates
  - Price calculations
- Wishlist functionality
  - Add/Remove products
  - Real-time updates
  - Easy transfer to cart

### User Dashboard
- Personal profile management
- Order history and tracking
- Address management
- Wishlist management
- Cart management

### Vendor Features
- Product management dashboard
- Add/Edit/Remove products
- Order management
- Sales analytics

### Checkout Process
- Secure checkout flow
- Multiple payment options
- Address selection/addition
- Order confirmation

## Technology Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Firebase
- Authentication: Firebase Auth
- Database: Firebase Realtime Database
- Storage: Firebase Storage

## Project Structure

```
├── Assets/              # Static assets and images
├── Auth/               # Authentication related files
├── HeaderFooter/       # Common header and footer components
├── Product-Details/    # Product detail page and logic
├── Products/           # Product listing and filtering
├── User/              # User dashboard and features
│   ├── Cart/         # Shopping cart functionality
│   ├── Checkout/     # Checkout process
│   ├── Orders/       # Order management
│   └── Wishlist/     # Wishlist functionality
└── Vendor/           # Vendor dashboard and management
```

## Setup Instructions

1. Clone the repository
2. Configure Firebase settings in `firebase-config.js`
3. Open `index.html` in a modern web browser
4. Start exploring the features!

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.