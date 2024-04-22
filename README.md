This repo is for the back-end.[Front-end repo](https://github.com/lihsinhuei/Number_practice_app) 

# Demo
Hi, this is my personal project, and I am working on both front-end and back-end, using React.js and Node.js.\
It's been deployed on Heroku [Live demo](https://www.hsinhuei.com/) , please check it out and give it a try. 


Restricts: 
- Recording can only function on desktops for now, will make it work on mobile devices in the future. 
- herokuapp.com cookies can not be set in most browsers because this domain is included in the Mozilla Foundation’s Public Suffix List.To fix this, will need to either using a custom domain or deploying it on anotehr service.   

# Idea
I designed it to help people learning English get better at speaking numbers. 
It might sound silly, but many language learners struggle with this, including me. 
Even though we can count from 1 to 100 in English, reading numbers randomly can be tricky. 
Sometimes, we go back to our native language, which isn't very helpful. That's where this app jumps in to help!
                    
# What can this app mainly do: 
- For user to sign in and sign up\
- Generates 10 random numbers and displays them one after another.
- Record users’ speakings
- Save the recordings
- Transcribe the recordings.(OpenAI's speech-to-text API). 
- Display the result


# Tools & skills(back-end):
⚡️ express/Node.js\
⚡️ Databse(Postgresql/knex)\
⚡️ Session/cookie/user authentication(express-session/Redis)\
⚡️ Password hashing(bcrypt)\
⚡️ Calling API(OpenAI Whisper API for transcribing) \
⚡️ set up flash message(connect-flash)\
⚡️ File system reading and writing/process audio/blob object\
⚡️ Deployment(Heroku)\


# Tools & skills(front-end):
⚡️ ReactJS/Create React App\
⚡️ Web recording\
⚡️ Countdown timer\
⚡️ API calling\
⚡️ HTML\
⚡️ CSS grid\


