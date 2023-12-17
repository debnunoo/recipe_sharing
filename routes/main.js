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

    // Validation checks for the registration page
    var signupValidation = [
        // Checking email is an email and is filled in
        check('email').isEmail().normalizeEmail().notEmpty(),
        // Checking password length is between 8 and 15 and is filled in
        check('password').isLength({ min: 8, max: 15}).notEmpty().withMessage('Please enter a password!').trim(),
        /* readjusted from (Express-Validator, n.d) */
        check('retype_password').notEmpty().withMessage('Please re-enter your password').trim().custom((value,{req}) =>{
            // Checking to see if 're-type password' matches the 'password' field 
            if(value !== req.body.password) {
                throw new Error('Passwords do not match. Please try again!');
            }
            else {
                return true;
            }
        })
    ];

    // g.jones, princejealous21
    // Route that handles user's registrations, including the validation above
    app.post('/registered', signupValidation, function(req, res) {
        const errors = validationResult(req);
        // If there are errors, send message below
        if (!errors.isEmpty()) {

            console.error('Failed');
            res.send('Passwords do not match. <a href="/register"> Please try again! </a>');
        }

        else {
            // Retrieving the password field from the registration form
            const plainPassword = req.body.password;
            // Number of salt rounds
            const saltRounds = 10;

            // Function that hashes password and returns the hash
            const hashedPassword = bcrypt.hashSync(plainPassword, saltRounds);

            // Hash function
            bcrypt.hash(plainPassword, saltRounds, function(err, hashedPassword) {

                // Inserting user's details into database
                let sqlquery = `INSERT INTO users(
                                username, first_name, last_name, email, hashedPassword)
                                VALUES (?, ?, ?, ?, ?)`;
                
                // Sanitising form fields, except hashedPassword
                let newrecord = [req.sanitize(req.body.user), req.sanitize(req.body.first), req.sanitize(req.body.last), req.sanitize(req.body.email), hashedPassword];

                db.query(sqlquery, newrecord, (err, result) => {
                    if(err) {
                        return console.error(err.message);
                    }
                    else {
                        console.log('Succesful!')

                        // Redirect to home page if login is successful
                        res.redirect('/');
                    }
                });
            });
        };

    });
    
    // Login page
    app.get('/login', function(req, res) {
        res.render('login.ejs', recipeData)
    });

    // Validation checks for the login page
    // Checking both fields are filled in
    var loginValidation = [check('user').notEmpty(), check('password').notEmpty().trim()]

    // Route that handles user's login, including the validation above
    app.post('/loggedin', loginValidation, function(req, res) {
        const errors = validationResult(req);
        // if inputted fields are invalid, user is sent error message
        if (!errors.isEmpty()) {
            const errMessage = 'Please enter the correct details. <a href="/login"> Please try again </a>';
            res.send(errMessage);
        }
        else {
            // Retrieving the username from the login form
            loggedUser = req.sanitize(req.body.user)

            // Otherwise sql query is run, to retrieve the username and hashedPassword based of the username
            let sqlquery = `SELECT user_id, username, hashedPassword
                            FROM users
                            WHERE username = ?`
            
            db.query(sqlquery, loggedUser, (err, result) => {
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

                    // Comparing user's entered password with the hash stored in the database
                    bcrypt.compare(req.sanitize(req.body.password), hashedPassword, function(err, result) {
                        if(err) {
                            // If error, message is sent
                            res.send('Sorry, your password seems to be incorrect. Please try again. <a href="/login"> Click here </a>');
                        }
                        else if(result == true) {
                            console.log('Login Sucessful!');
                            // Saving user session here, when login is successful
                            // Using the user_id as the req.session to enable reviews to be saved later, before redirecting to homepage
                            req.session.userId = userId;
                            res.redirect('/');
                        }
                        else {
                            // If password does not match, users are prompted to retry
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
                res.send('You are now logged out. Please return to <a href= "./"> Home </a>');
            })
    });
    // Listing the recipes
    app.get('/list_recipes', redirectLogin, function(req, res) {
        // Selecting fields from the recipe table to display within the table on the webpage
        let sqlquery = `SELECT recipe_name, cuisine, recipe_description, ingredients, recipe_method
                        FROM recipes`

        db.query(sqlquery, (err, result) => {
            if(err) {
                res.redirect('./');
            }
            else {
                // Looping through the data and storing within the result variable
                let newData = Object.assign({}, recipeData, {availableRecipes:result});
                console.log(newData);
                // Rendering page
                res.render('list_recipes.ejs', newData);
            }

        });
    });
    // Rendering the page for users to enter word for web api
    app.get('/external-recipes-form', function(req, res) {
        res.render('external_recipes.ejs', recipeData);
    })

    // Implementing the Web API (API Ninjas, n.d)
    app.get('/external-recipes', function(req, res) {
        
        // Retrieving and sanitising user's search keyword
        var query = req.sanitize(req.query.input);

        // Getting the url and headers from the request made
        request.get({
            // Adding the searched keyword at the end of the url
            url: `https://api.api-ninjas.com/v1/recipe?query=${query}`,
            headers: {
                // API key - stored within config.js (which is required above)
              'X-Api-Key': config.apiKey
            },
          }, function(error, response, body) {
            if(error) {
                console.log('error:', error);
            }
            else {
                // Turning the api information into JSON format
                var output = JSON.parse(body);
                // Formatting the output of the recipes into a more readable format
                let format_msg = function(output) {
                    // Adding line breaks in between to make the writing more readable
                    // Getting the relevant fields to display a recipe
                    // Adding links to go back (to search box) or to go home if finished searching
                    var msg = `Recipe Name: ${output.title} <br>
                    Ingredients: ${output.ingredients} <br>
                    Instructions: ${output.instructions} <br>
                    Servings of the Recipe = ${output.servings} <br>
                    <a href="javascript:history.back()"> Go back </a> or <a href="/"> Home </a>`
                    
                    // Returning the message
                    return msg;
                }
                // Initialising an empty variable
                var requested_recipe; 
                // Looping through the array of recipes
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
                    res.send('Recipe Not Found. <a href="external-recipes-form"> Please try again </a>');
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
                // User can either go view their added recipe (within the list_recipe page) or return home
                res.send('Recipe has been successfully added! View it here: <a href="/list_recipes"> View Recipes </a> or return to the home page <a href= "./"> Home </a>.');
            }
        });
    });
    // Route that will handle a recipe being deleted
    app.post('/delete/:recipeId', redirectLogin, function(req, res) {
        // accessing the recipe_id parameter from the list_recipes page
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
                // Redirecting back to the list_recipes page after deletion has occurred
                res.redirect('/list_recipes')
            }
        })
    })

    // Listing the reviews page
    app.get('/reviews', redirectLogin, function(req, res) {
        // Query that selects and accesses data from the 'existing_reviews' View table
        let sqlquery = "SELECT * FROM existing_reviews"

        db.query(sqlquery, (err, result) => {
            if(err) {
                res.redirect('./');
            }
            else {
                let newData = Object.assign({}, recipeData, {availableReviews:result});
                console.log(newData);
                // Rendering the page
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
                // Looping through the availableRecipes and storing it within result
                let newData = Object.assign({}, recipeData, {availableRecipes:result});
                console.log(newData);
                // Rendering page
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

        // Saving the review data into the database
        // Using Insert Into Select to input the recipe_id of the selected recipe (from dropdown) based on the recipe_name
        let sqlquery = `INSERT INTO 
                        reviews(user_id, review_title, review_content, rating, recipe_id)
                        VALUES(?, ?, ?, ?, (SELECT recipe_id FROM recipes WHERE recipe_name = ?))`
        
        // Getting the user_id and reviewed_recipe from above so that it can be added to the review tables
        // Selecting and sanitizing the fields that will be added into the review database
        let newrecord = [user_id, req.sanitize(req.body.title), req.sanitize(req.body.content), req.sanitize(req.body.rating), reviewed_recipe]

        db.query(sqlquery, newrecord, (err, result) => {
            if(err) {
                return console.error(err.message);
            }
            else {
                // Message that will be sent to confirm recipe has successfully added
                res.send('Review has been successfully added! View it here: <a href="/reviews"> View Reviews </a> or return to the home page <a href= "./"> Home </a>.');
            }
        });
    });

    // Search page
    app.get('/search', redirectLogin, function(req, res) {
        res.render('search.ejs', recipeData);
    });
    // Route that will handle the results of the search query
    app.get('/search-result', redirectLogin, function(req, res) {
        // retrieving the keyword (from search) and sanitizing it
        const keyword = req.sanitize(req.query.keyword);

        // querying the database to retrieve the data based on the keyword
        // using ? as a placeholder to prevent SQL Injection
        // using wildcards (%) to search for particular recipe that contains keyword anywhere within the recipe_name
        let sqlquery = "SELECT * FROM recipes WHERE recipe_name LIKE %?%";

        db.query(sqlquery, keyword, (err, result) => {
            if(err) {
                // Sending message if recipe_name cannot be found within database
                // User is prompted to retry
                res.send('Recipe name not found. <a href="/search"> Please try again! </a>')
            }
            else {
                // Looping through availableRecipes to see if keyword matches data
                // Storing within result
                let newData = Object.assign({}, recipeData, {availableRecipes:result});
                console.log(newData);
                // Rendering page
                res.render('list_recipes.ejs', newData);
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
                    // Returns and formats result as a JSON object
                    res.json(result); 
                });
        
    })
    
}