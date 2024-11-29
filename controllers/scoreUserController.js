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
    req.session.userName = userName;

    res.status(200).json({ message: 'Käyttäjänimi on käytettävissä.' });
  } catch (error) {
    console.error('Virhe käyttäjänimen tarkistuksessa:', error);
    res.status(500).json({ message: 'Virhe käyttäjänimen tarkistuksessa.' });
  }
});

router.post('/guess', async (req, res) => {
  const { guess } = req.body;
  const userName = req.session.userName;

  if (!userName) {
    return res.status(400).json({ message: 'Käyttäjä ei ole rekisteröitynyt.' });
  }

  if (!req.session.score) {
    req.session.score = 0;
  }

  try {
    const response = await axios.get('https://deckofcardsapi.com/api/deck/new/draw/?count=1');
    const card = response.data.cards[0];
    const cardValue = getCardValue(card.value);

    let result = false;
    let points = 0;

    if (guess === 'high' && cardValue > 7) {
      result = true;
      points = 10;
    }
    if (guess === 'low' && cardValue < 7) {
      result = true;
      points = 10;
    }
    if (guess === 'seven' && cardValue === 7) {
      result = true;
      points = 30;
    }

    req.session.score += points;

    res.status(200).json({
      userName,
      result,
      points,
      totalScore: req.session.score,
      cardImage: card.image,
      cardDescription: `${card.value} of ${card.suit}`
    });
  } catch (error) {
    console.error('Virhe kortin arpomisen yhteydessä:', error);
    res.status(500).json({ message: 'Virhe kortin arpomisen yhteydessä' });
  }
});

router.post('/endgame', async (req, res) => {

  const score = req.session.score
  const userName = req.session.userName;

  if (!userName || !score) {
    return res.status(400).json({ message: 'Ei löytynyt tarvittavia tietoja (käyttäjänimeä tai pistetietoja).' });
  }

  try {
    const user = new User({
      userName: userName,
      score: score,
      });

    await user.save();

    res.status(200).json({ message: 'Pisteet tallennettu onnistuneesti!' });

    req.session.destroy((err) => {
      if (err) {
        console.error('Virhe session tuhoamisessa:', err);
      } else {
        console.log('Sessio tuhoutui onnistuneesti');
      }
    });
  } catch (error) {
    console.error('Virhe pisteiden tallentamisessa:', error);
    res.status(500).json({ message: 'Virhe pisteiden tallentamisessa' });
  }
});

router.get('/toplist', async (req, res) => {
  try {
    const topUsers = await User.find({})
      .sort({ score: -1 })
      .limit(5);

    res.status(200).json(topUsers);
  } catch (error) {
    console.error('Virhe toplistan hakemisessa:', error);
    res.status(500).json({ message: 'Virhe toplistan hakemisessa' });
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