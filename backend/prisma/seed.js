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
    { name: 'Apple iPhone 15 Pro', price: 134900, availableStock: 50, barcode: 'PHONE-001', category: 'Electronics', imageUrl: 'https://images.unsplash.com/photo-1696446700622-2629b35bc2b4?w=500&q=80' },
    { name: 'Samsung Galaxy S24', price: 79999, availableStock: 35, barcode: 'PHONE-002', category: 'Electronics', imageUrl: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500&q=80' },
    { name: 'Sony WH-1000XM5 Headphones', price: 29990, availableStock: 80, barcode: 'AUDIO-001', category: 'Electronics', imageUrl: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500&q=80' },
    { name: 'MacBook Air M3', price: 114900, availableStock: 25, barcode: 'LAPTOP-001', category: 'Electronics', imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80' },
    { name: 'iPad Pro 12.9"', price: 112900, availableStock: 40, barcode: 'TABLET-001', category: 'Electronics', imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&q=80' },
    { name: "Levi's 501 Jeans", price: 3999, availableStock: 120, barcode: 'CLOTH-001', category: 'Clothing', imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&q=80' },
    { name: 'Nike Air Max 270', price: 10995, availableStock: 75, barcode: 'SHOE-001', category: 'Clothing', imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80' },
    { name: 'Adidas Ultraboost 23', price: 15999, availableStock: 60, barcode: 'SHOE-002', category: 'Clothing', imageUrl: 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=500&q=80' },
    { name: 'The Pragmatic Programmer', price: 1299, availableStock: 200, barcode: 'BOOK-001', category: 'Books', imageUrl: 'https://images.unsplash.com/photo-1589998059171-989d887dda6e?w=500&q=80' },
    { name: 'Clean Code by Robert Martin', price: 999, availableStock: 150, barcode: 'BOOK-002', category: 'Books', imageUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500&q=80' },
    { name: 'Bru Instant Coffee Premium Blend', price: 349, availableStock: 500, barcode: 'FOOD-001', category: 'Food & Beverages', imageUrl: 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=500&q=80' },
    { name: 'Organic Green Tea (50 bags)', price: 299, availableStock: 300, barcode: 'FOOD-002', category: 'Food & Beverages', imageUrl: 'https://images.unsplash.com/photo-1627492275512-40f4eb715428?w=500&q=80' },
    { name: 'Yoga Mat Premium', price: 1999, availableStock: 8, barcode: 'SPORT-001', category: 'Sports', imageUrl: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500&q=80' },
    { name: 'Dumbbells Set 20kg', price: 3499, availableStock: 5, barcode: 'SPORT-002', category: 'Sports', imageUrl: 'https://images.unsplash.com/photo-1586401100295-7a8096fd231a?w=500&q=80' },
    { name: 'Wireless Mechanical Keyboard', price: 8999, availableStock: 45, barcode: 'ACC-001', category: 'Accessories', imageUrl: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=500&q=80' },
    { name: 'USB-C Hub 7-in-1', price: 2499, availableStock: 3, barcode: 'ACC-002', category: 'Accessories', imageUrl: 'https://images.unsplash.com/photo-1647427017046-d50d603a1154?w=500&q=80' },
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
