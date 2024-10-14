const { Sequelize } = require('sequelize');
const sgMail = require('@sendgrid/mail');

// Load the .env
require('dotenv').config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Connect to the database
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false
});

// Test the connection
sequelize.authenticate().
    then(() => {
        console.log('Connection has been established successfully.');
    }).
    catch(error => {
        console.error('Unable to connect to the database:', error);
    });

module.exports = {
    sequelize,
    sgMail
};