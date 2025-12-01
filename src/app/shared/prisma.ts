import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// Create a PostgreSQL connection pool
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter: adapter,
  log: [
    {
      emit: "event",
      level: "query",
    },
    {
      emit: "event",
      level: "error",
    },
    {
      emit: "event",
      level: "info",
    },
    {
      emit: "event",
      level: "warn",
    },
  ],
});

prisma.$on("query", (e) => {
  // console.log("-------------------------------------------");
  // console.log("Query: " + e.query);
  // console.log("-------------------------------------------");
  // console.log("Params: " + e.params);
  // console.log("-------------------------------------------");
  // console.log("Duration: " + e.duration + "ms");
  // console.log("-------------------------------------------");
});

export default prisma;
