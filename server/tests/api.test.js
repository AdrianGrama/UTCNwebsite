const request = require('supertest');
const app = require('../server');

describe('Teste de Integrare API - UTCN Portal', () => {
  let student1Token = '';
  let student2Token = '';
  let teacherToken = '';

  beforeAll(async () => {
    // Autentificăm utilizatorii demo pentru a prelua token-urile necesare testelor
    const resS1 = await request(app)
      .post('/api/auth/login')
      .send({ username: 'popescu.ion', password: 'student123' });
    student1Token = resS1.body.token;

    const resS2 = await request(app)
      .post('/api/auth/login')
      .send({ username: 'ionescu.maria', password: 'student123' });
    student2Token = resS2.body.token;

    const resT = await request(app)
      .post('/api/auth/login')
      .send({ username: 'lisman.evreul', password: 'prof123' });
    teacherToken = resT.body.token;
  });

  describe('API Autentificare (Auth)', () => {
    it('Ar trebui să returneze 401 la autentificarea cu o parolă incorectă', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'popescu.ion', password: 'parola_gresita' });
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message');
    });

    it('Ar trebui să permită accesul la /api/auth/me cu un token valid', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${student1Token}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.username).toEqual('popescu.ion');
    });
  });

  describe('API Catalog Note & Izolarea Datelor', () => {
    it('Ar trebui să returneze 401 la accesarea notelor fără token', async () => {
      const res = await request(app).get('/api/grades');
      expect(res.statusCode).toEqual(401);
    });

    it('Ar trebui să permită studentului u1 să vadă DOAR notele sale (izolarea datelor)', async () => {
      const res = await request(app)
        .get('/api/grades')
        .set('Authorization', `Bearer ${student1Token}`);
      expect(res.statusCode).toEqual(200);
      
      // Fiecare notă returnată trebuie să aparțină exclusiv studentului 1 (u1)
      res.body.forEach(grade => {
        expect(grade.studentId).toEqual('u1');
      });
    });

    it('Ar trebui să interzică studentului adăugarea unei note noi (modificare neautorizată)', async () => {
      const res = await request(app)
        .post('/api/grades')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          studentId: 'u2',
          subject: 'Tehnologii Distribuite',
          grade: 10,
          credits: 5
        });
      expect(res.statusCode).toEqual(403);
    });

    it('Ar trebui să permită profesorului să vadă toate notele studenților', async () => {
      const res = await request(app)
        .get('/api/grades')
        .set('Authorization', `Bearer ${teacherToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('studentName');
    });
  });

  describe('API Avizier Anunțuri', () => {
    it('Ar trebui să returneze lista anunțurilor pentru orice student logat', async () => {
      const res = await request(app)
        .get('/api/announcements')
        .set('Authorization', `Bearer ${student1Token}`);
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('Ar trebui să interzică studenților publicarea unui anunț nou', async () => {
      const res = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          title: 'Anunț Student',
          content: 'Cercetare neautorizată',
          category: 'Administrativ'
        });
      expect(res.statusCode).toEqual(403);
    });
  });
});
