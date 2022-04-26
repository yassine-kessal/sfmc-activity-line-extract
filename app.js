// if it's not on production use .env file
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const activityConfig = require('./activity-config');
const logger = require('./server/utils/logger');

// static vars
const DIST_DIR = './dist';

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw({ type: 'application/jwt' }));

app.use(express.static(DIST_DIR));

/**
 * Fronted application
 */
app.get('/', function (req, res) {
    return res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.get('/config.json', function (req, res) {
    return res.status(200).json(activityConfig(req));
});

/**
 * Backend application
 */
app.post('/execute', function (req, res) {
    logger.info(JSON.stringify(req.body));

    return res.status(200).json({});
});

app.post('/publish', function (req, res) {
    logger.info(JSON.stringify(req.body));
    logger.info(JSON.stringify(req.query));

    return res.status(200).json({});
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
