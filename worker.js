// if it's not on production use .env file
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const sftpClient = require('ssh2-sftp-client');
const path = require('path').posix;
const cron = require('node-cron');

const sftp = new sftpClient();

const config = {
    host: process.env.FTP_HOST,
    port: process.env.FTP_PORT,
    user: process.env.FTP_USERNAME,
    password: process.env.FTP_PASSWORD
};

sftp.connect(config)
    .then(function () {
        cron.schedule('* * * * *', async function () {
            console.log('waiting...');

            try {
                const files = await sftp.list(
                    process.env.FTP_BASEPATH,
                    /.tmp$/
                );

                /**
                 * If tmp file has not been modified for less or equal then 2 minute, the extract process has been finished.
                 * Then remove the .tmp extension of file
                 */
                files.forEach(async (file) => {
                    if (new Date().getTime() >= file.modifyTime + 120 * 1000) {
                        console.log(
                            path.join(process.env.FTP_BASEPATH, file.name),
                            ' => ',
                            path.join(
                                process.env.FTP_BASEPATH,
                                file.name.replace(/.tmp$/, '')
                            )
                        );

                        sftp.rename(
                            path.join(process.env.FTP_BASEPATH, file.name),
                            path.join(
                                process.env.FTP_BASEPATH,
                                file.name.replace(/.tmp$/, '')
                            )
                        );
                    }
                });
            } catch (e) {
                console.log(e);
            }
        });
    })
    .catch(function (e) {
        console.log(e);
    });
