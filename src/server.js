
const express = require('express');
const StructEnv = require('./structenv');

const app = express();
app.use(express.json());
app.use(express.static('public'));

app.post('/convert/json-to-structenv', (req, res) => {
  try {
    const json = JSON.parse(req.body.input);
    const result = StructEnv.toStructEnv(json);
    res.json({ success: true, result });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.listen(3000, '0.0.0.0', () => {
  console.log('Server running on port 3000');
});
