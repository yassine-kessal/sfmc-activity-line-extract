// if it's not on production use .env file
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const activityConfig = require('./activity-config');
const logger = require('./server/utils/logger');
const sftpClient = require('ssh2-sftp-client');

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
sftp.connect({
    host: process.env.FTP_HOST,
    port: process.env.FTP_PORT,
    user: process.env.FTP_USERNAME,
    password: process.env.FTP_PASSWORD
})
    .then(function () {
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
        app.post('/execute', async function (req, res) {
            logger.info(JSON.stringify(req.body));

            const file = req.body.inArguments[0].file,
                fields = req.body.inArguments[0].fields,
                definitionId = req.body.definitionInstanceId,
                activityId = req.body.activityObjectID;

            const filename = file.filename;

            let data = '';
            var i = 1;

            // insert field with activityId link to activity
            fields
                .sort((field) => field.id)
                .forEach((field) => {
                    data += `"${field.value}"`;

                    if (i != fields.length) {
                        data += ',';
                    } else {
                        data += '\n';
                    }

                    i++;
                });

            try {
                const result = await sftp.append(
                    Buffer.from(data),
                    `${process.env.FTP_BASEPATH}/${filename}`
                );
            } catch (e) {
                console.log(e);
                return res.status(403).json({});
            }

            return res.status(200).json({});
        });

        app.post('/publish', function (req, res) {
            logger.info(JSON.stringify(req.body));
            logger.info(JSON.stringify(req.query));

            const isPublished = req.body.isPublished,
                activityId = req.body.activityObjectID,
                filename = req.query.filename,
                headersQuery = req.query.headers,
                activityname = req.query.activityname;

            if (!isPublished) {
                return res.status(200).json({});
            }

            try {
                // get headers
                let headersStr =
                    headersQuery
                        .split('|')
                        .map((h) => '"' + h + '"')
                        .join(',') + '\n';

                // TODO: verify duplicates (use a counter, hash, ts... ?)

                // create file and append with headers
                sftp.append(
                    Buffer.from(headersStr),
                    `${process.env.FTP_BASEPATH}/${filename}`
                );
            } catch (e) {
                console.log(e);
                return res
                    .status(503)
                    .json({ message: 'sftp create file on publish failed' });
            }

            return res.status(200).json({});
        });
    })
    .catch(function (e) {
        console.log(e);
        return res.status(503).json({ message: 'sftp connection failed' });
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
