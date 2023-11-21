// Handling the different routes within the application
module.exports = function(app, recipeData) {

        // requiring request here so routes have access it
        // allowing for HTTP requests to be made to an API and returning the result
        const request = require('request');
        // adding here in order to access the apiKey within the config.js file
        const config = require('./config.js');
        // all routes within main.js would be able to access this
        const redirectLogin = (req, res, next) => {
        // checking to see if the a session has been created for the user
        if (!req.session.userId ) {
            // if not, redirecting to the login page
            res.redirect('./login')
        } 
        // if so, application will keep running
        else { next (); }
    }

    // added here so all routes can access it
    const { check, validationResult, body } = require('express-validator');

    // added here so all routes would be able to access
    const bcrypt = require('bcrypt');

    // Home page
    app.get('/', function(req, res) {
        res.render('index.ejs', recipeData)
    });
    // About page
    app.get('/about', function(req, res) {
        res.render('about.ejs', recipeData)
    });
    // Register page
    app.get('/register', function(req, res) {
        res.render('register.ejs', recipeData)
    });

    var signupValidation = [
        check('email').isEmail().normalizeEmail().notEmpty(),
        check('password').isLength({ min: 8, max: 15}).notEmpty().withMessage('Please enter a password!').trim(),
        /* readjusted from https://express-validator.github.io/docs/6.13.0/custom-error-messages/ */
        check('retype_password').notEmpty().withMessage('Please re-enter your password').trim().custom((value,{req}) =>{
            if(value !== req.body.password) {
                throw new Error('Passwords do not match. Please try again!')
            }
            else {
                return true;
            }
        })
    ];

    // g.jones, princejealous21
    app.post('/registered', signupValidation, function(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            /*if(errors.array().includes('Passwords do not match')) {
                res.send('<script>alert{"Passwords do not match. Please try again!};</script>');
            } */

            //const errMessage = 'Password was too short. <a href="/register"> Please try again </a>';
            
            console.error('Failed')
        }

        else {
            const plainPassword = req.body.password;
            const saltRounds = 10;

            const hashedPassword = bcrypt.hashSync(plainPassword, saltRounds);

            bcrypt.hash(plainPassword, saltRounds, function(err, hashedPassword) {

                let sqlquery = `INSERT INTO users(
                                username, first_name, last_name, email, hashedPassword)
                                VALUES (?, ?, ?, ?, ?)`;
                
                let newrecord = [req.body.user, req.body.first, req.body.last, req.body.email, hashedPassword];

                db.query(sqlquery, newrecord, (err, result) => {
                    if(err) {
                        return console.error(err.message);
                    }
                    else {
                        console.log('Succesful!')
                        const success_message = 'Hello ' + req.body.first + ' ' + req.body.last + ' you are now registered! We will send an email to you at ' 
                            + req.body.email + '.Your password is: ' + req.body.password + ' and your hashed password is: ' + hashedPassword;
                            console.log(success_message);
                        
                        console.log(success_message);

                        res.redirect(301, '/');
                    }
                });
            });
        };

    });
    
    // Login page
    app.get('/login', function(req, res) {
        res.render('login.ejs', recipeData)
    });

    loginValidation = [check('user').notEmpty(), check('password').notEmpty().trim()]

    app.post('/loggedin', loginValidation, function(req, res) {
        const errors = validationResult(req);
        // if invalid email is inputted, user is redirected to the register page
        if (!errors.isEmpty()) {
            const errMessage = 'Please enter the correct details. <a href="/login"> Please try again </a>';
            res.send(errMessage);
        }
        else {
            let sqlquery = `SELECT username, hashedPassword
                            FROM users
                            WHERE username = ?`
            
            db.query(sqlquery, req.body.user, (err, result) => {
                if(err) {
                    return console.error(err.message);
                }
                else {
                    console.log(result);

                    hashedPassword = result[0].hashedPassword;
                    console.log(hashedPassword)

                    bcrypt.compare(req.body.password, hashedPassword, function(err, result) {
                        if(err) {
                            res.send('Sorry, your password seems to be incorrect. Please try again');
                        }
                        else if(result == true) {
                            console.log('Login Sucessful!');
                            // Saving user session here, when login is successful
                            req.session.userId = req.body.user;
                            res.redirect('/');
                        }
                        else {
                            res.send('Please try again!');
                        }
                    });

                }
            });
        }

    });
    // Route that will log out users when link is pressed
    app.get('/logout', redirectLogin, (req, res) => {
          // destroying the session after the user has logged out
          req.session.destroy(err => {
            if (err) {
              return res.redirect('./');
            }
                // sending message to user to indicate logging out has been successful
                res.send('You are now logged out. Please return to <a href='+'./'+'>Home</a>');
            })
    });
    // Listing the recipes
    app.get('/list_recipes', redirectLogin, function(req, res) {
        let sqlquery = `SELECT recipe_name, cuisine, recipe_description, ingredients, recipe_method
                        FROM recipes
                        GROUP BY recipe_name, cuisine, recipe_description, ingredients, recipe_method`

        db.query(sqlquery, (err, result) => {
            if(err) {
                res.redirect('./');
            }
            else {
                let newData = Object.assign({}, recipeData, {availableRecipes:result});
                console.log(newData);
                res.render('list_recipes.ejs', newData);
            }

        });
    });
    app.get('/external-recipes-form', function(req, res) {
        res.render('external_recipes.ejs', recipeData);
    })

    // https://api-ninjas.com/api/recipe
    // Implementing the Web API
    app.get('/external-recipes', function(req, res) {
        
        var query = req.query.input;

        request.get({
            url: `https://api.api-ninjas.com/v1/recipe?query=${query}`,
            headers: {
              'X-Api-Key': config.apiKey
            },
          }, function(error, response, body) {
            if(error) {
                console.log('error:', error);
            }
            else {
                var output = JSON.parse(body);
                res.send(output);
            }
          });
    });
    

    // Adding a Recipe page
    app.get('/add_recipe', redirectLogin, function(req, res) {
        res.render('add_recipe.ejs', recipeData);
    });
    // Route that will handle and process recipes being added to the recipes table
    app.post('/recipeadded', redirectLogin, function(req, res) {
        // saving the recipes data into the database
        let sqlquery = `INSERT INTO 
                        recipes(recipe_name, cuisine, recipe_description, ingredients, recipe_method)
                        VALUES(?, ?, ?, ?, ?)`
        // Selecting and sanitizing the fields that will be added into the recipes database
        let newrecord = [req.sanitize(req.body.name), req.sanitize(req.body.cuisine), req.sanitize(req.body.description), req.sanitize(req.body.ingredients), req.sanitize(req.body.method)]

        db.query(sqlquery, newrecord, (err, result) => {
            if(err) {
                return console.error(err.message);
            }
            else {
                // Message that will be sent to confirm recipe has successfully added
                res.send('Recipe has been successfully added! View it here: <a href="/list_recipes"> View Recipes </a> or return to the home page <a href='+'./'+'>Home</a>.');
            }
        });
    });
    // Route that will handle a recipe being deleted
    app.post('/deleterecipe/:recipeId', redirectLogin, function(req, res) {
        // accessing the recipe_id parameter
        const recipeId = req.params.recipeId;
        // Deleting all recipe information when the recipe matches the id (the unique identifier)
        let sqlquery = `DELETE FROM recipes
                        WHERE recipe_id = ?`

        db.query(sqlquery, [recipeId], (err, result) => {
            if(err) {
                // Returning error message if deletion was unsuccessful
                return console.error(err.message);
            }
            else {
                // Sending message to alert user that the recipe has been deleted
                res.send('Successfully deleted recipe! Please return to the home page <a href='+'./'+'>Home</a>.')
            }
        })
    })


    // Search page
    app.get('/search', function(req, res) {
        res.render('search.ejs', recipeData);
    });
    // Route that will handle the results of the search query
    app.get('/search-result', function(req, res) {
        // defining the keyword variable and sanitizing it
        const keyword = req.sanitize(req.query.keyword);
        // querying the database to retrieve the data based on the keyword
        // using ? as a placeholder to prevent SQL Injection
        let sqlquery = "SELECT * FROM WHERE recipe_name LIKE ?";

        db.query(sqlquery, [`%${keyword}%`], (err, result) => {
            if(err) {
                res.redirect('./');
            }
            else {
                let newData = Object.assign({}, recipeData, {availableRecipes:result});
                console.log(newData);
                res.render('list_recipes.ejs', newData);
            }
        });
    });
    
}