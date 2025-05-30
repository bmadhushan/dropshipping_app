import { getDatabase, initDatabase, closeDatabase } from '../config/database.js';

const runMigration = async () => {
  try {
    await initDatabase();
    const db = getDatabase();
    
    // Add base_price column to products table if it doesn't exist
    const addBasePriceColumn = () => {
      return new Promise((resolve, reject) => {
        db.run(`ALTER TABLE products ADD COLUMN base_price DECIMAL(10,2) DEFAULT 0`, (err) => {
          if (err) {
            if (err.message.includes('duplicate column name')) {
              console.log('base_price column already exists');
              resolve();
            } else {
              reject(err);
            }
          } else {
            console.log('Added base_price column to products table');
            resolve();
          }
        });
      });
    };
    
    // Add LKR conversion rate to global_settings
    const addConversionRate = () => {
      return new Promise((resolve, reject) => {
        db.run(
          `INSERT OR REPLACE INTO global_settings (key, value) VALUES (?, ?)`,
          ['lkr_conversion_rate', '330'],
          (err) => {
            if (err) {
              reject(err);
            } else {
              console.log('Added LKR conversion rate to global settings');
              resolve();
            }
          }
        );
      });
    };
    
    // Update categories table to add shipping_fee column if it doesn't exist
    const addShippingFeeColumn = () => {
      return new Promise((resolve, reject) => {
        db.run(`ALTER TABLE categories ADD COLUMN shipping_fee DECIMAL(10,2) DEFAULT 0`, (err) => {
          if (err) {
            if (err.message.includes('duplicate column name')) {
              console.log('shipping_fee column already exists in categories');
              resolve();
            } else {
              reject(err);
            }
          } else {
            console.log('Added shipping_fee column to categories table');
            resolve();
          }
        });
      });
    };
    
    // Run all migrations
    await addBasePriceColumn();
    await addShippingFeeColumn();
    await addConversionRate();
    
    console.log('Migration completed successfully');
    await closeDatabase();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

runMigration();