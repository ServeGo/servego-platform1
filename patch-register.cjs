const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'context', 'AppContext.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// The replacement text for registerUser, logout, and related elements
const cleanRegisterFlow = `  const registerUser = (
    name,
    email,
    phone,
    role,
    password,
    category,
    experience
  ) => {
    const trimmedEmail = email.trim().toLowerCase();
    const emailExists = users.some(u => u.email.toLowerCase() === trimmedEmail);
    if (emailExists) {
      return { success: false, error: 'Email address already registered. Please sign in instead.' };
    }

    const randId = Math.random().toString(36).substring(2, 9);
    
    if (role === 'customer') {
      const newUser = {
        id: \`c_usr_\${randId}\`,
        name,
        email,
        phone,
        role: 'customer',
        joinedDate: new Date().toISOString().split('T')[0],
        avatar: \`https://images.unsplash.com/photo-\${1500000000000 + Math.floor(Math.random() * 1000000)}?w=150\` || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        status: 'active',
        password: password || 'password',
        referralCode: \`SERVEGO-CUST-\${randId.toUpperCase()}\`,
        referralsCount: 0,
        referralDiscountBalance: 0
      };
      setUsers(prev => [...prev, newUser]);
      setCurrentUser(newUser);
      
      addSystemNotification(
        'Registration Successful',
        \`Hello \${name}! Welcome to ServeGo. Your unique referral code is \${newUser.referralCode}. Share it to earn ₹150 off for every friend who books.\`,
        'general',
        newUser.id,
        'customer'
      );
      return { success: true };
    } else {
      // Create provider user and add blank provider profile automatically
      const randProviderId = \`p_u\${randId}\`;
      const newProvider = {
        id: randProviderId,
        name,
        email,
        phone,
        avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150',
        category: category || 'Electrician',
        rating: 5.0,
        reviewCount: 0,
        experienceYears: experience || 3,
        jobsCompleted: 0,
        hourlyRate: 300,
        bio: \`Professional \${category || 'Electrician'} services. Dedicated to pristine execution and high security standards.\`,
        specialties: [\`\${category || 'Electrician'} Installations\`, \`\${category || 'Electrician'} Repairs\`],
        serviceAreas: ['Gachibowli', 'Madhapur', 'Jubilee Hills', 'Kondapur'],
        isVerified: true, // Mark verified directly so they appear in listings
        isFeatured: false,
        avatarColor: 'bg-emerald-100 text-emerald-800',
        reviews: [],
        availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        timeSlots: ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM', '06:00 PM'],
        earnings: 0,
        referralCode: \`SERVEGO-PRO-\${randId.toUpperCase()}\`,
        referralsCount: 0,
        referralsEarningsBonus: 0
      };
      setProviders(prev => [newProvider, ...prev]);

      const newUser = {
        id: \`c_usr_\${randId}\`,
        name,
        email,
        phone,
        role: 'provider',
        joinedDate: new Date().toISOString().split('T')[0],
        avatar: newProvider.avatar,
        status: 'active',
        providerId: randProviderId,
        password: password || 'password',
        referralCode: \`SERVEGO-PRO-\${randId.toUpperCase()}\`,
        referralsCount: 0,
        referralsEarningsBonus: 0
      };
      setUsers(prev => [...prev, newUser]);
      setCurrentUser(newUser);
      
      addSystemNotification(
        'Provider Profiling Activated',
        \`Hi \${name}, your ServeGo partner account has been automatically verified and activated. Your unique referral code is \${newProvider.referralCode}. Share it to earn ₹500 for every friend who signs up.\`,
        'verification',
        newUser.id,
        'provider'
      );
      return { success: true };
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };`;

const searchStartTag = 'const registerUser = (';
const searchEndTag = 'const setCity = (city) => {';

const startIndex = content.indexOf(searchStartTag);
const endIndex = content.indexOf(searchEndTag);

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + cleanRegisterFlow + '\n\n  ' + content.substring(endIndex);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ AppContext.jsx registerUser function successfully patched!');
} else {
  console.error('❌ Could not locate the register section boundaries.');
}
