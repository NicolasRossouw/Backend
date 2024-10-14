const { sgMail } = require('../db');
const Users = require('../models/users');
const db = require('../models/notes');
const encrypt = require('argon2');
const { Op } = require('sequelize');

const createAccount = async (request, response) => {
  try {
    const { username, email, password } = request.body;

    // Check if the user exist in the database
    const user = await Users.findOne({
      where: {
        [Op.or]: [
          { username: username },
          { email: email }
        ]
      }
    });

    if (user) {
      return response.status(409).json({
        message: "An account with this username/email already exists."
      });
    }

    // Hash the password
    const hashedPassword = await encrypt.hash(password);

    // Insert the user into the database
    await Users.create({
      "username": username,
      "email": email,
      "password": hashedPassword,
    });

    response.status(200).json({
      message: "Registration successful!"
    });
  } catch (error) {
    response.status(500).json({
      error: "Unable to register"
    });
  }
}

const updateAccount = async (request, response) => {
  try {
    const userId = request.params.userId;
    const { currentValue, newValue, currentPassword, newPassword } = request.body;
    const user = await Users.findByPk(userId);

    // Update the user in the database
    if (currentValue && newValue) {

      // Check if the value is an email
      if (isValidEmail(currentValue) && isValidEmail(newValue)) {
        const valid = await Users.findOne({
          where: {
            "email": currentValue
          }
        });

        if (!valid) {
          return response.status(401).json({
            message: "The current email you entered is incorrect. Please try again."
          });
        }

        const exist = await Users.findOne({
          where: {
            "email": newValue
          }
        });

        if (exist) {
          return response.status(409).json({
            message: "Email already exist"
          });
        }

        await Users.update({
          "email": newValue
        }, {
          where: {
            "user_id": userId
          }
        });
      } else {
        const valid = await Users.findOne({
          where: {
            "username": currentValue
          }
        });

        if (!valid) {
          return response.status(401).json({
            message: "The current username you entered is incorrect. Please try again."
          });
        }

        // Check if the new username already exist
        const exist = await Users.findOne({
          where: {
            "username": newValue
          }
        });

        if (exist) {
          return response.status(409).json({
            message: "Username already exist."
          });
        }

        await Users.update({
          "username": newValue
        }, {
          where: {
            "user_id": userId
          }
        });
      }
    }

    if (currentPassword && newPassword) {
      const valid = await encrypt.verify(user['dataValues']['password'], currentPassword);

      if (valid) {
        // Hash the password
        const hashedPassword = await encrypt.hash(newPassword);

        await Users.update({
          "password": hashedPassword
        }, {
          where: {
            "user_id": userId
          }
        });
      } else {
        return response.status(401).json({
          message: "The current password you entered is incorrect. Please try again."
        });
      }
    }

    response.status(200).json({
      message: "Account updated successfully"
    });
  } catch (error) {
    response.status(500).json({
      error: "Unable to update user account"
    });
  }
}

const deleteAccount = async (request, response) => {
  try {
    const userId = request.params.userId;

    // Check if the user exist in the database
    const user = await Users.findOne({
      where: {
        "user_id": userId
      }
    });

    if (user == null) {
      return response.status(404).json({
        message: "User does not exist"
      });
    }

    const notesId = await db.Notes.findAll({
      where: {
        "owner": userId
      },
      attributes: ['note_id']
    });

    const notesIdArray = notesId.map(note => note.note_id);

    // Delete the user's access from the user access note table
    await db.EditAccess.destroy({
      where: {
        "note_id": { [Op.in]: notesIdArray }
      }
    });

    await db.ViewAccess.destroy({
      where: {
        "note_id": { [Op.in]: notesIdArray }
      }
    });

    await db.Notes.destroy({
      where: {
        "owner": userId
      }
    });

    // Delete the user from the users table
    await Users.destroy({
      where: {
        "user_id": userId
      }
    });

    response.status(200).json({
      message: "Account deleted successfully"
    });
  } catch (error) {
    console.log(error);
    response.status(500).json({
      error: "Unable to delete the user"
    });
  }
}

const fetchUsers = async (request, response) => {
  try {
    // Fetch all users in the database
    const userId = request.params.userId;
    const users = await Users.findAll({
      where: {
        user_id: {
          [Op.not]: userId
        }
      },
      attributes: ['username']
    });

    const usernames = users.map(user => user.username);

    // Check if the users exist in the database
    response.status(200).json(usernames);
  } catch (error) {
    response.status(500).json({
      error: "Unable to fetch users"
    });
  }
}

const fetchUsersWithAccess = async (request, response) => {
  try {
    // Fetch a user from the database
    const data = request.params;

    // Check if the users exist in the database
    const editIds = await db.EditAccess.findAll({
      where: {
        "note_id": data['noteId']
      },
      attributes: ['user_id']
    });

    const viewIds = await db.ViewAccess.findAll({
      where: {
        "note_id": data['noteId']
      },
      attributes: ['user_id']
    });

    const editUserIds = editIds.map(user => user.user_id);
    const viewUserIds = viewIds.map(user => user.user_id);

    const users = await Users.findAll({
      where: {
        [Op.or]: [
          { user_id: editUserIds },
          { user_id: viewUserIds }
        ]
      },
      attributes: ['user_id', 'username']
    });

    const usersWithAccess = users.map(user => {
      const accessType = editUserIds.includes(user.user_id) ? 'edit' : 'view';
      return {
        ...user.dataValues,
        access: accessType
      };
    });

    response.status(200).json(usersWithAccess);
  } catch (error) {
    response.status(500).json({
      error: "Unable to fetch user"
    });
  }
};

const grantAccess = async (request, response) => {
  try {
    const data = request.params;

    const user = await Users.findOne({
      where: {
        username: data['userId']
      },
      attributes:['user_id', 'email']
    });

    const note = await db.Notes.findByPk(data['noteId']);

    if (data['access'] == 'edit') {
      await db.EditAccess.create({
        user_id: user['dataValues']['user_id'],
        note_id: data['noteId']
      });
    }

    if (data['access'] == 'view') {
      await db.ViewAccess.create({
        user_id: user['dataValues']['user_id'],
        note_id: data['noteId']
      });
    }

    // Send the notification to the user
    // const msg = {
    //   to: user['dataValues']['email'],
    //   from: '26526182@sun.ac.za',
    //   subject: 'Access Granted to Note',
    //   text: `You have been granted ${data['access']} access to note "${note['dataValues']['title']}".`,
    //   html: `<strong>You have been granted ${data['access']} access to note "${note['dataValues']['title']}".</strong>`
    // };

    // await sgMail.send(msg);

    response.status(200).json({
      message: "Access granted successfully."
    });
  } catch (error) {
    console.log(error);
    response.status(500).json({
      error: "Unable to grant access."
    });
  }
}

const revokeAccess = async (request, response) => {
  try {
    const data = request.params;

    const user = await Users.findOne({
      where: {
        username: data['userId']
      },
      attributes:['user_id', 'email']
    });

    if (data['access'] == 'edit') {
      await db.EditAccess.destroy({
        where: {
          "user_id": user['dataValues']['user_id']
        }
      });
    }

    if (data['access'] == 'view') {
      await db.ViewAccess.destroy({
        where: {
          "user_id": user['dataValues']['user_id']
        }
      });
    }

    response.status(200).json({
      message: "Access revoked successfully."
    });
  } catch (error) {
    response.status(500).json({
      error: "Unable to revoke access."
    });
  }
}

function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

module.exports = {
  createAccount,
  updateAccount,
  deleteAccount,
  fetchUsers,
  fetchUsersWithAccess,
  grantAccess,
  revokeAccess,
}