const { Model } = require('sequelize');

class CancellationPolicy extends Model {
    static init(sequelize, DataTypes) {
        return super.init({}, { sequelize, modelName: 'CancellationPolicy' });
    }
}

module.exports = CancellationPolicy;