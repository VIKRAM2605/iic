import postgres from "postgres";
import dotenv from "dotenv";
import { lookup } from "dns/promises";

dotenv.config();

const connectionOptions = {
  ssl: "require",
  connection: { options: "-c statement_timeout=30000" },
};

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not defined.");
}

const shouldPreferIpv4 = process.env.DATABASE_IP_FAMILY !== "ipv6";
let db;

if (shouldPreferIpv4) {
  try {
    const parsedUrl = new URL(databaseUrl);
    const hostname = parsedUrl.hostname;
    const { address } = await lookup(hostname, { family: 4 });

    db = postgres(databaseUrl, {
      ...connectionOptions,
      host: address,
      port: Number(parsedUrl.port || 5432),
      database: parsedUrl.pathname.replace(/^\//, ""),
      username: decodeURIComponent(parsedUrl.username),
      password: decodeURIComponent(parsedUrl.password),
      ssl: {
        rejectUnauthorized: true,
        servername: hostname,
      },
    });
  } catch {
    db = postgres(databaseUrl, connectionOptions);
  }
} else {
  db = postgres(databaseUrl, connectionOptions);
}

export default db;
