import mysql from "mysql2/promise";

const db = await mysql.createConnection({
  host: "localhost",
  user: "root",        // ton utilisateur MySQL
  password: "",        // ton mot de passe MySQL
  database: "js_forum" // le nom de ta base de données
});

export default db;