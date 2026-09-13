import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const demoUniversity = await prisma.university.upsert({
    where: {
      slug: 'demo-university',
    },
    update: {
      name: 'Demo University',
      status: 'ACTIVE',
    },
    create: {
      name: 'Demo University',
      slug: 'demo-university',
      status: 'ACTIVE',
    },
  });

  await prisma.approvedEmailDomain.upsert({
    where: {
      universityId_domain: {
        universityId: demoUniversity.id,
        domain: 'demo-university.edu',
      },
    },
    update: {},
    create: {
      universityId: demoUniversity.id,
      domain: 'demo-university.edu',
    },
  });

  await prisma.campus.upsert({
    where: {
      id: 'demo-main-campus',
    },
    update: {
      universityId: demoUniversity.id,
      name: 'Main Campus',
    },
    create: {
      id: 'demo-main-campus',
      universityId: demoUniversity.id,
      name: 'Main Campus',
    },
  });

  const parulUniversity = await prisma.university.upsert({
    where: {
      slug: 'parul-university',
    },
    update: {
      name: 'Parul University',
      status: 'ACTIVE',
    },
    create: {
      name: 'Parul University',
      slug: 'parul-university',
      status: 'ACTIVE',
    },
  });

  await prisma.approvedEmailDomain.upsert({
    where: {
      universityId_domain: {
        universityId: parulUniversity.id,
        domain: 'paruluniversity.ac.in',
      },
    },
    update: {},
    create: {
      universityId: parulUniversity.id,
      domain: 'paruluniversity.ac.in',
    },
  });

  await prisma.campus.upsert({
    where: {
      id: '8c66e942-6a5e-4f37-9fd5-87e12d410001',
    },
    update: {
      universityId: parulUniversity.id,
      name: 'Vadodara Campus',
    },
    create: {
      id: '8c66e942-6a5e-4f37-9fd5-87e12d410001',
      universityId: parulUniversity.id,
      name: 'Vadodara Campus',
    },
  });


  const demoPasswordHash = await argon2.hash('CampigoDemo123!');

const demoStudent = await prisma.user.upsert({
  where: {
    institutionalEmail: 'student@paruluniversity.ac.in',
  },
  update: {
    displayName: 'Demo Student',
    passwordHash: demoPasswordHash,
    universityId: parulUniversity.id,
    campusId: '8c66e942-6a5e-4f37-9fd5-87e12d410001',
    isActive: true,
  },
  create: {
    institutionalEmail: 'student@paruluniversity.ac.in',
    displayName: 'Demo Student',
    universityId: parulUniversity.id,
    campusId: '8c66e942-6a5e-4f37-9fd5-87e12d410001',
    passwordHash: demoPasswordHash,
  },
});

const existingLost = await prisma.lostItem.count({
    where: {
      ownerId: demoStudent.id,
    },
  });

  if (existingLost === 0) {
    await prisma.lostItem.createMany({
      data: [
        {
          universityId: parulUniversity.id,
          ownerId: demoStudent.id,
          campusId: '8c66e942-6a5e-4f37-9fd5-87e12d410001',
          title: 'Black Wallet',
          description: 'Lost near Library',
          lostDate: new Date(),
        },
        {
          universityId: parulUniversity.id,
          ownerId: demoStudent.id,
          campusId: '8c66e942-6a5e-4f37-9fd5-87e12d410001',
          title: 'Student ID Card',
          description: 'Lost near Canteen',
          lostDate: new Date(),
          status: 'RECOVERED',
        },
      ],
    });
  }

  const existingFound = await prisma.foundItem.count({
    where: {
      finderId: demoStudent.id,
    },
  });

  if (existingFound === 0) {
    await prisma.foundItem.create({
      data: {
        universityId: parulUniversity.id,
        finderId: demoStudent.id,
        campusId: '8c66e942-6a5e-4f37-9fd5-87e12d410001',
        title: 'Blue Water Bottle',
        description: 'Found outside Block A',
        foundDate: new Date(),
      },
    });
  }

  console.log('Seed completed');
  console.log(`Demo University ID=${demoUniversity.id}`);
  console.log(`Parul University ID=${parulUniversity.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
