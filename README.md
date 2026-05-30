# 🎓 Portal Studențesc UTCN - Proiect Tehnologii Distribuite (TD)

Acesta este scheletul de bază al aplicației pentru portalul studențesc UTCN, construit pentru proiectul la materia **Tehnologii Distribuite**. Proiectul este structurat într-o arhitectură Client-Server, utilizând o bază de date locală de tip `.json`.

---

## 🛠️ Tehnologii Utilizate

* **Frontend (Client):** React.js + Vite + Vanilla CSS (Design System Modern cu Glassmorphism și HSL variables, Dark/Light Mode).
* **Backend (Server):** Node.js + Express (Autentificare prin JWT, API-uri REST CRUD).
* **Baza de Date:** Fișier local JSON (`server/db.json`) cu operații asincrone de citire/scriere (folosind `fs.promises`).
* **Package Manager:** Yarn.

---

## 👥 Distribuția Sarcinilor în Echipă

Proiectul este structurat special pentru a permite celor 4 membri să lucreze în paralel, reducând la minimum conflictele de pe Git:

### 🧑‍💻David: Autentificare și Management Utilizatori (Auth)
* **Frontend:** Pagina de Login ([Login.jsx](file:///Users/gramaadrian/Desktop/Facultate/UTCNwebsite/client/src/pages/Login.jsx)) + Stocare locală "Remember Me" + Integrare [AuthContext.jsx](file:///Users/gramaadrian/Desktop/Facultate/UTCNwebsite/client/src/context/AuthContext.jsx).
* **Backend:** Rutele și controlerele de auth ([auth.routes.js](file:///Users/gramaadrian/Desktop/Facultate/UTCNwebsite/server/routes/auth.routes.js), [auth.controller.js](file:///Users/gramaadrian/Desktop/Facultate/UTCNwebsite/server/controllers/auth.controller.js)) + Middleware [auth.middleware.js](file:///Users/gramaadrian/Desktop/Facultate/UTCNwebsite/server/middleware/auth.middleware.js).

### 🧑‍💻 Vladimir: Situație Școlară (Grades CRUD)
* **Frontend:** Pagina de Note ([Grades.jsx](file:///Users/gramaadrian/Desktop/Facultate/UTCNwebsite/client/src/pages/Grades.jsx)) care afișează mediile/ECTS pentru studenți și oferă formulare/modale CRUD pentru profesori.
* **Backend:** Rutele și controlerele de note ([grades.routes.js](file:///Users/gramaadrian/Desktop/Facultate/UTCNwebsite/server/routes/grades.routes.js), [grades.controller.js](file:///Users/gramaadrian/Desktop/Facultate/UTCNwebsite/server/controllers/grades.controller.js)).

### 🧑‍💻 Vlad: Management Anunțuri (Announcements CRUD)
* **Frontend:** Pagina de Anunțuri ([Announcements.jsx](file:///Users/gramaadrian/Desktop/Facultate/UTCNwebsite/client/src/pages/Announcements.jsx)) cu categorii (filtru salvat în `localStorage`) și opțiuni de adăugare/ștergere pentru profesori.
* **Backend:** Rutele și controlerele de anunțuri ([announcements.routes.js](file:///Users/gramaadrian/Desktop/Facultate/UTCNwebsite/server/routes/announcements.routes.js), [announcements.controller.js](file:///Users/gramaadrian/Desktop/Facultate/UTCNwebsite/server/controllers/announcements.controller.js)).

### 🧑‍💻 Adi: Dashboard, Design System, Integrare și Testare
* **Frontend:** Pagina principală ([Dashboard.jsx](file:///Users/gramaadrian/Desktop/Facultate/UTCNwebsite/client/src/pages/Dashboard.jsx)) care agregă statisticile, ultimele anunțuri și profilul + Structura generală [App.jsx](file:///Users/gramaadrian/Desktop/Facultate/UTCNwebsite/client/src/App.jsx) + Design System în [index.css](file:///Users/gramaadrian/Desktop/Facultate/UTCNwebsite/client/src/index.css).
* **Testare:** Crearea colecției Postman și testarea manuală/validarea.

---

## 🚀 Instalare și Rulare Locală

### 1. Prerechizite
* Instalați **Node.js** (versiunea >= 18 recomandată).
* Instalați **Yarn** global (`npm install -g yarn`).

### 2. Instalarea dependențelor
De la rădăcina proiectului, rulați comanda de mai jos pentru a instala automat dependențele atât pentru client, cât și pentru server:
```bash
yarn install:all
```

### 3. Pornirea aplicației în mod Dezvoltare (Dev)
Pentru a rula simultan serverul și clientul cu o singură comandă:
```bash
yarn dev
```
Aplicația va fi disponibilă la adresele:
* **Frontend (Client):** [http://localhost:5173](http://localhost:5173)
* **Backend (Server):** [http://localhost:5001](http://localhost:5001)

---

## 🔑 Conturi de Test (Demo Credentials)

Pentru a testa cele două perspective din aplicație (Student vs. Profesor/Admin):

| Rol | Utilizator (Username) | Parolă | Nume Afișat | Specializare / Grupa |
| :--- | :--- | :--- | :--- | :--- |
| **Student 1** | `popescu.ion` | `student123` | Ion Popescu | Calculatoare (RO) / 30331 |
| **Student 2** | `ionescu.maria` | `student123` | Maria Ionescu | Calculatoare (EN) / 30332 |
| **Profesor** | `dobra.fecior` | `prof123` | Prof. Dr. Ing. Dobra | Departament Calculatoare |

---

## 🔌 API Endpoints Summary

### Autentificare (Auth)
* `POST /api/auth/login` - Autentificare utilizator. Returnează datele profilului și un JWT token.
* `GET /api/auth/me` - Returnează profilul utilizatorului pe baza token-ului JWT trimis în Header (`Authorization: Bearer <token>`).

### Catalog Note (Grades)
* `GET /api/grades` - Returnează notele (pentru studenți: doar ale lor; pentru profesori: ale tuturor studenților, cu detalii).
* `GET /api/grades/students` - (*Doar Profesor*) Returnează lista studenților existenți pentru dropdown-ul de notare.
* `POST /api/grades` - (*Doar Profesor*) Adaugă o notă nouă unui student.
* `PUT /api/grades/:id` - (*Doar Profesor*) Actualizează o notă existentă.
* `DELETE /api/grades/:id` - (*Doar Profesor*) Șterge o notă.

### Anunțuri (Announcements)
* `GET /api/announcements` - Listează toate anunțurile din bază (sortate după dată, cele mai noi primele).
* `POST /api/announcements` - (*Doar Profesor*) Adaugă un anunț nou pe avizier.
* `DELETE /api/announcements/:id` - (*Doar Profesor*) Șterge un anunț.

---

## 📂 Structura Bazei de Date JSON (`db.json`)

Baza de date este un fișier JSON simplu. Structura generală conține:
* `users` - lista utilizatorilor (studenți și profesori).
* `grades` - notele legate de id-ul studentului (`studentId`).
* `announcements` - postările de pe avizier cu autor, dată și categorie.
