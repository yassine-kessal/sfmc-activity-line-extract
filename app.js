// if it's not on production use .env file
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const path = require('path');

// static vars
const DIST_DIR = './dist';

const app = express();

app.use(express.static(DIST_DIR));

app.get('/', function (req, res) {
    return res.sendFile(path.join(__dirname, '../dist/index.html'));
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(process.env.PORT, () =>
        console.log(
            `✅  Production Server started: http(s)://localhost:${process.env.PORT}/`
        )
    );
} else {
    app.listen(process.env.PORT, () =>
        console.log(
            `✅  Production Server started: http(s)://${process.env.HEROKU_APP_NAME}.herokuapp.com:${process.env.PORT}/`
        )
    );
}
