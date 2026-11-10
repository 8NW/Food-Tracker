CREATE DATABASE snacktrack_db;

CREATE TABLE IF NOT EXISTS Customer(
    userID SERIAL PRIMARY KEY,
    firstName VARCHAR(50),
    lastName VARCHAR(50),
    backgroundColor VARCHAR(50),
    profilePicture VARCHAR(50),
    friends INT[],
    username VARCHAR(50)
    payment_method VARCHAR(1),
    card_number int,
    card_exp DATE,
    card_security_code int
);

CREATE TABLE IF NOT EXISTS Friend(
    friendID INT SERIAL,
    userID INT,
    PRIMARY KEY(userID, friendID)
    FOREIGN KEY(userID) REFERENCES Customer(userID),
    friendFirstName VARCHAR(50),
    friendLastName VARCHAR(50),
    amountOwed DECIMAL(18, 0),
    amountOwedBy DECIMAL(18, 0)
);

CREATE TABLE IF NOT EXISTS Household(
    householdID SERIAL PRIMARY KEY,
    householdName VARCHAR(50),
    members INT[]
);

CREATE TABLE IF NOT EXISTS UserHousehold(
    householdID SERIAL,
    userID INT,
    PRIMARY KEY(householdID, userID),
    FOREIGN KEY(householdID) REFERENCES Household(householdID),
    FOREIGN KEY(userID) REFERENCES Customer(userID),
    userOwes DECIMAL(18, 0),
    userIsOwed DECIMAL(18, 0)
);

CREATE TABLE IF NOT EXISTS Transactions(

    transaction_id int NOT NULL AUTO_INCREMENT,
    PRIMARY KEY(Transaction_id),
    senderID int NOT NULL,
    recieverID int NOT NULL,
    FOREIGN KEY(senderID) REFERENCES Customer(userID),
    FOREIGN KEY(recieverID) REFERENCES Customer(userID)
    amount DECIMAL(6,2) NOT NULL
);
