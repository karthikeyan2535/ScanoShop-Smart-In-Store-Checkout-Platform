const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@shop.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@shop.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  // Create cart for admin
  await prisma.cart.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id },
  });

  // Create regular user
  const userPassword = await bcrypt.hash('user123', 12);
  const user = await prisma.user.upsert({
    where: { email: 'user@shop.com' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'user@shop.com',
      password: userPassword,
      role: 'USER',
    },
  });

  await prisma.cart.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  // Sample products
  const products = [
    { name: 'Apple iPhone 15 Pro', price: 999.99, stock: 50, barcode: 'PHONE-001', category: 'Electronics' },
    { name: 'Samsung Galaxy S24', price: 849.99, stock: 35, barcode: 'PHONE-002', category: 'Electronics' },
    { name: 'Sony WH-1000XM5 Headphones', price: 349.99, stock: 80, barcode: 'AUDIO-001', category: 'Electronics' },
    { name: 'MacBook Air M3', price: 1299.99, stock: 25, barcode: 'LAPTOP-001', category: 'Electronics' },
    { name: 'iPad Pro 12.9"', price: 1099.99, stock: 40, barcode: 'TABLET-001', category: 'Electronics' },
    { name: "Levi's 501 Jeans", price: 59.99, stock: 120, barcode: 'CLOTH-001', category: 'Clothing' },
    { name: 'Nike Air Max 270', price: 129.99, stock: 75, barcode: 'SHOE-001', category: 'Clothing' },
    { name: 'Adidas Ultraboost 23', price: 179.99, stock: 60, barcode: 'SHOE-002', category: 'Clothing' },
    { name: 'The Pragmatic Programmer', price: 39.99, stock: 200, barcode: 'BOOK-001', category: 'Books' },
    { name: 'Clean Code by Robert Martin', price: 34.99, stock: 150, barcode: 'BOOK-002', category: 'Books' },
    { name: 'Instant Coffee Premium Blend', price: 12.99, stock: 500, barcode: 'FOOD-001', category: 'Food & Beverages' },
    { name: 'Organic Green Tea (50 bags)', price: 8.99, stock: 300, barcode: 'FOOD-002', category: 'Food & Beverages' },
    { name: 'Yoga Mat Premium', price: 49.99, stock: 8, barcode: 'SPORT-001', category: 'Sports' },
    { name: 'Dumbbells Set 20kg', price: 89.99, stock: 5, barcode: 'SPORT-002', category: 'Sports' },
    { name: 'Wireless Mechanical Keyboard', price: 149.99, stock: 45, barcode: 'ACC-001', category: 'Accessories' },
    { name: 'USB-C Hub 7-in-1', price: 39.99, stock: 3, barcode: 'ACC-002', category: 'Accessories' },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { barcode: product.barcode },
      update: {},
      create: product,
    });
  }

  console.log('✅ Seed complete!');
  console.log('   Admin: admin@shop.com / admin123');
  console.log('   User:  user@shop.com  / user123');
  console.log(`   Products created: ${products.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
