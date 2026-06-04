-- ============================================================
-- ScanoShop — Smart In-Store Checkout Platform
-- MySQL Schema (Reference — managed by Prisma in production)
-- ============================================================

CREATE DATABASE IF NOT EXISTS smart_shopping CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smart_shopping;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  email      VARCHAR(255) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  role       ENUM('USER', 'ADMIN') DEFAULT 'USER',
  createdAt  DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB;

-- Products
CREATE TABLE IF NOT EXISTS products (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  name      VARCHAR(255) NOT NULL,
  price     DECIMAL(10,2) NOT NULL,
  stock     INT DEFAULT 0,
  barcode   VARCHAR(100) NOT NULL UNIQUE,
  category  VARCHAR(100) NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_barcode (barcode),
  INDEX idx_category (category)
) ENGINE=InnoDB;

-- Carts (one per user)
CREATE TABLE IF NOT EXISTS carts (
  id     INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL UNIQUE,
  CONSTRAINT fk_cart_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Cart Items
CREATE TABLE IF NOT EXISTS cart_items (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  cartId    INT NOT NULL,
  productId INT NOT NULL,
  quantity  INT DEFAULT 1,
  UNIQUE KEY uq_cart_product (cartId, productId),
  INDEX idx_cart_id (cartId),
  CONSTRAINT fk_ci_cart    FOREIGN KEY (cartId)    REFERENCES carts(id)    ON DELETE CASCADE,
  CONSTRAINT fk_ci_product FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  userId     INT NOT NULL,
  totalPrice DECIMAL(10,2) NOT NULL,
  status     ENUM('PENDING','COMPLETED','FAILED') DEFAULT 'PENDING',
  createdAt  DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_order_user (userId),
  CONSTRAINT fk_order_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  orderId   INT NOT NULL,
  productId INT NOT NULL,
  quantity  INT NOT NULL,
  price     DECIMAL(10,2) NOT NULL,
  INDEX idx_order_id (orderId),
  CONSTRAINT fk_oi_order   FOREIGN KEY (orderId)   REFERENCES orders(id)   ON DELETE CASCADE,
  CONSTRAINT fk_oi_product FOREIGN KEY (productId) REFERENCES products(id)
) ENGINE=InnoDB;
