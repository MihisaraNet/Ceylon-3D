# Ceylon 3D — Monorepo

## New Tech Stack

| Layer      | Technology               |
|------------|--------------------------|
| Mobile App | React Native + Expo SDK 54 |
| Backend    | Node.js + Express 4      |
| Database   | MongoDB + Mongoose 8     |
| File Upload| Multer                   |
| Auth       | JWT (jsonwebtoken)       |
| API Calls  | Axios                    |

## Structure

```
ceylon3D-main/
  backend-node/   ← Node.js/Express/MongoDB API (port 8080)
  mobile/         ← React Native + Expo mobile app
```

## Quick Start

### 1. Start MongoDB
Make sure MongoDB is running locally: `mongod`

### 2. Start Backend
```bash
cd backend-node
npm install
npm run dev
```
Backend will be available at: http://localhost:8080
Default admin: admin@ceylon3d.com / admin123

### 3. Start Mobile App
```bash
cd mobile
npm install
npx expo start
```
Scan the QR code with Expo Go app on your phone.

> **For physical device:** Change `API_BASE_URL` in `mobile/app/lib/config.js`
> from `localhost` to your machine's LAN IP (e.g. `192.168.1.x`).

## API Endpoints

| Method | Path | Auth |
|--------|------|------|
| POST | /auth/register | public |
| POST | /auth/login | public |
| GET | /api/products | public |
| POST | /api/products | admin |
| PUT | /api/products/:id | admin |
| DELETE | /api/products/:id | admin |
| GET/POST/PUT/DELETE | /cart | auth |
| POST/GET | /orders | auth |
| GET/PUT | /orders/admin/** | admin |
| POST | /api/uploads/stl | public+auth |
| GET/PUT | /stl-orders/my/** | auth |
| GET/PUT/DELETE | /stl-orders/admin/** | admin |
| POST | /stl-orders/calculate-cost | auth |
