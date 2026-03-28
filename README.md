# Qiilu

Qiilu is a ride-hailing platform prototype designed for African markets such as Ghana. This workspace now includes:

- `frontend/`: a Next.js app with separate passenger and driver experiences
- `backend/`: an Express + WebSocket-ready API with Prisma, auth, routing, and driver/passenger flows
- `passenger.html` and `rider.html`: original standalone prototype screens

## Product focus

- Real-time ride discovery and request flow
- Car-only booking flow with route-based fare, ETA, and distance estimation
- Driver operations, earnings, wallet, and request management
- Mobile Money, trust-circle, and low-bandwidth support
- Next.js 16 `proxy.ts` route protection for passenger and driver web flows

## Quick start

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

### Backend

```bash
cd backend
npm install
npm run dev
```

API runs on `http://localhost:4000`.

### Optional routing upgrade

Qiilu now supports real route estimation through the backend.

- If `MAPBOX_ACCESS_TOKEN` is set in `backend/.env`, the API uses Mapbox geocoding and directions.
- If it is not set, the app falls back to public routing/geocoding services and known Accra locations for development.

## Suggested next steps

1. Add live WebSocket trip matching and driver movement updates.
2. Replace development routing fallback with fully production-managed map infrastructure.
3. Add OTP authentication, KYC uploads, and driver onboarding approval.
4. Integrate real MTN MoMo and Telecel Cash collections and payouts.
5. Add an admin and safety operations console for disputes, incidents, and commission control.
