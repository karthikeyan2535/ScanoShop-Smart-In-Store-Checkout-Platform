const cron = require('node-cron');
const prisma = require('../config/prisma');
const { emitInventoryUpdate, emitAdminUpdate } = require('../services/socketService');

const startCronJobs = () => {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      console.log('🔄 Running cron job to release expired inventory reservations...');
      const now = new Date();

      // Find all expired cart items
      const expiredItems = await prisma.cartItem.findMany({
        where: {
          reservedUntil: {
            lt: now,
          },
        },
      });

      if (expiredItems.length > 0) {
        const updatedProducts = await prisma.$transaction(async (tx) => {
          const prods = [];
          for (const item of expiredItems) {
            // Restore inventory
            const p = await tx.product.update({
              where: { id: item.productId },
              data: {
                availableStock: { increment: item.quantity },
                reservedStock: { decrement: item.quantity },
              },
            });
            prods.push(p);
            
            // Remove the cart item since reservation expired
            await tx.cartItem.delete({
              where: { id: item.id },
            });
          }
          return prods;
        });

        for (const p of updatedProducts) {
          emitInventoryUpdate(p.id, p.availableStock, p.reservedStock);
        }
        emitAdminUpdate();
        console.log(`✅ Released ${expiredItems.length} expired reservations.`);
      }
    } catch (error) {
      console.error('❌ Error in reservation cron job:', error);
    }
  });
};

module.exports = { startCronJobs };
