const fs = require('fs').promises;
const path = require('path');

const dbPath = path.join(__dirname, '../db.json');

// Citim parametrii pentru cloud din variabilele de mediu (folositoare când facem deploy pe Render)
const BIN_ID = process.env.JSONBIN_BIN_ID || '';
const API_KEY = process.env.JSONBIN_API_KEY || '';
const CLOUD_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

async function readDB() {
  // Dacă avem configurat JSONBin în variabilele de mediu, citim din Cloud
  if (BIN_ID && API_KEY) {
    try {
      const res = await fetch(`${CLOUD_URL}/latest`, {
        method: 'GET',
        headers: {
          'X-Master-Key': API_KEY
        }
      });
      
      if (!res.ok) {
        throw new Error(`Status JSONBin: ${res.status}`);
      }
      
      const data = await res.json();
      return data.record; // Datele propriu-zise sunt sub cheia .record în JSONBin
    } catch (error) {
      console.error('[CLOUD DB] Eroare la citirea din JSONBin, se revine la local:', error);
    }
  }

  // Fallback / Rulare locală implicită: citim din fișierul db.json local
  try {
    const data = await fs.readFile(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('[LOCAL DB] Eroare la citirea fișierului local db.json:', error);
    return { users: [], grades: [], announcements: [] };
  }
}

async function writeDB(data) {
  // Dacă avem configurat JSONBin în variabilele de mediu, scriem în Cloud
  if (BIN_ID && API_KEY) {
    try {
      const res = await fetch(CLOUD_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': API_KEY
        },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        throw new Error(`Status JSONBin: ${res.status}`);
      }
      
      const resData = await res.json();
      return resData.record;
    } catch (error) {
      console.error('[CLOUD DB] Eroare la scrierea în JSONBin:', error);
      throw error;
    }
  }

  // Fallback / Rulare locală implicită: scriem în fișierul db.json local
  try {
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('[LOCAL DB] Eroare la scrierea în fișierul local db.json:', error);
    throw error;
  }
}

module.exports = { readDB, writeDB };
