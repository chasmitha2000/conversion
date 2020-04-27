require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static(__dirname + '/public'));

mongoose.connect(process.env.DATABASE_URL , {useNewUrlParser: true, useUnifiedTopology: true});

const userSchema = new mongoose.Schema({
  name : String,
  email : String,
  password : String
});


userSchema.plugin(encrypt, { secret : process.env.SECRET , encryptedFields : ['password']});

const User = new mongoose.model("User" , userSchema);

app.get("/", function(req, res) {
  res.render("index" , {login_status : ""});
});


app.post("/" , function(req , res){
  const emailId = req.body.loginMail;
  const password = req.body.loginPassword;


  User.findOne({email : emailId}, function(err , foundUser){
    if(err){
      console.log(err);
    }else{
      if(foundUser){
        if(foundUser.password === password){
          res.sendFile(__dirname + "/conversion.html");
        }else{
          res.render("index" , { login_status : "user_password_woring"});
        }
      }
      if(!foundUser){
          res.render("index" , { login_status : "user_does_not_exist"});
      }
    }
  });


});




app.get("/signup", function(req, res) {
  res.render("signup" , {creating_user : ""});
});

app.post("/signup", function(req, res) {
  const emailId = req.body.userMail;
  const newUser = new User({
    name : req.body.userName,
    email : emailId,
    password : req.body.userPassword
  });

  User.findOne({email : emailId}, function(err , foundUser){
    if(err){
      console.log(err);
    }else{
      if(foundUser){
        res.render("signup" , {creating_user : "user_allready_exist"});
      } else {
        newUser.save(function(err){
          if (err){
            console.log(err);
          }else{
            res.render("signup" , {creating_user : "user_created"});
          }
        });
      }
    }
  });
});



app.post("/success", function(req, res) {
  res.sendFile(__dirname + "/conversion.html");
});

app.post("/conversion", function(req, res) {
  var enteredDate = req.body.setected_date.toString();
  var d = new Date();
  var currentDate = d.getUTCFullYear() + "-" + ("0" + (d.getUTCMonth() + 1)).slice(-2) + "-" + d.getUTCDate();
  if (enteredDate <= currentDate.toString()) {
    var enteredusd = Number(req.body.usd);
    var url = process.env.API_KEY + enteredDate + process.env.BASE_CURRENCY;
    request(url, function(error, response, body) {
      var data = JSON.parse(body);
      var curent_inr = Number(data.rates.INR);
      var finalValue = (curent_inr * enteredusd).toFixed(2);

     res.render('converted' , {status : "success" , entered_date : enteredDate , currency_inr : curent_inr.toFixed(2) , enter_usd : enteredusd , final_inr : finalValue});
    });
  } else {
    var current_date_url = process.env.API_KEY + currentDate + process.env.BASE_CURRENCY;
    request(current_date_url, function(error, response, body) {
      var data1 = JSON.parse(body);
      var curent_inr1 = Number(data1.rates.INR).toFixed(2);

      res.render("converted" , {status : "fail" , currency_inr : curent_inr1});
    });
  }
});

app.post("/converted", function(req, res) {
  res.sendFile(__dirname + "/conversion.html");
});

app.get("/logout" ,function(req,res){
  res.redirect("/");
});

app.listen(process.env.PORT || 3000 , function() {
  console.log("Server started on port 3000");
});
