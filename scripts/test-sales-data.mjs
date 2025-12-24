import { getLast7DaysSales } from '../server/db-sales.ts';

async function testSalesData() {
  console.log('🔍 Test des données de ventes des 7 derniers jours...\n');
  
  const result = await getLast7DaysSales(1);
  
  console.log('📊 Données brutes:');
  console.log(JSON.stringify(result, null, 2));
  
  console.log('\n📅 Format des dates:');
  result.forEach((item, index) => {
    console.log(`  ${index + 1}. date: "${item.date}" (type: ${typeof item.date})`);
    console.log(`     totalAmount: ${item.totalAmount}`);
    console.log(`     salesCount: ${item.salesCount}`);
  });
  
  console.log('\n✅ Test terminé');
}

testSalesData().catch(console.error);
