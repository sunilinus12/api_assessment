require("dotenv").config();
const mongoose= require("mongoose");

mongoose.connect(process.env.connn,{
    useNewUrlParser:true,
    useUnifiedTopology:true,
   
}).then(()=>{
    console.log("connection succesfull to db");
}).catch((e)=>{
    console.log(e);
})