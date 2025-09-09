import React, { useEffect, useMemo, useState } from 'react';
import { apiGet } from '../lib/api';
import { Download, Search } from 'lucide-react';

type Payment = {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  date: string;
  notes?: string;
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [memberQuery, setMemberQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  async function fetchPayments() {
    setLoading(true);
    try {
      const data = await apiGet('/payments');
      const mapped: Payment[] = (data.payments || []).map((p: any) => ({
        id: p._id,
        memberId: p.member?._id || '',
        memberName: p.member ? [p.member.firstName, p.member.lastName].filter(Boolean).join(' ').trim() || p.member.name || 'Member' : 'Member',
        amount: p.amount,
        date: p.date ? new Date(p.date).toISOString().split('T')[0] : '',
        notes: p.notes || '',
      }));
      setPayments(mapped);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPayments();
  }, []);

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const matchesMember = memberQuery
        ? p.memberName.toLowerCase().includes(memberQuery.toLowerCase())
        : true;
      const withinStart = startDate ? new Date(p.date) >= new Date(startDate) : true;
      const withinEnd = endDate ? new Date(p.date) <= new Date(endDate) : true;
      return matchesMember && withinStart && withinEnd;
    });
  }, [payments, memberQuery, startDate, endDate]);

  function downloadCSV() {
    const headers = ['Member Name', 'Amount', 'Date', 'Notes'];
    const rows = filtered.map(p => [
      escapeCsv(p.memberName),
      String(p.amount),
      p.date,
      escapeCsv(p.notes || ''),
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `payments_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function escapeCsv(value: string) {
    if (value == null) return '';
    const needsQuotes = /[",\n]/.test(value);
    const escaped = value.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Payments</h2>
          <p className="text-gray-600">View received payments and filter by member or date</p>
        </div>
        <button
          onClick={downloadCSV}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Download CSV</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              value={memberQuery}
              onChange={(e) => setMemberQuery(e.target.value)}
              placeholder="Filter by member name"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-6 text-center text-gray-500">Loading...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-6 text-center text-gray-500">No payments found</td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.memberName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">₹{p.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.notes}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


