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
}