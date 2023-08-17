//jshint esversion:6
/////////////////////////////////////////////User Authentication////////////////////////////
import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import session from "express-session"; /*step1*/
import passport from "passport"; /*step1*/
import passportLocalMongoose from "passport-local-mongoose"; /*step1*/
import "dotenv/config";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import findOrCreate from "mongoose-findorcreate";

const app = express();
const port = 3000;
// const saltRounds=10

main().catch((err) => console.log(err));

async function main() {
  app.use(
    session({
      secret: "Our little secret.",
      resave: false,
      saveUninitialized: false,
    })
  );
 

app.use(passport.initialize());
app.use(passport.session());


  mongoose.connect("mongodb://127.0.0.1:27017/userDB");

  const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId:String
  });

  userSchema.plugin(passportLocalMongoose); /*step4*/
  userSchema.plugin(findOrCreate);

  const User = mongoose.model("User", userSchema);

  // use static authenticate method of model in LocalStrategy
  passport.use(User.createStrategy()); /*step5*/

  // use static serialize and deserialize of model for passport session support
  passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username, name: user.name });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets", // Replace with your actual callback URL
      },
      (accessToken, refreshToken, profile, cb) => {
        console.log(profile);
        User.findOrCreate({ googleId: profile.id }, (err, user) => {
          return cb(err, user);
        });
      }
    )
  );


  app.use(bodyParser.urlencoded({ extended: true }));

  app.use(express.static("public"));

  app.set("view engine", "ejs");

  app.get("/", (req, res) => {
    res.render("home");
  });
  app.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile"] })
  );
  app.get(
    "/auth/google/secrets",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req, res) => {
      // Successful authentication, redirect home.
      res.redirect("/secrets");
    }
  );

  app.get("/login", (req, res) => {
    res.render("login");
  });
  app.get("/register", (req, res) => {
    res.render("register");
  });

  app.get("/secrets", (req, res) => {
    if (req.isAuthenticated()) {
      res.render("secrets");
    } else {
      res.redirect("/login");
    }
  });

  app.post("/register", async (req, res) => {
    User.register(
      { username: req.body.username },
      req.body.password,
      (err, user) => {
        if (err) {
          console.log(err);
          res.redirect("/register");
        } else {
          passport.authenticate("local")(req, res, () => {
            res.redirect("/secrets");
          });
        }
      }
    );
  });

  app.post("/login", async (req, res) => {
    const user = new User({
      username: req.body.username,
      password: req.body.password,
    });

    req.login(user, (err) => {
      if (err) {
        console.log(err);
      } else {
        passport.authenticate("local")(req, res, () => {
          res.redirect("/secrets");
        });
      }
    });
  });

  app.get("/logout", (req, res, next) => {
    req.logout(function (err) {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  });

  app.listen(port, () => {
    console.log(`server is runing on port ${port}`);
  });
}
