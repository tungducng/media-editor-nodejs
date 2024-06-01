const express = require("express");
const { authenticate, serverIndex } = require("./middlewares/index.js");
const path = require("path");

const PORT = 8062;

const server = express();

// ------ Middlewares ------ //

// For serving static files
server.use(express.static(path.join(__dirname, "../public")));

// For parsing JSON body
server.use(express.json());
// For authentication
server.use(authenticate);

// For different routes that need the index.html file
server.use(serverIndex);

// ------ API Routes ------ //
server.use('', require('./routes'))

// Handle all the errors that could happen in the routes
server.use((error, req, res, next) => {
  if (error && error.status) {
    res.status(error.status).json({ error: error.message });
  } else {
    console.error(error);
    res.status(500).json({
      error: "Sorry, something unexpected happened from our side.",
    });
  }
});

server.listen(PORT, () => {
  console.log(`Server has started on port ${PORT}`);
});
