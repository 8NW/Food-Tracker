const exp=require('express');

const app=exp();

var bodyParser = require('body-parser'); //Ensure our body-parser tool has been added
app.use(bodyParser.json());              // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));// support encoded bodies

var pgp = require('pg-promise')();

const { v4: genuuid} = require('uuid');

const session=require('express-session');
const { request } = require('express');

//Middle-ware
app.use(session(
{ name:'SessionCookie',
  genid: function(req) {
      console.log('session id created');
    return genuuid();}, // use UUIDs for session IDs
  secret: 'Shsh!Secret!',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false,expires:6000000000000 }
}));

const dbConfig = {
	host: 'db',
	port: 5432,
	database: 'snacktrackdb',
	user: 'postgres',
	password: 'pwd'
};


var db = pgp(dbConfig);

app.set('view engine', 'ejs');
app.use(exp.static(__dirname + '/'));

//Routes

app.get('/', function(req, res) {
	
	if(req.session.username)
	{
		req.session.destroy();

		res.render('pages/login',{
			local_css:"signin.css",
			color:'',
			my_title:"Login Page",
			failed: false
		});
	}
	
	res.render('pages/login',{
		local_css:"signin.css",
		color:'',
		my_title:"Login Page",
		failed: false
	});
});

app.post('/logout', function(req, res) {
	
	if(!req.session.username)
	{
		res.render('pages/login',{
			local_css:"signin.css",
			color:'',
			my_title:"Login Page"
		});
	}
	
	req.session.destroy();
	res.render('pages/login',{
		local_css:"signin.css",
		color:'',
		my_title:"Login Page",
		failed: false
	});
});

app.get('/logout', function(req, res) {
	
	if(!req.session.username)
	{
		res.render('pages/login',{
			local_css:"signin.css",
			color: "",
			my_title:"Login Page",
			failed: false
		});
	}

	var query = "SELECT backgroundColor FROM Customer WHERE username = '" + req.session.username + "';";
	
	db.any(query)
		.then(function (rows) {
			console.log(rows);
			res.render('pages/logout',{
				local_css:"signin.css",
				color:'',
				my_title: "Logout Page",
				color: rows[0].backgroundcolor
			})
		})
		.catch(function (err) {
			// display error message in case an error
			console.log("Error:", err);
			req.flash('error', err);
			res.render('pages/logout', {
				my_title: 'Logout Page',
				data: '',
				color:''
			})
		});
});

app.post('/register', function(request, response) {
	
	let firstname = request.body.first_name;
	let lastname = request.body.last_name;
	let username = request.body.username;
	let password = request.body.password;

	console.log("firstname: ", firstname);
	console.log("lastname: ", lastname);
	console.log("username: ", username);
	console.log("password: ", password);
	
	if(firstname && lastname && username && password)
	{
		var query1 = "SELECT * FROM Customer WHERE username = '" + username + "';";
		var query2 = "INSERT INTO Customer (firstName, lastName, friends, username, passwrd, profilePicture) VALUES ('" + firstname + "', '" + lastname + "', ARRAY[]::int[], '" + username + "', crypt('" + password + "', gen_salt('bf')), '../../resources/img/user__default.png');"
		var query3 = "SELECT c.userID, c.profilePicture, c.firstName, c.lastname FROM Customer d INNER JOIN Customer c on c.userID = ANY(d.friends) WHERE d.username = '" + username + "'ORDER BY c.userID ASC;";
		var query4 = "SELECT userID FROM Customer WHERE username = '" + username + "';";


		db.any(query1)
			.then(function (rows) {
				console.log("rows: ", rows);
				if((rows.length > 0))
				{
					response.render('pages/login',{
						local_css:"signin.css",
						my_title:"Login Page",
						failed: true
					});
				}
				else
				{
					db.task('get-everything', task => {
						return task.batch([
							task.any(query2),
							task.any(query3),
							task.any(query4)
						]);
					})
					.then(info => {
						console.log()
						if(info[2].length > 0)
							{
								console.log("WE ARE HERE");
								request.session.loggedin = true;
								request.session.username = username;
			
								var user_id;
								
								info[2].forEach(function(item)
								{
									user_id = item.userid;
								});
			
								request.session.userid = user_id;
			
								response.render('pages/people', {
									title: 'People Page',
									data: info[1],
									color: '',
									user_id: request.session.userid,
									affected: [1],
									id: info[2].userID,
									color_msg: ''
								})
							}
							else
							{
								response.render('pages/login',{
									local_css:"signin.css",
									my_title:"Login Page",
									failed: true
								});
							}
					})
					.catch(error => {
						// display error message in case an error
						response.render('pages/login', {
							title: 'Home Page',
							data: '',
							local_css:"signin.css",
							failed: true,
							color: '',
							householdname: '',
							color_msg: ''
						})
					});
				}
			})
			.catch(function (err) {
				// display error message in case an error
				console.log("Error:", err);
				request.flash('error', err);
				response.render('pages/home', {
					title: 'Home Page',
					data: '',
					color: '',
					color_msg: ''
				})
			});
	}

});


app.post('/auth', function(request, response) {
	// Capture the input fields
	let username = request.body.username;
	let password = request.body.password;

	// Ensure the input fields exists and are not empty
	if (username && password) {
		// Execute SQL query that'll select the account from the database based on the specified username and password

		console.log("here baby");
		var query = "SELECT * FROM Customer WHERE username = '" + username + "' AND passwrd = crypt('" + password + "', passwrd);";
		var query2 = "SELECT c.userID, c.profilePicture, c.firstName, c.lastname FROM Customer d INNER JOIN Customer c on c.userID = ANY(d.friends) WHERE d.username = '" + username + "'ORDER BY c.userID ASC;";
		var query3 = "SELECT userID FROM Customer WHERE username = '" + username + "';";
		var query4 = "SELECT backgroundColor FROM Customer WHERE username = '" + username + "';";

		db.task('get-everything', task => {
			return task.batch([
				task.any(query),
				task.any(query2),
				task.any(query3),
				task.any(query4)
			]);
		})
		.then(info => {
			if(info[0].length > 0)
				{
					request.session.loggedin = true;
					request.session.username = username;
					request.session.password = '';

					console.log("username: ", username);

					var user_id;
					
					info[2].forEach(function(item)
					{
						user_id = item.userid;
					});

					request.session.userid = user_id;

					console.log("id now: ", request.session.userid);

					response.render('pages/people', {
						title: 'People Page',
						data: info[1],
						color: info[3][0].backgroundcolor,
						user_id: request.session.userid,
						affected: [1],
						id: info[2].userID,
						color_msg: ''
					})
				}
				else
				{
					console.log("was an error here");
					request.flash('was an error');
					response.render('pages/login', {
						title: 'Login Page',
						data: '',
						local_css:"signin.css",
						color: '',
						failed: true,
						color_msg: ''
					})
				}
		})
		.catch(error => {
			// display error message in case an error
			response.render('pages/login', {
				title: 'Home Page',
				data: '',
				color: '',
				failed: true,
				local_css:"signin.css",
				householdname: '',
				color_msg: ''
			})
		});


	}
});

app.get('/register', function(req, res) {
		
	res.render('pages/register',{
		my_title:"Registration Page"
	});
});

app.post('/profile', function(req, res) {

	if(!req.session.username)
	{
		res.render('pages/login',{
			local_css:"signin.css",
			color:'',
			my_title:"Login Page",
			failed: false
		});
	}
	var pic = req.body.fav_language;

	var query = "UPDATE Customer SET profilePicture = '" + pic + "' WHERE userid = " + req.session.userid + ";";
	var query2 = "SELECT profilePicture, backgroundColor FROM Customer WHERE username = '" + req.session.username + "';";

	db.task('get-everything', task => {
		return task.batch([
			task.any(query),
			task.any(query2)
		]);
	})
	.then(info => {
		res.render('pages/profile',{
			my_title: "Profile Page",
			data: req.session.username,
			profilepic: info[1][0].profilepicture,
			color: info[1][0].backgroundcolor
		})
	})
	.catch(error => {
		// display error message in case an error
		request.flash('error', err);
		response.render('pages/people', {
			title: 'Home Page',
			data: '',
			color: '',
			householdname: '',
			color_msg: ''
		})
	});
});

/*Add your other get/post request handlers below here: */
app.get('/home', function(req, res) {	

	if(!req.session.username)
	{
		res.render('pages/login',{
			local_css:"signin.css",
			color:'',
			my_title:"Login Page",
			failed: false
		});
	}
	
	console.log(req.session.username);
	if(req.session.loggedin == true)
	{
		var query = "SELECT DISTINCT h.snacks, h.householdname, h.householdid FROM household h WHERE " + req.session.userid + " = ANY(members);";
		var query2 = "SELECT backgroundColor FROM Customer WHERE username = '" + req.session.username + "';";

		db.task('get-everything', task => {
			return task.batch([
				task.any(query),
				task.any(query2)
			]);
		})
			.then(function (rows) {
				res.render('pages/home',{
					my_title: "Home Page",
					data: rows[0],
					color: rows[1][0].backgroundcolor,
					affected:[1],
					alreadyExisted: false,
					color_msg: ''
				})
			})
			.catch(function (err) {
				// display error message in case an error
				console.log("Error:", err);
				req.flash('error', err);
				res.render('pages/home', {
					title: 'Home Page',
					data: '',
					alreadyExisted: false,
					color: '',
					color_msg: ''
				})
			});
	}
	else
	{
		console.log("Ain't logged in.");
	}
});

app.post('/individualHome', function(req, res) {	

	if(!req.session.username)
	{
		res.render('pages/login',{
			local_css:"signin.css",
			color:'',
			my_title:"Login Page",
			failed: false
		});
	}
	
	var home_id = req.body.home_id;
	var query = "SELECT userid, profilepicture, firstname, lastname FROM customer where userID = ANY(SELECT unnest(members) FROM household WHERE householdid = " + home_id + ") AND userid != " + req.session.userid + ";";
	var query2 = "SELECT householdname FROM household WHERE householdid = " + home_id + ";"; 
	var query3 = "SELECT backgroundColor FROM Customer WHERE username = '" + req.session.username + "';";

	db.task('get-everything', task => {
		return task.batch([
			task.any(query),
			task.any(query2),
			task.any(query3)
		]);
	})
	.then(info => {
		console.log("name: ", info[1]);
		res.render('pages/individualHome',{
			my_title: "People Page",
			color: info[2][0].backgroundcolor,
			data: info[0],
			householdname: info[1]
		})
	})
	.catch(error => {
		// display error message in case an error
		request.flash('error', err);
		response.render('pages/individualHome', {
			title: 'Home Page',
			data: '',
			color: '',
			householdname: '',
			color_msg: ''
		})
	});
});


app.get('/payments', function(req, res) {

	if(!req.session.username)
	{
		res.render('pages/login',{
			local_css:"signin.css",
			color:'',
			my_title:"Login Page",
			failed: false
		});
	}
  
	var query = "Select t.transaction_id AS trans_id, t.senderID AS send_ID, t.trans_desc AS transdesc, t.recieverID AS receive_ID, CAST(t.amount AS float) AS amnt, t.trans_date AS t_date, t.request AS request, c.firstName AS senderName, c2.firstName AS receiverName FROM Transactions t INNER JOIN Customer c ON c.userID = t.senderID INNER JOIN Customer c2 ON c2.userID = t.recieverID WHERE " + req.session.userid + " = t.senderID OR " + req.session.userid + " = t.recieverID ORDER BY t.transaction_id ASC;";
	var query2 = "SELECT backgroundColor FROM Customer WHERE username = '" + req.session.username + "';";

	db.task('get-everything', task => {
		return task.batch([
			task.any(query),
			task.any(query2)
		]);
	})
		.then(function (rows) {
			res.render('pages/payments',{
				my_title: "Payments Page",
				data: rows[0],
				userid: req.session.userid,
				color: rows[1][0].backgroundcolor,
				color_msg: ''
			})
		})
		.catch(function (err) {
			// display error message in case an error
			console.log("Error:", err);
			req.flash('error', err);
			res.render('pages/payments', {
				title: 'Payments Page',
				data: '',
				color: '',
				userid: '',
				color_msg: ''
			})
		});
});

app.get('/profile', function(req, res) {

	if(!req.session.username)
	{
		res.render('pages/login',{
			local_css:"signin.css",
			color:'',
			my_title:"Login Page",
			failed: false
		});
	}

	var query = "SELECT profilePicture, backgroundColor FROM Customer WHERE username = '" + req.session.username + "';";
	
	db.any(query)
		.then(function (rows) {
			console.log(rows);
			res.render('pages/profile',{
				my_title: "Profile Page",
				data: req.session.username,
				profilepic: rows[0].profilepicture,
				color: rows[0].backgroundcolor
			})
		})
		.catch(function (err) {
			// display error message in case an error
			console.log("Error:", err);
			req.flash('error', err);
			res.render('pages/profile', {
				my_title: 'Profile Page',
				data: req.session.username,
				profilepic:'',
				color:''
			})
		});
});

app.post('/pick_color', function(req, res) {

	if(!req.session.username)
	{
		res.render('pages/login',{
			local_css:"signin.css",
			color:'',
			my_title:"Login Page",
			failed: false
		});
	}

	var color = req.body.color_name;
	console.log(color);
	var query = "UPDATE Customer SET backgroundColor = '" + color + "' WHERE username = '" + req.session.username + "';";
	var query2 = "SELECT profilePicture, backgroundColor FROM Customer WHERE username = '" + req.session.username + "';";
	
	db.task('get-everything', task => {
		return task.batch([
			task.any(query),
			task.any(query2)
		]);
	})
		.then(function (rows) {
			console.log(rows);
			res.render('pages/profile',{
				my_title: "Profile Page",
				data: req.session.username,
				profilepic: rows[1][0].profilepicture,
				color: rows[1][0].backgroundcolor
			})
		})
		.catch(function (err) {
			// display error message in case an error
			console.log("Error:", err);
			res.render('pages/profile', {
				my_title: 'Profile Page',
				data: req.session.username,
				color:''
			})
		});
});

app.get('/people', function(req, res) {

	if(!req.session.username)
	{
		res.render('pages/login',{
			local_css:"signin.css",
			color:'',
			my_title:"Login Page",
			failed: false
		});
	}
	
	var query = "SELECT c.userID, c.profilePicture, c.firstName, c.lastname FROM Customer d INNER JOIN Customer c on c.userID = ANY(d.friends) WHERE d.userID = " + req.session.userid + " ORDER BY c.userID ASC;";
	var query2 = "SELECT backgroundColor FROM Customer WHERE username = '" + req.session.username + "';";

	db.task('get-everything', task => {
		return task.batch([
			task.any(query),
			task.any(query2)
		]);
	})
		.then(function (rows) {
			console.log("user_id: ", req.session.userid);
			res.render('pages/people',{
				my_title: "People Page",
				data: rows[0],
				color: rows[1][0].backgroundcolor,
				failed: false,
				user_id: req.session.userid,
				affected: [1]
			})
		})
		.catch(function (err) {
			// display error message in case an error
			console.log("Error:", err);
			req.flash('error', err);
			res.render('pages/people', {
				title: 'People Page',
				data: '',
				failed: true,
				affected: [1],
				color: '',
				user_id: req.session.userid,
				color_msg: ''
			})
		});
  });

  app.post('/home/delete', function(req, res) {

	if(!req.session.username)
	{
		res.render('pages/login',{
			local_css:"signin.css",
			color:'',
			my_title:"Login Page",
			failed: false
		});
	}
	var house_id = req.body.household_id;

	var query = "UPDATE Household SET members = array_remove(members, " + req.session.userid + ") WHERE householdid = " + house_id + ";";
	var query2 = "SELECT DISTINCT h.snacks, h.householdname, h.householdid FROM household h WHERE " + req.session.userid + " = ANY(members);";
	var query3 = "SELECT backgroundColor FROM Customer WHERE username = '" + req.session.username + "';";

	db.task('get-everything', task => {
		return task.batch([
			task.any(query),
			task.any(query2),
			task.any(query3)
		]);
	})
	.then(info => {
		res.render('pages/home',{
			my_title: "Home Page",
			color: info[2][0].backgroundcolor,
			data: info[1],
			affected: [1],
			alreadyExisted: false,
		})
	})
	.catch(error => {
		// display error message in case an error
		request.flash('error', err);
		response.render('pages/home', {
			title: 'Home Page',
			data: '',
			color: '',
			affected: [1],
			color_msg: ''
		})
	});

});

  app.post('/people/delete', function(req, res) {

	if(!req.session.username)
	{
		res.render('pages/login',{
			local_css:"signin.css",
			color:'',
			my_title:"Login Page",
			failed: false
		});
	}
	var friend_id = req.body.friend_id;

	var query = "UPDATE Customer SET friends = array_remove(friends, " + friend_id + ") WHERE userID = " + req.session.userid + ";";
	var query2 = "SELECT c.userID, c.profilePicture, c.firstName, c.lastname FROM Customer d INNER JOIN Customer c on c.userID = ANY(d.friends) WHERE d.userID = " + req.session.userid + " ORDER BY c.userID ASC;";
	var query3 = "SELECT backgroundColor FROM Customer WHERE username = '" + req.session.username + "';";
	
	db.task('get-everything', task => {
		return task.batch([
			task.any(query),
			task.any(query2),
			task.any(query3)
		]);
	})
	.then(info => {
		res.render('pages/people',{
			my_title: "People Page",
			color: info[2][0].backgroundcolor,
			data: info[1],
			failed: false,
			user_id: req.session.userid,
			affected: [1]
		})
	})
	.catch(error => {
		// display error message in case an error
		request.flash('error', err);
		response.render('pages/people', {
			title: 'Home Page',
			data: '',
			failed: true,
			color: '',
			user_id: req.session.userid,
			affected: [1],
			color_msg: ''
		})
	});

});

app.get('*', function(req, res){

	if(!req.session.username)
	{
		res.render('pages/login',{
			local_css:"signin.css",
			color:'',
			my_title:"Login Page",
			failed: false
		});
	}
	res.render('pages/404',{
		my_title:"404 page"
	});

  });

app.post('/people/pay', function(req, res) {

	if(!req.session.username)
	{
		res.render('pages/login',{
			local_css:"signin.css",
			color:'',
			my_title:"Login Page",
			failed: false
		});
	}
	var receiverid = req.body.receiver_id;
	var paymentAmount = req.body.payment_amount;
	var desc = req.body.pay_description;

	console.log("payment here: ", paymentAmount);

	var query = "INSERT INTO transactions (senderID, recieverID, trans_date, trans_desc, amount, request) VALUES (" + req.session.userid + ", " + receiverid + ", now(), '" + desc + "', CAST(" + paymentAmount + " AS float), 1);";
	var query2 = "SELECT c.userID, c.firstName, c.profilePicture, c.lastname FROM Customer d INNER JOIN Customer c on c.userID = ANY(d.friends) WHERE d.userID = " + req.session.userid + " ORDER BY c.userID ASC;";
	var query3 = "SELECT backgroundColor FROM Customer WHERE username = '" + req.session.username + "';";
	
	db.task('get-everything', task => {
		return task.batch([
			task.any(query),
			task.any(query2),
			task.any(query3)
		]);
	})
	.then(info => {
		res.render('pages/people',{
			my_title: "People Page",
			color: info[2][0].backgroundcolor,
			data: info[1],
			failed: false,
			user_id: req.session.userid,
			affected: [1]
		})
	})
	.catch(error => {
		// display error message in case an error
		request.flash('error', err);
		response.render('pages/people', {
			title: 'Home Page',
			data: '',
			color: '',
			affected: [1],
			color_msg: ''
		})
	});

});

app.post('/payments/payrequest', function(req, res) {

	if(!req.session.username)
	{
		res.render('pages/login',{
			local_css:"signin.css",
			color:'',
			my_title:"Login Page",
			failed: false
		});
	}

	var trans_id = req.body.trans_id;

	var query = "UPDATE transactions SET request = 1, trans_date = now() WHERE  transaction_id = " + trans_id + ";";
	var query2 = "Select t.transaction_id AS trans_id, t.senderID AS send_ID, t.trans_desc AS transdesc, t.recieverID AS receive_ID, CAST(t.amount AS float) AS amnt, t.trans_date AS t_date, t.request AS request, c2.firstName AS senderName, c2.firstName AS receiverName FROM Transactions t INNER JOIN Customer c ON c.userID = t.senderID INNER JOIN Customer c2 ON c2.userID = t.recieverID WHERE " + req.session.userid + " = t.senderID OR " + req.session.userid + " = t.recieverID ORDER BY t.transaction_id ASC;";
	var query3 = "SELECT backgroundColor FROM Customer WHERE username = '" + req.session.username + "';";
	
	db.task('get-everything', task => {
		return task.batch([
			task.any(query),
			task.any(query2),
			task.any(query3)
		]);
	})
	.then(info => {
		res.render('pages/payments',{
			my_title: "People Page",
			color: info[2][0].backgroundcolor,
			userid: req.session.userid,
			data: info[1],
			affected: [1]
		})
	})
	.catch(error => {
		// display error message in case an error
		request.flash('error', err);
		response.render('pages/payments', {
			title: 'Home Page',
			data: '',
			color: '',
			userid: '',
			affected: [1],
			color_msg: ''
		})
	});

});

app.post('/people/request', function(req, res) {

	if(!req.session.username)
	{
		res.render('pages/login',{
			local_css:"signin.css",
			color:'',
			my_title:"Login Page",
			failed: false
		});
	}
	var receiverid = req.body.receiver_id;

	console.log("receiver_id: ", receiverid);

	var requestAmount = req.body.request_amount;
	var desc = req.body.pay_description;

	var query = "INSERT INTO transactions (senderID, recieverID, trans_date, trans_desc, amount, request) VALUES (" + receiverid  + ", " + req.session.userid + ", now(), '" + desc + "', " + requestAmount + ", 0);";
	var query2 = "SELECT c.userID, c.profilePicture, c.firstName, c.lastname FROM Customer d INNER JOIN Customer c on c.userID = ANY(d.friends) WHERE d.userID = " + req.session.userid + " ORDER BY c.userID ASC;";
	var query3 = "SELECT backgroundColor FROM Customer WHERE username = '" + req.session.username + "';";
	
	db.task('get-everything', task => {
		return task.batch([
			task.any(query),
			task.any(query2),
			task.any(query3)
		]);
	})
	.then(info => {
		res.render('pages/people',{
			my_title: "People Page",
			color: info[2][0].backgroundcolor,
			data: info[1],
			user_id: req.session.userid,
			affected: [1]
		})
	})
	.catch(error => {
		// display error message in case an error
		request.flash('error', err);
		response.render('pages/people', {
			title: 'Home Page',
			data: '',
			color: '',
			affected: [1],
			color_msg: ''
		})
	});

});

app.post('/people/addfriend', function(req, res) {

	if(!req.session.username)
	{
		res.render('pages/login',{
			local_css:"signin.css",
			color:'',
			my_title:"Login Page",
			failed: false
		});
	}
	
	var username = req.body.username;
	var query = "UPDATE Customer SET friends = array_append(friends, (SELECT userID FROM Customer s WHERE s.userName = '" + username + "')) WHERE userID = '" + req.session.userid + "' AND username != '" + username + "' AND ((SELECT userID FROM Customer s WHERE s.userName = '" + username + "') <> ALL(friends)) AND (SELECT userID FROM Customer WHERE username = '" + username + "') IS NOT NULL;";
	var query2 = "SELECT c.userID, c.firstName, c.profilePicture, c.lastname FROM Customer d INNER JOIN Customer c on c.userID = ANY(d.friends) WHERE d.userID = '" + req.session.userid + "' ORDER BY c.userID ASC;";
	var query3 = "SELECT * FROM Customer WHERE username = '" + username + "';";
	var query4 = "SELECT backgroundColor FROM Customer WHERE username = '" + req.session.username + "';";

	db.task('get-everything', task => {
		return task.batch([
			task.any(query),
			task.any(query2),
			task.any(query3),
			task.any(query4)
		]);
	})
	.then(info => {

		console.log("info[0]: ", info[2]);
		res.render('pages/people',{
			my_title: "People Page",
			color: info[3][0].backgroundcolor,
			user_id: req.session.userid,
			affected: info[2],
			data: info[1]
		})
	})
	.catch(error => {
		// display error message in case an error
		request.flash('error', err);
		response.render('pages/people', {
			title: 'Home Page',
			data: '',
			affected: [1],
			color: '',
			color_msg: ''
		})
	});

});

app.post('/home/addsnack', function(req, res) {

	if(!req.session.username)
	{
		res.render('pages/login',{
			local_css:"signin.css",
			color:'',
			my_title:"Login Page",
			failed: false
		});
	}
	
	var snack = req.body.snack;
	var householdid = req.body.householdid;
	var query = "UPDATE Household SET snacks = array_append(snacks, '" + snack + "') WHERE householdid = " + householdid + " AND (SELECT householdid FROM Household WHERE householdid = " + householdid + ") IS NOT NULL;";
	var query2 = "SELECT DISTINCT h.snacks, h.householdname, h.householdid FROM household h WHERE " + req.session.userid + "  = ANY(members);";
	var query3 = "SELECT backgroundColor FROM Customer WHERE username = '" + req.session.username + "';";

	db.task('get-everything', task => {
		return task.batch([
			task.any(query),
			task.any(query2),
			task.any(query3)
		]);
	})
	.then(info => {
		res.render('pages/home',{
			my_title: "Home Page",
			color: info[2][0].backgroundcolor,
			affected: info[1],
			alreadyExisted: false,
			data: info[1]
		})
	})
	.catch(error => {
		// display error message in case an error
		request.flash('error', err);
		response.render('pages/home', {
			title: 'Home Page',
			data: '',
			affected: [1],
			color: '',
			color_msg: ''
		})
	});

});

app.post('/home/addhouse', function(req, res) {

	if(!req.session.username)
	{
		res.render('pages/login',{
			local_css:"signin.css",
			color:'',
			my_title:"Login Page",
			failed: false
		});
	}
	
	var housename = req.body.housename;
	var password = req.body.password;
	var query2 = "SELECT DISTINCT h.snacks, h.householdname, h.householdid FROM household h WHERE " + req.session.userid + " = ANY(members);";
	var query3 = "SELECT * FROM Household WHERE householdname = '" + housename + "';";
	var query = "DO $$ BEGIN IF (SELECT passwrd FROM household WHERE householdname = '" + housename + "') = '" + password + "' THEN UPDATE Household SET members = array_append(members, " + req.session.userid + ") WHERE '" + housename + "' = householdname AND (SELECT householdid FROM Household WHERE householdname = '" + housename + "') IS NOT NULL AND " + req.session.userid + " <> ALL(members); END IF; END $$;";
	var query4 = "SELECT backgroundColor FROM Customer WHERE username = '" + req.session.username + "';";
	
	db.task('get-everything', task => {
		return task.batch([
			task.any(query),
			task.any(query2),
			task.any(query3),
			task.any(query4)
		]);
	})
	.then(info => {

		console.log("info[0]: ", info[2]);
		res.render('pages/home',{
			my_title: "Home Page",
			color: info[3][0].backgroundcolor,
			affected: info[2],
			data: info[1],
			alreadyExisted: false
		})
	})
	.catch(error => {
		// display error message in case an error
		request.flash('error', err);
		response.render('pages/home', {
			title: 'Home Page',
			data: '',
			affected: [1],
			color: '',
			color_msg: ''
		})
	});

});

app.post('/home/createhouse', function(req, res) {

	if(!req.session.username)
	{
		res.render('pages/login',{
			local_css:"signin.css",
			color:'',
			my_title:"Login Page",
			failed: false
		});
	}
	
	var housename = req.body.housename;
	var password = req.body.password;
	var query2 = "SELECT DISTINCT h.snacks, h.householdname, h.householdid FROM household h WHERE " + req.session.userid + " = ANY(members);";
	var query3 = "SELECT * FROM Household WHERE householdname = '" + housename + "';";
	var query = "DO $$ BEGIN IF (SELECT householdname FROM household WHERE householdname = '" + housename + "') IS NULL THEN INSERT INTO Household (householdname, members, passwrd) VALUES ('" + housename + "', ARRAY[" + req.session.userid + "], '" + password + "'); END IF; END $$;";
	var query4 = "SELECT backgroundColor FROM Customer WHERE username = '" + req.session.username + "';";

	db.task('get-everything', task => {
		return task.batch([
			task.any(query),
			task.any(query2),
			task.any(query3),
			task.any(query4)
		]);
	})
	.then(info => {
			res.render('pages/home',{
				my_title: "Home Page",
				color: info[3][0].backgroundcolor,
				affected: info[2],
				data: info[1],
				alreadyExisted: false
			})
	})
	.catch(error => {
		// display error message in case an error
		request.flash('error', err);
		response.render('pages/home', {
			title: 'Home Page',
			data: '',
			affected: [1],
			color: '',
			color_msg: ''
		})
	});

});

app.listen(3000,()=>{
console.log('Server listening on port 3000');

});