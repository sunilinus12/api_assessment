const mongoose = require("mongoose");


const user_Schemea = new mongoose.Schema({

        
        username:{
            type:String,
        },
        email:{
            type:String,
            
            unique:true
        
        },
        password:{
            type:String
        },
        verified:{
            type:Boolean
        }
        



})

// now we need to create collection and pass it or export it

const User = new mongoose.model("user",user_Schemea);

module.exports = User;
