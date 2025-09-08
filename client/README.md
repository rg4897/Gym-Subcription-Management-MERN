# Gym Subscription Management System 💪

A comprehensive React-based web application for managing gym memberships, payments, and member communications. Built with TypeScript and Tailwind CSS for a modern, responsive experience.

## 🌟 Features

### Authentication & Security
- **Secure Login System** with username/password authentication
- **Two-Factor Authentication (2FA)** for enhanced security
- **User Registration** for gym administrators
- **Session Management** with secure logout

### Member Management
- **Complete Member Profiles** with contact information and join dates
- **Membership Status Tracking** (Active, Expired, Expiring Soon)
- **Search & Filter** members by name or phone number
- **Edit/Delete Members** with confirmation dialogs
- **Duplicate Phone Prevention** to avoid registration conflicts

### Payment Processing
- **Payment Modal System** with admin selection dropdown
- **Real-time Payment Tracking** with detailed records
- **Payment History** showing member, amount, admin, and date
- **Pending Amount Calculations** with automatic status updates
- **Monthly Revenue Analytics** with visual dashboard cards

### Communication Tools
- **SMS Reminder System** for payment notifications
- **Automated Notifications** for membership renewals
- **Member Communication History** tracking

### Dashboard Analytics
- **Real-time Statistics** for total, active, and expired members
- **Revenue Tracking** with monthly summaries
- **Payment Records Table** showing recent transactions
- **Visual Status Indicators** with color-coded member statuses

## 🛠 Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Hooks (useState)
- **Date Handling**: Native JavaScript Date API

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/gym-subscription-management.git
   cd gym-subscription-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn start
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

## 🔐 Demo Credentials

### Login(For Staging project only)
- **Username**: Any username
- **Password**: Any password
- **2FA Code**: `123456`

## 📱 Usage Guide

### Getting Started
1. **Register** a new admin account or **login** with existing credentials
2. Complete **2FA verification**
3. Access the **Dashboard** to view gym statistics

### Managing Members
1. Navigate to the **Members** section
2. Click **"Add Member"** to register new gym members
3. Fill in member details: name, phone, monthly fee, join date
4. Use the **search bar** to find specific members
5. Use **action buttons** to edit, delete, or communicate with members

### Processing Payments
1. Find members with **pending amounts** (red text in Pending column)
2. Click the **checkmark icon** next to the member
3. Select the **admin receiving payment** from the dropdown
4. Click **"Confirm Payment"** to process
5. View payment records on the **Dashboard**

### Sending Reminders
1. Click the **message icon** next to any member
2. Automated SMS reminders are sent for:
   - Payment due notifications
   - Membership renewal reminders

<!-- ## 🏗 Project Structure

```
src/
├── components/
│   └── GymSubscriptionApp.tsx    # Main application component
├── types/
│   ├── Member.ts                 # Member data structure
│   ├── PaymentRecord.ts          # Payment tracking structure
│   └── Notification.ts           # Notification system structure
├── utils/
│   ├── dateHelpers.ts           # Date manipulation utilities
│   └── statusCalculator.ts      # Member status logic
└── styles/
    └── globals.css              # Global styling
``` -->

## 🎯 Key Components

### Member Management
```typescript
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
```

### Payment Processing
```typescript
type PaymentRecord = {
  id: number;
  memberId: number;
  memberName: string;
  amount: number;
  receivedBy: string;
  receivedDate: string;
  timestamp: Date;
};
```

## 📊 Dashboard Metrics

The dashboard provides real-time insights including:

- **Total Members**: Complete member count
- **Active Members**: Currently enrolled members
- **Expiring Soon**: Members needing renewal
- **Pending Amount**: Total outstanding payments
- **Monthly Revenue**: Current month's collections
- **Payment History**: Recent transaction records

## 🔧 Customization

### Modifying Member Status Logic
Update the status calculation in the member management functions to customize when memberships are considered expired or expiring soon.

### Styling Customization
The application uses Tailwind CSS classes. Modify the className properties to change colors, spacing, and layout according to your gym's branding.

## 🤝 Contributing

1. **Fork** the repository
2. Create a **feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. Open a **Pull Request**

## 📋 Roadmap

- [X] **Database Integration** (PostgreSQL/MongoDB)
- [X] **Real SMS Integration** (Twilio/SMS Gateway)
- [X] **Email Notifications** for membership renewals
- [X] **Advanced Analytics** with charts and reports

## 🐛 Known Issues

- Payment records are stored in browser memory (will reset on refresh)
- SMS functionality is simulated (not connected to real SMS service)
- No data persistence (suitable for demo purposes)

<!-- ## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details. -->

## 🙏 Acknowledgments

- **Lucide React** for beautiful icons
- **Tailwind CSS** for rapid styling
- **React Team** for the amazing framework
- **TypeScript Team** for type safety

## 📞 Support

For support and questions:
- Create an **Issue** on GitHub
- Email: support@gymmanagement.com
<!-- - Documentation: [Wiki](https://github.com/yourusername/gym-subscription-management/wiki) -->

---

**Made with ❤️ for gym owners and fitness enthusiasts**

*Transform your gym management experience with modern technology!*