ALTER TABLE cmu_reimbursements ADD COLUMN transactionId VARCHAR(100) UNIQUE AFTER reference;
ALTER TABLE auth_pins ADD INDEX auth_pins_user_idx (userId);
