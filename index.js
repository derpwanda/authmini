const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const session = require('express-session')

const db = require('./database/dbConfig.js');

const server = express();
//create config object
const sessionConfig = {
  name: 'notsession', // default is connect.sid
  secret: 'asdf;lkj',
  cookie: {
    maxAge: 1000 * 60 * 10,
    secure: false, // only set it over https; in production you want this true
  },
  httpOnly: true,
  resave: false,
  saveUnitialized: false,
}

server.use(session(sessionConfig)); //wireup config
server.use(express.json());
server.use(cors());

//endpoint for login
server.post('/api/login', (req,res) => {
  //grab username and password from body
  const creds = req.body;

  db('users')
    .where({ username: creds.username })
    .first()
    .then(user => {
      if(user && bcrypt.compareSync(creds.password, user.password)) { //see COMPARESYNC
        //
        req.session.userId = user.id;
        //passwords match and user exists by that username
        res.status(200).json({message: 'you made it!'})
      } else {
        //either username or password is valid, all returns failure
        res.status(401).json({message: 'incorrect inputs'})
      }
    })
    .catch(err => res.json(err))
})

//create endpoint for registration
server.post('/api/register', (req,res) => {
  //grab username and password from body
  const creds = req.body;

  //hash the password
    //generate the hash from the user's password
  const hash = bcrypt.hashSync(creds.password, 14)//rounds is 2^X
    //override the user.password with the hash
  creds.password = hash;
  //save the user to the database
  db('users')
  .insert(creds)
  .then(ids => {
    res.status(201).json(ids);
  })
  .catch(err => res.json(err))
})

server.get('/', (req, res) => {
  res.send('Its Alive!');
});

// protect this route, only authenticated users should see it
server.get('/api/users', (req, res) => {
  if (req.session && req.session.userId) {
    //if they are logged in, provide access to users
    db('users')
      .select('id', 'username', 'password') // added password to the select****
      .then(users => {
        res.json(users);
      })
      .catch(err => res.send(err));
  } else {
    //bounce
    res.status(401).json({ message: 'not allowed'})
  }
});



server.listen(3300, () => console.log('\nrunning on port 3300\n'));
