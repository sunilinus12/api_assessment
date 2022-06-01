const mongoose = require("mongoose");


const otp_Schemea = new mongoose.Schema({

        
        userid:{
            type:String,
        },
        otp:{
            type:String,
            required:true,
        
        },
        createdAt:Date,

        expiresAt:Date
        



})

// now we need to create collection and pass it or export it
console.log("table created")
const OtpVerification = new mongoose.model("otpverification",otp_Schemea);

module.exports = OtpVerification;
