const express = require('express');
const axios = require('axios');
const router = express.Router();
const User = require('../schemas/User');

router.post('/check-username', async (req, res) => {
  const { userName } = req.body; 

  try {
    const existingUser = await User.findOne({ userName });
    if (existingUser) {
      return res.status(400).json({ message: 'Käyttäjänimi on jo käytössä, valitse toinen nimi.' });
    }
    res.status(200).json({ message: 'Käyttäjänimi on käytettävissä.' });
  } catch (error) {
    console.error('Virhe käyttäjänimen tarkistuksessa:', error);
    res.status(500).json({ message: 'Virhe käyttäjänimen tarkistuksessa.' });
  }
});

router.post('/endgame', async (req, res) => {
  const { userName, score } = req.body;

  try {
    const newUserScore = await User.create({ userName, score });
    res.status(201).json({ message: 'Pisteet tallennettu onnistuneesti', userScore: newUserScore });
  } catch (error) {
    console.error('Virhe pisteiden tallennuksessa:', error);
    res.status(500).json({ message: 'Virhe pisteiden tallennuksessa' });
  }
});

router.get('/toplist', async (req, res) => {
  try {
    const topUsers = await User.find().sort({ score: -1 }).limit(5);
    res.status(200).json(topUsers);
  } catch (error) {
    console.error('Virhe toplistan hakemisessa:', error);
    res.status(500).json({ message: 'Virhe toplistan hakemisessa' });
  }
});

router.post('/guess', async (req, res) => {
  const { guess } = req.body;

  try {
    const response = await axios.get('https://deckofcardsapi.com/api/deck/new/draw/?count=1');
    const card = response.data.cards[0];
    console.log(card);
    const cardValue = getCardValue(card.value);
    
    let result = false;
    if (guess === 'higher' && cardValue > 7) result = true;
    if (guess === 'lower' && cardValue < 7) result = true;
    if (guess === 'seven' && cardValue === 7) result = true;

    res.status(200).json({ result, card: cardValue, cardDescription: `${card.value} of ${card.suit}`, cardImage: card.image });
  } catch (error) {
    console.error('Virhe kortin arpomisen yhteydessä:', error);
    res.status(500).json({ message: 'Virhe kortin arpomisen yhteydessä' });
  }
});

const getCardValue = (card) => {
  switch (card) {
    case 'ACE': return 1;
    case 'KING': return 13;
    case 'QUEEN': return 12;
    case 'JACK': return 11;
    default: return parseInt(card);
  }
};

module.exports = router;