//jshint esversion:6
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');

const app = express();

app.use(express.static('public'))
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}))


mongoose.connect('mongodb://localhost:27017/userDB');


const userSchema = {
    email: String,
    password: String
}

const User = mongoose.model('user', userSchema);





app.get('/', function(req, res){
    res.render('home');
})

app.get('/login', function(req, res){
    res.render('login');
})

app.get('/register', function(req, res){
    res.render('register');
})
app.post('/register', function(req, res){

    let email = req.body.username;
    let password = req.body.password;

    const user = new User({
        email: email,
        password: password
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