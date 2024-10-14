const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const Notes = sequelize.define('Note', {
    note_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    owner: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    title: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    category: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    last_edit_at: {
      type: DataTypes.TEXT,
      allowNull: false,
    }
}, {
  tableName: 'notes',
  timestamps: false
});

const EditAccess = sequelize.define('EditAccess', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }, 
    note_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
}, {
  tableName: 'edit_access',
  timestamps: false
});

const ViewAccess = sequelize.define('ViewAccess', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }, 
    note_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
  tableName: 'view_access',
  timestamps: false
});

module.exports = {
  Notes,
  EditAccess,
  ViewAccess
};