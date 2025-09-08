import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Edit, MessageSquare, CheckCircle, Trash2 } from 'lucide-react';
import { apiDelete, apiGet, apiPost, apiPut } from '../lib/api';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';

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

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [memberForm, setMemberForm] = useState({
    name: '',
    phone: '',
    monthlyFee: '',
    joinDate: new Date().toISOString().split('T')[0]
  });
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [payFor, setPayFor] = useState<Member | null>(null);
  const [receivedBy, setReceivedBy] = useState('');

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
  }, []);

  async function handleSaveMember() {
    if (!(memberForm.name && memberForm.phone && memberForm.monthlyFee)) return;
    try {
      const [firstName, ...rest] = memberForm.name.trim().split(' ');
      const lastName = rest.join(' ');
      if (editingMember) {
        await apiPut(`/members/${editingMember.id}`, { firstName, lastName, phone: memberForm.phone });
        await apiPost(`/members/${editingMember.id}/subscription`, {
          planName: 'Monthly',
          price: parseInt(memberForm.monthlyFee),
          durationDays: 30,
          startDate: memberForm.joinDate,
        });
      } else {
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
      }
      await loadMembers();
      setEditingMember(null);
      setMemberForm({ name: '', phone: '', monthlyFee: '', joinDate: new Date().toISOString().split('T')[0] });
      setIsModalOpen(false);
    } catch (e) {
      alert('Failed to save member');
    }
  }

  async function handleDeleteMember(id: string) {
    try {
      await apiDelete(`/members/${id}`);
      await loadMembers();
      setIsDeleteOpen(false);
      setMemberToDelete(null);
    } catch (e) {
      alert('Failed to delete');
    }
  }

  const filteredMembers = useMemo(() => {
    return members.filter(member =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone.includes(searchTerm)
    );
  }, [members, searchTerm]);

  return (
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
            setIsModalOpen(true);
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
                    {true && (
                      <button
                        onClick={() => { setPayFor(member); setIsPayOpen(true); setReceivedBy(''); }}
                        className="text-purple-600 hover:text-purple-900"
                        title="Mark Payment Received"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditingMember(member);
                        setMemberForm({
                          name: member.name,
                          phone: member.phone,
                          monthlyFee: String(member.monthlyFee || ''),
                          joinDate: member.joinDate || new Date().toISOString().split('T')[0]
                        });
                        setIsModalOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit Member"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => alert(`SMS sent to ${member.name} (${member.phone})`)}
                      className="text-green-600 hover:text-green-900"
                      title="Send SMS"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setMemberToDelete(member); setIsDeleteOpen(true); }}
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
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMember ? 'Edit Member' : 'Add New Member'}</DialogTitle>
            <DialogDescription>Register member details and subscription information</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter member's full name"
                value={memberForm.name}
                onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+91-XXXXXXXXXX"
                value={memberForm.phone}
                onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Fee (₹)</label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter monthly subscription fee"
                value={memberForm.monthlyFee}
                onChange={(e) => setMemberForm({ ...memberForm, monthlyFee: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Join Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="w-full text-left border border-gray-300 rounded-lg px-4 py-3 hover:bg-gray-50">
                    {memberForm.joinDate ? format(new Date(memberForm.joinDate), 'yyyy-MM-dd') : 'Pick a date'}
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="p-0">
                  <Calendar
                    mode="single"
                    selected={memberForm.joinDate ? new Date(memberForm.joinDate) : undefined}
                    onSelect={(d) => d && setMemberForm({ ...memberForm, joinDate: d.toISOString().split('T')[0] })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300">Cancel</button>
            <button onClick={handleSaveMember} className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">{editingMember ? 'Update Member' : 'Add Member'}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete member?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently remove
              {memberToDelete ? ` ${memberToDelete.name}` : ' this member'} and their subscriptions.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button onClick={() => setIsDeleteOpen(false)} className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300">Cancel</button>
            <button onClick={() => memberToDelete && handleDeleteMember(memberToDelete.id)} className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700">Delete</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPayOpen} onOpenChange={setIsPayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
            <DialogDescription>
              {payFor ? `Member: ${payFor.name} (${payFor.phone})` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm text-gray-700">Amount</div>
              <div className="text-xl font-semibold">₹{payFor ? (payFor.pendingAmount > 0 ? payFor.pendingAmount : payFor.monthlyFee) : 0}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Received By</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Admin name or note"
                value={receivedBy}
                onChange={(e) => setReceivedBy(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setIsPayOpen(false)} className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300">Cancel</button>
            <button
              onClick={async () => {
                if (!payFor) return;
                const amount = payFor.pendingAmount > 0 ? payFor.pendingAmount : payFor.monthlyFee;
                try {
                  await apiPost('/payments', { memberId: payFor.id, amount, method: 'cash', status: 'success', notes: receivedBy });
                  await apiPost(`/members/${payFor.id}/subscription`, { planName: 'Monthly', price: amount, durationDays: 30, startDate: new Date().toISOString() });
                  setIsPayOpen(false);
                  setPayFor(null);
                  await loadMembers();
                } catch { alert('Failed to process payment'); }
              }}
              className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
            >
              Confirm Payment
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


