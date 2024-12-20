const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const routes = require('./controllers/scoreUserController');  
require('dotenv').config();
const app = express();
const session = require('express-session')

app.use(session({
  secret: process.env.SECRET, 
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: false,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24,
  }  
}));

const corsOptions = {
  origin: 'http://localhost:5173',
  methods: 'GET,POST',
  allowedHeaders: 'Content-Type',
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());

app.use('/api', routes); 

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB-yhteys onnistui'))
  .catch((error) => console.log('MongoDB-yhteys epäonnistui', error));

const PORT = process.env.PORT

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
