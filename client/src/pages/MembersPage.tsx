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
    joinDate: new Date().toISOString().split('T')[0],
    planType: 'Monthly'
  });
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [payFor, setPayFor] = useState<Member | null>(null);
  const [receivedByRole, setReceivedByRole] = useState('Admin');
  const [receivedByOther, setReceivedByOther] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isSuccessOpen) {
      setShowConfetti(true);
    }
  }, [isSuccessOpen]);

  function ConfettiOverlay({ onDone }: { onDone: () => void }) {
    useEffect(() => {
      const canvas = document.createElement('canvas');
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '9999';
      document.body.appendChild(canvas);

      const ctx = canvas.getContext('2d');
      if (!ctx) return () => {};

      let width = window.innerWidth;
      let height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;

      const handleResize = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
      };
      window.addEventListener('resize', handleResize);

      const colors = ['#ff6b6b', '#f7b801', '#6bcB77', '#4d96ff', '#845EC2'];
      const gravity = 0.25;
      const drag = 0.005;
      const particles: { x: number; y: number; vx: number; vy: number; size: number; color: string; rotation: number; vr: number; shape: number; life: number; }[] = [];

      const spawn = (count: number) => {
        for (let i = 0; i < count; i++) {
          const x = Math.random() * width;
          const y = -10 - Math.random() * 40; // from top
          const speed = 3 + Math.random() * 3;
          const angle = (Math.PI / 2) * (0.6 + Math.random() * 0.8); // mostly downward
          const vx = Math.cos(angle) * (Math.random() < 0.5 ? -1 : 1) * speed * 0.5;
          const vy = Math.sin(angle) * speed;
          particles.push({
            x,
            y,
            vx,
            vy,
            size: 6 + Math.random() * 6,
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * Math.PI,
            vr: (Math.random() - 0.5) * 0.2,
            shape: Math.floor(Math.random() * 2),
            life: 0,
          });
        }
      };

      let start: number | null = null;
      let raf = 0;

      const animate = (ts: number) => {
        if (start === null) start = ts;
        const elapsed = ts - start;

        ctx.clearRect(0, 0, width, height);

        // spawn more in first 800ms
        if (elapsed < 800) {
          spawn(40);
        }

        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.vy += gravity;
          p.vx *= 1 - drag;
          p.vy *= 1 - drag;
          p.x += p.vx;
          p.y += p.vy;
          p.rotation += p.vr;
          p.life += 16;

          // draw
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          if (p.shape === 0) {
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          } else {
            ctx.beginPath();
            ctx.ellipse(0, 0, p.size * 0.6, p.size * 0.35, 0, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();

          if (p.y - p.size > height + 50) {
            particles.splice(i, 1);
          }
        }

        if (elapsed < 1800 || particles.length > 0) {
          raf = requestAnimationFrame(animate);
        } else {
          cancelAnimationFrame(raf);
          document.body.removeChild(canvas);
          window.removeEventListener('resize', handleResize);
          onDone();
        }
      };

      raf = requestAnimationFrame(animate);

      return () => {
        cancelAnimationFrame(raf);
        if (canvas.parentNode) document.body.removeChild(canvas);
        window.removeEventListener('resize', handleResize);
      };
    }, [onDone]);

    return null;
  }

  async function loadMembers() {
    try {
      const data = await apiGet('/members');
      const mapped: Member[] = (data.members || []).map((m: any) => {
        const fullName = [m.firstName, m.lastName].filter(Boolean).join(' ').trim() || m.name || 'Member';
        const joinDate = m.joinedAt ? new Date(m.joinedAt).toISOString().split('T')[0] : '';
        const lastPayment = m.lastPayment ? new Date(m.lastPayment).toISOString().split('T')[0] : (m.subscription?.startDate ? new Date(m.subscription.startDate).toISOString().split('T')[0] : '');
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
          pendingAmount: m.pendingAmount ?? 0,
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
      const planDurations: Record<string, number> = {
        'Monthly': 30,
        'Quarterly': 90,
        'Half-Yearly': 180,
        'Yearly': 365,
      };
      const selectedPlan = (memberForm as any).planType || 'Monthly';
      const durationDays = planDurations[selectedPlan] ?? 30;
      if (editingMember) {
        await apiPut(`/members/${editingMember.id}`, { firstName, lastName, phone: memberForm.phone });
        await apiPost(`/members/${editingMember.id}/subscription`, {
          planName: selectedPlan,
          price: parseInt(memberForm.monthlyFee),
          durationDays,
          startDate: memberForm.joinDate,
        });
      } else {
        const created = await apiPost('/members', { firstName, lastName, phone: memberForm.phone, joinedAt: memberForm.joinDate });
        const memberId = created.member?._id;
        if (memberId) {
          const startDate = memberForm.joinDate;
          await apiPost(`/members/${memberId}/subscription`, {
            planName: selectedPlan,
            price: parseInt(memberForm.monthlyFee),
            durationDays,
            startDate,
          });
        }
      }
      await loadMembers();
      setEditingMember(null);
      setMemberForm({ name: '', phone: '', monthlyFee: '', joinDate: new Date().toISOString().split('T')[0], planType: 'Monthly' });
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
            setMemberForm({ name: '', phone: '', monthlyFee: '', joinDate: new Date().toISOString().split('T')[0], planType: 'Monthly' });
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
                        onClick={() => {
                          if (member.pendingAmount <= 0) {
                            setIsSuccessOpen(true);
                            return;
                          }
                          setPayFor(member);
                          const defaultAmount = member.pendingAmount > 0 ? member.pendingAmount : member.monthlyFee;
                          setPaymentAmount(String(defaultAmount || ''));
                          setIsPayOpen(true);
                          setReceivedByRole('Admin');
                          setReceivedByOther('');
                        }}
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
                          joinDate: member.joinDate || new Date().toISOString().split('T')[0],
                          planType: 'Monthly'
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Plan Type</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={memberForm.planType}
                onChange={(e) => setMemberForm({ ...memberForm, planType: e.target.value })}
              >
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Half-Yearly">Half-Yearly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subscription Fee (₹)</label>
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

      <Dialog open={isPayOpen} onOpenChange={(open) => { setIsPayOpen(open); if (!open) { setPayFor(null); setPaymentAmount(''); } }}>
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
              <input
                type="number"
                min={0}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-2"
                placeholder="Enter amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Received By</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={receivedByRole}
                onChange={(e) => setReceivedByRole(e.target.value)}
              >
                <option value="Admin">Admin</option>
                <option value="Trainer">Trainer</option>
                <option value="Others">Others</option>
              </select>
            </div>
            {receivedByRole === 'Others' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Specify (optional)</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Name or note"
                  value={receivedByOther}
                  onChange={(e) => setReceivedByOther(e.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <button onClick={() => setIsPayOpen(false)} className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300">Cancel</button>
            <button
              onClick={async () => {
                if (!payFor) return;
                const parsed = parseInt(paymentAmount || '0', 10);
                const maxAmount = payFor.pendingAmount > 0 ? payFor.pendingAmount : payFor.monthlyFee;
                const amount = isNaN(parsed) ? 0 : Math.min(Math.max(parsed, 0), maxAmount);
                if (amount <= 0) { alert('Please enter a valid amount'); return; }
                try {
                  const resp = await apiPost('/payments', { memberId: payFor.id, amount, method: 'cash', status: 'success', receivedByRole, notes: receivedByRole === 'Others' ? receivedByOther : '' });
                  setIsPayOpen(false);
                  setPayFor(null);
                  setPaymentAmount('');
                  setReceivedByRole('Admin');
                  setReceivedByOther('');
                  await loadMembers();
                  if (resp.fullyPaid || maxAmount - amount === 0) {
                    setIsSuccessOpen(true);
                  }
                } catch { alert('Failed to process payment'); }
              }}
              className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
            >
              Confirm Payment
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-600" /> Payment Successful</DialogTitle>
            <DialogDescription>
              Payment has been completed successfully.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button onClick={() => setIsSuccessOpen(false)} className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700">OK</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showConfetti && (
        <ConfettiOverlay onDone={() => setShowConfetti(false)} />
      )}
    </div>
  );
}


