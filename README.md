# LayerForge 3D — Full Stack Monorepo

Welcome to the **LayerForge 3D** project repository. This is a full-stack, end-to-end e-commerce and 3D printing service platform built with the MERN stack (MongoDB, Express, React Native, Node.js). 

## Key Features

* **User Authentication**: Secure JWT-based login, registration, and role management (Admin vs. Customer) using Context APIs.
* **Shop & Cart**: Browse custom 3D products, view details, manage a persistent shopping cart, and submit shop orders.
* **Custom 3D Printing Service (STL Upload)**: A fully integrated wizard allowing users to upload `.stl` files, select materials (PLA, ABS, Resin), set print details, and request quotes.
* **Admin Dashboard**: Comprehensive management suite including:
    * **Cost Calculator**: Admin tool to calculate production costs (material, energy, machine time, labor) and suggest selling prices.
    * **Order Management**: Update statuses, manage tracking numbers, and review customer details for both Shop and Custom STL orders.
    * **Product Management**: Full CRUD interface for the product catalogue, including multipart image uploads.
* **Thoroughly Documented Codebase**: Every major screen, context provider, route, and controller contains detailed line-by-line comments explaining data flow, validation rules, and business logic.

## 🛠️ Tech Stack

| Layer      | Technology               |
|------------|--------------------------|
| Mobile App | React Native + Expo SDK 54 |
| Backend    | Node.js + Express 4      |
| Database   | MongoDB + Mongoose 8     |
| File Upload| Multer                   |
| Auth       | JWT (jsonwebtoken)       |
| API Calls  | Axios                    |

## Repository Structure

```text
LayerForge-3D_WMT/
  ├── backend-node/   ← REST API (Node.js/Express) running on port 8080
  │   ├── src/models/       (Mongoose schemas with business logic documentation)
  │   ├── src/routes/       (API route definitions)
  │   ├── src/controllers/  (Request handling & database interaction)
  │   ├── src/middleware/   (Validation, Authentication, Image Uploads)
  │   └── public/           (Static uploads directory for images and STL files)
  │
  └── mobile/         ← React Native + Expo Mobile Application
      ├── app/screens/      (UI views: Admin, Auth, Shop, Upload - fully documented)
      ├── app/context/      (Global state management: AuthContext, CartContext)
      ├── app/lib/          (Axios API instance and config)
      └── app/data/         (Static data, categories, constants)
```

## Quick Start

### 1. Database Setup
Ensure MongoDB is running locally: 
```bash
mongod
```

### 2. Start Backend API
```bash
cd backend-node
npm install
npm run dev
```
* The backend will be available at: `http://localhost:8080`
  

### 3. Start Mobile Application
```bash
cd mobile
npm install
npx expo start
```
* Scan the QR code with the Expo Go app on your physical device.

> **Network Note:** To test on a physical device, update the `API_BASE_URL` inside `mobile/app/lib/config.js` from `localhost` to your computer's local network IP address (e.g., `192.168.1.X`).

## 🌐 API Endpoints Overview

| Method | Path | Auth Required |
|--------|------|------|
| POST | `/auth/register` | Public |
| POST | `/auth/login` | Public |
| GET | `/api/products` | Public |
| POST/PUT/DELETE | `/api/products/:id` | Admin Only |
| GET/POST/PUT/DELETE | `/cart` | Authenticated User |
| POST/GET | `/orders` | Authenticated User |
| GET/PUT | `/orders/admin/**` | Admin Only |
| POST | `/api/uploads/stl` | Public / Authenticated |
| GET/PUT | `/stl-orders/my/**` | Authenticated User |
| GET/PUT/DELETE | `/stl-orders/admin/**` | Admin Only |
| POST | `/stl-orders/calculate-cost` | Admin Only |
