//jshint esversion:6
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption')

const app = express();

app.use(express.static('public'))
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}))

// connecting to the database and creating a model.. 
mongoose.connect('mongodb://localhost:27017/userDB');



// creating a model from the mongoose schema class which is essential for encryption. 
const userSchema =  new mongoose.Schema({
    email: String,
    password: String
})


//creating the database encryption key... 

const secret = 'Thisisourlittlesecret';
userSchema.plugin(encrypt, {secret: secret, encryptedFields: ['password']});


const User = mongoose.model('user', userSchema);





app.get('/', function(req, res){
    res.render('home');
})

app.get('/login', function(req, res){
    res.render('login');
})



app.post('/login', function(req, res){
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email:username}, function(err, foundUser){
        if(err){
            console.log(err);
        }else{
            if(foundUser){
                if(foundUser.password === password){
                    res.render('secrets')
                }
            }
        }
    })


})




app.get('/register', function(req, res){
    res.render('register');
})
app.post('/register', function(req, res){

    const user = new User({
        email: req.body.username,
        password: req.body.password
    })
    user.save(function(err){
        if(err){
            console.log(err);
        }else{
            res.render('secrets')
        }
    });
   
})



app.get('/submit', function(req, res){
    res.render('submit');
})

















app.listen(3000, function(){
    console.log('Server running on port 3000')
})