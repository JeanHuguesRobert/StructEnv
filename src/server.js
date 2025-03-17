app.post('/convert/json-to-structenv', (req, res) => {
  try {
    const json = JSON.parse(req.body.input);
    const result = StructEnv.toStructEnv(json);
    res.json({ success: true, result });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});