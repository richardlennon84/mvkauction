const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');
require('dotenv').config();

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_your_real_key_here');
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

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

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'gbp',
          product_data: {
            name: `Vote for ${voteOption}`
          },
          unit_amount: 1000
        },
        quantity: 1
      }],
      success_url: `https://mvkauction.onrender.com/success?vote=${voteOption}`,
      cancel_url: `https://mvkauction.onrender.com/cancel`
    });

    res.json({ id: session.id });
  } catch (err) {
    console.error(err);
    res.status(500).send('Stripe error');
  }
});

app.get('/success', (req, res) => {
  const vote = req.query.vote;
  if (votes[vote] !== undefined) votes[vote]++;
  res.send(`<h1>Thanks for voting for ${vote}!</h1><a href="/">Back</a>`);
});

app.get('/cancel', (req, res) => {
  res.send(`<h1>Vote cancelled.</h1><a href="/">Back</a>`);
});

app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
