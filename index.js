const swaggerJsdoc = require('swagger-jsdoc');
const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const swaggerDocs = require('./swagger');

const app = express();
const PORT = process.env.PORT || 3001;
const NOTES_DIR = path.join(__dirname, 'notes');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (!fs.existsSync(NOTES_DIR)) {
  fs.mkdirSync(NOTES_DIR);
}

/**
 * @swagger
 * /:
 *   get:
 *     summary: Welcome message
 *     responses:
 *       200:
 *         description: Returns a welcome message.
 */
app.get('/', (req, res) => {
  res.send('Welcome to my API!');
});

/**
 * @swagger
 * /notes/{name}:
 *   get:
 *     summary: Get a note by name
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the note
 *     responses:
 *       200:
 *         description: The content of the note.
 *       404:
 *         description: Note not found.
 */
app.get('/notes/:name', (req, res) => {
  const noteName = req.params.name;
  const notePath = path.join(NOTES_DIR, noteName + '.txt');
  
  if (!fs.existsSync(notePath)) {
    return res.status(404).send('Not found');
  }
  
  const noteContent = fs.readFileSync(notePath, 'utf-8');
  res.send(noteContent);
});

/**
 * @swagger
 * /notes/{name}:
 *   put:
 *     summary: Update a note by name
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the note
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Note updated.
 *       404:
 *         description: Note not found.
 *       400:
 *         description: Bad request.
 */
app.put('/notes/:name', (req, res) => {
  const noteName = req.params.name;
  const notePath = path.join(NOTES_DIR, noteName + '.txt');
  
  if (!fs.existsSync(notePath)) {
    return res.status(404).send('Not found');
  }

  const newText = req.body.text;
  
  if (typeof newText === 'undefined') {
    return res.status(400).send('Bad request: text is undefined');
  }

  fs.writeFileSync(notePath, newText);
  res.send('Updated');
});

/**
 * @swagger
 * /notes/{name}:
 *   delete:
 *     summary: Delete a note by name
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the note
 *     responses:
 *       200:
 *         description: Note deleted.
 *       404:
 *         description: Note not found.
 */
app.delete('/notes/:name', (req, res) => {
  const noteName = req.params.name;
  const notePath = path.join(NOTES_DIR, noteName + '.txt');
  
  if (!fs.existsSync(notePath)) {
    return res.status(404).send('Not found');
  }

  fs.unlinkSync(notePath);
  res.send('Deleted');
});

/**
 * @swagger
 * /notes:
 *   get:
 *     summary: Get all notes
 *     responses:
 *       200:
 *         description: A list of notes.
 */
app.get('/notes', (req, res) => {
  const notes = fs.readdirSync(NOTES_DIR).map(file => {
    const notePath = path.join(NOTES_DIR, file);
    if (fs.statSync(notePath).isFile()) {
      const name = path.basename(file, '.txt');
      const text = fs.readFileSync(notePath, 'utf-8');
      return { name, text };
    }
  }).filter(note => note !== undefined);

  res.status(200).json(notes);
});

const upload = multer();

/**
 * @swagger
 * /write:
 *   post:
 *     summary: Create a new note
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               note_name:
 *                 type: string
 *               note:
 *                 type: string
 *     responses:
 *       201:
 *         description: Note created.
 *       400:
 *         description: Note already exists.
 */
app.post('/write', upload.none(), (req, res) => {
  const noteName = req.body.note_name;
  const noteText = req.body.note;
  const notePath = path.join(NOTES_DIR, noteName + '.txt');

  if (fs.existsSync(notePath)) {
    return res.status(400).send('Note already exists');
  }

  fs.writeFileSync(notePath, noteText);
  res.status(201).send('Created');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  swaggerDocs(app, PORT);
});
