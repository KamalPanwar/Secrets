//jshint esversion:6
import express from "express";
import bodyParser from "body-parser";
import mongoose  from "mongoose";
// import encrypt  from "mongoose-encryption";
import 'dotenv/config'
// import md5 from "md5";
import bcrypt from 'bcrypt'

const app = express();
const port = 3000;
const saltRounds=10 

main().catch((err) => console.log(err));

async function main() {
  mongoose.connect("mongodb://127.0.0.1:27017/userDB");

  const userSchema =new mongoose.Schema({
    email: String,
    password: String,
})

// userSchema.plugin(encrypt,{secret:process.env.SECRET, encryptedFields: ['password']} )

  const User = mongoose.model("User", userSchema);

  app.use(bodyParser.urlencoded({ extended: true }));

  app.use(express.static("public"));

  app.set("view engine", "ejs");

  app.get("/", (req, res) => {
    res.render("home");
  });
  app.get("/login", (req, res) => {
    res.render("login");
  });
  app.get("/register", (req, res) => {
    res.render("register");
  });

  app.post("/register", async (req, res) => {

    bcrypt.hash(req.body.password, saltRounds, async(err, hash)=> {
      const newUser = new User({
        email: req.body.username,
        password:hash,
      });
  
      try {
        await newUser.save();
        res.render("secrets");
      } catch (error) {
        console.error("something is not right:" + error);
      }
  });
    
  });

  app.post('/login',async(req,res)=>{
    const userName=req.body.username
    const passWord=req.body.password
    try {
      
       const foundUser= await User.findOne({email:userName})
       if(foundUser) {
        bcrypt.compare(passWord, foundUser.password, function(err, result) {
          if(result==true){
            res.render('secrets')
          }else{
            res.render('Incorrect Id or Password')
          }
      })
           
        
       }
    } catch (error) {
        
    }
    
  })

  app.listen(port, () => {
    console.log(`server is runing on port ${port}`);
  });
}
