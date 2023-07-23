
-- This makes sure that foreign_key constraints are observed and that errors will be thrown for violations
PRAGMA foreign_keys=ON;

BEGIN TRANSACTION;

--create your tables with SQL commands here (watch out for slight syntactical differences with SQLite)

--i have removed all the dummy tables provided in the template, the tables here are my own


CREATE TABLE IF NOT EXISTS credentials (
    userID INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50),
    userEmail NVARCHAR(50),
    passwords VARCHAR(50),
    dashboardTitle TEXT,
    dashboardSubT TEXT,
    dashboardAuthor TEXT
);

CREATE TABLE IF NOT EXISTS articles (
    articleID INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(50),
    sub_title VARCHAR(50),
    body TEXT,
    live INTEGER,
    created VARCHAR(50),
    modified VARCHAR(50),
    published VARCHAR(50),
    likes INTEGER,
    userID INTEGER,
    FOREIGN KEY (userID) REFERENCES credentials(userID)
);

CREATE TABLE IF NOT EXISTS articleComments(
    commentID INTEGER PRIMARY KEY AUTOINCREMENT,
    body TEXT,
    datePosted VARCHAR(50),
    articleID INTEGER,
    FOREIGN KEY (articleID) REFERENCES articles(articleID) ON DELETE CASCADE
);

COMMIT;

