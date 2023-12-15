USE recipe_sharing;
# creating a view that will contain the nested sql query
create view existing_reviews as
	select username, review_content, rating, review_title, recipe_name
	# selecting every field (except review_id) in order to perform joins and display necessary columns
    # using aliases for each query to simplify joins
    from (
			select user_id, review_content, rating, review_title, recipe_id
			from reviews
        ) a
		# retrieving the recipe_name based on the recipe_id to display in table
        join
		(
			select recipe_id, recipe_name 
			from recipes
		) b on a.recipe_id = b.recipe_id
		# retrieving the username based off the user_id to display in table
        join (
			select user_id, username
            from users
		) c on a.user_id = c.user_id;
        
    

    



