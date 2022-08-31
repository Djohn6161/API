const { text } = require('body-parser');
var dbConn = require('../config');

const Query = (sql, result) => {
    dbConn.query(sql, (eveerr, everes) => {
        // const eventlength = everes.length;
        if (eveerr) {
            console.log('Error while fetching Events', eveerr);
            result(eveerr, null);
        }else {
            result(null, everes);
        }
    })
}
const removeDuplicates = (array) =>{
    return array.filter((item,index, self) => 
        index === self.findIndex((value) => (
            value.id === item.id
        ))
    )
};
const deleteProperty = (array, keys) => {
    for(let i=0; i<array.length; i++){
        delete array[i][keys]
    }
    
}
module.exports = {
    Query, 
    removeDuplicates,
    deleteProperty
};