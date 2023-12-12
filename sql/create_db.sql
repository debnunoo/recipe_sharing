# Dropping the database if it exists
#DROP DATABASE IF EXISTS recipe_sharing;
# Dropping a user if they exist
#DROP USER IF EXISTS 'recipeuser'@'localhost';

# Creating the database that will hold the tables for the web application
CREATE DATABASE recipe_sharing;
# Using the database within the web application
USE recipe_sharing;

# Creating a user
CREATE USER 'recipeuser'@'localhost' IDENTIFIED WITH mysql_native_password BY 'admin_recipe';
# Granting the user access (privileges) to all areas within the application
GRANT ALL privileges ON recipe_sharing.* TO 'recipeuser'@'localhost';

# Creating a table that will store all the users information
# This will be stored when the user signs up, and will be used to log onto the app
CREATE TABLE users (
	user_id INT NOT NULL auto_increment UNIQUE,
    username varchar(20) NOT NULL UNIQUE,
    first_name varchar(30) NOT NULL,
    last_name varchar(30) NOT NULL,
    email varchar(100) NOT NULL,
    hashedPassword varchar(255),
    primary key(user_id)
);

# Creating a table that will store the recipe information
# The field lists are not exhaustive, but include some key information needed for a recipe
CREATE TABLE recipes (
	recipe_id INT NOT NULL auto_increment UNIQUE,
    recipe_name varchar(100) NOT NULL,
    cuisine varchar(30),
    recipe_description TEXT NOT NULL,
    ingredients TEXT NOT NULL,
    recipe_method LONGTEXT NOT NULL,
    primary key(recipe_id)
);

# Creating table to store users reviews on recipes
# Adding a Check Constraint to the rating column
CREATE TABLE reviews (
review_id INT NOT NULL auto_increment UNIQUE,
user_id INT,
review_content MEDIUMTEXT,
rating INT,
primary key(review_id),
foreign key(user_id) references users(user_id),
CHECK (rating >= 1 and rating <= 5)
);

# Creating table to enable join users to enter multiple reviews
CREATE TABLE user_reviews (
user_id INT,
review_id INT,
foreign key(user_id) references users(user_id),
foreign key(review_id) references reviews(review_id)
);
