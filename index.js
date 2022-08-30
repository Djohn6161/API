const express = require('express');
const app = express();

//static express
app.use(express.static('./methods-public'));

//parse form data
app.use(express.urlencoded({ extended:false }));

// parse json
app.use(express.json());

const port = process.env.PORT || 3000;
const event = require('./routes/event.route');

app.use('/api/v1', event);

app.listen (port, ()=>{
    console.log(`Express is running at port ${port}`);
});