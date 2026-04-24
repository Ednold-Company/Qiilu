import "dotenv/config";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
const adminPhone = process.env.SEED_ADMIN_PHONE?.trim();
const adminPassword = process.env.SEED_ADMIN_PASSWORD?.trim();
const adminName = process.env.SEED_ADMIN_NAME?.trim() || "Qiilu Ops";

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

if (!adminPhone || !adminPassword) {
  throw new Error("SEED_ADMIN_PHONE and SEED_ADMIN_PASSWORD must be set");
}

const pool = new pg.Pool({ connectionString });

async function main() {
  const client = await pool.connect();

  try {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const existingUser = await client.query<
      { id: string; role: "ADMIN" | "PASSENGER" | "DRIVER" }
    >(
      `SELECT "id", "role"
       FROM "User"
       WHERE "phone" = $1
       LIMIT 1`,
      [adminPhone]
    );

    if (existingUser.rowCount && existingUser.rows[0]) {
      const user = existingUser.rows[0];
      await client.query(
        `UPDATE "User"
         SET "role" = 'ADMIN',
             "name" = $2,
             "passwordHash" = $3,
             "updatedAt" = NOW()
         WHERE "id" = $1`,
        [user.id, adminName, passwordHash]
      );

      console.log(
        JSON.stringify(
          {
            admin: {
              action: user.role === "ADMIN" ? "updated" : "promoted",
              phone: adminPhone,
              name: adminName
            }
          },
          null,
          2
        )
      );
      return;
    }

    await client.query(
      `INSERT INTO "User" (
         "id",
         "role",
         "name",
         "phone",
         "passwordHash",
         "momoProvider",
         "lowBandwidthMode",
         "safetyShareEnabled",
         "availability",
         "createdAt",
         "updatedAt"
       )
       VALUES (
         $1,
         'ADMIN',
         $2,
         $3,
         $4,
         'MTN MoMo',
         false,
         true,
         'OFFLINE',
         NOW(),
         NOW()
       )`,
      [randomUUID(), adminName, adminPhone, passwordHash]
    );

    console.log(
      JSON.stringify(
        {
          admin: {
            action: "created",
            phone: adminPhone,
            name: adminName
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
