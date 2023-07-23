## Coursework Template

### CM2040 Database Networks and the Web

#### Installation requirements

- NodeJS
  - follow the install instructions at https://nodejs.org/en/
  - we recommend using the latest LTS version
- Sqlite3
  - Windows users: follow instructions here https://www.sqlitetutorial.net/download-install-sqlite/
  - Mac users: it comes preinstalled
  - Linux users: use a package manager eg. apt install

To install all the node packages run `npm install` from the project directory

#### Help with node SQLite3

A few aspects SQLite3 work a little differently to mySql but all of the key concepts are the same

Find the API documentation at:
https://github.com/TryGhost/node-sqlite3/wiki/API

Find node SQLite tutorials at:
https://www.sqlitetutorial.net/sqlite-nodejs/
This also a good resource to find examples and tutorials around SQLite queries

#### Using this template

This template sets you off in the right direction for your coursework. To get started:

Run `npm run build-db` to create the database (database.db)
Run `npm run start` to start serving the web app (Access via http://localhost:3000)

You can also run:
`npm run clean-db` to delete the database before rebuilding it for a fresh start

##### Next steps

- Explore the file structure and code
- Read all the comments
- Try accessing each of the routes via the browser - make sure you understand what they do
- Try creating ejs pages for each of the routes that retrieve and display the data
- Try enhancing the `create-user-record` page so that you can set the text in the record
- Try adding new routes and pages to let the user create their own records

##### Creating database tables

- All database tables should created by modifying the db_schema.sql
- This allows us to review and recreate your database simply by running `npm run build-db`
- Do NOT create or alter database tables through other means

#### Preparing for submission

Make a copy of this folder
In your copy, delete the following files and folders:
_ node_modules
_ .git (the hidden folder with your git repository) \* database.db (your database)

Make sure that your package.json file includes all of the dependencies for your project NB. you need to use the `--save` tag each time you use npm to install a dependency

#### Getting started with my project

PLEASE READ!!!!

NOTE FROM THE STUDENT, ME, SHANATH S/O RAJENDRAN

In the package.json scripts for build-db and clean-db, `cat` and `rm` are macOS/linus exclusive commands
Therefore, they are'nt able to run on Windows
In order to run the build-db script on Windows, change the build-db scripts to
`type db_schema.sql | sqlite3 database.db`
and remove the comments after the #
OR
simply just type the command into the terminal.

To clean and delete the database, you dont have to run the clean-db command
Just manually click and delete the database.db

These are the steps I have done to run the template

So if you, the marker, are running on macOS/Linus, all the scripts should work just fine
No changes should be required to the script.
If you are marking on windows, read the above steps

Thank you

NB. we will ONLY run `npm install`, `npm run build-db`, and `npm run start` . We will NOT install additional packages to run your code and will NOT run additional build scripts. Be careful with any additional node dependencies that you use.
