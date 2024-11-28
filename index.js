const fs = require('fs').promises;
const express = require('express');
const { Command } = require('commander');
const multer = require('multer');
const path = require('path');

const program = new Command();

program
  .option('-h, --host <host>', 'Адреса сервера')
  .option('-p, --port <port>', 'Порт сервера')
  .option('-c, --cache <cache>', 'Шлях до кеша')
  .parse(process.argv);

const { host, port, cache } = program.opts();

const cacheDir = path.isAbsolute(cache) ? cache : path.join(__dirname, cache);

async function create_d(dir) {
  try {
    await fs.access(dir).catch(() => fs.mkdir(dir, { recursive: true }));
    console.log(`Директорія '${dir}' готова.`);
  } catch (error) {
    console.error('Помилка при створенні директорії:', error);
  }
}

create_d(cacheDir);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer();


app.get('/notes/:name', async (req, res) => {
    const { name } = req.params;
    const filePath = path.join(cacheDir, name);
  
    try {
      const note = await fs.readFile(filePath, 'utf8');
      return res.status(200).send(note);
    } catch (error) {
      return res.status(404).send('Не знайдено');
    }
  });
  

  app.put('/notes/:name', async (req, res) => {
    const { name } = req.params;
    const text = req.body.text;
    const filePath = path.join(cacheDir, name);
  
    if (!text) {
      return res.status(400).send('Текст нотатки не надано');
    }
  
    try {
      await fs.writeFile(filePath, text);
      return res.status(200).send('Нотатка оновлена');
    } catch (error) {
      return res.status(500).send('Помилка при оновленні нотатки');
    }
  });
  

app.delete('/notes/:name', async (req, res) => {
  const { name } = req.params;
  const filePath = path.join(cacheDir, name);

  try {
    await fs.unlink(filePath);
    return res.status(200).send('Нотатка видалена');
  } catch (error) {
    return res.status(404).send('Не знайдено');
  }
});

app.get('/notes', async (req, res) => {
    try {
      const files = await fs.readdir(cacheDir);
      const notesList = await Promise.all(
        files.map(async (file) => {
          const note = await fs.readFile(path.join(cacheDir, file), 'utf8');
          return { name: file, text: note };
        })
      );
      return res.status(200).json(notesList);
    } catch (error) {
      return res.status(500).send('Помилка при зчитуванні нотаток');
    }
  });

  app.post('/write', upload.none(), async (req, res) => {
    const { note_name, note } = req.body;
  
    if (!note_name || !note) {
      return res.status(400).send('Назва та зміст нотатки обов\'язкові');
    }
  
    const filePath = path.join(cacheDir, note_name);
    try {
      await fs.access(filePath).then(() => {
        throw new Error('Нотатка вже існує');
      }).catch(async (err) => {
        if (err.message === 'Нотатка вже існує') throw err;
        await fs.writeFile(filePath, note);
        return res.status(201).send('Нотатка створена');
      });
    } catch (error) {
      console.error('Помилка при створенні нотатки:', error);
      return res.status(error.message === 'Нотатка вже існує' ? 400 : 500).send(error.message);
    }
  });

  app.get('/UploadForm.html', (req, res) => {
    const filePath = path.join('C:', 'Users', 'PC', 'bc2024-5', 'UploadForm.html');
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Помилка при відправці файлу:', err);
        res.status(500).send('Помилка при завантаженні файлу');
      }
    });
  });


app.listen(port, host, () => {
  console.log(`Сервер запущено на http://${host}:${port}`);
});
