import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function test() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('No user found');
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'taskmaster_jwt_secret_key_2026',
      { expiresIn: '15m' }
    );

    // Call POST /api/v1/ai/chat
    const res = await fetch('http://localhost:5000/api/v1/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        message: 'Tạo việc nộp báo cáo doanh số cho sếp gấp',
        history: []
      })
    });

    const json = await res.json();
    console.log('Status code:', res.status);
    console.log('Response:', JSON.stringify(json, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
