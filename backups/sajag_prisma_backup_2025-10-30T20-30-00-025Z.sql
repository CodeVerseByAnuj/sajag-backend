-- Sajag Database Backup
-- Created: 2025-10-30T20:30:00.025Z
-- Database: Prisma Connected Database
-- =====================================


-- Table: users
-- Records: 2
INSERT INTO users (id, email, password, isEmailVerified, emailVerifyToken, loginAttempts, lockUntil, createdAt, updatedAt) VALUES ('cmg3un07e0001ekmfx0r3lcro', 'anuj1@infutrix.com', '$2a$12$gP6rFyxC6.LcrFw4H3REMekqWS2ytvoK4CkOmXZIy1VBrX1Mqaq4a', false, '1d21660163374ac190fe86440b3bf51a70035cc013c335e69fa858cb36ef9357', 0, NULL, '2025-09-28T15:23:07.850Z', '2025-09-28T15:23:07.850Z');
INSERT INTO users (id, email, password, isEmailVerified, emailVerifyToken, loginAttempts, lockUntil, createdAt, updatedAt) VALUES ('cmg3ukftw0000ekmfenwg5y16', 'anuj@infutrix.com', '$2a$12$duDpkE0akV7GuQ.58NcKZe5GUoVmm8jcyEzoHY.Wy4CwXqANhHQx.', true, NULL, 0, NULL, '2025-09-28T15:21:08.132Z', '2025-09-28T15:27:33.888Z');


-- Table: customers
-- Records: 2
INSERT INTO customers (id, userId, name, guardianName, relation, address, aadharNumber, mobileNumber, createdAt, updatedAt) VALUES ('cmgz111bb0001p5vjbd4fhy49', 'cmg3ukftw0000ekmfenwg5y16', 'ram kumar', 'mukesh', 'father', 'asahat', '', '', '2025-10-20T11:02:51.549Z', '2025-10-20T11:02:51.549Z');
INSERT INTO customers (id, userId, name, guardianName, relation, address, aadharNumber, mobileNumber, createdAt, updatedAt) VALUES ('cmgz18lt0000hp5vj27cn424d', 'cmg3ukftw0000ekmfenwg5y16', 'janvi ', 'aksha goyal', 'father', 'kishapur', '458787878766', '9559551688', '2025-10-20T11:08:44.773Z', '2025-10-20T11:08:44.773Z');


-- Table: orders
-- Records: 2
INSERT INTO orders (id, customerId, createdAt, updatedAt) VALUES ('cmgz12acw0003p5vjc5k1yu1l', 'cmgz111bb0001p5vjbd4fhy49', '2025-10-20T11:03:50.000Z', '2025-10-20T11:03:50.000Z');
INSERT INTO orders (id, customerId, createdAt, updatedAt) VALUES ('cmgz19ohb000jp5vj5vfd8awe', 'cmgz18lt0000hp5vj27cn424d', '2025-10-20T11:09:34.895Z', '2025-10-20T11:09:34.895Z');


-- Table: items
-- Records: 2
INSERT INTO items (id, name, category, percentage, amount, itemWeight, imagePath, description, createdAt, updatedAt, customerId, orderId, interestPaidTill, remainingAmount, totalPaid) VALUES ('cmgz12ah30005p5vjzjsu2khs', 'chhagal ', 'silver', 2, 15000, '250 gm', NULL, '', '2025-10-20T11:03:50.151Z', '2025-10-20T11:13:29.633Z', 'cmgz111bb0001p5vjbd4fhy49', 'cmgz12acw0003p5vjc5k1yu1l', '2025-10-20T00:00:00.000Z', 5000, 10100);
INSERT INTO items (id, name, category, percentage, amount, itemWeight, imagePath, description, createdAt, updatedAt, customerId, orderId, interestPaidTill, remainingAmount, totalPaid) VALUES ('cmgz19olr000lp5vjtjhxd1kn', 'Ring', 'gold', 2, 25000, '7', NULL, '', '2025-10-20T11:09:35.055Z', '2025-10-20T11:32:04.137Z', 'cmgz18lt0000hp5vj27cn424d', 'cmgz19ohb000jp5vj5vfd8awe', '2025-12-20T00:00:00.000Z', 20000, 6317);


-- Table: payments
-- Records: 3
INSERT INTO payments (id, itemId, amountPaid, interestPaid, principalPaid, paidAt) VALUES ('cmgz1epq8000np5vjqzmsj321', 'cmgz12ah30005p5vjzjsu2khs', 10100, 100, 10000, '2025-10-20T00:00:00.000Z');
INSERT INTO payments (id, itemId, amountPaid, interestPaid, principalPaid, paidAt) VALUES ('cmgz1sdqd000pp5vj0rgfixa5', 'cmgz19olr000lp5vjtjhxd1kn', 5517, 517, 5000, '2025-11-20T00:00:00.000Z');
INSERT INTO payments (id, itemId, amountPaid, interestPaid, principalPaid, paidAt) VALUES ('cmgz22lpl000tp5vj0k2pdf27', 'cmgz19olr000lp5vjtjhxd1kn', 400, 400, 0, '2025-12-20T00:00:00.000Z');

