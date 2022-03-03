const express = require("express");
const app = express();

const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

const bcrypt = require("bcryptjs");

const mysql = require("mysql");
const connectionInfo = {
  host: "localhost",
  user: "root",
  password: "",
  database: "UserAuthenticationDemo"
};

const sqlConnection = mysql.createConnection(connectionInfo);
sqlConnection.connect(function(error) {
  if (error) {
    throw(error);
  }
});

const session = require("express-session");

const sessionOptions = {
  secret: "MikeIsMyFavoriteTeacher",
  resave: false,
  saveUninitialized: false,
  cookie: {maxAge: 600_000}
};
app.use(session(sessionOptions));

app.get("/", whoIsLoggedIn);
app.get("/register", register);
app.get("/login", login);
app.get("/logout", logout);

const port = 3000;
app.listen(port, "localhost", startHandler);

function startHandler() {
  console.log(`Server listening on port ${port}`);
}

function whoIsLoggedIn(req, res) {
  let object = {};

  if(req.session.user === undefined) {
    object["result"] = "Nobody is logged in.";
  }
  else {
    object["result"] = {"Id": req.session.user.Id, "Email": req.session.user.Email};
  }

  writeResult(res, object);
}

function register(req, res) {
  if(!emailIsValid(req.query.email)) {
    object = {"error": "Email is invalid."};

    writeResult(res, object);
    return;
  }

  if(!passwordIsValid(req.query.password)) {
    object = {"error": "Paasword is invalid."};

    writeResult(res, object);
    return;
  }
  let email = req.query.email;
  let passwordHash = bcrypt.hashSync(req.query.password, 12);

  sqlConnection.query("INSERT INTO Users(Email, Password) VALUES(?, ?)", [email, passwordHash], function(error) {
    if(error) {
      let message = "There was an error inserting the user.";
      if(error.code == "ER_DUP_ENTRY")
        message = "That email has already been taken.";

      let object = {"error": message};
      writeResult(res, object);
    }
    else {
      sqlConnection.query("SELECT Id, Email FROM Users WHERE email = ?", email, function(error, dbResult) {
        if(error) {
          let object = {"error": "There was an error getting the user."};
          writeResult(object);
        }
        else {
          let user = {"Id": dbResult[0].Id, "Email": dbResult[0].Email};
          req.session.user = user;

          let object = {"result": user};
          writeResult(res, object);
        }
      })
    }
  });
}

function login(req, res) {
  let email = req.query.email;
  let password = req.query.password;

  if(email === undefined) {
    let object = {"error": "Email is required."};

    writeResult(res, object);
    return;
  }

  if(password === undefined) {
    let object = {"error": "Password is required."};

    writeResult(res, object);
    return;
  }

  sqlConnection.query("SELECT Id, Email, Password FROM Users WHERE Email = ?", email, function(error, dbResult) {
    if(error) {
      let object = {"error": "There was an error."};
      writeResult(res, object);
    }
    else {
      let user = {"Id": dbResult[0].Id, "Email": dbResult[0].Email};
      req.session.user = user;

      let object = {"result": user};
      writeResult(res, object);
    }
  });
}

function logout(req, res) {
  req.session.user = undefined;

  let object = {"result": "Nobody is logged in."};
  writeResult(res, object);
}

function writeResult(res, object) {
  res.writeHead(200, {"Content-Type": "application/json"});
  res.end(JSON.stringify(object));
}

function emailIsValid(email) {
  if(email === undefined) {
    return false;
  }

  return emailRegex.test(email.toLowerCase());
}

function passwordIsValid(password) {
  if(password === undefined) {
    return false;
  }

  return passwordRegex.test(password.toLowerCase());
}