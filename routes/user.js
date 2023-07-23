/**
 * These are example routes for user management
 * This shows how to correctly structure your routes for the project
 *
 * This is your router for managing author actions
 */

const express = require("express");
const router = express.Router();
const assert = require("assert");
const bcrypt = require("bcrypt");

/* found a simple code snippet online to get the local system's date time
techsolutionstuff.com. (2021). How To Get Current Date And Time In Node.js.
[online] Available at: techsolutionstuff.com/post/how-to-get-current-date-and-time-in-node-js */
//referrenced will be made in the report as well

//global date time func available
function currentDateTime() {
  let raw_date_time = new Date();
  let date = ("0" + raw_date_time.getDate()).slice(-2);
  let month = ("0" + (raw_date_time.getMonth() + 1)).slice(-2);
  let year = raw_date_time.getFullYear();
  let hours = raw_date_time.getHours();
  //i added toString padStart because 12.05 reads as 12.5, which is mistaken when sorted
  //as it will read 12.50 instead
  let minutes = raw_date_time.getMinutes().toString().padStart(2, "0");
  let seconds = raw_date_time.getSeconds().toString().padStart(2, "0");
  //date & time in DD-MM-YYYY HH:MM:SS format
  let formatted_Date_Time =
    date + "-" + month + "-" + year + " " + hours + ":" + minutes + ":" + seconds;
  return formatted_Date_Time;
}
//MY CODES, NOT TEMPLATES

//register user
router.post("/register", async (req, res, next) => {
  try {
    //get the input from the form via body(body-parser)
    const retrieve_name = req.body.username;
    const retrieve_email = req.body.userEmail;
    const retrieve_pw = req.body.passwords;
    const defaultBlogTitle = "Default Blog title";
    const defaultBlogSubT = "Default Blog sub-title";
    const defaultBlogAuthor = "Default Author name";

    //generate salt so that if users have keyed in same password, their hash is still different
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(retrieve_pw, salt);
    global.db.run(
      "INSERT INTO credentials (username, userEmail, passwords, dashboardTitle, dashboardSubT, dashboardAuthor) VALUES(?,?,?,?,?,?);",
      retrieve_name,
      retrieve_email,
      hashedPassword,
      defaultBlogTitle,
      defaultBlogSubT,
      defaultBlogAuthor,
      function (err) {
        if (err) {
          next(err); //send the error on to the error handler
        } else {
        }
      }
    );
  } catch (err) {
    next(err);
  }
});

//login user
router.post("/login", async (req, res, next) => {
  //if value given in form == to database, authenticate
  try {
    const verify_name = req.body.username;
    const verify_password = req.body.password;
    global.db.get(
      "SELECT passwords FROM credentials WHERE username=?;",
      verify_name,
      async function (err, row) {
        //wait for bycrypt compare to return bool against the pw given by user and hashed pw in db
        if (row && (await bcrypt.compare(verify_password, row.passwords))) {
          req.session.user = req.body.username;
          res.redirect("/route/dashboard");
        }
        if (row == undefined) {
          const alertMsg = "Incorrect username and/or password";
          //send an alert to user if credentials are wrong
          //then redirect them back to login page again
          res.send(`
            <script>
              alert("${alertMsg}");
              setTimeout(function() {
                window.location.href = "/login";
              });
            </script>
          `);
        }
      }
    );
  } catch (err) {
    next(err);
  }
});

//renders logged in user dashboard(author home page)
router.get("/dashboard", async (req, res, next) => {
  try {
    const verify_name = req.session.user;
    //create empty function scoped variable, that will be used to store author home page settings
    //after query is successfull
    let authorTitle = null;
    let authorSubT = null;
    let authorName = null;
    //wait for the query to complete, then proceed, using Async and Promises
    const rowSettings = await new Promise((resolve, reject) => {
      global.db.get(
        //retrive author's home page settings
        "SELECT dashboardTitle, dashboardSubT, dashboardAuthor FROM credentials WHERE username=?;",
        verify_name,
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    // If rowSettings is not null, set the variables according to row retrieve from db
    if (rowSettings) {
      authorTitle = rowSettings.dashboardTitle;
      authorSubT = rowSettings.dashboardSubT;
      authorName = rowSettings.dashboardAuthor;
    }
    //retrieve all the user's(author's) articles using their ID
    //Query user primary ID
    global.db.all(
      "SELECT articleID, title, sub_title, live, created, modified, published, likes FROM articles WHERE userID=(SELECT userID FROM credentials WHERE username=?);",
      verify_name,
      function (err, row_articles) {
        if (err) {
          next(err);
        } else {
          if (req.session.user && row_articles.length > 0) {
            //declare empty arrays first to populate using conditional to check if article is live/not live
            //aka published or drafts
            let draftData = [];
            let publishData = [];
            let draftforms = [];
            let publishedforms = [];
            //use Node.js forEach() func to iterate over return sql query array
            //we store as objects because ejs takes in objects to render, not strings
            row_articles.forEach((row) => {
              //if live == 0, means its a draft, goes into draft array
              if (row.live == 0) {
                //push into our empty array
                draftData.push({
                  articleID: row.articleID,
                  title: row.title,
                  subtitle: row.sub_title,
                  dateCreated: row.created,
                  dateModified: row.modified,
                  live: row.live,
                });
              }
              //its live == 1, means its published, goes into published array
              if (row.live == 1) {
                publishData.push({
                  articleID: row.articleID,
                  title: row.title,
                  subtitle: row.sub_title,
                  dateCreated: row.created,
                  datePublished: row.published,
                  likes: row.likes,
                  live: row.live,
                });
              }
            });
            //render draft articles that are not published, AKA live value is 0
            //give our dynamic divs id's, so we can trace buttonclicks
            draftforms = draftData.map((draft, index) => ({
              id: index + 1,
              name: `Form ${index + 1}`,
            }));

            publishedforms = publishData.map((publish, index) => ({
              id: index + 1,
              name: `Form ${index + 1}`,
            }));
            res.render("dashboard", {
              user: req.session.user,
              //fill up author settings
              authorTitle: authorTitle,
              authorSubT: authorSubT,
              authorName: authorName,
              //generate forms for published articles
              publishedforms: publishedforms,
              //generate forms for draft articles
              draftforms: draftforms,
              //fill generated forms for publish
              publishedData: publishData,
              //fill generated forms for drafts
              draftData: draftData,
            });
          } else if (
            (req.session.user && row_articles.length == 0) ||
            row_articles.length == undefined
          ) {
            //newly registered users or users with no articles are default null
            res.render("dashboard", {
              user: req.session.user,
              authorTitle: authorTitle,
              authorSubT: authorSubT,
              authorName: authorName,
              draftData: null,
              publishedData: null,
              forms: null,
            });
          } else {
            //if session expires
            res.send("Access Denied");
          }
        }
      }
    );
  } catch (err) {
    next(err);
  }
});

//redirect logged in user(author) to their draft article creation page
router.get("/creation", (req, res) => {
  if (req.session.user) {
    res.render("creation", { user: req.session.user });
  } else {
    res.send("Access Denied");
  }
});

//POST request to store article draft to database
router.post("/create", (req, res, next) => {
  //get logged in user name
  const verify_name = req.session.user;
  //get form texts
  const title = req.body.CD_title;
  const sub_title = req.body.CD_sub_title;
  const body = req.body.CD_body;
  //retrieve user ID so we can form relation to their article
  global.db.get(
    "SELECT userID FROM credentials WHERE username=?;",
    verify_name,
    function (err, row) {
      if (err) {
        next(err);
      } else {
        if (row);
        const userPRIKEY = row.userID; //store user primary key into this variable after suss query
        //draft data creation will have their 'live' boolean column value as 0, which is false
        const liveBool = 0;
        //draft data creation will have their 'likes' integer column value as 0
        const likesCount = 0;
        global.db.run(
          "INSERT INTO articles (title,sub_title,body,live,likes,created,userID) VALUES (?,?,?,?,?,?,?);",
          [title, sub_title, body, liveBool, likesCount, currentDateTime(), userPRIKEY],
          function (err) {
            if (err) next(err);
            else {
              res.redirect("/route/dashboard");
            }
          }
        );
      }
    }
  );
});

//get article ID from dashboard and send to article edits for editing/deletion/publishing/sharing
router.post("/articleEdit", (req, res, next) => {
  //retrive all the article information from their input forms
  const verify_name = req.session.user;
  const articleID = req.body.articleID;
  const articleTitle = req.body.title;
  const articleSubTitle = req.body.subtitle;
  const action = req.body.buttonClick;
  //get the full article information from the db, with the data from the forms
  global.db.get(
    "SELECT articleID, title, sub_title, body, created, modified FROM articles WHERE articleID=? AND title=? AND sub_title=? AND userID=(SELECT userID FROM credentials WHERE username=?);",
    articleID,
    articleTitle,
    articleSubTitle,
    verify_name,
    function (err, row) {
      if (err) next(row);
      else if (req.session.user && row) {
        if (action == "edit") {
          //redirect to article edit page with the selected article based on on the button click
          res.render("article-edit", {
            user: req.session.user,
            draft_articleID: row.articleID,
            draft_title: row.title,
            draft_subtitle: row.sub_title,
            draft_body: row.body,
            draft_dateCreated: row.created,
            draft_lastModified: row.modified,
          });
        }
        if (action == "delete") {
          //delete the select article based on the button click and refresh the page
          global.db.run(
            "DELETE FROM articles WHERE articleID=? AND title=? AND sub_title=? AND userID=(SELECT userID FROM credentials WHERE username=?);",
            articleID,
            articleTitle,
            articleSubTitle,
            verify_name,
            function (err, rowDelete) {
              res.redirect("/route/dashboard");
            }
          );
        }
        if (action == "publish") {
          //get current date time so we can stamp the publication date
          //get date time using JS Date() method, self explanatory date time format below
          let raw_date_time = new Date();
          let date = ("0" + raw_date_time.getDate()).slice(-2);
          let month = ("0" + (raw_date_time.getMonth() + 1)).slice(-2);
          let year = raw_date_time.getFullYear();
          let hours = raw_date_time.getHours();
          let minutes = raw_date_time.getMinutes().toString().padStart(2, "0");
          let seconds = raw_date_time.getSeconds().toString().padStart(2, "0");
          //DD-MM-YYYY HH:MM:SS format
          let formatted_Date_Time =
            date + "-" + month + "-" + year + " " + hours + ":" + minutes + ":" + seconds;
          //update the clicked article, set their live status and the published date
          global.db.run(
            "UPDATE articles SET live=1, published=? WHERE articleID=? AND userID=(SELECT userID FROM credentials WHERE username=?);",
            formatted_Date_Time,
            articleID,
            verify_name,
            function (err, rowP) {
              res.redirect("/route/dashboard");
            }
          );
        }
        if (action == "share") {
          res.redirect("/route/dashboard");
        }
      } else {
        //session expired
        res.send("Access Denied");
      }
    }
  );
});

//POST request to store UPDATE EDITED article draft to database
router.post("/edit_save", (req, res, next) => {
  //get logged in user name
  const verify_name = req.session.user;
  //get form values
  const articleID = req.body.articleID;
  const title = req.body.CD_title;
  const sub_title = req.body.CD_sub_title;
  const body = req.body.CD_body;

  // get current date
  let raw_date_time = new Date();
  let date = ("0" + raw_date_time.getDate()).slice(-2);
  let month = ("0" + (raw_date_time.getMonth() + 1)).slice(-2);
  let year = raw_date_time.getFullYear();
  let hours = raw_date_time.getHours();
  let minutes = raw_date_time.getMinutes().toString().padStart(2, "0");
  let seconds = raw_date_time.getSeconds().toString().padStart(2, "0");
  let formatted_Date_Time =
    date + "-" + month + "-" + year + " " + hours + ":" + minutes + ":" + seconds;

  //use article ID and userID get the correct article and apply the changes
  global.db.run(
    "UPDATE articles SET title=?, sub_title=?, body=?, modified=? WHERE articleID=? AND userID = (SELECT userID FROM credentials WHERE username=?);",
    [title, sub_title, body, formatted_Date_Time, articleID, verify_name],
    function (err) {
      if (err) next(err);
      else {
        res.redirect("/route/dashboard");
      }
    }
  );
});

//send logged in user(author) to their settings page
router.get("/author-settings", (req, res, next) => {
  if (req.session.user) {
    const verify_name = req.session.user;
    global.db.get(
      "SELECT dashboardTitle, dashboardSubT, dashboardAuthor FROM credentials WHERE userID=(SELECT userID FROM credentials WHERE username=?);",
      verify_name,
      function (err, row) {
        if (err) next(err);
        else {
          res.render("author-settings", {
            user: req.session.user,
            authorTitle: row.dashboardTitle,
            authorSubT: row.dashboardSubT,
            authorName: row.dashboardAuthor,
          });
        }
      }
    );
  } else {
    res.send("Access Denied");
  }
});

//post request to make changes to logged in user(author) dashboard(author home page)
router.post("/settings", (req, res) => {
  const verify_name = req.session.user;
  const blog_title = req.body.blog_title;
  const blog_sub_title = req.body.blog_sub_title;
  const author_name = req.body.author_name;
  //update user settings in credentials table based on form input
  global.db.run(
    "UPDATE credentials SET dashboardTitle=?, dashboardSubT=?, dashboardAuthor=? WHERE userID = (SELECT userID FROM credentials WHERE username=?);",
    [blog_title, blog_sub_title, author_name, verify_name],
    function (err) {
      if (err) next(err);
      else {
        res.redirect("/route/dashboard");
      }
    }
  );
});

//logout
router.get("/logout", (req, res) => {
  req.session.destroy(function (err) {
    if (err) {
      console.log(err);
      res.send("You've encounterd an error! Oops");
    } else {
      res.redirect("/");
    }
  });
});
//---------------------------

//REMOVED ARE ALL THE DEFAULT TEMPLATES CODES FROM COURSERA

module.exports = router;
