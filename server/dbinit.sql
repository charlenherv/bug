SET sql_safe_updates = FALSE;

USE defaultdb;
DROP DATABASE IF EXISTS bank CASCADE;
CREATE DATABASE IF NOT EXISTS bank;

USE bank;

CREATE TABLE highscores (
    id UUID PRIMARY KEY,
    time DEFAULT CURRENT_TIMESTAMP
    user VARCHAR(255),
    score INT
);