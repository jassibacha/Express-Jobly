const { BadRequestError } = require('../expressError');

// Function to do partial updates to database
// Passes in 2 callbacks, one is the data we want to update and the other is a mapping object to convert js camelCase to sql snake_case

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
    // Get all the keys (col names) from dataToUpdate
    const keys = Object.keys(dataToUpdate);
    // No keys? Throw an error
    if (keys.length === 0) throw new BadRequestError('No data');

    // Checks if there's a mapping for this column name in jsToSql.
    // If there is, it uses the mapped name; if not, it uses the original name.
    // It then constructs a string like "column_name"=$1, where column_name is the (possibly mapped) column name, and $1 is a parameter placeholder for SQL queries.
    // The number in the placeholder ($1, $2, etc.) corresponds to the position of the value in the values array that will be returned.
    // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
    const cols = keys.map(
        (colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`
    );

    // Return object with 2 properties
    return {
        setCols: cols.join(', '), // This is a string that can be used in a SQL UPDATE statement. It's a comma-separated list of the column assignments.
        values: Object.values(dataToUpdate), // This is an array of the values from the dataToUpdate object. These values will replace the placeholders ($1, $2, etc.) in the SQL query.
    };
}

module.exports = { sqlForPartialUpdate };
