const express = require('express');
const fs = require('fs');
const cors = require('cors');
const multer = require('multer');//a middleware to handle a formData object
const knex = require('knex'); // a query builder for databases
const OpenAI = require('openai');
const promise =  require('promise');
// const {toFile} = require("openai/uploads") ;
// const { Readable } = require('stream'); 
const axios = require("axios");
require('dotenv').config() //package to access the variables in .env file(process.env)


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
app.use(cors())
app.use(express.json()); // latest version of expressJS now comes with Body-Parser!
const upload = multer();




app.post('/signup',(req,res)=>{
	console.log(req.body.username);
	console.log(req.body.email);
	console.log(req.body.password);
	db('users')
	 .returning(['user_id','username'])
	 .insert({username:req.body.username ,email:req.body.email,password_hash:req.body.password})
	 .then((result) => res.status(200).send(result[0]))
	 .catch(()=>console.log("Insert db failed!"))
})


app.post('/signin',(req,res)=>{
	const email = req.body.email; 
	console.log(email);
	db.select('*').from('users').where('email',email)
	 .then(result=> {
	 	if(result[0].password_hash == req.body.password){
	 		res.status(200).send(result[0]);
	 	}else{
	 		res.status(404).send('invalid email or password');
	 	}
	  })
	 .catch(()=>res.status(404).send('selecting failed'))
})



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
				temperature:0.8
			},
			{
				headers:{
					'Content-Type':'multipart/form-data',
					Authorization: API_KEY
				}
			}
		)
		return response;

		//failed using fetch, got error 'Could not parse multipart form'
		// const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
			//   method: 'POST',
			//   // maxBodyLength: Infinity,
			//   headers: {
			//     'Authorization': 'Bearer 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',
			//     'Content-Type': 'multipart/form-data',
			//   },
			//   body: {
			//     file: audioFile,
			//     model: 'whisper-1',
			//   }
			// })
			// console.log(await response.json());
	}
		
	transcribeAudio(req.file.originalname)
		.then(response=>{
			console.log("You said:",response.data.text);
			res.status(response.status).send({
				data:response.data.text  //the transcrip text from OpenAI
			})
		})
		.catch((error)=>{
			res.status(404).send('unexpected error, failed handling audio');
		})


// 	res.status(200).send('ok'); 
//   //forgot what below codes do...... 
//     req.on('end', () => {
// 		res.send({
//             headers: req.headers,
//             data:response.data.text
//         });
//     });

	
})


app.get('/record',(req,res)=>{
	console.log('app');
	res.status(200).send("ok!!!"); 
})




app.listen(3000, ()=> {
  console.log('app is running on port 3000');
  db('users').count('user_id').returning().then(total=>console.log("Total users number:",total[0].count));
})