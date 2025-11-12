import React, { useState } from 'react';

const UserIdentityForm = ({ onSubmit }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        profileImage: '',
        role: '',
        preferredLanguage: '',
        theme: 'light'
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Hash password before submitting (in a real app, use proper hashing)
        const hashedPassword = btoa(formData.password); // Simple base64 for demo - use proper hashing in production
        const submitData = {
            ...formData,
            passwordHash: hashedPassword,
            signUpDate: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            socialAccounts: {} // Can be extended later
        };
        delete submitData.password; // Remove plain password
        onSubmit(submitData);
    };

    return (
        <div className="user-identity-form">
            <h2>User Identity Information</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="name">Name:</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="phone">Phone:</label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="profileImage">Profile Image URL:</label>
                    <input
                        type="url"
                        id="profileImage"
                        name="profileImage"
                        value={formData.profileImage}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="role">Role:</label>
                    <select
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                    >
                        <option value="">Select Role</option>
                        <option value="admin">Admin</option>
                        <option value="user">User</option>
                        <option value="moderator">Moderator</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="preferredLanguage">Preferred Language:</label>
                    <select
                        id="preferredLanguage"
                        name="preferredLanguage"
                        value={formData.preferredLanguage}
                        onChange={handleChange}
                    >
                        <option value="">Select Language</option>
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="theme">Theme:</label>
                    <select
                        id="theme"
                        name="theme"
                        value={formData.theme}
                        onChange={handleChange}
                    >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                    </select>
                </div>

                <button type="submit">Save User Identity</button>
            </form>
        </div>
    );
};

export default UserIdentityForm;
