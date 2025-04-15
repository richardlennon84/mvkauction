const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'your_stripe_secret_key_here');

app.use(cors());
app.use(express.json());

const votes = {
  char1: 0,
  char2: 0,
  char3: 0,
  char4: 0
};

app.get('/votes', (req, res) => {
  res.json(votes);
});

app.post('/create-checkout-session', async (req, res) => {
  const { voteOption } = req.body;
  if (!votes.hasOwnProperty(voteOption)) {
    return res.status(400).json({ error: 'Invalid vote option' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'gbp',
          product_data: {
            name: `Vote for ${voteOption}`
          },
          unit_amount: 100
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: 'https://mvkauction.onrender.com/success?vote=' + voteOption,
      cancel_url: 'https://mvkauction.onrender.com/cancel'
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

app.get('/success', (req, res) => {
  const vote = req.query.vote;
  if (votes.hasOwnProperty(vote)) {
    votes[vote]++;
    res.send(`<h1>Thank you for voting for ${vote}!</h1>`);
  } else {
    res.send('<h1>Thank you for your donation!</h1>');
  }
});

app.get('/cancel', (req, res) => {
  res.send('<h1>Vote cancelled.</h1>');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
