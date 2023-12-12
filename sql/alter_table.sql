USE recipe_sharing;

# Adding an alter statement as table has already been created
# users need to enter the title of their review
alter table reviews
# title column is needed for users to enter the review title
add review_title varchar(255),
# added here so that joins can be made with recipes table to retrieve recipe_name
add recipe_id INT,
add foreign key(recipe_id) references recipes(recipe_id);
