import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'pro@taskmaster.dev';
  const plainPassword = 'password123';
  const hashed = await bcrypt.hash(plainPassword, 12);

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { password: hashed, isLocked: false }
    });
    console.log('✅ Updated existing demo account password + unlocked:', email);
  } else {
    await prisma.user.create({
      data: {
        name: 'Nguyen Van Pro',
        email,
        password: hashed,
        role: 'user'
      }
    });
    console.log('✅ Created new demo account:', email);
  }
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
