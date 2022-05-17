// if it's not on production use .env file
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const activityConfig = require('./activity-config');
const logger = require('./server/utils/logger');
const mysql = require('mysql2');
const sftpClient = require('ssh2-sftp-client');
const { stringify } = require('csv-stringify');
var fs = require('fs');

var groupBy = function (xs, key) {
    return xs.reduce(function (rv, x) {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
    }, {});
};

const db = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
});

const sftp = new sftpClient();

// static vars
const DIST_DIR = './dist';

const app = express();

app.use(
    bodyParser.urlencoded({
        extended: true
    })
);
app.use(bodyParser.json());
app.use(
    bodyParser.raw({
        type: 'application/jwt'
    })
);

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
        definitionId = req.body.definitionInstanceId,
        activityId = req.body.activityObjectID;

    const filename = file.filename;

    // insert field with activityId link to activity
    db.connect(function (err) {
        if (err) logger.error(err);

        let sqlString =
            'INSERT INTO fields (name, value, activityId, definitionId) VALUES';

        var i = 0;
        fields.forEach(function (field) {
            if (i != 0) sqlString += ', ';

            sqlString += `('${field.name}', '${field.value}', '${activityId}', '${definitionId}')`;

            i++;
        });

        console.log(sqlString);
        db.query(sqlString, function (err) {
            if (err) logger.error(err);
        });
    });

    return res.status(200).json({});
});

app.post('/publish', function (req, res) {
    logger.info(JSON.stringify(req.body));
    logger.info(JSON.stringify(req.query));

    const isPublished = req.body.isPublished,
        activityId = req.body.activityObjectID,
        filename = req.query.filename,
        activityname = req.query.activityname;

    if (!isPublished) {
        return res.status(200).json({});
    }

    // purge file with fields and recreate file
    db.connect(function (err) {
        if (err) logger.error(err);

        db.query(`DELETE FROM activities WHERE activityId='${activityId}'`);
        // db.query(`DELETE FROM fields WHERE activityId='${activityId}'`);

        db.query(
            `INSERT INTO activities(filename, activityname, activityId) VALUES('${filename}', '${activityname}', '${activityId}')`
        );
    });

    return res.status(200).json({});
});

app.get('/get-data', function (req, res) {
    db.connect(function (err) {
        if (err) logger.error(err);

        db.query(
            'SELECT fields.id, fields.name, fields.value, fields.createdAt, activities.filename, activities.activityId FROM fields INNER JOIN activities ON activities.activityId = fields.activityId',
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

app.get('/generate', function (req, res) {
    db.connect(function (err) {
        if (err) logger.error(err);

        db.query(
            `SELECT activities.activityId, activities.activityname, activities.filename FROM activities WHERE activities.activityId IN (
                SELECT activityId FROM fields
            )`,
            function (errActivities, activities) {
                if (errActivities) {
                    logger.error(errActivities);
                    return;
                }

                activities.forEach(function (activity) {
                    db.query(
                        `SELECT fields.name, fields.value, fields.definitionId FROM fields WHERE fields.activityId = '${activity.activityId}'`,
                        function (errFields, fields) {
                            if (errFields) {
                                logger.error(errFields);
                                return;
                            }

                            let groupedFields = groupBy(fields, 'definitionId'),
                                formattedFields = [];

                            Object.keys(groupedFields).forEach((keyRow) => {
                                let v = {};
                                groupedFields[keyRow].forEach((row) => {
                                    v[row.name] = row.value;
                                });
                                formattedFields.push(v);
                            });

                            console.log(formattedFields);

                            stringify(
                                formattedFields,
                                {
                                    header: true,
                                    quote: true,
                                    delimiter: ','
                                },
                                async function (err, data) {
                                    if (err) {
                                        console.log(err);
                                        return;
                                    }

                                    console.log(data);

                                    try {
                                        await sftp.connect({
                                            host: process.env.FTP_HOST,
                                            port: process.env.FTP_PORT,
                                            user: process.env.FTP_USERNAME,
                                            password: process.env.FTP_PASSWORD
                                        });
                                        // await sftp.mkdir(
                                        //     `${process.env.FTP_BASEPATH}${activity.activityname}`,
                                        //     true
                                        // );
                                        const result = await sftp.put(
                                            Buffer.from(data),
                                            `${process.env.FTP_BASEPATH}/${activity.filename}`
                                        );

                                        console.log('sftp', result);

                                        db.connect(function (err) {
                                            if (err) logger.error(err);

                                            // db.query(
                                            //     `DELETE FROM activities WHERE activityId='${activity.activityId}'`
                                            // );
                                        });
                                    } catch (err) {
                                        logger.error('sftp error', err);
                                    } finally {
                                        await sftp.end();
                                    }
                                }
                            );
                        }
                    );
                });
            }
        );
    });

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
