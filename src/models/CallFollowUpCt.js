const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database'); // Adjust the path to your database configuration

class CallFollowUpCt extends Model {}

CallFollowUpCt.init(
    {
        // Define your model attributes here
        // Example:
        // name: {
        //   type: DataTypes.STRING,
        //   allowNull: false,
        // },
    },
    {
        sequelize,
        modelName: 'CallFollowUpCt',
        tableName: 'call_follow_up_cts', // Adjust to match your database table name
        timestamps: true, // Set to false if your table doesn't have createdAt/updatedAt columns
    }
);

module.exports = CallFollowUpCt;