import bcrypt from 'bcryptjs';
import prisma from './client.js';

async function main() {
  await prisma.payment.deleteMany();
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.service.deleteMany();
  await prisma.provider.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.authEvent.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany();

  const adminPassword = await bcrypt.hash('servego@123', 10);

  await prisma.user.create({
    data: {
      name: 'ServeGo Admin',
      email: 'servego@gmail.com',
      phone: '18004198899',
      role: 'admin',
      password: adminPassword,
      status: 'ACTIVE',
      avatar: 'https://ui-avatars.com/api/?name=ServeGo+Admin&background=0F172A&color=fff&size=150',
      referralCode: 'SERVEGO-ADMIN-001',
      referralsCount: 0,
      referralDiscountBalance: 0
    }
  });

  console.log('✅ Database reset and default admin created successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
