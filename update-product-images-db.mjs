import { readFileSync } from "fs";
import mysql from "mysql2/promise";

async function updateProductImages() {
  // Load upload results
  const results = JSON.parse(readFileSync("/home/ubuntu/ifn-connect-improved/upload-results.json", "utf-8"));
  
  // Connect to database
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log("🔄 Updating product images in database...\n");
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const result of results) {
    if (!result.success) {
      console.log(`⏭️  Skipping product ${result.productId} (upload failed)`);
      errorCount++;
      continue;
    }
    
    try {
      const [updateResult] = await connection.execute(
        "UPDATE products SET imageUrl = ? WHERE id = ?",
        [result.url, result.productId]
      );
      
      if (updateResult.affectedRows > 0) {
        console.log(`✅ Updated product ${result.productId}: ${result.filename}`);
        successCount++;
      } else {
        console.log(`⚠️  Product ${result.productId} not found in database`);
        errorCount++;
      }
    } catch (error) {
      console.error(`❌ Error updating product ${result.productId}:`, error.message);
      errorCount++;
    }
  }
  
  await connection.end();
  
  console.log(`\n📊 Database Update Summary:`);
  console.log(`   ✅ Successfully updated: ${successCount}/${results.length}`);
  console.log(`   ❌ Failed/Skipped: ${errorCount}/${results.length}`);
}

updateProductImages().catch(console.error);
