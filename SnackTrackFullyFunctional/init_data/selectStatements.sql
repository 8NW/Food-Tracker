SELECT c.firstName, c.lastname FROM Customer d 
INNER JOIN Customer c on c.userID = ANY(d.friends) 
WHERE d.userID = 5; 