import { authentification, addUser, userExists } from '../services/auth.js';

export async function login(req, res) {
  const { username, password } = req.body;
  const result = await authentification(username, password);
  if (result.success) {
    req.session.user = { id: result.user.id, username: result.user.username };
    res.redirect('/co');
  } else {
    res.status(401).json({ error: result.message });
  }
}

export async function register(req, res) {
  const { username, email, password } = req.body;
  const exists = await userExists(username);
  if (exists) {
    return res.status(409).json({ error: "Nom d'utilisateur déjà pris" });
  }
  await addUser(username, email, password);
  res.status(201).json({ message: "Compte créé !" });
}


