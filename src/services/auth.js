import bcrypt from "bcrypt";
import { findByUsername, createUser } from "../repository/user.js";
import { createSession, deleteSession } from "../repository/session.js";
import { generateSessionId ,buildCookie} from "../utils/cookie.js";

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function userExists(username) {
    const user = await findByUsername(username);
    return !!user;
}

export async function addUser(username, email, password) {
    const hashed = await bcrypt.hash(password, 12);
    return createUser(username, email, hashed);
}

export async function authentification(username, password) {
  const user = await findByUsername(username);
  
  if (!user) return {
    success: false, message: "Invalid credentials"
  };
  
  const match = await bcrypt.compare(password, user.password);

  if (!match) return {
    success: false, message: "Invalid credentials"
  };
  
  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + SESSION_DURATION);
  const token = buildCookie('session_id', sessionId, { maxAge: 7 * 24 * 60 * 60, } )
  await createSession(/*sessionId,*/ user.id, token, expiresAt);

  return {
    success: true,
    sessionId,
    expiresAt,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  };
}

export async function logout(sessionId) {
  await deleteSession(sessionId);
}