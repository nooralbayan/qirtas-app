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
        paymentStatus: "€Ì— „”œœ"
      }
    }
  );
  console.log("Reset students payment status:", studentsRes.modifiedCount);
  process.exit(0);
}).catch(console.error);
