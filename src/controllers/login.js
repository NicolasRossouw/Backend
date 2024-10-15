const users = require('../models/users');
const { createAccessToken } = require('../auth');
const decrypt = require('argon2');
const { sgMail } = require('../db');
const { Op } = require('sequelize');

const fetchLogin = async (request, response) => {
  try {
    const data = request.body;

    // Check if the note already exist in the db
    const user = await users.findOne({
      where: {
        "email": data['email']
      },
      attributes: ['user_id', 'username', 'password']
    });

    if (user == null) {
      return response.status(404).json({
        message: "The email address you entered is not associated with any account"
      });
    }

    // Validate the password
    const valid = await decrypt.verify(user['dataValues']['password'], data['password']);

    if (valid) {
      const accessToken = await createAccessToken({
        "username": user['dataValues']['username']
      });

      response.status(200).json({
        message: "Login successful! Welcome back!",
        token: accessToken,
        userId: user['dataValues']['user_id'],
        username: user['dataValues']['username']
      });
    } else {
      return response.status(401).json({
        message: "The password you entered is incorrect. Please try again."
      });
    }
  } catch (error) {
    response.status(500).json({
      error: "Unable to login"
    });
  }
}

const fetchForgotPassword = async (request, response) => {
  try {
    const email = request.body.email;

    // Check if the user exists
    const user = await users.findOne({
      where: {
        "email": email
      },
      attributes: ['user_id', 'username', 'email']
    })

    if (user == null) {
      return response.status(404).json({
        message: "The email address you entered is not associated with any account"
      });
    } else {
      const userId = user.user_id;

      // Create OTP
      const otp = Math.floor(100000 + Math.random() * 900000);
      const expiration = new Date(Date.now() + 3600000);

      await users.update({
          "reset_otp": otp,
          "reset_otp_expiration": expiration
        },
        {
          where: {
            "email": user.email
          }
        }
      );
  
      const resetLink = `https://backend-production-2a40.up.railway.app/reset-password?email=${user.email}`;

      // Create the response msg
      const msg = {
        to: user.email,
        from: '26526182@sun.ac.za',
        subject: 'Password Reset Request',
        html: `<p> Hi ${user.username},</p><p>Your OTP for password reset is : <strong>${otp}</strong></p><p> Please use the following link to set your password:</p><a href="${resetLink}">Reset Password</a>`
      };

      await sgMail.send(msg);

      return response.status(200).json({
        message: 'Password reset link and OTP sent to your email address.'
      });
    }
  } catch (error) {
    return response.status(500).json({
      message: 'There was an error processing your request. Please try again later.'
    });
  }
}

const fetchResetPassword = async (request, response) => {
  try {
    const email = request.body.email;
    const { otp, newPassword } = request.body;
    const user = await users.findOne({
      where: {
        "email": email,
        "reset_otp": otp,
        "reset_otp_expiration": {
          [Op.gt]: new Date() 
        }
      },
    });

    if (user == null) {
      return response.status(404).json({
        message: 'OTP is invalid or expired. Please request a new one.'
      });
    }

    // hash this new password
    const hashedPassword = await decrypt.hash(newPassword);
    await users.update({
      "password": hashedPassword,
      "reset_otp": null,
      "reset_otp_expiration": null
    },{
      where: {
        "user_id": user.user_id
      }
    });
    

    return response.status(200).json({
      message: 'Password reset successful!'
    });

  } catch (err) {
    return response.status(500).json({
      message: 'There was an error processing your request. Please try again later.'
    });
  }
}

module.exports = {
  fetchLogin,
  fetchForgotPassword,
  fetchResetPassword,
}
