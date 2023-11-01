DROP DATABASE IF EXISTS recipe_sharing;
DROP USER IF EXISTS 'recipeuser'@'localhost';


CREATE DATABASE recipe_sharing;
USE recipe_sharing;

CREATE USER 'recipeuser'@'localhost' IDENTIFIED WITH mysql_native_password BY 'admin_recipe';
GRANT ALL privileges ON recipe_sharing.* TO 'recipeuser'@'localhost';

CREATE TABLE users (
	user_id INT NOT NULL auto_increment UNIQUE,
    username varchar(20) NOT NULL UNIQUE,
    first_name varchar(30) NOT NULL,
    last_name varchar(30) NOT NULL,
    email varchar(100) NOT NULL,
    hashedPassword varchar(255),
    primary key(user_id)
);
