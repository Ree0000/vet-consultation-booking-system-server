import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create veterinarians
  const vets = await Promise.all([
    prisma.veterinarian.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'Sarah Johnson',
        specialization: 'Small Animals',
        available: true
      }
    }),
    prisma.veterinarian.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: 'Michael Chen',
        specialization: 'Surgery',
        available: true
      }
    }),
    prisma.veterinarian.upsert({
      where: { id: 3 },
      update: {},
      create: {
        name: 'Emily Rodriguez',
        specialization: 'Internal Medicine',
        available: true
      }
    }),
    prisma.veterinarian.upsert({
      where: { id: 4 },
      update: {},
      create: {
        name: 'David Thompson',
        specialization: 'Emergency Care',
        available: true
      }
    })
  ])

  console.log(`✅ Created ${vets.length} veterinarians`);
  console.log('🎊 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
