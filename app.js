const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const morgan = require("morgan"); // for logging
const connectDB = require("./config/db");
const exphbs = require("express-handlebars");
const methodOverride = require("method-override");

const passport = require("passport");
const session = require("express-session");

const MongoStore = require("connect-mongo");

const path = require("path");

//load the config files
dotenv.config({ path: "./config/config.env" });

//passport config
require("./config/passport")(passport);

//connect mongodb
connectDB();

const app = express();

//add body parser middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// METHOD OVERRIDE
app.use(
  methodOverride(function (req, res) {
    if (req.body && typeof req.body === "object" && "_method" in req.body) {
      // look in urlencoded POST bodies and delete it
      let method = req.body._method;
      delete req.body._method;
      return method;
    }
  })
);

//logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

//Handlebar helpers
const {
  formatDate,
  stripTags,
  truncate,
  editIcon,
  select,
} = require("./helpers/hbs");

// view engine : handlebars
app.engine(
  ".hbs",
  exphbs({
    helpers: { formatDate, stripTags, truncate, editIcon, select },
    defaultLayout: "main",
    extname: ".hbs",
  })
);
app.set("view engine", ".hbs");

// SESSIONS middleware
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false, //dont create session until something stores
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  })
);

//passport middleware
app.use(passport.initialize());
app.use(passport.session());

// SET GLOBAL VARIABLES
app.use(function (req, res, next) {
  res.locals.user = req.user || null;
  next();
});

//static folders
app.use(express.static(path.join(__dirname, "public")));

//Routes
app.use("/", require("./routes/index"));
app.use("/auth", require("./routes/auth"));
app.use("/stories", require("./routes/stories"));

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`App listening on ${process.env.NODE_ENV} mode on port 8000!`);
});
