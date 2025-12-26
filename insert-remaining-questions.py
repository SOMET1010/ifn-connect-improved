#!/usr/bin/env python3
import os
import mysql.connector
from urllib.parse import urlparse

# Parse DATABASE_URL
db_url = os.getenv('DATABASE_URL')
parsed = urlparse(db_url)

# Extract connection parameters
host = parsed.hostname
port = parsed.port or 3306
user = parsed.username
password = parsed.password
database = parsed.path[1:].split('?')[0]

# Connect to database
conn = mysql.connector.connect(
    host=host,
    port=port,
    user=user,
    password=password,
    database=database
)

cursor = conn.cursor()

# Questions for remaining courses (3-10)
questions = [
    # Cours 3: Faire connaître son commerce avec les réseaux sociaux
    (3, 'Quel réseau social est le plus utilisé en Côte d''Ivoire pour le commerce ?', 'LinkedIn', 'WhatsApp et Facebook', 'Twitter', 'TikTok uniquement', 'B', 'WhatsApp et Facebook sont les plus populaires et accessibles pour les commerçants.'),
    (3, 'Que faut-il montrer sur les réseaux sociaux ?', 'Seulement des textes longs', 'Des photos de ses produits et de son activité', 'Uniquement des vidéos professionnelles', 'Rien du tout', 'B', 'Les photos de produits attirent l''attention et donnent envie d''acheter.'),
    (3, 'À quelle fréquence faut-il publier sur les réseaux sociaux ?', 'Une fois par an', 'Régulièrement (plusieurs fois par semaine)', 'Seulement quand on a envie', 'Jamais', 'B', 'La régularité maintient l''intérêt des clients et augmente la visibilité.'),
    (3, 'Quel type de contenu attire le plus les clients ?', 'Des textes sans images', 'Des photos de qualité avec les prix', 'Des publications en langue étrangère', 'Des messages négatifs', 'B', 'Les clients veulent voir les produits et connaître les prix rapidement.'),
    (3, 'Comment utiliser WhatsApp pour son commerce ?', 'Créer un groupe avec tous ses clients', 'Envoyer des messages personnalisés et des photos de produits', 'Spammer tout le monde', 'Ne jamais répondre aux messages', 'B', 'WhatsApp permet un contact direct et personnalisé avec les clients.'),
    (3, 'Que faire quand un client commente une publication ?', 'L''ignorer', 'Répondre rapidement et poliment', 'Le bloquer', 'Supprimer le commentaire', 'B', 'Répondre aux commentaires montre qu''on est à l''écoute et professionnel.'),
    (3, 'Quel est l''avantage principal des réseaux sociaux pour un petit commerce ?', 'C''est gratuit et accessible à tous', 'Ça remplace complètement le magasin', 'Ça élimine la concurrence', 'Ça garantit le succès immédiat', 'A', 'Les réseaux sociaux sont gratuits et permettent de toucher beaucoup de clients potentiels.'),
    
    # Cours 4: Les bases du marketing pour petit commerce
    (4, 'Qu''est-ce que le marketing pour un petit commerce ?', 'Vendre le plus cher possible', 'Attirer et fidéliser les clients', 'Copier les concurrents', 'Ignorer les clients', 'B', 'Le marketing consiste à attirer de nouveaux clients et à les faire revenir.'),
    (4, 'Quel est l''élément le plus important pour fidéliser un client ?', 'Le prix le plus bas', 'Un bon accueil et un bon service', 'Un grand magasin', 'Beaucoup de publicité', 'B', 'Les clients reviennent là où ils sont bien accueillis et bien servis.'),
    (4, 'Comment fixer le bon prix pour ses produits ?', 'Le prix le plus élevé possible', 'En tenant compte du coût d''achat, des charges et de la concurrence', 'Au hasard', 'Toujours moins cher que tout le monde', 'B', 'Le prix doit couvrir les coûts et rester compétitif.'),
    (4, 'Quelle est l''importance de la présentation des produits ?', 'Aucune importance', 'Une belle présentation attire les clients', 'Seul le prix compte', 'Ça fait perdre du temps', 'B', 'Une bonne présentation donne envie d''acheter et montre le professionnalisme.'),
    (4, 'Comment se différencier de la concurrence ?', 'Baisser tous les prix', 'Offrir un service unique ou une spécialité', 'Critiquer les concurrents', 'Fermer plus tôt', 'B', 'Se spécialiser ou offrir un service particulier attire des clients fidèles.'),
    (4, 'Que signifie "connaître sa clientèle" ?', 'Savoir leurs noms seulement', 'Comprendre leurs besoins et leurs habitudes d''achat', 'Les espionner', 'Leur demander leur salaire', 'B', 'Connaître les besoins permet de proposer les bons produits au bon moment.'),
    
    # Cours 5: Bien gérer son inventaire mensuel
    (5, 'Qu''est-ce qu''un inventaire ?', 'Une liste de clients', 'Le comptage complet de tous les produits en stock', 'Une facture', 'Un contrat', 'B', 'L''inventaire consiste à compter physiquement tous les produits présents.'),
    (5, 'À quelle fréquence faut-il faire un inventaire ?', 'Jamais', 'Au moins une fois par mois', 'Seulement quand on a le temps', 'Une fois tous les 5 ans', 'B', 'Un inventaire mensuel permet de suivre l''évolution du stock et détecter les problèmes.'),
    (5, 'Pourquoi calculer la valeur de son stock ?', 'Pour savoir combien d''argent est immobilisé', 'Pour payer plus d''impôts', 'Pour impressionner les voisins', 'Ce n''est pas utile', 'A', 'Connaître la valeur du stock aide à gérer sa trésorerie et sa rentabilité.'),
    (5, 'Que faire si on trouve des différences entre le stock théorique et réel ?', 'Les ignorer', 'Chercher les causes (vol, casse, erreur de comptage)', 'Accuser quelqu''un au hasard', 'Fermer le magasin', 'B', 'Il faut comprendre les écarts pour corriger les problèmes.'),
    (5, 'Quel est le meilleur moment pour faire l''inventaire ?', 'Pendant les heures d''ouverture', 'Quand le magasin est fermé et calme', 'Pendant les fêtes', 'Quand il y a beaucoup de clients', 'B', 'Un inventaire se fait au calme pour éviter les erreurs.'),
    (5, 'Comment savoir si son commerce est rentable ?', 'Si le magasin est plein', 'En comparant la valeur du stock et les ventes', 'Si on a beaucoup de clients', 'Si on travaille beaucoup', 'B', 'La rentabilité se mesure en comparant ce qu''on vend et ce qu''on dépense.'),
    
    # Cours 6: Comprendre la CNPS et vos droits
    (6, 'Que signifie CNPS ?', 'Caisse Nationale de Paiement Social', 'Caisse Nationale de Prévoyance Sociale', 'Centre National de Protection Sanitaire', 'Comité National des Petits Salaires', 'B', 'La CNPS est la Caisse Nationale de Prévoyance Sociale de Côte d''Ivoire.'),
    (6, 'À quoi sert la CNPS ?', 'À prêter de l''argent', 'À protéger les travailleurs (retraite, maladie, accidents)', 'À vendre des assurances', 'À collecter les impôts', 'B', 'La CNPS protège les travailleurs et leurs familles contre les risques sociaux.'),
    (6, 'Qui peut cotiser à la CNPS ?', 'Seulement les fonctionnaires', 'Les salariés et les travailleurs indépendants', 'Seulement les riches', 'Personne', 'B', 'Tous les travailleurs, y compris les indépendants, peuvent cotiser à la CNPS.'),
    (6, 'Quel est l''avantage de cotiser à la CNPS ?', 'Avoir une retraite et des prestations en cas de maladie ou accident', 'Payer moins d''impôts', 'Obtenir un crédit bancaire', 'Avoir un magasin gratuit', 'A', 'Les cotisations permettent de bénéficier d''une retraite et de prestations sociales.'),
    (6, 'Comment déclarer ses employés à la CNPS ?', 'Ce n''est pas obligatoire', 'Via la plateforme e-CNPS en ligne', 'En allant à la mairie', 'Par téléphone uniquement', 'B', 'La déclaration se fait facilement en ligne sur la plateforme e-CNPS.'),
    (6, 'Que risque un employeur qui ne déclare pas ses employés ?', 'Rien du tout', 'Des amendes et des sanctions légales', 'Une récompense', 'Une promotion', 'B', 'Ne pas déclarer ses employés est illégal et expose à des sanctions.'),
    
    # Cours 7: Comment s''inscrire à la CMU en ligne
    (7, 'Que signifie CMU ?', 'Caisse Médicale Universelle', 'Couverture Maladie Universelle', 'Centre Médical Urgent', 'Comité Médical Unique', 'B', 'La CMU est la Couverture Maladie Universelle de Côte d''Ivoire.'),
    (7, 'Quel est l''avantage principal de la CMU ?', 'Avoir un médecin à domicile', 'Réduire les frais médicaux jusqu''à 70%', 'Ne plus jamais tomber malade', 'Avoir des médicaments gratuits illimités', 'B', 'La CMU permet de payer moins cher les soins et les médicaments.'),
    (7, 'Comment s''inscrire à la CMU ?', 'Seulement en allant à l''hôpital', 'Via la plateforme e-CNPS en ligne', 'Par courrier postal', 'Ce n''est pas possible', 'B', 'L''inscription se fait facilement en ligne sur e-CNPS.'),
    (7, 'Qui peut bénéficier de la CMU ?', 'Seulement les fonctionnaires', 'Tous les citoyens et résidents de Côte d''Ivoire', 'Seulement les personnes âgées', 'Seulement les enfants', 'B', 'La CMU est accessible à tous, c''est son principe d''universalité.'),
    (7, 'Combien coûte la cotisation CMU ?', 'C''est gratuit pour tout le monde', 'Cela dépend du régime choisi (salarié, indépendant, indigent)', '1 million de FCFA par mois', 'On ne paie qu''une seule fois dans sa vie', 'B', 'Le montant varie selon le statut professionnel de la personne.'),
    (7, 'Que faut-il pour s''inscrire à la CMU en ligne ?', 'Rien du tout', 'Une pièce d''identité et un téléphone ou ordinateur', 'Un diplôme universitaire', 'Un compte bancaire à l''étranger', 'B', 'L''inscription nécessite une pièce d''identité et un accès internet.'),
    (7, 'Où utiliser sa carte CMU ?', 'Seulement dans les pharmacies', 'Dans les hôpitaux et pharmacies agréés', 'Seulement à Abidjan', 'Nulle part', 'B', 'La carte CMU est acceptée dans tous les établissements de santé agréés.'),
    
    # Cours 8: Ouvrir un compte Orange Money
    (8, 'Qu''est-ce qu''Orange Money ?', 'Une banque traditionnelle', 'Un service de paiement mobile par téléphone', 'Une carte de crédit', 'Un magasin', 'B', 'Orange Money permet d''envoyer et recevoir de l''argent via son téléphone.'),
    (8, 'Que faut-il pour ouvrir un compte Orange Money ?', 'Un compte bancaire obligatoirement', 'Une carte SIM Orange et une pièce d''identité', 'Un ordinateur', 'Beaucoup d''argent', 'B', 'Il suffit d''avoir une ligne Orange et une pièce d''identité valide.'),
    (8, 'Quel est l''avantage principal d''Orange Money ?', 'C''est gratuit pour tout', 'Envoyer et recevoir de l''argent rapidement sans aller à la banque', 'Avoir un téléphone gratuit', 'Payer moins d''impôts', 'B', 'Orange Money permet des transactions rapides et pratiques 24h/24.'),
    (8, 'Où peut-on ouvrir un compte Orange Money ?', 'Seulement à Abidjan', 'Dans n''importe quelle boutique Orange agréée', 'Seulement à la banque', 'Ce n''est plus possible', 'B', 'Les boutiques Orange et les agents agréés peuvent ouvrir des comptes.'),
    (8, 'Faut-il payer pour ouvrir un compte Orange Money ?', 'Oui, très cher', 'Non, l''ouverture est gratuite', 'Seulement pour les étrangers', 'Seulement le premier mois', 'B', 'L''ouverture de compte est gratuite, seules les transactions ont des frais.'),
    (8, 'Peut-on utiliser Orange Money sans compte bancaire ?', 'Non, impossible', 'Oui, c''est justement son avantage', 'Seulement pour recevoir', 'Seulement pour envoyer', 'B', 'Orange Money permet l''inclusion financière des personnes sans compte bancaire.'),
    
    # Cours 9: Faire un transfert d''argent avec Orange Money
    (9, 'Comment envoyer de l''argent avec Orange Money ?', 'Composer #144# et suivre les instructions', 'Aller à la banque', 'Envoyer un SMS normal', 'Appeler le destinataire', 'A', 'Le code USSD #144# permet d''accéder au menu Orange Money.'),
    (9, 'Peut-on envoyer de l''argent à l''étranger avec Orange Money ?', 'Non, jamais', 'Oui, vers certains pays africains et européens', 'Seulement vers la France', 'Seulement vers le Mali', 'B', 'Orange Money permet les transferts internationaux vers plusieurs pays.'),
    (9, 'Combien de temps prend un transfert Orange Money ?', 'Plusieurs jours', 'Quelques secondes à quelques minutes', 'Une semaine', 'Un mois', 'B', 'Les transferts Orange Money sont quasi instantanés.'),
    (9, 'Que faut-il connaître pour envoyer de l''argent ?', 'L''adresse complète du destinataire', 'Le numéro de téléphone Orange du destinataire', 'Son numéro de compte bancaire', 'Son lieu de naissance', 'B', 'Il suffit de connaître le numéro Orange Money du destinataire.'),
    (9, 'Y a-t-il des frais pour les transferts ?', 'Non, c''est toujours gratuit', 'Oui, des frais variables selon le montant', 'Seulement pour les gros montants', 'Seulement le week-end', 'B', 'Les frais dépendent du montant transféré, selon un barème.'),
    (9, 'Peut-on annuler un transfert Orange Money ?', 'Oui, à tout moment', 'Non, une fois envoyé c''est définitif', 'Seulement dans les 24h', 'Seulement si le destinataire accepte', 'B', 'Il faut vérifier les informations avant d''envoyer car c''est irréversible.'),
    
    # Cours 10: Les bases du Mobile Money pour votre commerce
    (10, 'Pourquoi accepter le Mobile Money dans son commerce ?', 'Pour compliquer les choses', 'Pour augmenter les ventes en offrant plus de moyens de paiement', 'Pour payer plus de taxes', 'Pour faire comme les autres', 'B', 'Plus de moyens de paiement = plus de clients satisfaits = plus de ventes.'),
    (10, 'Quels sont les principaux opérateurs de Mobile Money en Côte d''Ivoire ?', 'Seulement Orange', 'Orange Money, MTN Mobile Money, Moov Money', 'Seulement les banques', 'Il n''y en a pas', 'B', 'Les trois principaux opérateurs sont Orange, MTN et Moov.'),
    (10, 'Comment recevoir un paiement Mobile Money dans son commerce ?', 'Donner son numéro de téléphone au client', 'Le client envoie l''argent sur votre numéro Mobile Money', 'Aller à la banque ensemble', 'Attendre un chèque', 'B', 'Le client effectue un transfert vers le numéro Mobile Money du commerçant.'),
    (10, 'Quel est l''avantage du Mobile Money par rapport au cash ?', 'C''est plus lourd à transporter', 'C''est plus sûr (pas de risque de vol, pas de fausse monnaie)', 'C''est plus lent', 'C''est plus compliqué', 'B', 'Le Mobile Money élimine les risques liés à l''argent liquide.'),
    (10, 'Faut-il un équipement spécial pour accepter le Mobile Money ?', 'Oui, une machine très chère', 'Non, juste un téléphone avec un compte Mobile Money', 'Oui, un ordinateur obligatoire', 'Oui, une connexion internet haut débit', 'B', 'Un simple téléphone avec un compte Mobile Money suffit pour commencer.'),
    (10, 'Comment retirer l''argent reçu en Mobile Money ?', 'Ce n''est pas possible', 'Chez un agent agréé ou en boutique opérateur', 'Seulement à la banque centrale', 'Seulement une fois par an', 'B', 'On peut retirer son argent chez les agents et boutiques des opérateurs.'),
    (10, 'Quel est le risque principal du Mobile Money pour un commerçant ?', 'Perdre tout son argent', 'Se tromper de numéro lors d''un transfert', 'Payer trop d''impôts', 'Avoir trop de clients', 'B', 'Il faut toujours vérifier le numéro avant de valider une transaction.'),
]

# Insert questions
for q in questions:
    cursor.execute("""
        INSERT INTO quizzes (courseId, question, optionA, optionB, optionC, optionD, correctAnswer, explanation)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """, q)

conn.commit()
print(f"✅ {len(questions)} questions insérées avec succès !")

cursor.close()
conn.close()
