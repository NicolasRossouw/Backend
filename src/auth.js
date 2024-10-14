const jwt = require('jsonwebtoken');

// Load the .env
require('dotenv').config();

const createAccessToken = async (data) => {
    try {
        // Create an access token
        const accessToken = await jwt.sign(data, process.env.ACCESS_TOKEN_SECRET);

        return accessToken;
    } catch (error) {
        response.status(500).json({
            error: "Unable to create access token"
        });
    }
}

const verifyAccessToken = async (request, response, next) => {
    try {
        // Check if the user has access
        const header = request.headers['authorization'];

        if (header == null) {
            return response.status(404).json({
                message: "Unauthorized"
            });
        }

        // Retrieve the token
        const token = header.split(' ')[1];

        // Verify the token
        await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        next();
    } catch (error) {
        response.status(500).json({
            error: "Unable to verify token"
        });
    }
}

module.exports = {
    createAccessToken,
    verifyAccessToken
}