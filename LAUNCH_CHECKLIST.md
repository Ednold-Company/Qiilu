# Qiilu Launch Checklist

This checklist is the working launch tracker for Qiilu.

Use it to decide whether Qiilu is ready for:

- internal demo
- closed beta
- public launch

## Status key

- `[ ]` not started
- `[~]` in progress
- `[x]` complete
- `BLOCKED` cannot proceed until an external dependency is resolved

## Current recommendation

Qiilu is currently best suited for:

- `[x]` internal demo
- `[x]` stakeholder review
- `[ ]` closed beta
- `[ ]` public launch

## Launch gates

Qiilu should not be treated as public-launch ready until all items in `Must Have Before Launch` are complete.

## Must Have Before Launch

### 1. Production deployment

- [ ] Deploy backend to Railway
- [ ] Deploy frontend to Vercel
- [ ] Confirm backend `GET /health/live`
- [ ] Confirm backend `GET /health/ready`
- [ ] Confirm frontend can reach backend using production `NEXT_PUBLIC_API_URL`
- [ ] Confirm `FRONTEND_ORIGIN` matches the deployed frontend domain
- [ ] Confirm websocket/realtime connection works in production

Notes:

-

### 2. Secrets and environment safety

- [ ] Rotate all real secrets before launch
- [ ] Confirm no real secrets remain in git history that are still active
- [ ] Confirm production env vars are set only in Railway/Vercel
- [ ] Confirm `.env` files are not committed

Critical secrets:

- [ ] `DATABASE_URL`
- [ ] `JWT_SECRET`
- [ ] `SMTP_*`
- [ ] `PAYSTACK_SECRET_KEY`
- [ ] `PAYSTACK_WEBHOOK_SECRET`
- [ ] `MAPBOX_ACCESS_TOKEN`

Notes:

-

### 3. Authentication and access control

- [ ] Passenger signup works in production
- [ ] Driver signup works in production
- [ ] OTP email delivery works reliably
- [ ] Login works for passenger, driver, and admin
- [ ] Logout clears session correctly
- [ ] Protected routes redirect correctly
- [ ] Admin routes are blocked for non-admin users
- [ ] Driver routes are blocked for passengers
- [ ] Passenger routes are blocked for drivers

Notes:

-

### 4. Payments

- [ ] Passenger ride payment works in staging/production
- [ ] Driver wallet top-up works
- [ ] Driver payout request works
- [ ] Paystack webhook is configured
- [ ] Payment callback URL is configured
- [ ] Failed payment flow is handled cleanly
- [ ] Duplicate webhook handling is safe
- [ ] Wallet balances reconcile correctly

Notes:

-

### 5. Dispatch and trips

- [ ] Passenger can request a ride in production
- [ ] Search state is honest when no driver has accepted
- [ ] Only available, connected drivers can accept
- [ ] Driver can accept a ride
- [ ] Driver can start a ride
- [ ] Driver can complete a ride
- [ ] Passenger receives realtime ride updates
- [ ] Driver location updates flow correctly
- [x] Passenger can cancel before assignment or during search

Notes:

-

### 6. KYC and compliance

- [ ] Decide KYC provider or secure manual review process
- [ ] Secure document upload/storage is implemented
- [ ] Driver KYC review flow is production-safe
- [ ] Passenger KYC policy is defined if required
- [ ] Admin KYC approval/rejection flow is tested

Status:

- BLOCKED until provider or secure document workflow is finalized

Notes:

-

### 7. Monitoring and operations

- [x] Error tracking hooks are implemented
- [ ] Basic uptime monitoring is enabled
- [x] Backend logs are available in production
- [ ] Payment failures are visible to ops
- [ ] KYC review failures are visible to ops
- [ ] Support incidents are visible in admin

Notes:

-

### 8. Security and abuse protection

- [ ] Rate limiting is verified in production
- [ ] OTP abuse protection is reviewed
- [ ] Auth brute-force protection is reviewed
- [ ] Payment endpoints are reviewed for abuse
- [ ] Webhook signature verification is confirmed

Notes:

-

## Should Have Before Launch

### Testing

- [x] API tests for auth
- [ ] API tests for route estimates
- [x] API tests for ride booking
- [x] API tests for payments
- [ ] API tests for messaging
- [ ] End-to-end test for passenger booking flow
- [ ] End-to-end test for driver trip flow

### Product quality

- [ ] Empty states reviewed across passenger UI
- [ ] Empty states reviewed across driver UI
- [ ] Error states reviewed across auth flows
- [ ] Error states reviewed across payment flows
- [ ] Mobile responsiveness checked across main routes
- [ ] Theme toggle checked across all main pages

### Operations quality

- [x] Admin audit log for KYC actions
- [x] Admin audit log for payout actions
- [ ] Support incident workflow reviewed
- [ ] Manual recovery steps documented for failed payments

## Can Wait Until After Launch

- [ ] Native mobile apps
- [ ] Advanced dispatch optimization
- [ ] Growth/promo system
- [ ] Expanded vehicle categories
- [ ] More exact source-fidelity polish on every UI file
- [ ] Advanced analytics dashboards

## Closed beta exit criteria

Before starting a closed beta:

- [ ] Production deploy is live
- [ ] Auth works end to end
- [ ] Route estimates work
- [ ] Ride request flow works
- [ ] Driver acceptance flow works
- [ ] Basic payment flow works
- [ ] Admin can review incidents and KYC
- [ ] Monitoring is enabled

## Public launch exit criteria

Before starting a public launch:

- [ ] All `Must Have Before Launch` items are complete
- [ ] Closed beta feedback has been addressed
- [ ] Payment reconciliation is proven
- [ ] KYC/document handling is production-safe
- [ ] Support workflow is staffed and tested

## Go-live verification run

Run this checklist on the deployed app before launch day:

### Passenger

- [ ] Signup
- [ ] Login
- [ ] Request ride
- [ ] Receive realtime updates
- [ ] View ride history
- [ ] Open messaging
- [ ] Logout

### Driver

- [ ] Signup/login
- [ ] Go online
- [ ] See request queue
- [ ] Accept trip
- [ ] Start trip
- [ ] Complete trip
- [ ] Open wallet
- [ ] Submit payout request
- [ ] Open messaging
- [ ] Logout

### Admin

- [ ] Login
- [ ] View KYC queue
- [ ] Approve or reject a KYC item
- [ ] View payout queue
- [ ] Process a payout item
- [ ] View support incidents

### Platform

- [ ] Health endpoints return expected status
- [ ] Realtime connection works
- [ ] SMTP delivery works
- [ ] Paystack webhook receives events
- [ ] Logs are visible

## Owners

Use this section if you want to assign responsibilities later.

- Product:
- Frontend:
- Backend:
- Ops:
- Payments:
- KYC/Compliance:
