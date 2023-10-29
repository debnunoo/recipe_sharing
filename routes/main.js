// Handling the different routes within the application
module.exports = function(app, recipeData) {

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
    // Login page
    app.get('/login', function(req, res) {
        res.render('login.ejs', recipeData)
    });
}