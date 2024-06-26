const express = require('express');
require('dotenv').config() //to access the variables in .env file(process.env)
const port = process.env.PORT || 8080
const fs = require('fs'); 
const cors = require('cors');
const multer = require('multer');//a middleware to handle a formData object
const knex = require('knex'); // a query builder for databases
const OpenAI = require('openai');
const axios = require("axios"); //a promise-based HTTP Client for node.js and the browser.
const bcrypt = require('bcrypt');
const saltRounds = 10;
const redis = require('redis');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const flash = require('connect-flash');



const db = knex({
  client: 'pg', //postgresql
  connection: process.env.DATABASE_URL ? {
    host : process.env.DATABASE_HOST,
    port : process.env.DATABASE_PORT,
    user : process.env.DATABASE_USER,
    password : process.env.DATABASE_PASSWORD,
    database : process.env.DATABASE_NAME,
	ssl: { rejectUnauthorized: false }
  } 
  : 
  {
    host : '127.0.0.1',
    port : 5432,
    user : 'lihsinhuei',
    password : '',
    database : 'number_project'
  }
});

const app = express();
app.use(cors(
	{
	origin: process.env.ORIGIN ||'http://localhost:3000',
    methods: ["POST", "PUT", "GET", "OPTIONS", "HEAD"],
    credentials: true,
}
))
app.use(express.json()); // latest version of expressJS now comes with Body-Parser!
const upload = multer();



const redisClient = process.env.REDIS_TLS_URL ? //coonection failed if REDIS_URL is used
	redis.createClient({
		url: process.env.REDIS_TLS_URL,
		socket: {
			tls: true,
			rejectUnauthorized: false,
		}
	}) 
	: redis.createClient(); //default:connect to localhost on port 6379.

(async ()=>{

	redisClient.on('error', (err) =>
		console.log(`Fail to connect to redis. ${err}`)
  	);
  	redisClient.on('connect', () => console.log('Successfully connect to redis'));

	  await redisClient.connect();
})();




app.use(
	session({
	  store: new RedisStore({ client: redisClient }),
	  secret: process.env.SECRET, 
	  resave: true,  
	  saveUninitialized: false,
	  cookie: {
		SameSite: 'none',
		secure: process.env.NODE_ENV==="production"? true: false,
		maxAge: 1000 * 60 * 60 * 24 * 30 
	  }	
	})
  )

  app.use(flash())


app.get('/', (req, res) => {
console.log('req.session.isAuth:',req.session.isAuth);
	//check if the user has logged in before
	if (req.session.isAuth) {
		var user={
			username:req.session.username,
			user_id:req.session.user_id,
			email:req.session.email
		}
		res.status(200).json(user);
	}else{
		res.status(202).json("has not logged in before.");

	}

})

app.post('/signup',(req,res)=>{
	console.log(req.body.username);
	console.log(req.body.email);
	console.log(req.body.password);

	db.select('email').from('users').where('email',req.body.email)
	 .then(user=> {
		if(user.length == 0){  //the email is not used 
			bcrypt.genSalt(saltRounds, function(err, salt) {
				bcrypt.hash(req.body.password, salt, function(err, hash) {
					console.log("password hash:",hash);
					db('users')
					.returning(['user_id','username','email'])
					.insert({username:req.body.username ,email:req.body.email,password_hash:hash})
					.then((user) => {
						req.session.isAuth = true;
						req.session.username = user[0].username;
						req.session.user_id = user[0].user_id;
						req.session.email=user[0].email;
						console.log(req.session);
						res.status(200).json(user[0])
					})
					.catch((err)=>{
						console.log("signup failed!error:",err);
						req.flash('err',"something went wrong while registering, please try again.");
						res.status(400).json('unable to sign up')
					})
				});
			});
		}else{ //the email is used 
			console.log('This email address is already been registered.');
			req.flash('info','This email address is already been registered. Please sign in');
			res.status(202).send({message:req.flash('info')});
		}
	 })

})


app.post('/signin',(req,res)=>{
	const email = req.body.email; 
	console.log(email);
	db.select('*').from('users').where('email',email)
	 .then(user=> {
		if(user.length===0){
			console.log("User is not exist");
			req.flash('error','User is not exist');
			res.status(202).send({message:req.flash('error')});
		}else{
			console.log("user info from DB:",user);
			bcrypt.compare(req.body.password, user[0].password_hash, function(err, result) {
				if(result){
					console.log('password correct, result:',result);
					req.session.isAuth = true;
					req.session.username = user[0].username;
					req.session.user_id = user[0].user_id;
					req.session.email=user[0].email;
					console.log(req.session);
					 res.status(200).json(user[0]);
				 }else{
					console.log("password not correct, result:",result);
					req.flash('error','invalid email or password');
					res.status(202).send({message:req.flash('error')});
				 }
			});
		}
	  })
	 .catch((err)=>{
		console.log("Something went wrong while login.");
		res.status(404).send('signin failed');
	 })
})


app.post('/logout', (req, res) => {
	console.log("logging out");
	req.session.destroy((err) => {
	  if (err) {
		res.status(404).send('destroy session failed');
	  }
	})
	res.clearCookie('connect.sid')
	res.status(200).send('logged out');
  })


// 1. save the data to disk; 
// 2. read the file again and send it to OpenAI API; 
// 3.get the transcribe from OpenAI API; 
// 4. write the record to DB
app.post('/processUserRecording',upload.single("blob"),(req,res)=>{

	async function transcribeAudio(fileName){
		fs.writeFileSync(fileName, req.file.buffer, 'base64',(err) => err && console.error(err));
		console.log("file name is:",fileName);

		//read the recording from disk again(an alternative solution, bc idk how to conver buffer to filelike data form)  
		const audioFile = fs.createReadStream(fileName);

		//read api key from .env file
		const API_KEY =`Bearer ${process.env.OPENAI_API_KEY}`; 

		const response = await axios.post(
			'https://api.openai.com/v1/audio/transcriptions',
			{
				file:audioFile,
				model:"whisper-1",
				language:'en',
				temperature:0.2
			},
			{
				headers:{
					'Content-Type':'multipart/form-data',
					Authorization: API_KEY
				}
			}
		)
		return response;
	}
		
	transcribeAudio(req.file.originalname)
		.then(response=>{
			//the response was from axios. To access the content, use response.data rather than response.body
			console.log("You said:",response.data.text); 

			//save data to DB 
			db('records')
			.returning('record_id')
			.insert({
				challenge_id:req.body.challengeID,
				question_no:req.body.quizNo,
				given_number:req.body.givenNumber,
				is_skip:req.body.isSkip,
				file_name:req.file.originalname,
				transcribe:response.data.text
			})
			.then((result) =>{
				if(result.length==1){
					console.log("the record was inserted");
					res.status(response.status).send({
						data:response.data.text  //the transcrip text property from OpenAI
					});

				}else{
					console.log("inserted not correctly");
					res.status(404).send("inserted not correctly");
				}
			})
			.catch((error)=>console.log("Insert db failed!",error))

		})
		.catch((error)=>{
			console.log(error);
			res.status(404).send('unexpected error, failed handling audio');
		})
	
})


//add the a new challenge record to DB
app.post('/newChallenge',(req,res)=>{
	db('challenge')
	 .returning('challenge_id')
	 .insert({user_id:req.body.userID})
	 .then((result) => res.status(200).send(result[0]))
	 .catch((error)=>console.log("Insert db failed!",error))
})


//not done yet!!!!don't skip quesions. also need to think about code duplication
// app.post('/skipQuestion',(req,res)=>{
// 	//save data for this questionto DB 
// 	db('records')
// 	.insert({
// 		challenge_id:req.body.challengeID,
// 		question_no:req.body.quizNo,
// 		given_number:givenNumber,
// 		is_skip:true,
// 		file_name:"skipped",
// 		transcribe:""
// 	})
// 	.then((result) => res.status(200).send(result[0]))
// 	.catch((error)=>{
// 		console.log("Insert db failed!",error)
// 		res.status(404).send("Insert db failed!")
// 	})
// })

//fetch all the records(each challenge includes 10 records) from DB to display on the page
app.post('/getRecord',(req,res)=>{
	console.log("challengeID:",req.body.challengeID);

	db('records')
		.returning(['question_no','given_number','transcribe','file_name','is_correct'])
		.select('*')
  		.where('challenge_id',req.body.challengeID)
		.then(data => {
			console.log(data);
			console.log("how many rows:",data.length);
			res.status(200).send(data);
		})
		.catch((error)=>console.log("Failed select data from DB!",error))

})




app.listen(port, ()=> {
  console.log('app is running on port:',port);
  console.log("NODE_ENV:",process.env.NODE_ENV);
  db('users').count('user_id').returning().then(total=>console.log("Total users number:",total[0].count));
})