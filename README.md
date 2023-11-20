## Using Node.js, Express

Run `npm run build-db` to create the database (database.db)
Run `npm run start` to start serving the web app (Access via http://localhost:3000)

You can also run:
`npm run clean-db` to delete the database before rebuilding it for a fresh start

In the package.json scripts for build-db and clean-db, `cat` and `rm` are macOS/linus exclusive commands
Therefore, they are'nt able to run on Windows
In order to run the build-db script on Windows, change the build-db scripts to
`type db_schema.sql | sqlite3 database.db`
and remove the comments after the #
OR
simply just type the command into the terminal.

To clean and delete the database, you dont have to run the clean-db command
Just manually click and delete the database.db

----------------------------------------------
Home page of the website

![home_page](https://github.com/ShanTheShan/Blogging-Website-SQL/assets/96246152/5edb0599-fbc9-48d9-875c-b39812409176)
----------------------------------------------

----------------------------------------------
Logged in

![main_page](https://github.com/ShanTheShan/Blogging-Website-SQL/assets/96246152/5523740e-ca22-4c7d-8bc0-6566c6054a0e)
----------------------------------------------
