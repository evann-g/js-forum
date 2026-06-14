import crypto from 'crypto';

export function parseCookies(cookieHeader = '') {
    if (!cookieHeader) return {};

    return Object.fromEntries(
        cookieHeader.split(';')
            .map(cookie => cookie.trim().split('='))
            .filter(parts => parts.length >= 2)
            .map(([key, ...value]) => [decodeURIComponent(key), decodeURIComponent(value.join('='))])
    );
}

export function buildCookie(name, value, options = {}) {
    const {
        httpOnly = true,
        secure = process.env.NODE_ENV === 'production',
        sameSite = 'Lax',
        path = '/',
        maxAge = 60 * 60 * 24 * 7, // 7 days
    } = options;

    let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
    cookie += `; Path=${path}`;
    cookie += `; Max-Age=${maxAge}`;

    if (httpOnly) cookie += '; HttpOnly';
    if (secure) cookie += '; Secure';

    cookie += `; SameSite=${sameSite}`;

    return cookie;
}

export function buildExpireCookie(name) {
    return `${encodeURIComponent(name)}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`;
}

export function generateSessionId() {
    return crypto.randomBytes(32).toString('hex');
}
