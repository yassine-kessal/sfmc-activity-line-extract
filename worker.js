var fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { stringify } = require('csv-stringify');

var groupBy = function (xs, key) {
    return xs.reduce(function (rv, x) {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
    }, {});
};

const db = new sqlite3.Database('./database.sqlite3');

db.get('PRAGMA foreign_keys = ON');

// TODO for now 0s, after change to 900s = 15m
db.serialize(function () {
    db.all(
        `SELECT fields.name, fields.value, files.activityId, fields.defId FROM fields
        INNER JOIN files ON files.activityId = fields.fileActivityId`,
        function (err, rows) {
            if (err) {
                console.log(err);
                return;
            }

            console.log(rows);

            let groupedRows = groupBy(rows, 'defId'),
                formattedRows = [];

            Object.keys(groupedRows).forEach((keyRow) => {
                let v = {};
                groupedRows[keyRow].forEach((row) => {
                    v[row.name] = row.value;
                });
                formattedRows.push(v);
            });

            console.log(formattedRows);

            stringify(
                formattedRows,
                {
                    header: true,
                    delimiter: ';'
                },
                function (err, data) {
                    if (err) {
                        console.log(err);
                        return;
                    }

                    console.log(data);
                    fs.writeFile(
                        __dirname + '/exported/test.csv',
                        data,
                        (err, data) => {
                            if (err) {
                                console.log(err);
                            }
                        }
                    );
                }
            );
        }
    );
});
