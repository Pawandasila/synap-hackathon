import bcrypt from 'bcrypt';

export const hashPassword = async (password, saltRound = 10) => {
    const salt = await bcrypt.genSalt(saltRound);
    return await bcrypt.hash(password, salt);
}

export const comparePassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
}