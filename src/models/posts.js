const mongoose = require("mongoose");


const posts_Schemea = new mongoose.Schema({

        
       image_post:{
            type:String,
        },
        email:{
            type:String,
            
        
        },
        text_post:{
            type:String,
        }     



})

// now we need to create collection and pass it or export it

const Posts = new mongoose.model("posts",posts_Schemea);

module.exports = Posts;
