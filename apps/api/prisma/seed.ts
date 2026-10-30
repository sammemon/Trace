import { PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await argon2.hash('TraceAdmin!2026', { type: argon2.argon2id });
  await prisma.user.upsert({
    where: { email: 'admin@admin.muet.edu.pk' },
    update: {},
    create: {
      email: 'admin@admin.muet.edu.pk',
      passwordHash,
      fullName: 'TRACE Administrator',
      department: 'Administration',
      batchYear: 2020,
      role: Role.ADMIN,
      emailVerifiedAt: new Date()
    }
  });

  const categories = [
    ['ID Card', 'id-card', 'card', true], ['Wallet', 'wallet', 'wallet', false],
    ['Keys', 'keys', 'key', false], ['Phone', 'phone', 'smartphone', false],
    ['Laptop / Tablet', 'laptop-tablet', 'laptop', false], ['Books / Notes', 'books-notes', 'book-open', false],
    ['Bag', 'bag', 'backpack', false], ['Earphones', 'earphones', 'headphones', false],
    ['Water Bottle', 'water-bottle', 'bottle', false], ['Documents', 'documents', 'file-text', true]
  ];
  for (const [name, slug, icon, isSensitive] of categories) {
    await prisma.category.upsert({
      where: { slug: slug as string },
      update: {},
      create: { name: name as string, slug: slug as string, icon: icon as string, isSensitive: isSensitive as boolean }
    });
  }

  for (const location of [
    { name: 'Main Library Desk', type: 'LIBRARY', lat: 24.8607, lng: 67.0011, isSafeHandoverPoint: true },
    { name: 'Campus Security Office', type: 'SECURITY', lat: 24.8612, lng: 67.0018, isSafeHandoverPoint: true },
    { name: 'Student Cafeteria Entrance', type: 'CAFETERIA', lat: 24.8599, lng: 67.0006, isSafeHandoverPoint: true }
  ]) {
    await prisma.campusLocation.upsert({ where: { name_type: { name: location.name, type: location.type } }, update: location, create: location });
  }
}

main().finally(() => prisma.$disconnect());
