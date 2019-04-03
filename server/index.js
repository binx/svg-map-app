const express = require("express"),
  bodyParser = require("body-parser"),
  path = require("path");

const multer = require("multer");
const upload = multer({ inMemory: true });

const app = express();

app.use(bodyParser.json());

app.post("/upload_json", upload.any(), function(req, res, next) {
  let jsonArray = [];
  const jsonString = req.files[0].buffer.toString();

  res.send(jsonString);
});

app.use(express.static(path.join(__dirname, '..', 'build')));
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '..', 'build', 'index.html'));
});

const server = app.listen(7101, "localhost", function() {
  console.log("Listening on port 7101!");
});