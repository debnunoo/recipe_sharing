// Handling the different routes within the application
module.exports = function(app, recipeData) {

    // Home page
    app.get('/', function(req, res) {
        res.render('index.ejs', recipeData)
    });
}