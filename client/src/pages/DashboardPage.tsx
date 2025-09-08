import React, { useEffect, useMemo, useState } from 'react';
import { User, CheckCircle, AlertTriangle, IndianRupee } from 'lucide-react';
import { apiGet } from '../lib/api';

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

type PaymentRecord = {
  id: number;
  memberId: string;
  memberName: string;
  amount: number;
  receivedBy: string;
  receivedDate: string;
  timestamp: Date;
};

export default function DashboardPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);

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
      // ignore
    }
  }

  useEffect(() => {
    loadMembers();
    (async () => {
      try {
        const data = await apiGet('/payments');
        const mapped = (data.payments || []).map((p: any) => ({
          id: p._id,
          memberId: p.member?._id || '',
          memberName: p.member ? [p.member.firstName, p.member.lastName].filter(Boolean).join(' ').trim() || p.member.name || 'Member' : 'Member',
          amount: p.amount,
          receivedBy: p.notes || '',
          receivedDate: p.date ? new Date(p.date).toISOString().split('T')[0] : '',
          timestamp: new Date(p.createdAt || p.date || Date.now()),
        })) as PaymentRecord[];
        setPaymentRecords(mapped);
      } catch {}
    })();
  }, []);

  const stats = useMemo(() => {
    return {
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
  }, [members, paymentRecords]);

  return (
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
    </div>
  );
}


