import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Clear existing
  await prisma.order.deleteMany()
  await prisma.session.deleteMany()
  await prisma.device.deleteMany()
  await prisma.inventoryItem.deleteMany()
  await prisma.user.deleteMany()

  // Create Admin
  await prisma.user.create({
    data: {
      username: 'admin',
      password: 'admin123', // In real app, hash this
      role: 'ADMIN',
    }
  })

  // Create Devices
  const devices = [
    { number: '1', type: 'PS5', hourlyRateSingle: 20, hourlyRateMulti: 30 },
    { number: '2', type: 'PS5', hourlyRateSingle: 20, hourlyRateMulti: 30 },
    { number: '3', type: 'PS4', hourlyRateSingle: 15, hourlyRateMulti: 25 },
    { number: '4', type: 'PS4', hourlyRateSingle: 15, hourlyRateMulti: 25 },
    { number: 'PC-1', type: 'PC', hourlyRateSingle: 10, hourlyRateMulti: 10 },
    { number: 'PC-2', type: 'PC', hourlyRateSingle: 10, hourlyRateMulti: 10 },
  ]

  for (const d of devices) {
    await prisma.device.create({ data: d })
  }

  // Create Inventory
  const items = [
    { name: 'Pepsi', category: 'DRINK', price: 15, stock: 50 },
    { name: 'Coffee', category: 'DRINK', price: 20, stock: 30 },
    { name: 'Tea', category: 'DRINK', price: 10, stock: 100 },
    { name: 'Chips', category: 'FOOD', price: 12, stock: 40 },
  ]

  for (const i of items) {
    await prisma.inventoryItem.create({ data: i })
  }

  console.log('Seed completed successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
