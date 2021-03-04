const express = require("express");
const app = express();
const { pool } = require("./dbConfig");
const bcrypt = require("bcrypt");
const { render } = require("ejs");
const session = require("express-session");
const flash = require("express-flash");
const passport = require("passport");
const initializePassport = require("./passportConfig");
const path = require('path');
var _dirname = path.resolve();

/*var MemoryStore = require("memorystore")(session);

app.use(
  session({
    cookie: { maxAge: 86400000 },
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
    resave: false,
    secret: "keyboard cat",
  })
);*/

initializePassport(passport);

const PORT = process.env.PORT || 4000;

//This sends front end detail to our server
app.set("views", "./views");
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));

/*app.use(
  session({
    secret: "secret",

    resave: false,

    saveUninitialized: false,
  })
);*/
//Static files
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static("public"));

//This serves the static files from the React App
app.use(express.static(path.join(_dirname, 'client/build')));
//app.use("/css", express.static(__dirname + "public/css"));
//app.use("/js", express.static(__dirname + "public/js"));
//app.use("/images", express.static(__dirname + "public/images"));
app.use(flash());

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/users/register", checkAuthenticated, (req, res) => {
  res.render("register");
});

app.get("/users/login", checkAuthenticated, (req, res) => {
  res.render("login");
});

app.get("/users/dashboard", checkNotAuthenticated, (req, res) => {
  res.render("dashboard", { user: req.user.name });
});

app.get("/users/logout", (req, res) => {
  req.logOut();
  req.flash("success_msg", "You are logged out");
  res.redirect("/users/login");
});

/*app.get("/users/game", (req, res) => {
  res.sendFile(__dirname + "/users/game.html");
});*/




app.post("/users/register", async (req, res) => {
  let { name, email, password, password2 } = req.body;

  console.log({
    name,
    email,
    password,
    password2,
  });

  let errors = [];

  if (!name || !email || !password || !password2) {
    errors.push({ message: "Please enter all fields " });
  }

  if (password.length < 6) {
    errors.push({ message: "Password should be at least 6 characters" });
  }

  if (password != password2) {
    errors.push({ message: "Passwords do not match" });
  }

  if (errors.length > 0) {
    res.render("register", { errors });
  } else {
    //Form validation has passed

    let hashedPassword = await bcrypt.hash(password, 10);
    console.log(hashedPassword);

    pool.query(
      `SELECT * FROM users
      WHERE email = $1`,
      [email],
      (err, results) => {
        if (err) {
          throw err;
        }
        console.log(results.rows);

        if (results.rows.length > 0) {
          errors.push({ message: "Email already registered" });
          res.render("register", { errors });
        } else {
          pool.query(
            `INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, password`,
            [name, email, hashedPassword],
            (err, results) => {
              if (err) {
                throw err;
              }
              console.log(results.rows);
              req.flash("success_msg", "You are now registered. Please log in");
              res.redirect("/users/login");
            }
          );
        }
      }
    );
  }
});

//if it cannot authenticate, express will render one of the error messages
app.post(
  "/users/login",
  passport.authenticate("local", {
    successRedirect: "/users/game",
    failureRedirect: "/users/login",
    failureFlash: true,
  })
);
function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/users/game");
  }
  next();
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/users/login");
}

//handles any request that do not match the ones above
app.get('*', (req, res) =>{
  res.sendFile(path.join(_dirname+'/client/build/index.html'));
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
