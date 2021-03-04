const express = require('express');
const bodyParser = require('body-parser');

const app = express();


const port = 5000;

app.use(bodyParser.urlencoded({ extended: false }));
/*body-parser is a NOde/js middleware that is responsible for parsing the incoming request bodies in a middleware before you handle it.  
Therefore, in order to read HTTP POST data, we have to use body-parser node module.  Body-Parser is a piece of express middleware that 
reads a form's input and stores it as a javascript object accessible through req.body. Should be installed everytime express is used*/


app.get('/', (req, res) => {
  res.send('Hello World!')
});

app.post('/', function (req, res) {
    res.send('Got a POST request')
  })

app.put('/user', function (req, res) {
    res.send('Got a PUT request at /user')
  })

app.delete('/user', function (req, res) {
    res.send('Got a DELETE request at /user')
  })


app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
});