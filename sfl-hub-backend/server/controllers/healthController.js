const checkHealth = (req, res) => {
  res.status(200).send("Success! The server is running.");
};

export {checkHealth};