const DataTypes = require('sequelize');
const { sequelize } = require('../db');

const Users = sequelize.define('User', {
    user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    username: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    email: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    password: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    reset_otp: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    reset_otp_expiration:{
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'users',
    timestamps: false
});

module.exports = Users;
