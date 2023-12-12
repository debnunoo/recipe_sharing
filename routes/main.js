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
            let sqlquery = `SELECT user_id, username, hashedPassword
                            FROM users
                            WHERE username = ?`
            
            db.query(sqlquery, req.body.user, (err, result) => {
                if(err) {
                    return console.error(err.message);
                }
                else {
                    console.log(result);

                    // Retrieving the hashed password from the query
                    hashedPassword = result[0].hashedPassword;
                    //  Retrieving the user_id from query
                    userId = result[0].user_id;
                    console.log(hashedPassword)

                    bcrypt.compare(req.body.password, hashedPassword, function(err, result) {
                        if(err) {
                            res.send('Sorry, your password seems to be incorrect. Please try again. <a href="/login"> Click here </a>');
                        }
                        else if(result == true) {
                            console.log('Login Sucessful!');
                            // Saving user session here, when login is successful
                            // Using the user_id as the req.session to enable reviews to be saved later
                            req.session.userId = userId;
                            res.redirect('/');
                        }
                        else {
                            res.send('Please try again! <a href="/login"> Click here </a>');
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
        let sqlquery = `SELECT recipe_id, recipe_name, cuisine, recipe_description, ingredients, recipe_method
                        FROM recipes`

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
                // Turning the api information 
                var output = JSON.parse(body);
                // Formatting the output of the recipes into a more readable format
                let format_msg = function(output) {
                    // Adding line breaks in between to make the writing more readable
                    var msg = `Recipe Name: ${output.title} <br>
                    Ingredients: ${output.ingredients} <br>
                    Instructions: ${output.instructions} <br>
                    Servings of the Recipe = ${output.servings} <br>
                    <a href="javascript:history.back()"> Go back </a> or <a href="/"> Home </a>`
                    
                    // Returning the message
                    return msg;
                }
                // Initialising empty variable
                var requested_recipe; 
                // For loop to loop through the array of recipes
                for (let i = 0; i < output.length; i++) {
                    // checking to see if the query entered matches a title within the array
                    if(output[i].title == query) {
                        // if it does, storing the recipe (from the array) in the empty variable
                        requested_recipe = output[i];
                        // breaking the loop if recipe has been found
                        break;
                    }
                }
                // Conditional statement to check variable contains a recipe
                if(requested_recipe) {
                    // Returning the found recipe (from the for loop above)
                    //  and sending the recipe in the formatted output (set above)
                    res.send(format_msg(requested_recipe));
                }
                else {
                    // Message sent back if the recipe is not included within the API
                    res.send('Recipe Not Found. Please try again');
                }
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
    app.post('/delete/:recipeId', redirectLogin, function(req, res) {
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

    app.get('/reviews', redirectLogin, function(req, res) {
        let sqlquery = "SELECT * FROM existing_reviews"

        db.query(sqlquery, (err, result) => {
            if(err) {
                res.redirect('./');
            }
            else {
                let newData = Object.assign({}, recipeData, {availableReviews:result});
                console.log(newData);
                res.render('list_reviews.ejs', newData);
            }

        });
    })

    // Adding a Food Review page
    app.get('/add_review', redirectLogin, function(req, res) {
        // getting the recipe_name in order to display within the dropdown menus
        let sqlquery = `SELECT recipe_name
                        FROM recipes`

        db.query(sqlquery, (err, result) => {
            if(err) {
                res.redirect('./');
            }
            else {
                let newData = Object.assign({}, recipeData, {availableRecipes:result});
                console.log(newData);
                res.render('add_reviews.ejs', newData);
            }

        });
    });    

    // Route that will handle and process reviews being added to the review table
    app.post('/reviewadded', redirectLogin, function(req, res) {

        // Retrieving the userId from the req.session in order to input the user_id into the reviews table
        const user_id = req.session.userId;
        // Retrieving the selected recipe name from the dropdown options
        const reviewed_recipe = req.body.existing_recipes;

        // saving the review data into the database
        let sqlquery = `INSERT INTO 
                        reviews(user_id, review_title, review_content, rating, recipe_id)
                        VALUES(?, ?, ?, ?, (SELECT recipe_id FROM recipes WHERE recipe_name = ?))`
        
        // Getting the user_id from above so that it can be added to the review tables
        // Selecting and sanitizing the fields that will be added into the review database
        let newrecord = [user_id, req.sanitize(req.body.title), req.sanitize(req.body.content), req.sanitize(req.body.rating), reviewed_recipe]

        db.query(sqlquery, newrecord, (err, result) => {
            if(err) {
                return console.error(err.message);
            }
            else {
                // Message that will be sent to confirm recipe has successfully added
                res.send('Review has been successfully added! View it here: <a href="/reviews"> View Reviews </a> or return to the home page <a href='+'./'+'>Home</a>.');
            }
        });
    });

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
        let sqlquery = "SELECT * FROM recipes WHERE recipe_name LIKE ?";

        db.query(sqlquery, keyword, (err, result) => {
            if(err) {
                res.redirect('./');
            }
            else {
                if(result) {
                    let newData = Object.assign({}, recipeData, {availableRecipes:result});
                    console.log(newData);
                    res.render('list_recipes.ejs', newData);
                }
                else {
                    res.send('Recipe name not found. Please try again!');
                }
            } 
            
        });
    });      
    // Providing an API to allow other applications to access the recipe data
    app.get('/api', function(req, res) {
                // Query database to get all the books
                let sqlquery = "SELECT * FROM recipes"; 

                // Execute the sql query
                db.query(sqlquery, (err, result) => {
                    if (err) {
                        res.redirect('./');
                    }
                    // Return results as a JSON object
                    res.json(result); 
                });
        
    })
    
}