import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { quizzes } from './drizzle/schema.ts';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

const questions = [
  // Cours 2
  { courseId: 2, question: 'Qu''est-ce qu''une rupture de stock ?', optionA: 'Quand le magasin ferme', optionB: 'Quand un produit n''est plus disponible à la vente', optionC: 'Quand les prix augmentent', optionD: 'Quand il y a trop de clients', correctAnswer: 'B', explanation: 'Une rupture de stock signifie qu''on ne peut plus vendre un produit car il n''est plus en magasin.' },
  { courseId: 2, question: 'Quelle est la conséquence principale d''une rupture de stock ?', optionA: 'Les clients vont chez les concurrents', optionB: 'Le loyer augmente', optionC: 'Les produits deviennent gratuits', optionD: 'Le magasin devient plus grand', correctAnswer: 'A', explanation: 'Les clients insatisfaits iront acheter ailleurs, ce qui fait perdre des ventes.' },
  { courseId: 2, question: 'Comment prévoir ses besoins en stock ?', optionA: 'Deviner au hasard', optionB: 'Analyser les ventes passées et les tendances', optionC: 'Copier le voisin', optionD: 'Attendre que les clients demandent', correctAnswer: 'B', explanation: 'En regardant ce qui s''est vendu avant, on peut mieux prévoir les besoins futurs.' },
  { courseId: 2, question: 'Quel est l''avantage d''avoir un stock de sécurité ?', optionA: 'Occuper plus d''espace', optionB: 'Se protéger contre les ruptures imprévues', optionC: 'Payer plus de taxes', optionD: 'Impressionner les fournisseurs', correctAnswer: 'B', explanation: 'Un stock de sécurité permet de continuer à vendre même en cas de retard de livraison.' },
  { courseId: 2, question: 'Que faire pendant les périodes de forte demande (fêtes, rentrée) ?', optionA: 'Fermer le magasin', optionB: 'Commander plus de stock à l''avance', optionC: 'Augmenter les prix au maximum', optionD: 'Ignorer la demande', correctAnswer: 'B', explanation: 'Il faut anticiper et commander davantage avant les périodes de forte demande.' },
  { courseId: 2, question: 'Comment un simple cahier peut-il aider à éviter les ruptures ?', optionA: 'En notant les entrées et sorties de produits', optionB: 'En le montrant aux clients', optionC: 'En l''utilisant comme décoration', optionD: 'En le vendant', correctAnswer: 'A', explanation: 'Noter les mouvements de stock permet de savoir exactement ce qu''il reste et quand commander.' },
];

for (const q of questions) {
  await db.insert(quizzes).values(q);
}

console.log('Questions insérées avec succès !');
await connection.end();
