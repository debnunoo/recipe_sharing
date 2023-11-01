// Handling the different routes within the application
module.exports = function(app, recipeData) {

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
}