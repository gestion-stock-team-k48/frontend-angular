#!/usr/bin/env node
// Jeu de données de démonstration.
//
// Il ne touche ni la base ni le backend : tout passe par l'API publique, avec les mêmes
// appels que ferait l'interface. Les règles métier — unicité des codes, transitions d'état,
// mouvements de stock déclenchés par une livraison — sont donc appliquées par le serveur,
// et les données produites sont cohérentes par construction plutôt que par déclaration.
//
// Usage : ./scripts/seed.sh   (ou : node scripts/seed.mjs)

const CONFIG = {
  api: process.env.SEED_API ?? 'http://localhost:8080/api/v1',
  mailpit: process.env.SEED_MAILPIT ?? 'http://localhost:8025',
  motDePasse: process.env.SEED_MOT_DE_PASSE ?? 'GestionStock2026!',
  entreprises: Number(process.env.SEED_ENTREPRISES ?? 12),
  categories: Number(process.env.SEED_CATEGORIES ?? 12),
  articles: Number(process.env.SEED_ARTICLES ?? 150),
  clients: Number(process.env.SEED_CLIENTS ?? 24),
  fournisseurs: Number(process.env.SEED_FOURNISSEURS ?? 10),
  utilisateurs: Number(process.env.SEED_UTILISATEURS ?? 5),
  commandesFournisseur: Number(process.env.SEED_COMMANDES_FOURNISSEUR ?? 14),
  commandesClient: Number(process.env.SEED_COMMANDES_CLIENT ?? 28),
  ventes: Number(process.env.SEED_VENTES ?? 30),
  parallelisme: Number(process.env.SEED_PARALLELISME ?? 6),
  graine: Number(process.env.SEED_GRAINE ?? 20260819),
  // Suffixe appliqué aux emails et aux codes fiscaux. Vide par défaut, pour que deux
  // exécutions sur une base vierge donnent exactement le même jeu ; à renseigner pour
  // ajouter des entreprises à une base qui en contient déjà.
  etiquette: process.env.SEED_ETIQUETTE ?? '',
};

// ── Hasard reproductible ────────────────────────────────────────────────────────────────
// Un tirage déterministe : deux exécutions sur une base vierge donnent le même jeu, ce qui
// rend une capture d'écran ou un test manuel rejouable.
let etatHasard = CONFIG.graine;

function hasard() {
  etatHasard = (etatHasard * 1664525 + 1013904223) % 4294967296;
  return etatHasard / 4294967296;
}

const entier = (min, max) => min + Math.floor(hasard() * (max - min + 1));
const choisir = (liste) => liste[Math.floor(hasard() * liste.length)];
const parfois = (probabilite) => hasard() < probabilite;

/** Mélange une copie de la liste, sans toucher l'originale. */
function melanger(liste) {
  const copie = [...liste];
  for (let i = copie.length - 1; i > 0; i -= 1) {
    const j = Math.floor(hasard() * (i + 1));
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }
  return copie;
}

// ── Vocabulaire ─────────────────────────────────────────────────────────────────────────
const VILLES = [
  'Douala',
  'Yaoundé',
  'Bafoussam',
  'Garoua',
  'Bamenda',
  'Maroua',
  'Ngaoundéré',
  'Bertoua',
  'Kribi',
  'Limbé',
  'Edéa',
  'Dschang',
];

const PRENOMS = [
  'Alice',
  'Serge',
  'Aminata',
  'Jordan',
  'Chantal',
  'Bertrand',
  'Nadège',
  'Yves',
  'Solange',
  'Patrick',
  'Estelle',
  'Armand',
  'Léonie',
  'Cyrille',
  'Mireille',
  'Blaise',
  'Josiane',
  'Rodrigue',
  'Carine',
  'Franck',
  'Sylvie',
  'Ernest',
  'Brigitte',
  'Landry',
];

const NOMS = [
  'Ngono',
  'Fokou',
  'Mbarga',
  'Tchoumi',
  'Essomba',
  'Kamdem',
  'Ateba',
  'Njoya',
  'Nkoulou',
  'Bello',
  'Owona',
  'Talla',
  'Manga',
  'Sadjo',
  'Eyenga',
  'Fotso',
];

const ENTREPRISES = [
  [
    'Quincaillerie du Centre',
    'quincaillerie-centre',
    'Quincaillerie générale et matériaux de finition.',
  ],
  ['Comptoir Bâti Douala', 'comptoir-bati', 'Négoce de matériaux de construction.'],
  ['Électro Sanaga', 'electro-sanaga', 'Matériel électrique et éclairage.'],
  ['Plomberie Wouri', 'plomberie-wouri', 'Sanitaire, robinetterie et raccords.'],
  ['Peintures Mont Fébé', 'peintures-febe', 'Peintures, enduits et outillage de finition.'],
  ['Agro Fournitures Noun', 'agro-noun', 'Intrants et petit matériel agricole.'],
  ['Papeterie Étoile', 'papeterie-etoile', 'Fournitures de bureau et scolaire.'],
  ['Froid Service Littoral', 'froid-littoral', 'Climatisation et froid commercial.'],
  ['Auto Pièces Mfoundi', 'auto-mfoundi', 'Pièces détachées et lubrifiants.'],
  ['Bois et Panneaux Kadey', 'bois-kadey', 'Bois de charpente, panneaux et dérivés.'],
  ['Textiles Adamaoua', 'textiles-adamaoua', 'Tissus, mercerie et confection.'],
  ['Médical Plus Bénoué', 'medical-benoue', 'Consommables et petit matériel médical.'],
  ['Sanitaire Moungo', 'sanitaire-moungo', 'Équipements sanitaires et carrelage.'],
  ['Outillage Pro Nkam', 'outillage-nkam', 'Outillage professionnel et électroportatif.'],
];

/** Familles d'articles : chaque catégorie porte ses propres bases de désignation. */
const FAMILLES = [
  [
    'Ciment et liants',
    ['Ciment CPJ 35', 'Ciment CPJ 42', 'Chaux hydraulique', 'Mortier-colle', 'Enduit de lissage'],
    4500,
    9000,
  ],
  [
    'Fers et aciers',
    ['Fer à béton 8', 'Fer à béton 10', 'Fer à béton 12', 'Treillis soudé', 'Cornière acier'],
    3000,
    26000,
  ],
  [
    'Peintures',
    [
      'Peinture acrylique 5 L',
      'Peinture glycéro 5 L',
      'Sous-couche 10 L',
      'Vernis incolore 1 L',
      'Diluant 1 L',
    ],
    2500,
    32000,
  ],
  [
    'Plomberie',
    ['Tube PVC 63', 'Coude PVC 90°', 'Robinet mitigeur', 'Siphon lavabo', 'Colle PVC 250 g'],
    800,
    28000,
  ],
  [
    'Électricité',
    [
      'Câble 2,5 mm²',
      'Disjoncteur 16 A',
      'Interrupteur simple',
      'Prise 2P+T',
      'Tableau 12 modules',
    ],
    900,
    34000,
  ],
  [
    'Éclairage',
    [
      'Ampoule LED 9 W',
      'Réglette LED 1,2 m',
      'Projecteur 50 W',
      'Douille E27',
      'Détecteur de présence',
    ],
    700,
    22000,
  ],
  [
    'Outillage à main',
    [
      'Marteau 500 g',
      'Tournevis plat',
      'Pince universelle',
      'Mètre ruban 5 m',
      'Niveau à bulle 60 cm',
    ],
    1200,
    14000,
  ],
  [
    'Outillage électroportatif',
    [
      'Perceuse 650 W',
      'Meuleuse 125 mm',
      'Scie sauteuse',
      'Ponceuse orbitale',
      'Visseuse sans fil',
    ],
    18000,
    95000,
  ],
  [
    'Quincaillerie',
    [
      'Vis à bois 4x40',
      'Cheville nylon 8',
      'Charnière 100 mm',
      'Cadenas 40 mm',
      'Serrure encastrée',
    ],
    300,
    18000,
  ],
  [
    'Sanitaire',
    ['Lavabo céramique', 'WC complet', 'Receveur de douche', 'Miroir 60 cm', 'Porte-serviettes'],
    9000,
    140000,
  ],
  [
    'Carrelage',
    [
      'Carreau 30x30',
      'Carreau 60x60',
      'Plinthe céramique',
      'Croisillon 3 mm',
      'Joint de carrelage 5 kg',
    ],
    900,
    12000,
  ],
  [
    'Menuiserie',
    ['Planche 200x20', 'Contreplaqué 5 mm', 'Latte 5x5', 'Porte isoplane', 'Paumelle 80 mm'],
    1500,
    42000,
  ],
  [
    'Protection',
    [
      'Casque de chantier',
      'Gants de manutention',
      'Lunettes de protection',
      'Masque anti-poussière',
      'Chaussures de sécurité',
    ],
    1500,
    26000,
  ],
  [
    'Consommables',
    ['Ruban adhésif', 'Bâche 4x5 m', 'Sac poubelle 100 L', 'Chiffon coton 1 kg', 'Papier abrasif'],
    500,
    9000,
  ],
];

// ── Client HTTP ─────────────────────────────────────────────────────────────────────────
class ErreurApi extends Error {
  constructor(methode, chemin, statut, corps) {
    super(`${methode} ${chemin} → ${statut} ${corps}`);
    this.statut = statut;
  }
}

async function appeler(methode, chemin, { corps, jeton } = {}) {
  const entetes = { Accept: 'application/json' };
  if (corps !== undefined) {
    entetes['Content-Type'] = 'application/json';
  }
  if (jeton !== undefined) {
    entetes.Authorization = `Bearer ${jeton}`;
  }

  const reponse = await fetch(`${CONFIG.api}${chemin}`, {
    method: methode,
    headers: entetes,
    body: corps === undefined ? undefined : JSON.stringify(corps),
  });

  const texte = await reponse.text();
  if (!reponse.ok) {
    throw new ErreurApi(methode, chemin, reponse.status, texte.slice(0, 300));
  }
  return texte === '' ? null : JSON.parse(texte);
}

/**
 * Exécute les tâches par vagues : le backend local n'aime pas cent requêtes d'un coup.
 *
 * L'index passé au traitement est celui de l'élément dans la liste entière, pas dans sa
 * vague — un code construit à partir de cet index se répéterait sinon d'une vague à l'autre.
 */
async function parVagues(elements, traitement) {
  const resultats = [];
  for (let debut = 0; debut < elements.length; debut += CONFIG.parallelisme) {
    const vague = elements.slice(debut, debut + CONFIG.parallelisme);
    resultats.push(
      ...(await Promise.all(vague.map((element, rang) => traitement(element, debut + rang)))),
    );
  }
  return resultats;
}

// ── Dates ───────────────────────────────────────────────────────────────────────────────
const AUJOURDHUI = new Date();

/** Date au format attendu par le backend, décalée de `jours` dans le passé. */
function ilYA(jours) {
  const date = new Date(AUJOURDHUI);
  date.setDate(date.getDate() - jours);
  return date.toISOString().slice(0, 10);
}

// ── Mailpit : récupération du mot de passe temporaire ────────────────────────────────────
const patienter = (millisecondes) => new Promise((suite) => setTimeout(suite, millisecondes));

/**
 * L'email part de façon asynchrone : au premier regard, la boîte est parfois encore vide.
 * Quelques tentatives espacées suffisent, plutôt que de laisser un compte sur son mot de
 * passe temporaire pour une demi-seconde de retard.
 */
async function motDePasseTemporaire(email, tentatives = 6) {
  const liste = await fetch(`${CONFIG.mailpit}/api/v1/search?query=${encodeURIComponent(email)}`);
  if (!liste.ok) {
    throw new Error(`Mailpit a répondu ${liste.status}`);
  }

  const { messages } = await liste.json();
  const message = messages?.[0];
  if (message === undefined) {
    if (tentatives <= 1) {
      throw new Error(`aucun email reçu pour ${email}`);
    }
    await patienter(500);
    return motDePasseTemporaire(email, tentatives - 1);
  }

  const detail = await (await fetch(`${CONFIG.mailpit}/api/v1/message/${message.ID}`)).json();
  const contenu = `${detail.HTML ?? ''}${detail.Text ?? ''}`;
  const trouve = /Mot de passe temporaire\s*:\s*(?:<strong[^>]*>)?\s*([A-Z0-9]{6,})/u.exec(contenu);

  if (trouve === null) {
    throw new Error(`mot de passe temporaire introuvable dans l'email de ${email}`);
  }
  return trouve[1];
}

// ── Construction d'une entreprise ───────────────────────────────────────────────────────
async function creerEntreprise(rang) {
  const [nom, slug, description] = ENTREPRISES[rang % ENTREPRISES.length];
  const suffixe = rang >= ENTREPRISES.length ? ` ${Math.floor(rang / ENTREPRISES.length) + 1}` : '';
  const domaine = `${slug}${suffixe === '' ? '' : rang}${CONFIG.etiquette}`;
  const ville = VILLES[rang % VILLES.length];

  const inscription = await appeler('POST', '/auth/register', {
    corps: {
      nomEntreprise: `${nom}${suffixe}`,
      description,
      codeFiscal: `M${String(102030 + rang * 7919).padStart(9, '0')}${CONFIG.etiquette}`,
      email: `contact@${domaine}.cm`,
      numTel: `+2376${String(50000000 + rang * 131071).slice(0, 8)}`,
      siteWeb: `https://www.${domaine}.cm`,
      rue: `${entier(1, 300)} rue du Marché`,
      ville,
      codePostal: String(entier(1000, 9999)),
      pays: 'Cameroun',
      nomAdmin: NOMS[rang % NOMS.length],
      prenomAdmin: PRENOMS[rang % PRENOMS.length],
      emailAdmin: `admin@${domaine}.cm`,
      motDePasse: CONFIG.motDePasse,
    },
  });

  return { nom: `${nom}${suffixe}`, domaine, ville, jeton: inscription.token };
}

async function creerCategories(jeton) {
  const familles = melanger(FAMILLES).slice(0, Math.min(CONFIG.categories, FAMILLES.length));

  return parVagues(familles, async (famille, index) => {
    const [libelle] = famille;
    const categorie = await appeler('POST', '/categories', {
      jeton,
      corps: { code: `CAT-${String(index + 1).padStart(2, '0')}`, designation: libelle },
    });
    return { ...categorie, famille };
  });
}

async function creerArticles(jeton, categories) {
  const demandes = [];

  for (let rang = 0; rang < CONFIG.articles; rang += 1) {
    const categorie = categories[rang % categories.length];
    const [, bases, prixMin, prixMax] = categorie.famille;
    const base = bases[Math.floor(rang / categories.length) % bases.length];
    const variante = 1 + Math.floor(rang / (categories.length * bases.length));

    const prixHt = entier(prixMin, prixMax);
    const tauxTva = 19.25;

    demandes.push({
      code: `ART-${String(rang + 1).padStart(4, '0')}`,
      designation: variante === 1 ? base : `${base} — modèle ${variante}`,
      prixUnitaireHt: prixHt,
      tauxTva,
      prixUnitaireTtc: Math.round(prixHt * (1 + tauxTva / 100)),
      seuilMinimum: entier(5, 40),
      categoryId: categorie.id,
    });
  }

  return parVagues(demandes, (corps) => appeler('POST', '/articles', { jeton, corps }));
}

function personne(domaine, rang, prefixe) {
  const prenom = PRENOMS[(rang * 3) % PRENOMS.length];
  const nom = NOMS[(rang * 5) % NOMS.length];

  return {
    nom,
    prenom,
    email: `${prefixe}${rang + 1}@${domaine}.cm`,
    numTel: `+2376${String(70000000 + rang * 65537).slice(0, 8)}`,
    rue: `${entier(1, 200)} avenue ${choisir(['Kennedy', 'de la Réunification', 'Charles Atangana', 'du Lac'])}`,
    ville: choisir(VILLES),
    codePostal: String(entier(1000, 9999)),
    pays: 'Cameroun',
  };
}

async function creerTiers(jeton, domaine) {
  const clients = await parVagues(
    Array.from({ length: CONFIG.clients }, (_, rang) => personne(domaine, rang, 'client')),
    (corps) => appeler('POST', '/clients', { jeton, corps }),
  );

  const fournisseurs = await parVagues(
    Array.from({ length: CONFIG.fournisseurs }, (_, rang) =>
      personne(domaine, rang, 'fournisseur'),
    ),
    (corps) => appeler('POST', '/fournisseurs', { jeton, corps }),
  );

  return { clients, fournisseurs };
}

/**
 * Crée les comptes, puis remplace leur mot de passe temporaire par le mot de passe commun.
 *
 * Le backend ne permet pas de choisir le mot de passe à la création : il en génère un et
 * l'envoie par email. Le seul chemin honnête pour obtenir un mot de passe unique passe donc
 * par la boîte de réception de développement, puis par `POST /utilisateurs/change-password`,
 * exactement comme le ferait la personne à sa première connexion.
 */
async function creerUtilisateurs(jeton, domaine) {
  const comptes = Array.from({ length: CONFIG.utilisateurs }, (_, rang) => ({
    ...personne(domaine, rang + 40, 'equipe'),
    dateDeNaissance: `19${entier(70, 99)}-${String(entier(1, 12)).padStart(2, '0')}-${String(entier(1, 28)).padStart(2, '0')}`,
    roles: rang === 0 ? ['ROLE_USER', 'ROLE_ADMIN'] : ['ROLE_USER'],
  }));

  const crees = await parVagues(comptes, (corps) =>
    appeler('POST', '/utilisateurs', { jeton, corps }),
  );

  let alignes = 0;
  for (const compte of crees) {
    try {
      const temporaire = await motDePasseTemporaire(compte.email);
      const session = await appeler('POST', '/auth/authenticate', {
        corps: { email: compte.email, motDePasse: temporaire },
      });
      await appeler('POST', '/utilisateurs/change-password', {
        jeton: session.token,
        corps: { oldPassword: temporaire, newPassword: CONFIG.motDePasse },
      });
      alignes += 1;
    } catch (erreur) {
      console.warn(
        `      ! mot de passe laissé temporaire pour ${compte.email} : ${erreur.message}`,
      );
    }
  }

  return { crees, alignes };
}

/**
 * Stock initial.
 *
 * Une part des articles reste volontairement sous son seuil, et quelques-uns à zéro : sans
 * eux, l'écran des alertes et le tableau de bord seraient vides, ce qui est le cas le moins
 * intéressant à regarder.
 */
async function poserStockInitial(jeton, articles, stock) {
  const mouvements = [];

  for (const article of articles) {
    const seuil = article.seuilMinimum ?? 10;
    let quantite;

    if (parfois(0.06)) {
      quantite = 0;
    } else if (parfois(0.12)) {
      quantite = entier(1, Math.max(1, seuil - 1));
    } else {
      quantite = entier(seuil * 2, seuil * 6);
    }

    stock.set(article.id, quantite);
    if (quantite > 0) {
      mouvements.push({ articleId: article.id, quantite, sourceMvt: 'STOCK_INITIAL' });
    }
  }

  await parVagues(mouvements, (corps) =>
    appeler('POST', '/mouvements-stock/entree', { jeton, corps }),
  );
  return mouvements.length;
}

function lignesAleatoires(articles, nombre) {
  return melanger(articles)
    .slice(0, nombre)
    .map((article) => ({ articleId: article.id, quantite: entier(1, 12) }));
}

async function creerCommandesFournisseur(jeton, articles, fournisseurs, stock) {
  const etats = { EN_PREPARATION: 0, VALIDEE: 0, LIVREE: 0, ANNULEE: 0 };

  for (let rang = 0; rang < CONFIG.commandesFournisseur; rang += 1) {
    const lignes = lignesAleatoires(articles, entier(2, 6));
    const commande = await appeler('POST', '/commandes-fournisseur', {
      jeton,
      corps: {
        dateCommande: ilYA(entier(30, 240)),
        idFournisseur: choisir(fournisseurs).id,
        lignes,
      },
    });

    // Une commande d'approvisionnement finit le plus souvent livrée : c'est elle qui remplit
    // le stock que les commandes client viendront ensuite entamer.
    const sort = hasard();
    if (sort < 0.65) {
      await changerEtat(jeton, '/commandes-fournisseur', commande.id, 'VALIDEE');
      await changerEtat(jeton, '/commandes-fournisseur', commande.id, 'LIVREE');
      for (const ligne of lignes) {
        stock.set(ligne.articleId, (stock.get(ligne.articleId) ?? 0) + ligne.quantite);
      }
      etats.LIVREE += 1;
    } else if (sort < 0.85) {
      await changerEtat(jeton, '/commandes-fournisseur', commande.id, 'VALIDEE');
      etats.VALIDEE += 1;
    } else if (sort < 0.93) {
      await changerEtat(jeton, '/commandes-fournisseur', commande.id, 'ANNULEE');
      etats.ANNULEE += 1;
    } else {
      etats.EN_PREPARATION += 1;
    }
  }

  return etats;
}

async function creerCommandesClient(jeton, articles, clients, stock) {
  const etats = { EN_PREPARATION: 0, VALIDEE: 0, LIVREE: 0, ANNULEE: 0 };

  for (let rang = 0; rang < CONFIG.commandesClient; rang += 1) {
    const lignes = lignesAleatoires(articles, entier(1, 5)).filter(
      (ligne) => (stock.get(ligne.articleId) ?? 0) > 0,
    );
    if (lignes.length === 0) {
      continue;
    }

    const commande = await appeler('POST', '/commandes-client', {
      jeton,
      corps: { dateCommande: ilYA(entier(1, 150)), idClient: choisir(clients).id, lignes },
    });

    const sort = hasard();
    // Une commande n'est livrée que si le stock la couvre vraiment : le serveur refuserait,
    // et un jeu de démonstration n'a pas à s'appuyer sur des erreurs rattrapées.
    const couverte = lignes.every((ligne) => (stock.get(ligne.articleId) ?? 0) >= ligne.quantite);

    if (sort < 0.55 && couverte) {
      await changerEtat(jeton, '/commandes-client', commande.id, 'VALIDEE');
      await changerEtat(jeton, '/commandes-client', commande.id, 'LIVREE');
      for (const ligne of lignes) {
        stock.set(ligne.articleId, (stock.get(ligne.articleId) ?? 0) - ligne.quantite);
      }
      etats.LIVREE += 1;
    } else if (sort < 0.8) {
      await changerEtat(jeton, '/commandes-client', commande.id, 'VALIDEE');
      etats.VALIDEE += 1;
    } else if (sort < 0.9) {
      await changerEtat(jeton, '/commandes-client', commande.id, 'ANNULEE');
      etats.ANNULEE += 1;
    } else {
      etats.EN_PREPARATION += 1;
    }
  }

  return etats;
}

function changerEtat(jeton, base, id, etatCommande) {
  return appeler('PATCH', `${base}/${id}/etat`, { jeton, corps: { etatCommande } });
}

/**
 * Ventes.
 *
 * Le code est fourni ici, alors que l'interface le laisse au serveur. C'est un contournement,
 * et il est dû à un défaut du backend : `uk_ventes_code` est une contrainte d'unicité
 * **globale**, tandis que `generateCode` compte les ventes de l'entreprise courante. La
 * deuxième entreprise produit donc `VT-2026-0001` une seconde fois et se voit refusée. Tant
 * que la contrainte n'inclut pas l'entreprise, un jeu multi-entreprises ne peut pas s'en
 * remettre à la génération automatique. Écart consigné dans `docs/06-API-CONTRAT.md`.
 */
async function creerVentes(jeton, articles, stock, rangEntreprise) {
  const commentaires = [
    'Vente comptoir',
    'Client de passage',
    'Chantier Akwa',
    'Livraison sur place',
    'Règlement espèces',
    'Commande téléphonique',
    null,
  ];

  let posees = 0;

  for (let rang = 0; rang < CONFIG.ventes; rang += 1) {
    const lignes = melanger(articles)
      .slice(0, entier(1, 4))
      .map((article) => {
        const disponible = stock.get(article.id) ?? 0;
        return { articleId: article.id, quantite: Math.min(disponible, entier(1, 5)) };
      })
      .filter((ligne) => ligne.quantite > 0);

    if (lignes.length === 0) {
      continue;
    }

    const commentaire = choisir(commentaires);
    const code = `VT-${AUJOURDHUI.getFullYear()}-${String(rangEntreprise + 1).padStart(2, '0')}${String(posees + 1).padStart(3, '0')}${CONFIG.etiquette}`;

    await appeler('POST', '/ventes', {
      jeton,
      corps: { code, ...(commentaire === null ? {} : { commentaire }), lignes },
    });

    for (const ligne of lignes) {
      stock.set(ligne.articleId, (stock.get(ligne.articleId) ?? 0) - ligne.quantite);
    }
    posees += 1;
  }

  return posees;
}

async function corrections(jeton, articles, stock) {
  const motifs = ['Inventaire annuel', 'Casse en manutention', 'Erreur de saisie', 'Retour client'];
  let posees = 0;

  for (const article of melanger(articles).slice(0, 8)) {
    const disponible = stock.get(article.id) ?? 0;
    const negative = disponible > 3 && parfois(0.5);
    const quantite = negative ? entier(1, 3) : entier(1, 10);

    await appeler('POST', `/mouvements-stock/correction-${negative ? 'negative' : 'positive'}`, {
      jeton,
      corps: { articleId: article.id, quantite, motif: choisir(motifs) },
    });

    stock.set(article.id, disponible + (negative ? -quantite : quantite));
    posees += 1;
  }

  return posees;
}

/**
 * Passe de rattrapage : remet au mot de passe commun les comptes restés sur leur mot de passe
 * temporaire, quelle qu'en soit la raison — email en retard, exécution interrompue.
 */
async function aligner() {
  console.log(`Rattrapage des mots de passe → ${CONFIG.api}\n`);
  let alignes = 0;
  let restants = 0;

  for (let rang = 0; rang < CONFIG.entreprises; rang += 1) {
    const [, slug] = ENTREPRISES[rang % ENTREPRISES.length];
    const suffixe = rang >= ENTREPRISES.length ? rang : '';
    const domaine = `${slug}${suffixe}${CONFIG.etiquette}`;

    let jeton;
    try {
      const session = await appeler('POST', '/auth/authenticate', {
        corps: { email: `admin@${domaine}.cm`, motDePasse: CONFIG.motDePasse },
      });
      jeton = session.token;
    } catch {
      console.warn(`  ! entreprise ${domaine} introuvable, ignorée`);
      continue;
    }

    const page = await appeler('GET', '/utilisateurs?page=0&size=200', { jeton });
    const aRegler = (page.content ?? []).filter((compte) => compte.mustChangePassword === true);

    for (const compte of aRegler) {
      try {
        const temporaire = await motDePasseTemporaire(compte.email);
        const session = await appeler('POST', '/auth/authenticate', {
          corps: { email: compte.email, motDePasse: temporaire },
        });
        await appeler('POST', '/utilisateurs/change-password', {
          jeton: session.token,
          corps: { oldPassword: temporaire, newPassword: CONFIG.motDePasse },
        });
        alignes += 1;
      } catch (erreur) {
        console.warn(`  ! ${compte.email} : ${erreur.message}`);
        restants += 1;
      }
    }
  }

  console.log(`\n${alignes} compte(s) alignés, ${restants} encore sur un mot de passe temporaire.`);
}

// ── Programme ───────────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`Jeu de démonstration → ${CONFIG.api}`);
  console.log(
    `  ${CONFIG.entreprises} entreprises, mot de passe commun « ${CONFIG.motDePasse} »\n`,
  );

  const debut = Date.now();
  const comptes = [];

  for (let rang = 0; rang < CONFIG.entreprises; rang += 1) {
    const entreprise = await creerEntreprise(rang);
    console.log(`[${rang + 1}/${CONFIG.entreprises}] ${entreprise.nom} (${entreprise.ville})`);

    const jeton = entreprise.jeton;
    const stock = new Map();

    const categories = await creerCategories(jeton);
    const articles = await creerArticles(jeton, categories);
    const { clients, fournisseurs } = await creerTiers(jeton, entreprise.domaine);
    const utilisateurs = await creerUtilisateurs(jeton, entreprise.domaine);
    const entrees = await poserStockInitial(jeton, articles, stock);
    const achats = await creerCommandesFournisseur(jeton, articles, fournisseurs, stock);
    const ventesCommandees = await creerCommandesClient(jeton, articles, clients, stock);
    const ventes = await creerVentes(jeton, articles, stock, rang);
    const ajustements = await corrections(jeton, articles, stock);

    const sousSeuil = articles.filter(
      (article) => (stock.get(article.id) ?? 0) <= (article.seuilMinimum ?? 0),
    ).length;

    console.log(
      `      ${categories.length} catégories · ${articles.length} articles · ${clients.length} clients · ` +
        `${fournisseurs.length} fournisseurs · ${utilisateurs.crees.length} comptes ` +
        `(${utilisateurs.alignes} au mot de passe commun)`,
    );
    console.log(
      `      ${entrees} entrées de stock · ${ajustements} corrections · ${ventes} ventes · ` +
        `${sousSeuil} articles sous seuil`,
    );
    console.log(
      `      commandes fournisseur ${resume(achats)} · commandes client ${resume(ventesCommandees)}`,
    );

    comptes.push(`admin@${entreprise.domaine}.cm`);
  }

  const duree = Math.round((Date.now() - debut) / 1000);
  console.log(`\nTerminé en ${duree} s.`);
  console.log(
    `Se connecter avec l'un de ces comptes et le mot de passe « ${CONFIG.motDePasse} » :`,
  );
  for (const compte of comptes) {
    console.log(`  ${compte}`);
  }
}

const resume = (etats) =>
  Object.entries(etats)
    .filter(([, nombre]) => nombre > 0)
    .map(([etat, nombre]) => `${nombre} ${etat.toLowerCase().replace('_', ' ')}`)
    .join(', ');

const programme = process.env.SEED_ALIGNEMENT === '1' ? aligner : main;

programme().catch((erreur) => {
  console.error(`\nÉchec : ${erreur.message}`);
  console.error('Vérifier que le backend et Mailpit tournent, et que la base est vierge.');
  process.exitCode = 1;
});
