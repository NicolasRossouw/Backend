const db = require('../models/notes');
const { Op } = require('sequelize');

const createNote = async (request, response) => {
  try {
    const { userId, title, content, category, created_at, last_edit_at } = request.body;

    // Check if the note already exist the db
    const note = await db.Notes.findOne({
      where: {
        "title": title
      }
    });

    if (note) {
      return response.status(200).json({
        message: "Note already exist"
      });
    }

    // Insert the note into the notes tables
    const newNote = await db.Notes.create({
      "owner": userId,
      "title": title,
      "category": category,
      "content": content,
      "created_at": created_at,
      "last_edit_at": last_edit_at
    });

    response.status(200).json({
      noteId: newNote['dataValues']['note_id'],
      message: "Note created successfully"
    });
  } catch (error) {
    response.status(500).json({
      error: "Unable to create note"
    });
  }
};

const updateNote = async (request, response) => {
  try {
    const noteId = request.params.noteId;
    const { title, content, category, last_edit_at } = request.body;

    // Check if the note exist in the database
    const note = await db.Notes.findByPk(noteId);

    if (note == null) {
      return response.status(200).json({
        message: "Note does not exist"
      });
    }

    // Update the note in the database
    if (title) {
      await db.Notes.update({
        "title": title,
        "last_edit_at": last_edit_at
      }, {
        where: {
          "note_id": noteId
        }
      });
    }

    if (content) {
      await db.Notes.update({
        "content": content,
        "last_edit_at": last_edit_at
      }, {
        where: {
          "note_id": noteId
        }
      });
    }

    if (category) {
      await db.Notes.update({
        "category": category,
        "last_edit_at": last_edit_at
      }, {
        where: {
          "note_id": noteId
        }
      });
    }

    response.status(200).json({
      message: "Note updated successfully"
    });
  } catch (error) {
    response.status(500).json({
      error: "Unable to update note"
    });
  }
}

const deleteNote = async (request, response) => {
  try {
    const noteId = request.params.noteId;

    // Check if the note exist in the database
    const note = await db.Notes.findOne({
      where: {
        "note_id": noteId
      }
    });

    if (note == null) {
      return response.status(200).json({
        message: "Note does not exist"
      });
    }

    await db.EditAccess.destroy({
      where: {
        "note_id": noteId
      }
    });

    await db.ViewAccess.destroy({
      where: {
        "note_id": noteId
      }
    });

    await db.Notes.destroy({
      where: {
        "note_id": noteId
      }
    });

    response.status(200).json({
      message: "Note deleted successfully"
    });
  } catch (error) {
    response.status(500).json({
      error: "Unable to delete note"
    });
  }
}

const fetchNotes = async (request, response) => {
  try {
    // Fetch all notes in the database
    const userId = request.params.userId;

    const edit = await db.EditAccess.findAll({
      where: {
        "user_id": userId
      },
      attributes: ['note_id']
    });

    const view = await db.ViewAccess.findAll({
      where: {
        "user_id": userId
      },
      attributes: ['note_id']
    });

    const editIds = edit.map(access => access.note_id);
    const viewIds = view.map(access => access.note_id);

    const notes = await db.Notes.findAll({
      where: {
        [Op.or]: [
          { "owner": userId },
          { "note_id": editIds },
          { "note_id": viewIds }
        ]
      }
    });

    const notesWithPermissions = notes.map(note => {
      if (note.owner === userId) {
        note.dataValues.permission = 'Owner';
      } else if (editIds.includes(note.note_id)) {
        note.dataValues.permission = 'Edit';
      } else if (viewIds.includes(note.note_id)) {
        note.dataValues.permission = 'View';
      }
      return note;
    });

    if (notesWithPermissions) {
      response.status(200).json(notesWithPermissions);
    } else {
      response.status(200).json({
        message: "No notes found in the database"
      });
    }
  } catch (error) {
    response.status(500).json({
      error: "Unable to fetch notes"
    });
  }
};

const fetchNote = async (request, response) => {
  try {
    // Fetch note in the database
    const noteId = request.params.noteId;
    const note = await db.Notes.findByPk(noteId);

    if (note) {
      response.status(200).json(note['dataValues']['content']);
    } else {
      response.status(200).json({
        message: "Note does not exit"
      });
    }
  } catch (error) {
    response.status(500).json({
      error: "Unable to fetch notes"
    });
  }
};

module.exports = {
  createNote,
  updateNote,
  deleteNote,
  fetchNotes,
  fetchNote
};