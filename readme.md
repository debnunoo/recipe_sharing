To set up and run this working repository, clone this repository
                    git clone https://github.com/debnunoo/recipe_sharing.git

When cloned, change into the 'recipe_sharing' directory by running 'cd recipe_sharing'.
Once in the directory, run 'npm install' to install all packages required for the web application to work.

After installing all dependencies, go to **https://api-ninjas.com/api/recipe** and create an account to get an API key. When API key is retrieved, go back to the repository and navigate to the routes directory using (cd routes). There, create a new file called 'config.js' and use the code below:
                    **var config = {
                            apiKey: 'replace_with_API_key_here'
                                };

                    module.exports = config;**

Replace 'replace_with_API_key_here' with the API key retrieved from **https://api-ninjas.com/api/recipe**.

After setting this up, go back to the main directory (cd ..) and set up a new file called 'db_credentials.env' - this will hold and store the database password. The database password can be within the 'create_db.sql' file - this will be used here 
                    **DB_PASSWORD = 'find_sql_password'**

    * replace 'find_sql_password' with the sql password

After these files have been set up, set up your MySQL environment by running all scripts, in the order of below:
                    **1. Run 'create_db.sql'
                    2. Run 'inserting_data.sql'
                    3. Run 'alter_table.sql'
                    4. Run 'view.sql'**

Once all four scripts have been ran, return to the repository (recipe_sharing) and run 'node index.js'.