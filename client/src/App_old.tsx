import React, { useState } from 'react';
import { User, IndianRupee , MessageSquare, Shield, Plus, Edit, Trash2, Search, Bell, CheckCircle, AlertTriangle } from 'lucide-react';

// Define types for Member and Notification
type Member = {
  id: number;
  name: string;
  phone: string;
  joinDate: string;
  lastPayment: string;
  expiryDate: string;
  monthlyFee: number;
  status: string;
  pendingAmount: number;
};

type Notification = {
  id: number;
  type: string;
  member: string;
  message: string;
  timestamp: Date;
};

const GymSubscriptionApp = () => {
  const [currentView, setCurrentView] = useState('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showTwoFA, setShowTwoFA] = useState(false);
  const [members, setMembers] = useState<Member[]>([
    {
      id: 1,
      name: 'John Doe',
      phone: '+91-9876543210',
      joinDate: '2024-01-15',
      lastPayment: '2024-06-15',
      expiryDate: '2024-07-15',
      monthlyFee: 2000,
      status: 'expired',
      pendingAmount: 2000
    },
    {
      id: 2,
      name: 'Jane Smith',
      phone: '+91-9876543211',
      joinDate: '2024-02-01',
      lastPayment: '2024-07-01',
      expiryDate: '2024-08-01',
      monthlyFee: 2500,
      status: 'active',
      pendingAmount: 0
    },
    {
      id: 3,
      name: 'Mike Johnson',
      phone: '+91-9876543212',
      joinDate: '2024-03-10',
      lastPayment: '2024-06-10',
      expiryDate: '2024-07-10',
      monthlyFee: 1800,
      status: 'expired',
      pendingAmount: 1800
    },
    {
      id: 4,
      name: 'Sarah Wilson',
      phone: '+91-9876543213',
      joinDate: '2024-04-05',
      lastPayment: '2024-07-20',
      expiryDate: '2024-08-20',
      monthlyFee: 2200,
      status: 'expiring_soon',
      pendingAmount: 0
    }
  ]);
  
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [twoFACode, setTwoFACode] = useState('');
  const [memberForm, setMemberForm] = useState({
    name: '',
    phone: '',
    monthlyFee: '',
    joinDate: new Date().toISOString().split('T')[0]
  });
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  // @ts-ignore
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const stats = {
    totalMembers: members.length,
    activeMembers: members.filter(m => m.status === 'active').length,
    expiredMembers: members.filter(m => m.status === 'expired').length,
    expiringMembers: members.filter(m => m.status === 'expiring_soon').length,
    totalPending: members.reduce((sum, m) => sum + m.pendingAmount, 0),
    thisMonthPaid: members.filter(m => {
      const today = new Date();
      const lastPayment = new Date(m.lastPayment);
      return lastPayment.getMonth() === today.getMonth() && lastPayment.getFullYear() === today.getFullYear();
    }).length
  };

  const handleLogin = () => {
    if (loginForm.username && loginForm.password) {
      setShowTwoFA(true);
    }
  };

  const handleTwoFA = () => {
    if (twoFACode === '123456') {
      setIsAuthenticated(true);
      setCurrentView('dashboard');
      setShowTwoFA(false);
    } else {
      alert('Invalid 2FA code. Try: 123456');
    }
  };

  const handleRegister = () => {
    if (registerForm.password === registerForm.confirmPassword) {
      alert('Registration successful! Please login.');
      setCurrentView('login');
    } else {
      alert('Passwords do not match!');
    }
  };

  const handleAddMember = () => {
    if (memberForm.name && memberForm.phone && memberForm.monthlyFee) {
      const phoneExists = members.some(m => m.phone === memberForm.phone && m.id !== editingMember?.id);
      if (phoneExists) {
        alert('A member with this phone number already exists!');
        return;
      }

      const expiryDate = new Date(memberForm.joinDate);
      expiryDate.setMonth(expiryDate.getMonth() + 1);

      const newMember: Member = {
        id: editingMember ? editingMember.id : Date.now(),
        name: memberForm.name,
        phone: memberForm.phone,
        joinDate: memberForm.joinDate,
        lastPayment: memberForm.joinDate,
        expiryDate: expiryDate.toISOString().split('T')[0],
        monthlyFee: parseInt(memberForm.monthlyFee),
        status: 'active',
        pendingAmount: 0
      };

      if (editingMember) {
        setMembers(members.map(m => m.id === editingMember.id ? newMember : m));
        setEditingMember(null);
      } else {
        setMembers([...members, newMember]);
      }

      setMemberForm({ name: '', phone: '', monthlyFee: '', joinDate: new Date().toISOString().split('T')[0] });
      setCurrentView('members');
    }
  };

  const handleEditMember = (member: Member) => {
    setEditingMember(member);
    setMemberForm({
      name: member.name,
      phone: member.phone,
      monthlyFee: member.monthlyFee.toString(),
      joinDate: member.joinDate
    });
    setCurrentView('add-member');
  };

  const handleDeleteMember = (id: number) => {
    if (window.confirm('Are you sure you want to delete this member?')) {
      setMembers(members.filter(m => m.id !== id));
    }
  };

  const sendSMSReminder = (member: Member) => {
    const message = member.pendingAmount > 0 
      ? `Payment reminder: You have a pending amount of ₹${member.pendingAmount}. Please clear your dues.`
      : `Reminder: Your gym membership expires on ${member.expiryDate}. Please renew to continue.`;
    
    setNotifications(prev => [...prev, {
      id: Date.now(),
      type: 'manual_sms',
      member: member.name,
      message: `SMS sent to ${member.phone}: ${message}`,
      timestamp: new Date()
    }]);
    
    alert(`SMS sent to ${member.name} (${member.phone})`);
  };

  const markPaymentReceived = (memberId: number) => {
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    setMembers(members.map(m => {
      if (m.id === memberId) {
        return {
          ...m,
          lastPayment: today.toISOString().split('T')[0],
          expiryDate: nextMonth.toISOString().split('T')[0],
          pendingAmount: 0,
          status: 'active'
        };
      }
      return m;
    }));
  };

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.phone.includes(searchTerm)
  );

  if (!isAuthenticated) {
    if (currentView === 'register') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-green-900 to-blue-900 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
            <div className="text-center mb-8">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Create Admin Account</h1>
              <p className="text-gray-600 mt-2">Register as gym owner/trainer</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Choose username"
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm({...registerForm, username: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Create password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Confirm password"
                  value={registerForm.confirmPassword}
                  onChange={(e) => setRegisterForm({...registerForm, confirmPassword: e.target.value})}
                />
              </div>
              <button
                onClick={handleRegister}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition duration-200 font-medium"
              >
                Register
              </button>
              <p className="text-center text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => setCurrentView('login')}
                  className="text-green-600 hover:underline font-medium"
                >
                  Login here
                </button>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Gym Admin Login</h1>
            <p className="text-gray-600 mt-2">Secure access to gym management</p>
          </div>

          {!showTwoFA ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter username"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                />
              </div>
              <button
                onClick={handleLogin}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
              >
                Login
              </button>
              <p className="text-center text-gray-600">
                Don't have an account?{' '}
                <button
                  onClick={() => setCurrentView('register')}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Register here
                </button>
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Two-Factor Authentication</h3>
                <p className="text-gray-600 text-sm mb-4">Enter the 6-digit code (Demo: 123456)</p>
              </div>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-center text-2xl tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="000000"
                maxLength={6}
                value={twoFACode}
                onChange={(e) => setTwoFACode(e.target.value)}
              />
              <button
                onClick={handleTwoFA}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition duration-200 font-medium"
              >
                Verify & Login
              </button>
              <button
                onClick={() => setShowTwoFA(false)}
                className="w-full bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition duration-200"
              >
                Back
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-gray-800">Manish Ka Gym💪</h1>
              <div className="flex space-x-6">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === 'dashboard' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setCurrentView('members')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === 'members' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Members
                </button>
              </div>
            </div>
            <button
              onClick={() => {
                setIsAuthenticated(false);
                setCurrentView('login');
              }}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {currentView === 'dashboard' && (
        <div className="max-w-7xl mx-auto p-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Dashboard Overview</h2>
            <p className="text-gray-600">Gym membership and payment summary</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Members</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalMembers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Members</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeMembers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-yellow-100 p-3 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.expiringMembers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-red-100 p-3 rounded-full">
                  <IndianRupee  className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Amount</p>
                  <p className="text-2xl font-bold text-gray-900">₹{stats.totalPending}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-800">This Month Payments</h3>
              </div>
              <div className="p-6">
                <div className="text-3xl font-bold text-green-600 mb-2">{stats.thisMonthPaid}</div>
                <p className="text-gray-600">members paid this month</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-800">Expired Memberships</h3>
              </div>
              <div className="p-6">
                <div className="text-3xl font-bold text-red-600 mb-2">{stats.expiredMembers}</div>
                <p className="text-gray-600">memberships have expired</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentView === 'members' && (
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Gym Members</h2>
              <p className="text-gray-600">Manage member subscriptions and payments</p>
            </div>
            <button
              onClick={() => {
                setEditingMember(null);
                setMemberForm({ name: '', phone: '', monthlyFee: '', joinDate: new Date().toISOString().split('T')[0] });
                setCurrentView('add-member');
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Member</span>
            </button>
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search members by name or phone..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Fee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-500">Joined: {member.joinDate}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          member.status === 'active' ? 'bg-green-100 text-green-800' :
                          member.status === 'expiring_soon' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {member.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.expiryDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{member.monthlyFee}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${member.pendingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ₹{member.pendingAmount}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEditMember(member)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit Member"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => sendSMSReminder(member)}
                          className="text-green-600 hover:text-green-900"
                          title="Send SMS"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        {member.pendingAmount > 0 && (
                          <button
                            onClick={() => markPaymentReceived(member.id)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Mark Payment Received"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteMember(member.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {currentView === 'add-member' && (
        <div className="max-w-2xl mx-auto p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {editingMember ? 'Edit Member' : 'Add New Member'}
            </h2>
            <p className="text-gray-600">Register member details and subscription information</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter member's full name"
                  value={memberForm.name}
                  onChange={(e) => setMemberForm({...memberForm, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+91-XXXXXXXXXX"
                  value={memberForm.phone}
                  onChange={(e) => setMemberForm({...memberForm, phone: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Fee (₹)</label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter monthly subscription fee"
                  value={memberForm.monthlyFee}
                  onChange={(e) => setMemberForm({...memberForm, monthlyFee: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Join Date</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={memberForm.joinDate}
                  onChange={(e) => setMemberForm({...memberForm, joinDate: e.target.value})}
                />
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleAddMember}
                className="w-full bg-blue-600 text-white rounded-lg px-4 py-3 hover:bg-blue-700"
              >
                {editingMember ? 'Update Member' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GymSubscriptionApp;
