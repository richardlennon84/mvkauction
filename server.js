const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');

const app = express();
const port = process.env.PORT || 3000;

// ✅ Only declare Stripe once!
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_your_real_key_here');

app.use(cors());
app.use(express.json());

// Store votes in memory (can be replaced with a database)
const votes = {
  char1: 0,
  char2: 0,
  char3: 0,
  char4: 0
};

// ✅ GET votes endpoint
app.get('/votes', (req, res) => {
  res.json(votes);
});

// ✅ POST create-checkout-session endpoint
app.post('/create-checkout-session', async (req, res) => {
  const { voteOption } = req.body;

  if (!votes.hasOwnProperty(voteOption)) {
    return res.status(400).json({ error: 'Invalid vote option' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'gbp',
          product_data: {
            name: `Vote for ${voteOption}`,
          },
          unit_amount: 1000, // £10
        },
        quantity: 1,
      }],
      success_url: `https://mvkauction.onrender.com/success?vote=${voteOption}`,
      cancel_url: 'https://mvkauction.onrender.com/cancel',
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// ✅ Success handler
app.get('/success', (req, res) => {
  const vote = req.query.vote;
  if (votes.hasOwnProperty(vote)) {
    votes[vote]++;
    res.send(`<h1>Thanks for voting for ${vote}!</h1>`);
  } else {
    res.send('<h1>Vote success, but option not tracked.</h1>');
  }
});

// ✅ Cancel handler
app.get('/cancel', (req, res) => {
  res.send('<h1>Vote canceled.</h1>');
});

app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
