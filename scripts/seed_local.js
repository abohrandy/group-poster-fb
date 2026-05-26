const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const sampleGroups = [
  {
    name: "Adventure Seekers NG",
    url: "https://web.facebook.com/groups/1850623791933180/",
    membersCount: 15300,
    dailyPosts: 5,
    allowsPages: true,
    status: "JOINED",
    notes: "Scanned manually"
  },
  {
    name: "CS '11",
    url: "https://web.facebook.com/groups/csmau11/",
    membersCount: 420,
    dailyPosts: 0,
    allowsPages: false,
    status: "JOINED",
    notes: "Campaign group"
  },
  {
    name: "THE LARGEST CAMEROONIAN GROUP ON FACEBOOK!!",
    url: "https://web.facebook.com/groups/largestcamerooniangroup/",
    membersCount: 45000,
    dailyPosts: 20,
    allowsPages: true,
    status: "JOINED",
    notes: "Large community group"
  },
  {
    name: "Dating & International Networking (DIN)",
    url: "https://web.facebook.com/groups/1189422621175161/",
    membersCount: 22000,
    dailyPosts: 12,
    allowsPages: true,
    status: "JOINED",
    notes: "Networking forum"
  },
  {
    name: "MUAA FCT",
    url: "https://web.facebook.com/groups/muaafct/",
    membersCount: 3100,
    dailyPosts: 2,
    allowsPages: false,
    status: "JOINED",
    notes: "FCT Group"
  }
];

async function main() {
  console.log('Seeding local database with sample Facebook groups...');

  // Create default user if not exists
  const existingUser = await prisma.user.findFirst();
  if (!existingUser) {
    // password is "password" hashed using bcryptjs (pre-hashed to save deps)
    await prisma.user.create({
      data: {
        email: "admin@example.com",
        passwordHash: "$2a$10$QO0R5x6z19O.q23D3F.Kz.r4q1zC1FwYyLzQ8Q.3tH1cZ9.vV5NKy", // precompiled hash for "password"
        name: "Admin Operator",
        facebookPageName: "SRHC Hon. Paul Yerima"
      }
    });
    console.log('Created default user: admin@example.com / password');
  }

  for (const group of sampleGroups) {
    await prisma.facebookGroup.upsert({
      where: { url: group.url },
      update: {
        status: group.status,
        membersCount: group.membersCount,
        dailyPosts: group.dailyPosts
      },
      create: group
    });
    console.log(`Upserted group: ${group.name}`);
  }

  console.log('Seed completed successfully!');
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
