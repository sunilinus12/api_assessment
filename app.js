const express = require('express')
const app = express()

const nodemailer = require("nodemailer");
require("dotenv").config();
const bcrypt = require("bcryptjs")
const port = process.env.PORT || 9000;
const bodyParser = require('body-parser')
require("./src/db/conn")


//creating table
const User = require("./src/models/users.js")
const OtpVerification = require("./src/models/otpverification");
const res = require('express/lib/response');
const { send, redirect } = require('express/lib/response');
const Posts = require("./src/models/posts");
const { reset } = require('nodemon');

app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json())



app.get('/', (req, res) => {
    res.send('Hello World!')
})

let transporter = nodemailer.createTransport({
    service: process.env.MAILSERVICE,
    auth: {
        user: process.env.EMAIL_AUTH,
        pass: process.env.EMAIL_PASS,
    }
})
transporter.verify((error, success) => {
    if (error) {
        console.log(error);
    }
    else {
        console.log("success");
    }
})

app.post("/signup", async (req, res) => {

    try {

        const password = req.body.password;
        const salt = 10;
        const hashpassword = await bcrypt.hash(password,salt);
        const user = new User({
            username: req.body.username,
            email: req.body.email,
            password: hashpassword,
            verified: false
        });
        const em=req.body.email;
        const check_email = await User.findOne({"email":em});
        if(!check_email){
            const save = await user.save();
            if (save) {
                sendOTPVerificationEmail(save, res);
            }
        }
        else{
            res.send({message:"user already exists Please login"})
        }





    } catch (error) {
        console.log(error);
    }

})
// to verify otp
app.post("/verify", async (req, res) => {

    try {

        const { userid, otp } = req.body;

        if (!userid || !otp) {
            throw new Error("empty otp details are not allowed");
        }
        else {

            const record = await OtpVerification.findOne({ 'userid': userid });


            if (!record) {
                throw new Error("Account record doesn't exist or has been verified already. Please signup or login");

            }
            else {
                const expiredate = record.expiresAt;
                const hashotp = record.otp;


                if (expiredate < Date.now()) {
                    await OtpVerification.deleteMany({ userid });
                    throw new Error("code is expired please request again");
                }
                else {
                    const validotp = await bcrypt.compare(otp, hashotp);
                    if (!validotp) {
                        throw new Error("invalid otp");
                    }
                    else {

                        await User.updateOne({ _id: userid }, { verified: true });
                        await OtpVerification.deleteMany({ userid });
                        res.json({
                            status: "Verfied",
                            message: "user email verified successfully"
                        });
                    }
                }
            }
        }

    } catch (error) {
        res.json({
            status: "FAILED",
            message: error.message,
        })
    }

})


// resend the otp 
app.post("/reverify", async (req, res) => {
    try {

        let { userid, email } = req.body;
        if (!userid || !email) {
            throw Error("Empty user details are not allowed");
        }
        else {
            //delete exisiting record and send email
            await OtpVerification.deleteMany({ userid });
            sendOTPVerificationEmail({ _id: userid, email }, res);
        }
    } catch (error) {
        res.json({
            status: "FAILED",
            message: error.message,
        })
    }
}


)

// login 
app.post("/login", async (req, res) => {

    try {

        const email = req.body.email;
        const record = await User.findOne({ email });
        if (!record) {
            res.json({
                status: "Invalid emailid",
                message: "Please sign up"
            })
        }
        else {
            status_verified = record.verified;
            if (status_verified) {
                res.send(`welcome ${record.username} bro`);
            }
            else {
                sendOTPVerificationEmail({ _id: record._id, email }, res);


            }

        }

    } catch (error) {

    }
})

// posts send
app.post("/posts", async (req, res) => {

    try {

        const { image_post, text_post, email } = req.body;

        const post = new Posts({
            image_post,
            email,
            text_post
        });
        const save_post = await post.save();
        if(!save_post){
            res.send("Error")
        }
        else{
            res.send("inserted");
        }
    } catch (error) {
        res.send(error);
    }


})


// posts updating
app.patch("/posts/:email", async (req, res) => {

    try {

        const email = req.params.email
        
    
        const update_post = await Posts.findOneAndUpdate(email,req.body,{
            new:true
        });
        if(!update_post){
            res.send("Error")
        }
        else{
            res.send("updated successfully");
        }
    } catch (error) {
        res.send(error);
    }


})
///feeds  
app.get("/feeds",async(req,res)=>{

    try {
        
        const records = await Posts.find();
        if(!records){
            res.send("error");
        }
        else{
                res.send(records);
        }

    } catch (error) {
        res.send(error.message)   
    }

})

//logout
app.patch("/logout/:email",async(req,res)=>{
    
    try {
        const email = req.params.email;
        const verified_status = await User.findOneAndUpdate(email,{"verified":false},{new:true});
        if(verified_status){
            res.send("logout successfully");
        }
        else{
            res.send("logout unsuccessfyll")
        }
        
    } catch (error) {
        res.send(error.message)   
    }
})

// posts deleting
app.delete("/posts/:email", async (req, res) => {

    try {

        const email = req.params.email
        
    
        const delete_post = await Posts.findOneAndDelete({email});
        if(!delete_post){
            res.send("Error")
        }
        else{
            res.send("deleted successfully");
        }
    } catch (error) {
        res.send(error);
    }


})
// function to send otp 
const sendOTPVerificationEmail = async ({ _id, email }, res) => {
    try {

        const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
        let mailoptions = {
            from: process.env.EMAIL_AUTH,
            to: email,
            subject: "Verify Your Email",
            html: `<p> Your otp is: ${otp}`
        };

        const saltRounds = 10;
        const hashedotp = await bcrypt.hash(otp, saltRounds);
        const user_otp = new OtpVerification({
            userid: _id,
            otp: hashedotp,
            createdAt: Date.now(),
            expiresAt: Date.now() + 3600000,
        });
        //saving in db
        const save_otp = await user_otp.save();
        await transporter.sendMail(mailoptions);
        res.json({
            status: "PENDING",
            message: "verification otp email sent",
            data: {
                user_id: _id,
                email,
            }
        });


    } catch (error) {
        res.json({
            status: "FAILED",
            message: error.message,
        })
    }
}



app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})