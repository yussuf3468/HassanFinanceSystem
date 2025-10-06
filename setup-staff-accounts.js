// Setup script to create staff accounts
// Run this in Supabase SQL Editor or use Supabase Admin API

const staffAccounts = [
  {
    email: "admin@bookshop.so",
    password: "YussufMuse2024@Admin", // Strong password for admin
    name: "Yussuf Muse (Admin)",
    role: "admin",
  },
  {
    email: "zakaria@bookshop.so",
    password: "Zakaria2024@Staff", // Strong password for staff
    name: "Zakaria",
    role: "staff",
  },
  {
    email: "khaled@bookshop.so",
    password: "Khaled2024@Staff", // Strong password for staff
    name: "Khaled",
    role: "staff",
  },
];

// Note: These accounts need to be created manually in Supabase Dashboard
// or using the Supabase Admin API due to security restrictions

console.log("=== HASSAN MUSE BOOKSHOP - STAFF LOGIN CREDENTIALS ===\n");

staffAccounts.forEach((account, index) => {
  console.log(`${index + 1}. ${account.name}`);
  console.log(`   Email: ${account.email}`);
  console.log(`   Password: ${account.password}`);
  console.log(`   Role: ${account.role}`);
  console.log("   ---");
});

console.log("\n📝 IMPORTANT INSTRUCTIONS:");
console.log("1. Go to your Supabase Dashboard");
console.log("2. Navigate to Authentication > Users");
console.log('3. Click "Add User" button');
console.log("4. Create each account with the credentials above");
console.log('5. Set "Email Confirm" to true for each user');
console.log("6. Share these credentials securely with your staff");

console.log("\n🔒 SECURITY NOTES:");
console.log("- Change passwords after first login");
console.log("- Keep credentials secure and private");
console.log("- Each staff member should only know their own password");
console.log("- Yussuf Muse (Admin) has full access to all features");

export { staffAccounts };