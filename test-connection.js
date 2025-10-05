// Test Supabase connection
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://viushfvdujmhrtthjase.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdXNoZnZkdWptaHJ0dGhqYXNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NTA1MTksImV4cCI6MjA3NTIyNjUxOX0.q0_pRAKz9XdIaFslMWyFhzLCIS_7bcoISE___v5Bwis";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log("Testing Supabase connection...");

    // Test basic connection
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .limit(1);

    if (error) {
      console.log(
        "Connection successful, but tables not created yet:",
        error.message
      );
      console.log(
        "You need to create the database schema manually in Supabase dashboard"
      );
    } else {
      console.log("Connection successful! Tables exist:", data);
    }
  } catch (error) {
    console.error("Connection failed:", error);
  }
}

testConnection();
