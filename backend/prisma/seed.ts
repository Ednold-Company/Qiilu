import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, VehicleServiceKind, VehicleType } from "@prisma/client";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.transaction.deleteMany();
  await prisma.ride.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  const car = await prisma.vehicle.create({
    data: {
      category: VehicleType.CAR,
      serviceKind: VehicleServiceKind.PRIVATE,
      seats: 4,
      description: "Sedan with air conditioning",
      baseFareGhs: 18,
      etaMinutes: 4,
      nearbyCount: 9
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
