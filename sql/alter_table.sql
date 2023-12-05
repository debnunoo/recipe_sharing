USE recipe_sharing;

# Adding an alter statement as table has already been created
# users need to enter the title of their review
alter table reviews
add review_title varchar(255);
