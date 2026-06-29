'use client';

import { useState, useEffect } from 'react';
import { FiUser, FiMail, FiKey, FiSave, FiEdit2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const [user, setUser] = useState({
    username: '',
    email: '',
    fullName: '',
    company: '',
    role: 'Data Scientist',
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser({
        username: userData.username || '',
        email: userData.email || '',
        fullName: userData.username || '',
        company: 'SmartML Inc.',
        role: 'Data Scientist',
      });
    }
  }, []);

  const handleSave = () => {
    setIsEditing(false);
    toast.success('Profile updated successfully!');
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-1">Manage your account information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{user.username}</h2>
            <p className="text-gray-500">{user.role}</p>
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500">Member since</p>
              <p className="font-medium text-gray-900">January 2024</p>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Account Information</h2>
              <button
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                {isEditing ? <FiSave className="w-4 h-4" /> : <FiEdit2 className="w-4 h-4" />}
                {isEditing ? 'Save Changes' : 'Edit Profile'}
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <div className="flex items-center gap-2">
                  <FiUser className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={user.username}
                    disabled={!isEditing}
                    onChange={(e) => setUser({ ...user, username: e.target.value })}
                    className={`flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      !isEditing ? 'bg-gray-50' : ''
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="flex items-center gap-2">
                  <FiMail className="w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={user.email}
                    disabled={!isEditing}
                    onChange={(e) => setUser({ ...user, email: e.target.value })}
                    className={`flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      !isEditing ? 'bg-gray-50' : ''
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <div className="flex items-center gap-2">
                  <FiKey className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={user.company}
                    disabled={!isEditing}
                    onChange={(e) => setUser({ ...user, company: e.target.value })}
                    className={`flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      !isEditing ? 'bg-gray-50' : ''
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Password Change */}
          {isEditing && (
            <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                  Update Password
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}