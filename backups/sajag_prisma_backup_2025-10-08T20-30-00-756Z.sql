-- Sajag Database Backup
-- Created: 2025-10-08T20:30:00.756Z
-- Database: Prisma Connected Database
-- =====================================


-- Table: users
-- Records: 2
INSERT INTO users (id, email, password, isEmailVerified, emailVerifyToken, loginAttempts, lockUntil, createdAt, updatedAt) VALUES ('cmg3un07e0001ekmfx0r3lcro', 'anuj1@infutrix.com', '$2a$12$gP6rFyxC6.LcrFw4H3REMekqWS2ytvoK4CkOmXZIy1VBrX1Mqaq4a', false, '1d21660163374ac190fe86440b3bf51a70035cc013c335e69fa858cb36ef9357', 0, NULL, '2025-09-28T15:23:07.850Z', '2025-09-28T15:23:07.850Z');
INSERT INTO users (id, email, password, isEmailVerified, emailVerifyToken, loginAttempts, lockUntil, createdAt, updatedAt) VALUES ('cmg3ukftw0000ekmfenwg5y16', 'anuj@infutrix.com', '$2a$12$duDpkE0akV7GuQ.58NcKZe5GUoVmm8jcyEzoHY.Wy4CwXqANhHQx.', true, NULL, 0, NULL, '2025-09-28T15:21:08.132Z', '2025-09-28T15:27:33.888Z');


-- Table: customers
-- Records: 2
INSERT INTO customers (id, userId, name, guardianName, relation, address, aadharNumber, mobileNumber, createdAt, updatedAt) VALUES ('cmghz5n4b00011i3e2124dg55', 'cmg3ukftw0000ekmfenwg5y16', '2ece73268ae0fe78230e8f32a2fa8f31:d5dd1f76fb214a36a8fca2bbd06a6a74', 'dc8ca6b8c6bc1dad492099186f43c62d:fbf149a6941e175b12c4afbc43369bab', 'father', '62ae0a5c996d489b3c0b174e95c5e606:d996269655bac5e4a0b81734809f0a576bd43ea3d91b71bd6f83d17505c872d8', '0596b34fe4119fd839f54ad97eaf4838:51df32f77166452eed4268eb4ba3a212', '056a43f13f02312db35870fa5c110d46:896ef3df5329f014066cb41511993059', '2025-10-08T12:38:22.279Z', '2025-10-08T12:38:22.279Z');
INSERT INTO customers (id, userId, name, guardianName, relation, address, aadharNumber, mobileNumber, createdAt, updatedAt) VALUES ('cmghzh8eo0001os2lpg2repej', 'cmg3ukftw0000ekmfenwg5y16', '60e1ef2bcf9ae9809170e9ed79067880:328d49da923624042135c539934d0602', '1a565aedb63ff9fc5e28eab5c6cb34fc:5b5f4bf9334823994b2836fee99cf594', 'father', 'c1ff7ee92d85c8c4316a557d6fe6d848:6bece557c85f0b1cf05d0ae0d82a84f42cf9b961b05bc3e03fcabf211bba58ed', 'c146e8c2555af06907d136eb660eff7c:cd0d5deabd12bb71a9d14c56db7f403c', '0483985c5dfd85decfe6ec0390a161df:15ae642a906e9667a44e6b6725243403', '2025-10-08T12:47:23.089Z', '2025-10-08T12:47:23.089Z');


-- Table: orders
-- Records: 2
INSERT INTO orders (id, customerId, createdAt, updatedAt) VALUES ('cmghz60j900031i3e234qktsw', 'cmghz5n4b00011i3e2124dg55', '2025-10-08T12:38:39.669Z', '2025-10-08T12:38:39.669Z');
INSERT INTO orders (id, customerId, createdAt, updatedAt) VALUES ('cmghzhi600003os2lkwpc45zr', 'cmghzh8eo0001os2lpg2repej', '2025-10-08T12:47:35.736Z', '2025-10-08T12:47:35.736Z');


-- Table: items
-- Records: 2
INSERT INTO items (id, name, category, percentage, amount, itemWeight, imagePath, description, createdAt, updatedAt, customerId, orderId, interestPaidTill, remainingAmount, totalPaid) VALUES ('cmghz60mm00051i3eyqz0x0gw', '4d2d0817bd6685d2622bcdd33f3fd553:7eebb1d3a01f209dbb097b329d089763a65f6e2d61d779c13eb1f30a8d16937e', 'gold', 2, 100, '5', 'uploads/gold-necklace.jpg', '22K traditional necklace', '2025-10-08T12:38:39.790Z', '2025-10-08T12:39:26.892Z', 'cmghz5n4b00011i3e2124dg55', 'cmghz60j900031i3e234qktsw', '2025-08-07T00:00:00.000Z', 80, 22);
INSERT INTO items (id, name, category, percentage, amount, itemWeight, imagePath, description, createdAt, updatedAt, customerId, orderId, interestPaidTill, remainingAmount, totalPaid) VALUES ('cmghzhi8r0005os2lac89txks', 'acc8e54769d0b7dd61e01e205eee4aa8:5183101f6be54b21450819fb3e3d7e12e93bcb1fb3e0ca37234ba8ebe9105644', 'gold', 2, 100, '5', 'uploads/gold-necklace.jpg', '22K traditional necklace', '2025-10-08T12:47:35.835Z', '2025-10-08T12:48:15.369Z', 'cmghzh8eo0001os2lpg2repej', 'cmghzhi600003os2lkwpc45zr', '2025-08-07T00:00:00.000Z', -2560, 2662);


-- Table: payments
-- Records: 2
INSERT INTO payments (id, itemId, amountPaid, interestPaid, principalPaid, paidAt) VALUES ('cmghz712100071i3e26sv5dst', 'cmghz60mm00051i3eyqz0x0gw', 22, 2, 20, '2025-08-07T00:00:00.000Z');
INSERT INTO payments (id, itemId, amountPaid, interestPaid, principalPaid, paidAt) VALUES ('cmghzicu70007os2lvr5hq9ic', 'cmghzhi8r0005os2lac89txks', 2662, 2, 2660, '2025-08-07T00:00:00.000Z');

