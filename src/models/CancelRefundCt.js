const { Model } = require('sequelize');

class CancelRefundCt extends Model {
    static init(sequelize, DataTypes) {
        return super.init({}, { sequelize, modelName: 'CancelRefundCt' });
    }
}

module.exports = CancelRefundCt;