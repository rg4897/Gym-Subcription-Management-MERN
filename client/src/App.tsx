

import React, { useEffect, useState } from 'react';
import { User, IndianRupee, MessageSquare, Shield, Plus, Edit, Trash2, Search, CheckCircle, AlertTriangle } from 'lucide-react';
import { apiGet, apiPost, apiPut, apiDelete } from './lib/api';

// Define types for Member, Notification, and PaymentRecord
type Member = {
  id: string;
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

type PaymentRecord = {
  id: number;
  memberId: string;
  memberName: string;
  amount: number;
  receivedBy: string;
  receivedDate: string;
  timestamp: Date;
};

const GymSubscriptionApp = () => {
  const [currentView, setCurrentView] = useState('login');
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [showTwoFA, setShowTwoFA] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedMemberForPayment, setSelectedMemberForPayment] = useState<Member | null>(null);
  const [selectedAdmin, setSelectedAdmin] = useState('');
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [adminList, setAdminList] = useState<string[]>(['Leo', 'Caroline', 'Mark', 'Alex', 'Diana']);
  const [members, setMembers] = useState<Member[]>([]);
  
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
    }).length,
    thisMonthRevenue: paymentRecords
      .filter(record => {
        const today = new Date();
        const recordDate = new Date(record.receivedDate);
        return recordDate.getMonth() === today.getMonth() && recordDate.getFullYear() === today.getFullYear();
      })
      .reduce((sum, record) => sum + record.amount, 0)
  };

  const handleLogin = async () => {
    if (!(loginForm.username && loginForm.password)) return;
    try {
      const res = await apiPost('/auth/login', { email: loginForm.username, password: loginForm.password });
      localStorage.setItem('token', res.token);
      setIsAuthenticated(true);
      setCurrentView('dashboard');
      setShowTwoFA(false);
      await loadMembers();
    } catch (e) {
      alert('Login failed');
    }
  };

  const handleTwoFA = () => { setShowTwoFA(false); };

  const handleRegister = async () => {
    if (registerForm.password !== registerForm.confirmPassword) { alert('Passwords do not match!'); return; }
    try {
      await apiPost('/auth/register', { name: registerForm.username, email: registerForm.email, password: registerForm.password });
      alert('Registration successful! Please login.');
      setCurrentView('login');
    } catch (e) {
      alert('Registration failed');
    }
  };

  async function loadMembers() {
    try {
      const data = await apiGet('/members');
      const mapped: Member[] = (data.members || []).map((m: any) => {
        const fullName = [m.firstName, m.lastName].filter(Boolean).join(' ').trim() || m.name || 'Member';
        const joinDate = m.joinedAt ? new Date(m.joinedAt).toISOString().split('T')[0] : '';
        const lastPayment = m.subscription?.startDate ? new Date(m.subscription.startDate).toISOString().split('T')[0] : '';
        const expiryDate = m.subscription?.endDate ? new Date(m.subscription.endDate).toISOString().split('T')[0] : '';
        const monthlyFee = m.subscription?.price || 0;
        const status = expiryDate ? (new Date(expiryDate) < new Date() ? 'expired' : 'active') : 'active';
        return {
          id: m._id,
          name: fullName,
          phone: m.phone || '',
          joinDate,
          lastPayment,
          expiryDate,
          monthlyFee,
          status,
          pendingAmount: 0,
        } as Member;
      });
      setMembers(mapped);
    } catch (e) {
      // ignore for unauthenticated
    }
  }

  useEffect(() => {
    if (isAuthenticated) { loadMembers(); }
  }, [isAuthenticated]);

  const handleAddMember = async () => {
    if (!(memberForm.name && memberForm.phone && memberForm.monthlyFee)) return;
    try {
      const [firstName, ...rest] = memberForm.name.trim().split(' ');
      const lastName = rest.join(' ');
      const created = await apiPost('/members', { firstName, lastName, phone: memberForm.phone, joinedAt: memberForm.joinDate });
      const memberId = created.member?._id;
      if (memberId) {
        const startDate = memberForm.joinDate;
        await apiPost(`/members/${memberId}/subscription`, {
          planName: 'Monthly',
          price: parseInt(memberForm.monthlyFee),
          durationDays: 30,
          startDate,
        });
      }
      await loadMembers();
      setEditingMember(null);
      setMemberForm({ name: '', phone: '', monthlyFee: '', joinDate: new Date().toISOString().split('T')[0] });
      setCurrentView('members');
    } catch (e) {
      alert('Failed to save member');
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

  const handleDeleteMember = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this member?')) return;
    try {
      await apiDelete(`/members/${id}`);
      await loadMembers();
    } catch (e) {
      alert('Failed to delete');
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

  const markPaymentReceived = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (member) {
      setSelectedMemberForPayment(member);
      setShowPaymentModal(true);
      setSelectedAdmin('');
    }
  };

  const processPayment = async () => {
    if (!selectedMemberForPayment || !selectedAdmin) { alert('Please select an admin to process the payment'); return; }
    try {
      const today = new Date();
      const amount = selectedMemberForPayment.pendingAmount > 0 ? selectedMemberForPayment.pendingAmount : selectedMemberForPayment.monthlyFee;
      await apiPost('/payments', { memberId: selectedMemberForPayment.id, amount, method: 'cash', status: 'success', notes: `Received by ${selectedAdmin}` });
      await apiPost(`/members/${selectedMemberForPayment.id}/subscription`, { planName: 'Monthly', price: amount, durationDays: 30, startDate: today.toISOString() });
      setShowPaymentModal(false);
      setSelectedMemberForPayment(null);
      setSelectedAdmin('');
      await loadMembers();
      alert(`Payment of ₹${amount} received from ${selectedMemberForPayment.name} by ${selectedAdmin}`);
    } catch (e) {
      alert('Failed to process payment');
    }
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
                localStorage.removeItem('token');
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
                  <IndianRupee className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Amount</p>
                  <p className="text-2xl font-bold text-gray-900">₹{stats.totalPending}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
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
                <h3 className="text-lg font-semibold text-gray-800">This Month Revenue</h3>
              </div>
              <div className="p-6">
                <div className="text-3xl font-bold text-blue-600 mb-2">₹{stats.thisMonthRevenue}</div>
                <p className="text-gray-600">total collected this month</p>
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

          {/* Recent Payment Records */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-800">Recent Payment Records</h3>
            </div>
            <div className="p-6">
              {paymentRecords.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No payment records yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Received By</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paymentRecords.slice(0, 10).map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.memberName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">₹{record.amount}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.receivedBy}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.receivedDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
                className="w-full bg-blue-600 text-white rounded-lg px-4 py-3 hover:bg-blue-700 transition duration-200 font-medium"
              >
                {editingMember ? 'Update Member' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showPaymentModal && selectedMemberForPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Process Payment</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Member: <span className="font-medium text-gray-800">{selectedMemberForPayment.name}</span></p>
                <p className="text-sm text-gray-600">Phone: <span className="font-medium text-gray-800">{selectedMemberForPayment.phone}</span></p>
                <p className="text-sm text-gray-600">Amount: <span className="font-medium text-green-600">₹{selectedMemberForPayment.pendingAmount > 0 ? selectedMemberForPayment.pendingAmount : selectedMemberForPayment.monthlyFee}</span></p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Admin Receiving Payment
              </label>
              <select
                value={selectedAdmin}
                onChange={(e) => setSelectedAdmin(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose an admin...</option>
                {adminList.map((admin: string) => (
                  <option key={admin} value={admin}>{admin}</option>
                ))}
              </select>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={processPayment}
                disabled={!selectedAdmin}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition duration-200 ${
                  selectedAdmin
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Confirm Payment
              </button>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedMemberForPayment(null);
                  setSelectedAdmin('');
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition duration-200 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default GymSubscriptionApp;