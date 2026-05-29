const { readDB, writeDB } = require('../utils/db');

exports.getAnnouncements = async (req, res) => {
  try {
    const db = await readDB();
    // Sortate descrescător după dată (cele mai noi primele)
    const sortedAnnouncements = [...db.announcements].sort((a, b) => new Date(b.date) - new Date(a.date));
    return res.json(sortedAnnouncements);
  } catch (error) {
    console.error('getAnnouncements error:', error);
    return res.status(500).json({ message: 'Eroare la citirea anunțurilor.' });
  }
};

exports.addAnnouncement = async (req, res) => {
  try {
    const { title, content, category } = req.body;
    if (!title || !content || !category) {
      return res.status(400).json({ message: 'Titlul, conținutul și categoria sunt obligatorii.' });
    }

    const db = await readDB();

    const newAnnouncement = {
      id: 'a_' + Date.now(),
      title,
      content,
      category,
      author: req.user.name || req.user.username,
      date: new Date().toISOString()
    };

    db.announcements.push(newAnnouncement);
    await writeDB(db);

    return res.status(201).json(newAnnouncement);
  } catch (error) {
    console.error('addAnnouncement error:', error);
    return res.status(500).json({ message: 'Eroare la adăugarea anunțului.' });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();

    const announcementIdx = db.announcements.findIndex(a => a.id === id);
    if (announcementIdx === -1) {
      return res.status(404).json({ message: 'Anunțul nu a fost găsit.' });
    }

    db.announcements.splice(announcementIdx, 1);
    await writeDB(db);

    return res.json({ message: 'Anunțul a fost șters cu succes.' });
  } catch (error) {
    console.error('deleteAnnouncement error:', error);
    return res.status(500).json({ message: 'Eroare la ștergerea anunțului.' });
  }
};
