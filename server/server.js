const express = require('express');
const app = express();

const path = require('path');
const client = __dirname + '/public';

// Default
app.use(express.static(path.join(client)));

// Cockroach
const async = require("async");
const fs = require("fs");
const parse = require("pg-connection-string").parse;
const pg = require("pg");
const { v4: uuidv4 } = require("uuid");

// Connection to the database
var connectData = require('./connect_data');
let string = "postgresql://"+connectData.data.user+":"+connectData.data.pass+"@free-tier.gcp-us-central1.cockroachlabs.cloud:"+connectData.data.port+"/defaultdb?sslmode=verify-full&sslrootcert=$HOME/certs/root.crt&options=--cluster%3Dbug-game-5059";
  // Expand $env:appdata environment variable in Windows connection string
  if (string.includes("env:appdata")) {
    string = string.replace(
      "$env:appdata",
      process.env.APPDATA
    );
  }
  // Expand $HOME environment variable in UNIX connection string
  else if (string.includes("HOME")){
    string = string.replace(
      "$HOME",
      process.env.HOME
    );
  }
  
var config = parse(string);
  config.port = 26257;
  config.database = "scores";

app.post('/leaderboard', (req, res) => {
    const currentPlayer = req.query.player;
    const newScore = req.query.score;
    const id = new Date().valueOf();

    const pool = new pg.Pool(config);
    pool.connect(function (err, client, done) {
        // Close the connection to the database and exit
        const finish = function (callback) {
                done();
        };
        if (err) {
          console.error('Error connecting to the CockroachDB', err);
          finish();
        }

        // async.waterfall is used to run a multiple task that is dependent to the previous one.
        
        let returnData;
        async.waterfall([
                function (next) {
                    // Init table if doesn't exist
                    console.log('add table')
                    const command = "CREATE TABLE IF NOT EXISTS leaderboard (id INT PRIMARY KEY, added TIMESTAMP DEFAULT CURRENT_TIMESTAMP, player VARCHAR(1000), score INT)"
                    client.query(command, next);
                  
                },
                function (results, next) {
                  console.log('add score')
                  if (currentPlayer && newScore) {
                    // Add score
                    const command = "INSERT INTO leaderboard (id, player, score) VALUES (" + id + ", '" + currentPlayer + "', " + newScore + ")"
                    client.query(command);
                  }
                  next();
                },
                function (next) {
                  const command = "SELECT player,score FROM leaderboard ORDER BY score DESC LIMIT 10;";
                  
                  client.query(command, function(err,{rows}){
                    returnData = {entries: rows};
                    next();
                  });
                },
            ],
            function (err) {
                if (err) {
                    console.error('Error adding and getting database ', err);
                    finish();
                }
                res.json(returnData);
                finish();
        });
    });
});

// STATIC
app.use(express.static(client+'/'));
app.get('/', (req,res) => {
  res.sendFile(client + "/index.html");
});
const host = '0.0.0.0';
const port = process.env.PORT || 5000;
app.listen(port, function(){
    console.log('Running on '+ port);
    console.log('Static set to '+ client + "/index.html")
});