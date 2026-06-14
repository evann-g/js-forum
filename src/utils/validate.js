export function validateRegister({ username, email, password }) {
    const errors = [];

    if (!username || username.trim().length < 3) {
        errors.push('Username must be at least 3 characters long.');
    }
    // Guard against excessively long inputs (DoS / database abuse)
    if (username && username.length > 50) {
        errors.push('Username must be 50 characters or fewer.');
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Invalid email address.');
    }

    if (!password || password.length < 8) {
        errors.push('Password must be at least 8 characters long.');
    }

    return errors;
}

export function validatePost({ title, body }) {
    const errors = [];
    if (!title || title.trim().length < 3)
        errors.push('Title must be at least 3 characters long.');
    if (!body || body.trim().length < 10)
        errors.push('Body must be at least 10 characters long.');
    return errors;
}

export function validateComment({ body }) {
    const errors = [];

    if (!body || body.trim().length < 1) {
        errors.push('Comment cannot be empty.');
    }

    return errors;
}
