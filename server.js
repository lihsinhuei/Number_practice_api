const express = require('express');
require('dotenv').config() //to access the variables in .env file(process.env)
const port = 8080;
const fs = require('fs'); 
const cors = require('cors');
const multer = require('multer');//a middleware to handle a formData object
const knex = require('knex'); // a query builder for databases
const OpenAI = require('openai');
const axios = require("axios"); //a promise-based HTTP Client for node.js and the browser.
const flash = require('connect-flash');



const db = knex({
  client: 'pg', //postgresql
  connection: {
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
	origin: 'http://localhost:3000',
    methods: ["POST", "PUT", "GET", "OPTIONS", "HEAD"],
    credentials: true,
}
))
app.use(express.json()); // latest version of expressJS now comes with Body-Parser!
const upload = multer();

const redis = require('redis');
const session = require('express-session');
const RedisStore = require('connect-redis').default;

const redisClient = redis.createClient();

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
	  secret: process.env.secret,
	  resave: false,
	  saveUninitialized: false,
	  cookie: {
		SameSite: 'none',
		secure: false,
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
			// const showInputError = req.flash('showInputError')[0] || false
		// res.status(404).send(showInputError);
		res.status(202).json("has not logged in before.");

	}

})

app.post('/signup',(req,res)=>{
	console.log(req.body.username);
	console.log(req.body.email);
	console.log(req.body.password);
	db('users')
	 .returning(['user_id','username'])
	 .insert({username:req.body.username ,email:req.body.email,password_hash:req.body.password})
	 .then((result) => {
		console.log("within signup");
		res.status(200).json(result[0])
	 })
	 .catch((err)=>{
		console.log("signup failed!error:",err);
		res.status(400).json('unable to sign up')
	 })
})


app.post('/signin',(req,res)=>{
	const email = req.body.email; 
	console.log(email);
	db.select('*').from('users').where('email',email)
	 .then(result=> {
		console.log(result);
	 	if(result[0].password_hash == req.body.password){
			req.session.isAuth = true;
			req.session.username = result[0].username;
			req.session.user_id = result[0].user_id;
			req.session.email=result[0].email;
			console.log(req.session);
	 		res.status(200).json(result[0]);
	 	}else{
			// req.flash('showInputError', true)
	 		res.status(404).send('invalid email or password');
	 	}
	  })
	 .catch(()=>{
		// req.flash('showInputError', true);
		res.status(404).send('signin selecting failed');
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

	const db2 = knex({
		client: 'pg', //postgresql
		connection: {
		  host : '127.0.0.1',
		  port : 5432,
		  user : 'lihsinhuei',
		  password : '',
		  database : 'number_project'
		}
	  });

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
  db('users').count('user_id').returning().then(total=>console.log("Total users number:",total[0].count));
})