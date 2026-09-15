const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const mongoose = require("mongoose");
const uri = "mongodb+srv://osamarahal07_db_user:90RtVaRt1ZnnORkk@noor.oaioyb5.mongodb.net/qirtas?retryWrites=true&w=majority&appName=noor";
mongoose.connect(uri).then(async () => {
  console.log("Connected to Atlas DB");
  const receiptRes = await mongoose.connection.collection("receipts").deleteMany({});
  console.log("Deleted receipts:", receiptRes.deletedCount);
  
  const studentsRes = await mongoose.connection.collection("students").updateMany(
    {}, 
    { 
      $set: { 
        paidAmount: 0,
        paymentStatus: "€Ì— „”œœ",
        remaining: "$totalDue" // Wait, $set doesn't evaluate $totalDue like that unless using pipeline in MongoDB >=4.2
      }
    }
  );
  
  // To safely set remaining, do an aggregation pipeline update
  await mongoose.connection.collection("students").updateMany(
    {},
    [{ 
      $set: { 
        paidAmount: 0,
        paymentStatus: "€Ì— „”œœ",
        remaining: "$totalDue"
      }
    }]
  );
  
  console.log("Reset students payment status");
  process.exit(0);
}).catch(console.error);
