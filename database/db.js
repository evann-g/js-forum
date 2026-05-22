import mysql from 'mysql';



let con = mysql.createConnection({
  host: "localhost",
  user: "yourusername",
  password: "yourpassword",
  database: "schema.sql"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
  let sql = "create table users (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(255), password VARCHAR(255))";
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Table created");
  });
});

function createUser(username, passwordHash) {
  let sql = "INSERT INTO users (username, password) VALUES (?, ?)";
  con.query(sql, [username, passwordHash], function (err, result) {
    if (err) throw err;
    console.log("User created");
  });
}

export default { createUser };