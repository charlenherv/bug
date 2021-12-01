const express = require('express');
const app = express();
const fs = require("fs");
const path = require('path');
const client = __dirname + '/public';

// Default
app.use(express.static(path.join(client)));

// Cockroach
const parse = require("pg-connection-string").parse;
const { Pool } = require("pg");
const prompt = require("prompt");
const { v4: uuidv4 } = require("uuid");

/*
// Wrapper for a function.  This automatically re-calls the operation with
// the client as an argument as long as the database server asks for
// the function to be retried.
async function retryTxn(n, max, client, operation, callback) {
  await client.query("BEGIN;");
  while (true) {
      n++;
      if (n === max) {
          throw new Error("Max retry count reached.");
      }
      try {
          await operation(client, callback);
          await client.query("COMMIT;");
          return;
      } catch (err) {
          if (err.code !== "40001") {
              return callback(err);
          } else {
              console.log("Transaction failed. Retrying transaction.");
              console.log(err.message);
              await client.query("ROLLBACK;", () => {
                  console.log("Rolling back transaction.");
              });
              await new Promise((r) => setTimeout(r, 2 ** n * 1000));
          }
      }
  }
}

// Init table if doesn't exist
async function createTableIfDoesntExist(client, callback) {
  const command = "CREATE TABLE IF NOT EXISTS scores (id UUID PRIMARY KEY, time DEFAULT CURRENT_TIMESTAMP, user varchar(1000), score INT);"
  await client.query(command, callback);
}

// Run the transactions in the connection pool
app.get('/getLeaderboard', (req, res) => {

  
  async function getScores(client, callback) {
    const command1 = "CREATE TABLE IF NOT EXISTS scores (id UUID PRIMARY KEY, time CURRENT_TIMESTAMP, user varchar(1000), score INT);"
    await client.query(command1, callback);

    const command = "SELECT user,score FROM scores;"
    await client.query(command, callback);
  }

  (async () => {

    // CONNECTION
    prompt.start();
    const URI = await prompt.get("connectionString");
    var connectionString;
    // Expand $env:appdata environment variable in Windows connection string
    if (URI.connectionString.includes("env:appdata")) {
        connectionString = await URI.connectionString.replace(
            "$env:appdata",
            process.env.APPDATA
        );
    }
    // Expand $HOME environment variable in UNIX connection string
    else if (URI.connectionString.includes("HOME")) {
        connectionString = await URI.connectionString.replace(
            "$HOME",
            process.env.HOME
        );
    }
    var config = parse(connectionString);
    config.port = 26257;
    config.database = "bank";
    const pool = new Pool(config);
    // Connect to database
    const client = await pool.connect();

    // RUNNING CODE
    console.log("Get scores...");
    function cb(err, res) {
        if (err) throw err;

        if (res.rows.length > 0) {
          const entries = res.rows;
          console.log(entries);
          res.json({});
        }
    }
    await retryTxn(0, 15, client, getScores, cb);

    // Exit program
    process.exit();

  })().catch((err) => console.log(err.stack));

});

app.post('/addScore', (req, res) => {
  var user = req.query.user;
  var score = req.query.score;

  (async () => {
    // Insert new score
    // Get user and score from api call
    async function addScore(client, callback) {
      const id = await uuidv4();
      const command = "INSERT INTO scores (id, user, score) VALUES (" + id + ", " + user + ", " + score + ")"
      await client.query(command, callback);
    }
    
    // CONNECTION
    prompt.start();
    const URI = await prompt.get("connectionString");
    var connectionString;
    // Expand $env:appdata environment variable in Windows connection string
    if (URI.connectionString.includes("env:appdata")) {
        connectionString = await URI.connectionString.replace(
            "$env:appdata",
            process.env.APPDATA
        );
    }
    // Expand $HOME environment variable in UNIX connection string
    else if (URI.connectionString.includes("HOME")) {
        connectionString = await URI.connectionString.replace(
            "$HOME",
            process.env.HOME
        );
    }
    var config = parse(connectionString);
    config.port = 26257;
    config.database = "bank";
    const pool = new Pool(config);
    // Connect to database
    const client = await pool.connect();

    // RUNNING CODE
    console.log("Adding score...");
    function cb(err, res) {
        if (err) throw err;

        if (res.rows.length > 0) {
            console.log(entries);
            res.json({});
        }
    }
    await retryTxn(0, 15, client, addScore, cb);

    // Exit program
    process.exit();

  })().catch((err) => console.log(err.stack));
  
});
*/
// STATIC
app.use(express.static(client+'/'));
app.get('/', (req,res) => {
  res.sendFile(client + "/index.html");
});

const port = process.env.PORT || 5000;
app.listen(port, function(){
    console.log('Running on '+ port);
    console.log('Static set to '+ client + "/index.html")
});