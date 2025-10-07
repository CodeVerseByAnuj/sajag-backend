-- Postgres-compatible SQL dump generated from prisma/schema.prisma
-- Paste this into an online Postgres SQL editor to create the schema.

-- Note: IDs are plain TEXT (Prisma uses cuid()).

-- Drop tables/types if they exist (reverse dependency order)
DROP TABLE IF EXISTS payment_history CASCADE;
DROP TABLE IF EXISTS interest_history CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS relation_type;
DROP TYPE IF EXISTS category_type;

-- Create enum types
CREATE TYPE relation_type AS ENUM ('father','mother','wife','husband','son','daughter','other');
CREATE TYPE category_type AS ENUM ('gold','silver');

-- Users table (mapped: users)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  isEmailVerified BOOLEAN NOT NULL DEFAULT false,
  emailVerifyToken TEXT,
  loginAttempts INTEGER NOT NULL DEFAULT 0,
  lockUntil TIMESTAMP WITH TIME ZONE,
  createdAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updatedAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Customers table (mapped: customers)
CREATE TABLE customers (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  name TEXT NOT NULL,
  guardianName TEXT NOT NULL,
  relation relation_type NOT NULL,
  address TEXT NOT NULL,
  aadharNumber TEXT NOT NULL UNIQUE,
  mobileNumber TEXT NOT NULL,
  createdAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updatedAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_customers_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Orders table (mapped: orders)
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  customerId TEXT NOT NULL,
  createdAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updatedAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_orders_customer FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE CASCADE
);

-- Items table (mapped: items)
CREATE TABLE items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category category_type NOT NULL,
  percentage DOUBLE PRECISION NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  itemWeight TEXT NOT NULL,
  imagePath TEXT,
  description TEXT,
  createdAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updatedAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  customerId TEXT NOT NULL,
  orderId TEXT NOT NULL,
  interestPaidTill TIMESTAMP WITH TIME ZONE,
  remainingAmount DOUBLE PRECISION NOT NULL DEFAULT 0,
  totalPaid DOUBLE PRECISION NOT NULL DEFAULT 0,
  CONSTRAINT fk_items_customer FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE CASCADE,
  CONSTRAINT fk_items_order FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE NO ACTION
);

-- Payments table (mapped: payments)
CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  itemId TEXT NOT NULL,
  amountPaid DOUBLE PRECISION NOT NULL,
  interestPaid DOUBLE PRECISION NOT NULL,
  principalPaid DOUBLE PRECISION NOT NULL,
  paidAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_payments_item FOREIGN KEY (itemId) REFERENCES items(id) ON DELETE CASCADE
);

-- Interest history table (mapped: interest_history)
CREATE TABLE interest_history (
  id TEXT PRIMARY KEY,
  itemId TEXT NOT NULL,
  interestAmount DOUBLE PRECISION NOT NULL,
  interestDate TIMESTAMP WITH TIME ZONE NOT NULL,
  paidAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  userId TEXT NOT NULL,
  CONSTRAINT fk_interest_item FOREIGN KEY (itemId) REFERENCES items(id) ON DELETE CASCADE,
  CONSTRAINT fk_interest_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Payment history table (model name: payment_history)
CREATE TABLE payment_history (
  id TEXT PRIMARY KEY,
  itemId TEXT NOT NULL,
  userId TEXT NOT NULL,
  amountPaid DOUBLE PRECISION NOT NULL,
  paidAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_pmh_items FOREIGN KEY (itemId) REFERENCES items(id) ON DELETE CASCADE,
  CONSTRAINT fk_pmh_users FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Optional: simple indexes to speed lookups
CREATE INDEX idx_customers_userId ON customers(userId);
CREATE INDEX idx_orders_customerId ON orders(customerId);
CREATE INDEX idx_items_customerId ON items(customerId);
CREATE INDEX idx_items_orderId ON items(orderId);
CREATE INDEX idx_payments_itemId ON payments(itemId);
CREATE INDEX idx_interest_itemId ON interest_history(itemId);
CREATE INDEX idx_interest_userId ON interest_history(userId);
CREATE INDEX idx_payment_history_itemId ON payment_history(itemId);
CREATE INDEX idx_payment_history_userId ON payment_history(userId);

-- End of dump
