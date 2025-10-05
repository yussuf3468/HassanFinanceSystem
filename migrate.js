import { supabase } from "./src/lib/supabase.js";
import fs from "fs";

async function runMigration() {
  try {
    console.log("Running database migration...");

    // Read the migration file
    const migration = fs.readFileSync(
      "./supabase/migrations/20251005134155_create_bookstore_schema.sql",
      "utf8"
    );

    // Split into individual statements (rough approach)
    const statements = migration
      .split(";")
      .map((stmt) => stmt.trim())
      .filter(
        (stmt) =>
          stmt.length > 0 && !stmt.startsWith("/*") && !stmt.startsWith("--")
      );

    console.log(`Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        const { error } = await supabase.rpc("exec_sql", { sql: statement });
        if (error) {
          console.error(`Error in statement ${i + 1}:`, error);
        }
      }
    }

    console.log("Migration completed!");
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

runMigration();
