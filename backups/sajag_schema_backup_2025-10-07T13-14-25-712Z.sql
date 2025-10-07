-- Sajag Database Schema Backup
-- Created: 2025-10-07T13:14:25.713Z
-- Source: Prisma Schema
-- =====================================

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id               String            @id @default(cuid())
  email            String            @unique
  password         String
  isEmailVerified  Boolean           @default(false)
  emailVerifyToken String?
  loginAttempts    Int               @default(0)
  lockUntil        DateTime?
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt
  customers        Customer[]
  interest_history InterestHistory[]
  payment_history  payment_history[]

  @@map("users")
}

model Customer {
  id           String   @id @default(cuid())
  userId       String
  name         String
  guardianName String
  relation     Relation
  address      String
  aadharNumber String   @unique
  mobileNumber String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  items        Item[]   @relation("CustomerToItems")
  orders       Order[]

  @@map("customers")
}

model Order {
  id         String   @id @default(cuid())
  customerId String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  Item       Item[]
  customer   Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)

  @@map("orders")
}

model Item {
  id               String            @id @default(cuid())
  name             String
  category         Category
  percentage       Float
  amount           Float
  itemWeight       String
  imagePath        String?
  description      String?
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt
  customerId       String
  orderId          String
  interestPaidTill DateTime?
  remainingAmount  Float             @default(0)
  totalPaid        Float             @default(0)
  interestHistory  InterestHistory[]
  customer         Customer          @relation("CustomerToItems", fields: [customerId], references: [id], onDelete: Cascade)
  order            Order             @relation(fields: [orderId], references: [id])
  payment_history  payment_history[]
  payments         Payment[]

  @@map("items")
}

model Payment {
  id            String   @id @default(cuid())
  itemId        String
  amountPaid    Float
  interestPaid  Float
  principalPaid Float
  paidAt        DateTime @default(now())
  item          Item     @relation(fields: [itemId], references: [id], onDelete: Cascade)

  @@map("payments")
}

model InterestHistory {
  id             String   @id @default(cuid())
  itemId         String
  interestAmount Float
  interestDate   DateTime
  paidAt         DateTime @default(now())
  userId         String
  item           Item     @relation(fields: [itemId], references: [id], onDelete: Cascade)
  users          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("interest_history")
}

model payment_history {
  id         String   @id
  itemId     String
  userId     String
  amountPaid Float
  paidAt     DateTime @default(now())
  items      Item     @relation(fields: [itemId], references: [id], onDelete: Cascade)
  users      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

enum Relation {
  father
  mother
  wife
  husband
  son
  daughter
  other
}

enum Category {
  gold
  silver
}


-- Database Connection Info (for reference):
-- URL: postgresql://***:***@210.79.129.252:5432/postgres
-- Created via Prisma backup system
