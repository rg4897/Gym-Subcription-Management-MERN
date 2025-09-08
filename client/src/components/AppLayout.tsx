import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';

export default function AppLayout() {
  const navigate = useNavigate();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  function performLogout() {
    localStorage.removeItem('token');
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link to="/dashboard" className="text-xl font-bold text-gray-800">Gym Management💪</Link>
              <div className="flex space-x-6">
                <NavLink
                  to="/dashboard"
                  end
                  className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to="/members"
                  className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Members
                </NavLink>
              </div>
            </div>
            <button onClick={() => setIsLogoutOpen(true)} className="text-gray-600 hover:text-gray-900 font-medium">Logout</button>
          </div>
        </div>
      </nav>
      <Outlet />
      <Dialog open={isLogoutOpen} onOpenChange={setIsLogoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log out?</DialogTitle>
            <DialogDescription>
              You will need to sign in again to access the dashboard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button onClick={() => setIsLogoutOpen(false)} className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300">Cancel</button>
            <button onClick={performLogout} className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700">Logout</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


