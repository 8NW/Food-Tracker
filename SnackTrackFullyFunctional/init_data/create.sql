CREATE TABLE IF NOT EXISTS Customer(
    userID SERIAL PRIMARY KEY,
    firstName VARCHAR(50),
    lastName VARCHAR(50),
    backgroundColor VARCHAR(50),
    profilePicture VARCHAR(50),
    friends INT[],
    username VARCHAR(50),
    passwrd VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS Household(
    householdID SERIAL PRIMARY KEY,
    householdName VARCHAR(50),
    passwrd VARCHAR(50),
    snacks VARCHAR[],
    members INT[]
);

CREATE EXTENSION pgcrypto;

/*CREATE TABLE IF NOT EXISTS UserHousehold(
    householdID INT,
    userID INT,
    PRIMARY KEY(householdID, userID),
    FOREIGN KEY(householdID) REFERENCES Household(householdID),
    FOREIGN KEY(userID) REFERENCES Customer(userID),
    userOwes DECIMAL(18, 0),
    userIsOwed DECIMAL(18, 0)
); */

INSERT INTO Customer (firstName, lastName, friends) VALUES 
('Fred', 'Rick', ARRAY [2, 3, 4]), 
('Billy', 'Bob', ARRAY [1, 3, 4]),
('John', 'Doe', ARRAY[1, 2, 4]),
('Jane', 'Doe', ARRAY[1, 2, 3]),
('Michael', 'Jordan', ARRAY [2]),
('Larry', 'Bird', ARRAY [1, 3]),
('Cale', 'Makar', ARRAY [1, 3]);

CREATE TABLE IF NOT EXISTS Transactions(

    transaction_id SERIAL PRIMARY KEY,
    senderID int NOT NULL,
    recieverID int NOT NULL,
    trans_date date,
    trans_desc VARCHAR(50),
    FOREIGN KEY(senderID) REFERENCES Customer(userID),
    FOREIGN KEY(recieverID) REFERENCES Customer(userID),
    amount DECIMAL(18,2) NOT NULL,
    request INT
);