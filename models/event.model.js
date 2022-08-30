const { text } = require('body-parser');
var dbConn = require('../config');

const Query = (sql, result) => {
    dbConn.query(sql, (eveerr, everes) => {
        // const eventlength = everes.length;
        if (eveerr) {
            console.log('Error while fetching Events', eveerr);
            result(null, eveerr);
        }else {
            result(null, everes);
        }
    })
}

module.exports = Query;