# Product Admin Dashboard

A responsive Product Admin Dashboard built with Next.js, React, JavaScript, Tailwind CSS, Axios, and the DummyJSON API.

The application allows authenticated users to view, search, filter, sort, add, edit, view, and delete products through a simple admin interface.

## Features

### Authentication
- Login using DummyJSON authentication
- Demo credentials
- Protected product routes
- Logout functionality
- Axios-based authorization handling
- Duplicate login request prevention

### Product Management
- Product listing
- Product details
- Add product
- Edit product
- Delete product
- Delete confirmation modal
- Product image gallery
- Product reviews

### Search and Filtering
- Debounced product search
- Category filtering
- Price sorting
- Rating sorting
- Title sorting
- Search/category mutual exclusivity based on DummyJSON API limitations

### Pagination
- Previous / Next navigation
- Page numbers
- Page size selection
- 10 / 20 / 50 products per page
- Showing current result range

### URL State
Search, category, sorting, page, and page size are reflected in the URL.

Example:

`/products?page=2&pageSize=20&search=phone`

### Error Handling
- Loading states
- Empty states
- API error states
- Retry functionality
- Invalid product handling
- Invalid URL parameter handling
- Duplicate request prevention

### Responsive Design
The dashboard supports:

- Desktop table layout
- Mobile card layout
- Responsive forms
- Responsive product details
- Responsive confirmation modal

## Tech Stack

- Next.js
- React
- JavaScript
- Tailwind CSS
- Axios
- DummyJSON API

## Project Structure

src/
├── app/
│   ├── login/
│   │   └── page.js
│   │
│   ├── products/
│   │   ├── layout.js
│   │   ├── page.js
│   │   ├── add/
│   │   │   └── page.js
│   │   └── [id]/
│   │       ├── page.js
│   │       └── edit/
│   │           └── page.js
│   │
│   ├── layout.js
│   ├── page.js
│   └── globals.css
│
├── components/
│   ├── ConfirmModal.jsx
│   └── ProtectedRoute.jsx
│
├── context/
│   └── ProductContext.jsx
│
├── hooks/
│   └── useDebounce.js
│
├── lib/
│   └── axios.js
│
├── services/
│   ├── authApi.js
│   └── productApi.js
│
└── utils/
    └── auth.js

Setup & Installation

Clone the GitHub repository by running the command git clone 
https://github.com/HSBADGUJAR/product-admin-dashboard.git

Open the Project Directory by moving into the project folder with cd product-admin-dashboard. 

Install Dependencies by running npm install. This will install the packages listed in package.json.

Environment Variables — The current version of this project does not require any environment variables. The application uses the public DummyJSON API at https://dummyjson.com. Therefore, you do not need to create a .env.local file for the current version. 

Start the Development Server by running npm run dev. After the server starts, open http://localhost:3000.

Login — Use the following DummyJSON demo credentials. Username: emilys. Password: emilyspass. After successful login, the application redirects to /products.

Test the Application — Once logged in, explore the product page, verify the authentication flow.