// if it's not on production use .env file
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const cron = require('node-cron');
const logger = require('./server/utils/logger');
const mysql = require('mysql2');
const sftpClient = require('ssh2-sftp-client');
const {
    stringify
} = require('csv-stringify');
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

cron.schedule('* * * * *', function () {
    console.log('waiting...');

    db.connect(function (err) {
        if (err) logger.error(err);

        db.query(
            `SELECT activities.activityId, activities.activityname, activities.filename FROM activities WHERE activities.activityId IN (
                SELECT activityId FROM fields WHERE TIMESTAMPDIFF(SECOND, activities.lastUpdatedFieldAt, NOW()) > 180
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
                                formattedFields, {
                                    header: true,
                                    quoted: true,
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

                                        const result = await sftp.put(
                                            Buffer.from(data),
                                            `${process.env.FTP_BASEPATH}/${activity.filename}`
                                        );

                                        console.log('sftp', result);

                                        db.query(
                                            `DELETE FROM activities WHERE activityId='${activity.activityId}'`
                                        );
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
});