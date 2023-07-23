const express = require("express");
const path = require("path");
const app = express();
const port = 3000;
const sqlite3 = require("sqlite3").verbose();
const session = require("express-session");
const { v4: uuidv4 } = require("uuid");

//items in the global namespace are accessible throught out the node application
global.db = new sqlite3.Database("./database.db", function (err) {
  if (err) {
    console.error(err);
    process.exit(1); //Bail out we can't connect to the DB
  } else {
    console.log("Database connected");
    global.db.run("PRAGMA foreign_keys=ON"); //This tells SQLite to pay attention to foreign key constraints
  }
});

//serving static files like CSS, images, etc.
app.use(express.static(path.join(__dirname, "static")));

//body-parser
app.use(express.json()); //parse JSON bodies
app.use(express.urlencoded({ extended: true })); // URL-encoded bodies

const userRoutes = require("./routes/user");

//use session to associate with logged in users, readers do not have sesesions,
//therefore they cannot manually enter URL for logged in users
app.use(
  session({
    secret: uuidv4(),
    resave: false,
    saveUninitialized: true,
  })
);

//set the app to use ejs for rendering
app.set("view engine", "ejs");

//async function to get authors name for their articles
//optional parameter to pass articleID
getAuthors = (articleID = 0) => {
  return new Promise((resolve, reject) => {
    if (articleID === 0) {
      global.db.all("SELECT userID,dashboardAuthor FROM credentials;", (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    } else {
      global.db.get(
        "SELECT dashboardAuthor FROM credentials WHERE userID=(SELECT userID FROM articles WHERE articleID=?)",
        articleID,
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    }
  });
};

//index page
app.get("/", async (req, res, next) => {
  //NEW------------------
  let authors = [];
  //call our async function and wait to fullfill its promise
  const authorObject = await getAuthors();
  authorObject.forEach((author) => {
    authors.push({
      authorID: author.userID,
      authorName: author.dashboardAuthor,
    });
  });
  //---------------------------
  global.db.all(
    //get the first 100 strings from the article body and store as previewBody
    "SELECT articleID, title, sub_title, published,userID, SUBSTR(body,1,100) AS previewBody FROM articles WHERE live=1 ORDER BY published DESC;",
    function (err, rows) {
      if (err) next(err);
      else {
        //store all the retrieved articles from the query and map them to this array
        const posts = [];
        //iterate over the retrieve rows via the index 'row' and store all the article info
        rows.forEach((row) => {
          const matchingAuthor = authors.find((author) => author.authorID === row.userID);
          if (matchingAuthor) {
            posts.push({
              articleID: row.articleID,
              title: row.title,
              subtitle: row.sub_title,
              body: row.previewBody,
              publishedDate: row.published,
              publishedBy: matchingAuthor.authorName,
            });
          }
        });
        res.render("index", {
          //pass in all the retrived articles info stored in the posts array here
          posts: posts,
        });
      }
    }
  );
});

//reader page
//we will use async function here to query the selected article first,
//then render it here
app.get("/reader", async (req, res, next) => {
  try {
    //we query the articleID from the database in the index page
    //now we get the articleID based on which article link was clicked using query
    const articleID = req.query.articleID;
    //next line codes proceeds only when the getArticleById returns its promise
    const article = await getArticleById(articleID);
    //get author name to match their article
    const retrieveAuthor = await getAuthors(articleID);
    //get the comments of the article
    const comments = await getArticleComments(articleID);
    // Render the read page and pass the article information from our promise
    res.render("reader", { article: article, comments: comments, author: retrieveAuthor });
  } catch (err) {
    next(err);
  }
});

//promise function to retrieve the article based on the article ID
function getArticleById(articleID) {
  return new Promise((resolve, reject) => {
    global.db.get(
      "SELECT articleID, title, sub_title, body, published, likes FROM articles WHERE articleID = ?;",
      articleID,
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
}

//promise function to retrive the associated comments of the articleID
function getArticleComments(articleID) {
  return new Promise((resolve, reject) => {
    global.db.all(
      "SELECT body, datePosted FROM articleComments  WHERE articleID = ? ORDER BY datePosted DESC;",
      articleID,
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}

//to update article like count when reader clicks the like button
app.get("/like", async (req, res, next) => {
  try {
    //query the articleID from the database in the reader page
    //query the article's likes from the database in the reader page
    const articleID = req.query.articleID;
    //call the async function to update the articles like count first
    await updateArticleLikes(articleID);
    //then re-render the reader page
    const article = await getArticleById(articleID);
    //get author name to match their article
    const retrieveAuthor = await getAuthors(articleID);
    //get the comments of the article
    const comments = await getArticleComments(articleID);
    //read page rendered again, and pass the article information from our promise
    res.render("reader", { article: article, comments: comments, author: retrieveAuthor });
  } catch (err) {
    next(err);
  }
});

//promise function to update the likes of the article and re-render page
function updateArticleLikes(articleID) {
  return new Promise((resolve, reject) => {
    global.db.run("UPDATE articles SET likes=likes+1 WHERE articleID=?;", articleID, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

app.post("/comments", (req, res, next) => {
  //get the comments and the articleID
  const body = req.body.comments;
  const ArticleID = req.body.articleID;
  /* get date and time of comment*/
  let raw_date_time = new Date();
  let date = ("0" + raw_date_time.getDate()).slice(-2);
  let month = ("0" + (raw_date_time.getMonth() + 1)).slice(-2);
  let year = raw_date_time.getFullYear();
  let hours = raw_date_time.getHours();
  let minutes = raw_date_time.getMinutes().toString().padStart(2, "0");
  let seconds = raw_date_time.getSeconds().toString().padStart(2, "0");
  //date & time in DD-MM-YYYY HH:MM:SS format
  let formatted_Date_Time =
    date + "-" + month + "-" + year + " " + hours + ":" + minutes + ":" + seconds;
  /*-----------------------------------*/
  global.db.run(
    "INSERT INTO articleComments(body,articleID,datePosted) VALUES (?,?,?);",
    body,
    ArticleID,
    formatted_Date_Time,
    function (err) {
      if (err) next(err);
      else {
        res.redirect(`/reader?articleID=${ArticleID}`);
      }
    }
  );
});

//register page
app.get("/register", (req, res) => {
  res.render("register", { title: "Register" });
});

//login page
app.get("/login", (req, res) => {
  res.render("login", { title: "Login" });
});

//this adds all the authour routes to the app under the path /route
app.use("/route", userRoutes);

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
