import { storagePut } from "./server/storage.ts";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const imageMapping = {
  "tomates.jpg": 1,
  "oignons.jpg": 2,
  "aubergines.jpg": 3,
  "gombo.jpg": 4,
  "piment.jpg": 5,
  "chou.jpg": 6,
  "carotte.jpg": 7,
  "mais.jpg": 8,
  "riz.jpg": 9,
  "manioc.jpg": 10,
  "igname.jpg": 11,
  "plantain.jpg": 12,
  "patate-douce.jpg": 13,
  "arachides.jpg": 14,
  "haricots.jpg": 15,
  "niebe.jpg": 16,
  "soja.jpg": 17,
  "tilapia.jpg": 18,
  "carpe.jpg": 19,
  "poisson-fume.jpg": 20,
  "sardines.jpg": 21,
  "poulet.jpg": 22,
  "mouton.jpg": 23,
  "boeuf.jpg": 24,
  "bananes.jpg": 25,
  "oranges.jpg": 26,
  "mangues.jpg": 27,
  "noix-coco.jpg": 28,
  "ananas.jpg": 29,
  "papaye.jpg": 30,
  "sel.jpg": 31,
  "cube-maggi.jpg": 32,
  "poivre.jpg": 33,
  "huile.jpg": 34
};

async function uploadImages() {
  const imageDir = "/home/ubuntu/ifn-connect-improved/product-images";
  const results = [];

  console.log("🚀 Starting image upload to S3...\n");

  for (const [filename, productId] of Object.entries(imageMapping)) {
    try {
      const filePath = join(imageDir, filename);
      const fileBuffer = readFileSync(filePath);
      
      // Upload to S3 with product-specific path
      const s3Key = `products/${productId}/${filename}`;
      const { url } = await storagePut(s3Key, fileBuffer, "image/jpeg");
      
      results.push({
        productId,
        filename,
        url,
        success: true
      });
      
      console.log(`✅ Uploaded ${filename} → Product ID ${productId}`);
      console.log(`   URL: ${url}\n`);
    } catch (error) {
      console.error(`❌ Failed to upload ${filename}:`, error.message);
      results.push({
        productId,
        filename,
        error: error.message,
        success: false
      });
    }
  }

  // Save results to JSON file
  const resultsJson = JSON.stringify(results, null, 2);
  const { writeFileSync } = await import("fs");
  writeFileSync("/home/ubuntu/ifn-connect-improved/upload-results.json", resultsJson);
  
  const successCount = results.filter(r => r.success).length;
  console.log(`\n📊 Upload Summary:`);
  console.log(`   ✅ Successful: ${successCount}/${results.length}`);
  console.log(`   ❌ Failed: ${results.length - successCount}/${results.length}`);
  console.log(`\n💾 Results saved to upload-results.json`);
  
  return results;
}

uploadImages().catch(console.error);
