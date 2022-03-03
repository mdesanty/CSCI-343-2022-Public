DROP DATABASE IF EXISTS UserAuthenticationDemo;
CREATE DATABASE UserAuthenticationDemo;
use UserAuthenticationDemo;

CREATE TABLE Users (
  Id int NOT NULL AUTO_INCREMENT,
  Email VARCHAR(255) NOT NULL UNIQUE,
  Password VARCHAR(60) NOT NULL,
  PRIMARY KEY(Id)
);