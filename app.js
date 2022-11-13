//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const findOrCreate = require('mongoose-findorcreate')
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;

const app = express();

app.use(express.static('public'))
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}))

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}))



app.use(passport.initialize());
app.use(passport.session())



// connecting to the database and creating a model.. 
mongoose.connect(process.env.URL);



// creating a model from the mongoose schema class which is essential for encryption. 
const userSchema =  new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    facebookId: String,
    secret: String
})

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate)

//creating the database encryption key... 




const User = mongoose.model('user', userSchema);

//creating a login strategy and serializing and deserializing the user credentials throughout the session 

passport.use(User.createStrategy());



passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

//The serializing and deserializing in and out of the session code below is only aplicable
//to local strategy, it does not work on google strategy.
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());



//creating google strategy

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

//Creating Facebook strategy....
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));









app.get('/', function(req, res){
    res.render('home');
})



//Google login authentication routes...
app.get('/auth/google',
        passport.authenticate('google', {scope: ['profile']}));

app.get('/auth/google/secrets',
        passport.authenticate('google', {failureRedirect: '/login'}), function(req, res){
            res.redirect('/secrets');
        })


//facebook login authentication route
app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });




app.get('/login', function(req, res){
    res.render('login');
})



app.post('/login', function(req, res){
   const user = new User({
    username: req.body.username,
    password: req.body.password
   })

   req.login(user, function(err){
    if(err){
        console.log(err)
        res.redirect('/login')
    }else{
        passport.authenticate('local')(req,res, function(){
            res.redirect('/secrets')
        })
    }
   })

})




app.get('/register', function(req, res){
    res.render('register');
})

app.get('/secrets', function(req,res){
    if(req.isAuthenticated()){
       User.find({'secrets': {$ne: null}}, function(err, foundUsers){
        if(err){
            console.log(err)
        }else{
            if(foundUsers){
                res.render('secrets', {userSecrets: foundUsers})
            }
        }
       })
    }else{
        res.redirect('/login')
    }
})
app.get('/logout', function(req,res){
    req.logout(function(err){
        if(err){
            console.log(err)
        }else{
            res.redirect('/') 
        }
    });
   
})

app.post('/register', function(req, res){
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err){
            console.log(err);
            res.redirect('/register');
        }else{
            passport.authenticate('local')(req,res, function(){
                res.redirect('/secrets');
            })
        }
    })
   
})



app.get('/submit', function(req, res){
    if(req.isAuthenticated()){
        res.render('submit')
    }else{
        res.redirect('/login')
    }
})

app.post('/submit', function(req, res){
   const newSecret =  req.body.secret;

   User.findById(req.user.id, function(err, foundUser){
    if(err){
        console.log(err);
    }else{
        if(foundUser){
            foundUser.secret = newSecret;
            foundUser.save(function(){
                res.redirect('/secrets')
            });
        }
    }
   })
})















app.listen(process.env.PORT || 3000, function(){
    console.log('Server running on port 3000')
})