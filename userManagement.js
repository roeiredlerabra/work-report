// userManagement.js
import { StorageManager } from './storageManager.js';
import bcrypt from 'bcryptjs';

export const UserManagement = {
    users: [],

    async registerUser(username, email, password, role) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            id: Date.now().toString(),
            username,
            email,
            password: hashedPassword,
            role
        };
        this.users.push(newUser);
        StorageManager.setItem('users', this.users);
    },

    async updateUserProfile(userId, updates) {
        const userIndex = this.users.findIndex(user => user.id === userId);
        if (userIndex !== -1) {
            if (updates.password) {
                updates.password = await bcrypt.hash(updates.password, 10);
            }
            this.users[userIndex] = { ...this.users[userIndex], ...updates };
            StorageManager.setItem('users', this.users);
        }
    },

    resetPassword(email) {
        console.log(`Password reset requested for ${email}`);
        // In a real app, this would involve sending an email with a reset link
    },

    async authenticateUser(username, password) {
        const user = this.users.find(u => u.username === username);
        if (user && await bcrypt.compare(password, user.password)) {
            return user;
        }
        return null;
    }
};