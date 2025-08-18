import bcrypt from 'bcrypt';

export const hashPassword = async (password, saltRound = 10) => {
    const salt = await bcrypt.genSalt(saltRound);
    return await bcrypt.hash(password, salt);
}

export const compareValue = async (value, hash) => {
    return await bcrypt.compare(value, hash);
}