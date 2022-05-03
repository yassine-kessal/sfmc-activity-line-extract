// if it's not on production use .env file
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const activityConfig = require('./activity-config');
const logger = require('./server/utils/logger');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.sqlite3');

db.get('PRAGMA foreign_keys = ON');

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

    const file = req.body.inArguments[0].file,
        fields = req.body.inArguments[0].fields,
        defId = req.body.definitionInstanceId,
        activityId = req.body.activityObjectID;

    const filename = file.filename;

    // insert field with activityId link to activity
    db.serialize(function () {
        let sqlString =
            'INSERT INTO fields (name, value, fileActivityId, defId) VALUES';

        var i = 0;
        fields.forEach(function (field) {
            if (i != 0) sqlString += ', ';

            sqlString += `('${field.name}', '${field.value}', '${activityId}', '${defId}')`;

            i++;
        });

        console.log(sqlString);
        db.run(sqlString);
    });

    return res.status(200).json({});
});

app.post('/publish', function (req, res) {
    logger.info(JSON.stringify(req.body));
    logger.info(JSON.stringify(req.query));

    const isPublished = req.body.isPublished,
        activityId = req.body.activityObjectID,
        filename = req.query.filename;

    if (!isPublished) {
        return res.status(200).json({});
    }

    // purge file with fields and recreate file
    db.serialize(function () {
        db.run(`DELETE FROM files WHERE activityId='${activityId}'`);
        db.run(`DELETE FROM fields WHERE fileActivityId='${activityId}'`);

        db.run(
            `INSERT INTO files(filename, activityId) VALUES('${filename}', '${activityId}')`
        );
    });

    return res.status(200).json({});
});

app.get('/get-data', function (req, res) {
    db.serialize(function () {
        db.all(
            'SELECT fields.id, fields.name, fields.value, fields.createdAt, files.filename, files.activityId FROM fields INNER JOIN files ON files.activityId = fields.fileActivityId',
            function (err, rows) {
                if (!err) {
                    res.send(rows);
                } else {
                    console.log(err);
                    res.status(200).json({});
                }
            }
        );
    });
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
