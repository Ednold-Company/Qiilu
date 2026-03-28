export const vehicles = [
  {
    id: "veh-car-1",
    category: "Car",
    type: "Private",
    seats: 4,
    description: "Toyota Corolla with air conditioning",
    active: true
  },
  {
    id: "veh-tricycle-1",
    category: "Tricycle",
    type: "Shared",
    seats: 3,
    description: "Aboboyaa for quick campus movement",
    active: true
  },
  {
    id: "veh-bike-1",
    category: "Motorbike",
    type: "Private",
    seats: 1,
    description: "High speed dispatch for dense traffic",
    active: true
  }
];

export const rides = [
  {
    id: "ride-1001",
    status: "searching",
    passengerId: "user-passenger-1",
    pickup: "East Legon A and C Mall",
    destination: "Airport City",
    vehicleType: "Car",
    estimatedFareGhs: 18,
    paymentMethod: "MoMo"
  },
  {
    id: "ride-1002",
    status: "accepted",
    passengerId: "user-passenger-2",
    pickup: "Kotokuraba Station",
    destination: "Teaching Hospital",
    vehicleType: "Tricycle",
    estimatedFareGhs: 13,
    paymentMethod: "Cash"
  }
];

export const wallets = [
  {
    userId: "user-driver-1",
    balanceGhs: 642.4,
    cashGhs: 246.1,
    momoGhs: 396.3,
    pendingWithdrawalGhs: 0
  }
];

export const transactions = [
  {
    id: "txn-901",
    walletUserId: "user-driver-1",
    kind: "trip-credit",
    amountGhs: 18,
    channel: "MoMo",
    createdAt: "2026-03-24T10:24:00.000Z"
  },
  {
    id: "txn-902",
    walletUserId: "user-driver-1",
    kind: "commission-debit",
    amountGhs: -2.7,
    channel: "system",
    createdAt: "2026-03-24T10:24:10.000Z"
  }
];

export const users = [
  {
    id: "user-passenger-1",
    role: "passenger",
    name: "Ama Badu",
    phone: "+233240000001",
    preferredPayment: "MoMo"
  },
  {
    id: "user-driver-1",
    role: "driver",
    name: "Kofi Mensah",
    phone: "+233240000002",
    kycStatus: "verified"
  }
];
