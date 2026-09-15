const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const mongoose = require("mongoose");
const uri = "mongodb+srv://osamarahal07_db_user:90RtVaRt1ZnnORkk@noor.oaioyb5.mongodb.net/qirtas?retryWrites=true&w=majority&appName=noor";

mongoose.connect(uri).then(async () => {
  console.log("Connected to DB");
  
  // Show current admin password
  const admin = await mongoose.connection.collection("users").findOne({ username: "admin" });
  console.log("Current admin password:", admin.password);
  
  // Check if it is bcrypt-hashed
  const isBcrypt = admin.password && admin.password.startsWith("$2b$");
  console.log("Is bcrypt hashed:", isBcrypt);
  
  if (isBcrypt) {
    // Reset to plain text "admin123"
    await mongoose.connection.collection("users").updateOne(
      { username: "admin" },
      { $set: { password: "admin123" } }
    );
    console.log("Password reset to: admin123");
  } else {
    console.log("Password is already plain text:", admin.password);
  }
  
  // Show all users
  const users = await mongoose.connection.collection("users").find({}).toArray();
  console.log("\nAll users after fix:");
  users.forEach(u => console.log("username:", u.username, "| password:", u.password, "| role:", u.role));
  
  process.exit(0);
}).catch(console.error);
