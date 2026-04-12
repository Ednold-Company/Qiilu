import "dotenv/config";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new pg.Pool({ connectionString });

async function main() {
  const client = await pool.connect();

  try {
    await client.query('DELETE FROM "SupportIncident"');
    await client.query('DELETE FROM "OtpCode"');
    await client.query('DELETE FROM "KycSubmission"');
    await client.query('DELETE FROM "PayoutRequest"');
    await client.query('DELETE FROM "Transaction"');
    await client.query('DELETE FROM "Ride"');
    await client.query('DELETE FROM "Wallet"');
    await client.query('DELETE FROM "Vehicle"');
    await client.query('DELETE FROM "User" WHERE "role" <> \'ADMIN\'');

    const carId = randomUUID();
    await client.query(
      `INSERT INTO "Vehicle" ("id","category","serviceKind","seats","description","active","baseFareGhs","etaMinutes","nearbyCount","createdAt","updatedAt")
       VALUES ($1,'CAR','PRIVATE',4,$2,true,18,4,9,NOW(),NOW())`,
      [carId, "Sedan with air conditioning"]
    );

    if (process.env.SEED_ADMIN_PHONE && process.env.SEED_ADMIN_PASSWORD) {
      const adminId = randomUUID();
      const adminPassword = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD, 10);

      await client.query('DELETE FROM "User" WHERE "role" = \'ADMIN\'');
      await client.query(
        `INSERT INTO "User" ("id","role","name","phone","passwordHash","momoProvider","lowBandwidthMode","safetyShareEnabled","availability","createdAt","updatedAt")
         VALUES ($1,'ADMIN',$2,$3,$4,'MTN MoMo',false,true,'OFFLINE',NOW(),NOW())`,
        [adminId, "Qiilu Ops", process.env.SEED_ADMIN_PHONE, adminPassword]
      );

      console.log(
        JSON.stringify(
          {
            seeded: {
              vehicle: "CAR",
              admin: {
                phone: process.env.SEED_ADMIN_PHONE
              }
            }
          },
          null,
          2
        )
      );
      return;
    }

    console.log(
      JSON.stringify(
        {
          seeded: {
            vehicle: "CAR",
            admin: "skipped"
          }
        },
        null,
        2
      )
    );
  } finally {
    client.release();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
