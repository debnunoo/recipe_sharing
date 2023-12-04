// Importing the modules that will be used within the application
// Requiring the Dotenv module here in order to store configuration details for the database
// Setting the path to the file name of that holds the credentials
// adapted from https://www.geeksforgeeks.org/where-should-secret-keys-should-be-stored-for-a-node-js-app/
require('dotenv').config({ path: 'db_credentials.env' });
var express = require('express');
var ejs = require('ejs');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var session = require('express-session');
var validator = require('express-validator');
var sanitizer = require('express-sanitizer');

// Creating the express application object
const app = express()
const port = 8000
app.use(bodyParser.urlencoded({ extended: true }))
app.use(sanitizer());
app.use(session({
    secret: 'somerandomstuff',
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 600000
    }
}));

// Setting up the path to read into the css file
app.use(express.static(__dirname + '/css'));

// Setting up the path to read into the assets file
app.use(express.static(__dirname + '/assets'));

// Creating and defining database connection to MySQL
// process.env.DB_PASSWORD points to the database password
const db = mysql.createConnection({
    host: 'localhost',
    user: 'recipeuser',
    password: process.env.DB_PASSWORD,
    database: 'recipe_sharing'
});

// Connecting to the database
db.connect((err) => {
    if(err) {
        throw err;
    }
    else {
        console.log('Connected to the database');
    }
});

global.db = db;


// Setting the directory where Express will pick up the HTML files
app.set('views', __dirname + '/views');

// Telling Express that EJS will be used as the templating engine
app.set('view engine', 'ejs');

// Telling Express how HTML files should be processed
// Wanting to use EJS' rendering engine
app.engine('html', ejs.renderFile)

// Defining the data
var recipeData = {recipeSharingName: "Recipe Swap Central"}

// Requires the main.js file inside the routes folder
// Passing in the Express app and data as arguments.
// All the routes will go into this file
require("./routes/main")(app, recipeData);

// Start the web app listening
app.listen(port, () => console.log(`Recipe web app listening on port ${port}!`))


