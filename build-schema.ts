// build-schema.ts

import * as fs from "fs";
import * as path from "path";

// Define directories and output path relative to the script's location (project root)
const projectRoot = __dirname;
const schemaDir = path.join(projectRoot, "prisma", "schema");
const outputFilePath = path.join(projectRoot, "prisma", "schema.prisma");

// Define the precise order of files to ensure correct dependencies (e.g., enums before models)
const schemaFileOrder: string[] = [
  "head.pschema",
  "enums.pschema",
  "user_address.pschema",
  "product_inventory.pschema",
  "order_payment.pschema",
  "returns.pschema",
  "blog.pschema",
  "misc.pschema",
];

let finalSchema = "";

console.log("🏗️ Building Prisma schema from multiple files...");

schemaFileOrder.forEach((fileName) => {
  const filePath = path.join(schemaDir, fileName);

  if (fs.existsSync(filePath)) {
    console.log(`  - Adding ${fileName}`);
    const content = fs.readFileSync(filePath, "utf-8");

    // Add a separator comment for clarity in the final schema.prisma file
    finalSchema += `\n// --- Start of ${fileName} ---\n\n`;
    finalSchema += content;
    finalSchema += `\n// --- End of ${fileName} ---\n\n`;
  } else {
    console.warn(`⚠️ WARNING: File not found: ${fileName}. Skipping.`);
  }
});

// Write the combined content to the target file
try {
  fs.writeFileSync(outputFilePath, finalSchema);
  console.log(`✅ Successfully built combined schema at ${outputFilePath}`);
} catch (error) {
  console.error("❌ Error writing schema.prisma:", error);
  process.exit(1); // Exit with failure code
}
