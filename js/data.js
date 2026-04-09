// ============================================================
//  VexxyRep — BASE DE DONNÉES
//
//  ► AJOUTER un produit    : copie un objet et modifie les champs
//  ► SUPPRIMER un produit  : retire l'objet du tableau PRODUCTS
//  ► MODIFIER un produit   : change directement la valeur du champ
//  ► AJOUTER une catégorie : ajoute { id, label } dans CATEGORIES
//                            puis utilise ce même id dans un produit
//
//  Chaque produit doit avoir un "id" unique (nombre entier).
// ============================================================

// ---- Configuration générale du site ----
const SITE_CONFIG = {
  name: "VexxyRep",
  discordUrl: "https://discord.gg/TON_LIEN_ICI",   // ← Remplace par ton lien Discord
  tiktokUrl:  "https://www.tiktok.com/@TON_COMPTE", // ← Remplace par ton lien TikTok
};

// ---- Catégories ----
const CATEGORIES = [
  { id: "all",         label: "Tous" },
  { id: "tshirts",     label: "T-Shirts" },
  { id: "hoodies",     label: "Hoodies" },
  { id: "pantalons",   label: "Pantalons" },
  { id: "vestes",      label: "Vestes" },
  { id: "accessoires", label: "Accessoires" },
];

// ---- Produits ----
// Champs :
//   id          → identifiant unique (nombre)
//   name        → nom affiché sur la carte
//   category    → doit correspondre à un id de CATEGORIES (sauf "all")
//   description → courte description (1-2 phrases max)
//   image       → URL de l'image (locale : "images/photo.jpg" ou distante)
//   link        → URL copiée quand on clique sur "Copier le lien"
//   price       → prix affiché (string, ex : "49.99€")

const PRODUCTS = [
  // ——————————————
  //  T-SHIRTS
  // ——————————————
  {
    id: 1,
    name: "T-Shirt Forest Wash",
    category: "tshirts",
    description: "T-shirt oversize délavé, coton épais 300g. Coupe boxy relaxed, parfaite pour toutes les saisons.",
    image: "https://picsum.photos/seed/vexxyrep-ts1/400/500",
    link: "https://exemple.com/produits/tshirt-forest-wash",
    price: "34.99€",
  },
  {
    id: 2,
    name: "T-Shirt Graphic VexxyRep",
    category: "tshirts",
    description: "Sérigraphie nature exclusive sur coton bio. Coupe regular, tombé impeccable.",
    image: "https://picsum.photos/seed/vexxyrep-ts2/400/500",
    link: "https://exemple.com/produits/tshirt-graphic-vexxyrep",
    price: "39.99€",
  },
  {
    id: 3,
    name: "T-Shirt Essential",
    category: "tshirts",
    description: "Le basique incontournable. Coton peigné doux, col rond coupé droit.",
    image: "https://picsum.photos/seed/vexxyrep-ts3/400/500",
    link: "https://exemple.com/produits/tshirt-essential",
    price: "29.99€",
  },

  // ——————————————
  //  HOODIES
  // ——————————————
  {
    id: 4,
    name: "Hoodie Forêt Profonde",
    category: "hoodies",
    description: "Hoodie oversize premium, intérieur molleton brushé ultra-doux. Broderie forêt au chest.",
    image: "https://picsum.photos/seed/vexxyrep-hd1/400/500",
    link: "https://exemple.com/produits/hoodie-foret",
    price: "79.99€",
  },
  {
    id: 5,
    name: "Sweat Crewneck VexxyRep",
    category: "hoodies",
    description: "Crewneck épais 380g, broderie ton-sur-ton. Un classique intemporel revisité.",
    image: "https://picsum.photos/seed/vexxyrep-hd2/400/500",
    link: "https://exemple.com/produits/sweat-crewneck",
    price: "64.99€",
  },
  {
    id: 6,
    name: "Hoodie Zip Premium",
    category: "hoodies",
    description: "Zip full-length, tissu lourd 400g. Poche zippée intérieure, capuche double épaisseur.",
    image: "https://picsum.photos/seed/vexxyrep-hd3/400/500",
    link: "https://exemple.com/produits/hoodie-zip",
    price: "84.99€",
  },

  // ——————————————
  //  PANTALONS
  // ——————————————
  {
    id: 7,
    name: "Cargo Techno",
    category: "pantalons",
    description: "Cargo multi-poches en ripstop technique résistant. Coupe tapered moderne.",
    image: "https://picsum.photos/seed/vexxyrep-pt1/400/500",
    link: "https://exemple.com/produits/cargo-techno",
    price: "89.99€",
  },
  {
    id: 8,
    name: "Jogger Lounge",
    category: "pantalons",
    description: "Pantalon de confort absolu, ceinture élastique large. Pour la détente comme la rue.",
    image: "https://picsum.photos/seed/vexxyrep-pt2/400/500",
    link: "https://exemple.com/produits/jogger-lounge",
    price: "54.99€",
  },

  // ——————————————
  //  VESTES
  // ——————————————
  {
    id: 9,
    name: "Veste Bomber VexxyRep",
    category: "vestes",
    description: "Bomber satin réversible avec broderie signature au dos. Pièce iconique de la collection.",
    image: "https://picsum.photos/seed/vexxyrep-vj1/400/500",
    link: "https://exemple.com/produits/bomber-vexxyrep",
    price: "119.99€",
  },
  {
    id: 10,
    name: "Veste Coupe-Vent",
    category: "vestes",
    description: "Coupe-vent technique légère et imperméable. Packable en poche, idéale en toutes conditions.",
    image: "https://picsum.photos/seed/vexxyrep-vj2/400/500",
    link: "https://exemple.com/produits/coupe-vent",
    price: "99.99€",
  },

  // ——————————————
  //  ACCESSOIRES
  // ——————————————
  {
    id: 11,
    name: "Casquette Leaf",
    category: "accessoires",
    description: "Dad hat 5 panneaux en coton lavé, broderie feuille. Réglage velcro. Unisexe.",
    image: "https://picsum.photos/seed/vexxyrep-ac1/400/500",
    link: "https://exemple.com/produits/casquette-leaf",
    price: "29.99€",
  },
  {
    id: 12,
    name: "Tote Bag VexxyRep",
    category: "accessoires",
    description: "Tote 100% coton épais sérigraphié. Parfait pour le quotidien, solide et élégant.",
    image: "https://picsum.photos/seed/vexxyrep-ac2/400/500",
    link: "https://exemple.com/produits/tote-bag",
    price: "19.99€",
  },
];
