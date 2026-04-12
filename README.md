# Qiilu

Qiilu is a ride-hailing platform prototype designed for African markets such as Ghana. This workspace now includes:

- `frontend/`: a Next.js app with separate passenger and driver experiences
- `backend/`: an Express + WebSocket-ready API with Prisma, auth, routing, admin ops, and driver/passenger flows
- `passenger.html` and `rider.html`: original standalone prototype screens

## Product focus

- Real-time ride discovery and request flow
- Car-only booking flow with route-based fare, ETA, and distance estimation
- Driver operations, earnings, wallet, and request management
- Admin operations for KYC, payout approvals, and support incidents
- Mobile Money, trust-circle, and low-bandwidth support
- USSD booking for riders without mobile data
- OTP + password login for the live web app
- Next.js 16 `proxy.ts` route protection for passenger, driver, and admin web flows

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

Set up local environment files before starting:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

### Optional routing upgrade

Qiilu now supports real route estimation through the backend.

- If `MAPBOX_ACCESS_TOKEN` is set in `backend/.env`, the API uses Mapbox geocoding and directions.
- If it is not set, the app falls back to public routing/geocoding services and known Accra locations for development.

### Seed data for local demos

After the database is configured, you can seed a local demo environment:

```bash
cd backend
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
```

The seed creates:

- one live `CAR` vehicle configuration
- an admin account only if `SEED_ADMIN_PHONE` and `SEED_ADMIN_PASSWORD` are provided

You can override the seeded admin identity with:

- `SEED_ADMIN_PHONE`
- `SEED_ADMIN_PASSWORD`

For development OTP testing, set `OTP_PROVIDER=console` and the backend will return the one-time code in the API response.
For live OTP delivery over email, set `OTP_PROVIDER=smtp` and provide your SMTP credentials.

## Auth and roles

Qiilu now supports:

- password signup for passengers and drivers
- password login for passengers, drivers, and admin users
- OTP login for passengers, drivers, and admin users
- protected dashboard routing through `frontend/proxy.ts`

Local role entry points:

- passenger app: `http://localhost:3000/passenger`
- driver console: `http://localhost:3000/driver`
- admin console: `http://localhost:3000/admin`

## USSD flow

Qiilu now includes a low-bandwidth USSD booking entry point at `POST /ussd/entry`.

Expected payload:

```json
{
  "sessionId": "12345",
  "serviceCode": "*920*123#",
  "phoneNumber": "+233240000000",
  "text": "1*2*3*1*1"
}
```

Menu path:

1. `1` starts a car ride request
2. choose pickup from the listed locations
3. choose destination
4. choose payment method
5. confirm booking

USSD rides are created as real rides in the same database, use the `USSD` request source, and appear in the live driver request queue.

Useful endpoints:

- `POST /ussd/entry`: USSD aggregator callback target
- `GET /ussd/locations`: inspect the current menu locations used by the USSD flow

## Deployment

### Backend

The backend includes a production `Dockerfile`, so it can be deployed to Railway, Render, Fly.io, or any container host.

Required backend environment variables:

- `DATABASE_URL`
- `JWT_SECRET`
- `FRONTEND_ORIGIN`
- `OTP_PROVIDER` optional, use `console` for local OTP testing or `smtp` for email OTP delivery
- `SMTP_HOST` required when `OTP_PROVIDER=smtp`
- `SMTP_PORT` required when `OTP_PROVIDER=smtp`
- `SMTP_SECURE` optional, use `true` for port `465`
- `SMTP_USER` required when `OTP_PROVIDER=smtp`
- `SMTP_PASS` required when `OTP_PROVIDER=smtp`
- `SMTP_FROM` optional sender identity for outbound OTP emails
- `PAYMENT_PROVIDER` optional, set to `paystack` to enable live MoMo collections and payouts
- `PAYSTACK_SECRET_KEY` required when `PAYMENT_PROVIDER=paystack`
- `PAYSTACK_WEBHOOK_SECRET` optional override for webhook signature validation
- `PAYSTACK_CALLBACK_URL` optional return URL after Paystack checkout
- `MAPBOX_ACCESS_TOKEN` optional
- `SEED_ADMIN_PHONE` optional
- `SEED_ADMIN_PASSWORD` optional
- `PORT` optional

Recommended backend release flow:

```bash
npm install
npm run prisma:generate
npm run build
```

Container startup already runs `prisma db push` before starting the API.

### Frontend

Deploy the Next.js app from the `frontend` directory to Vercel.

Required frontend environment variables:

- `NEXT_PUBLIC_API_URL`

Recommended Vercel settings:

1. Set the project root directory to `frontend`
2. Set `NEXT_PUBLIC_API_URL` to your deployed backend URL
3. Keep `Node.js` on the current Vercel default runtime

### Cross-origin production setup

If the frontend and backend are on different domains:

- set `FRONTEND_ORIGIN` to a comma-separated list of allowed frontend URLs
- keep using JWT auth from the frontend API helper
- Qiilu mirrors lightweight routing cookies on the frontend domain so `proxy.ts` can still protect routes in production

## Current production shape

- Next.js 16 frontend with passenger, driver, and admin apps
- Express + Prisma backend with realtime WebSocket updates
- Neon/Postgres-ready Prisma setup
- Real map routing with Mapbox or OSRM fallback
- OTP and password authentication
- SMTP email OTP support for signup and email verification
- Paystack-ready Mobile Money collections, wallet top-ups, and driver payout transfers
- Driver wallet payout requests and KYC submission flow
- Admin dashboard for payouts, KYC, dispatch, and support
- USSD ride intake for low-connectivity users

## Paystack integration

Qiilu now supports Paystack as an optional payment provider for Ghana MoMo flows.

- Set `PAYMENT_PROVIDER=paystack`
- Set `PAYSTACK_SECRET_KEY`
- Point your Paystack webhook to `POST /payments/webhooks/paystack`
- Optionally set `PAYSTACK_CALLBACK_URL` to the frontend page you want Paystack to return users to after approval

What is wired today:

- passenger MoMo ride checkouts initialize through Paystack
- driver wallet top-ups initialize through Paystack
- driver payout requests create Paystack transfer recipients and transfers
- webhook reconciliation updates wallet credits and payout settlement status

## Suggested next steps

1. Connect the USSD endpoint to a live provider such as Hubtel or Africa's Talking.
2. Add phone-number-first signup with OTP verification and document upload storage.
3. Replace demo admin actions with audited workflows, notifications, and background jobs.
4. Add automated API tests, end-to-end booking tests, and production observability.
5. Add background jobs for payout retry, payment reconciliation, and provider failure alerts.
