const express = require('express');
const app = express();
const cors = require('cors');
const WebSocket = require('ws');
const account = require('./routes/account');
const login = require('./routes/login');
const notes = require('./routes/notes');

// Load the .env
require('dotenv').config();

// Set up the port for the backend server
const PORT = process.env.PORT;

// Set up CORS
app.use(cors());

// Parse all JSON bodies
app.use(express.json());

// Register all routes
app.use(account);
app.use(login);
app.use(notes);

// Create a WebSocket server
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Setup WebSocket
const wss = new WebSocket.Server({ server });

// This object will store clients by noteId
const noteRooms = {};

wss.on('connection', (ws) => {
  let currentNoteId = null;
  console.log('New client connected');

  ws.on('message', (message) => {
    try {
      // Parse the received message
      const data = JSON.parse(message);

      // Check if the message is to join a note room
      if (data.type === 'join_note') {
        currentNoteId = data.noteId;

        // Ensure the room exists
        if (!noteRooms[currentNoteId]) {
          noteRooms[currentNoteId] = new Set();
        }

        // Add the client to the specific note room
        noteRooms[currentNoteId].add(ws);

      } else if (data.type === 'note_update') {
        // Broadcast the updated markdown only to clients in the same note room

        if (currentNoteId && noteRooms[currentNoteId]) {
          noteRooms[currentNoteId].forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ markdownText: data.markdownText }));
            }
          });
        }
      }
    } catch (error) {
      console.error(error);
    }
  });

  ws.on('close', () => {
    // Remove the client from the room on disconnection
    if (currentNoteId && noteRooms[currentNoteId]) {
      noteRooms[currentNoteId].delete(ws);

      // Clean up the room if empty
      if (noteRooms[currentNoteId].size === 0) {
        delete noteRooms[currentNoteId];
      }
    }
    console.log('Client disconnected');
  });
});

