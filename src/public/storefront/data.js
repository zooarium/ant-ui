// Dummy storefront data — shaped EXACTLY like the future
// `GET /public/storefront` response (ant order-intake, guest-token scoped).
// TenantHomePage renders only from this object, so swapping to the live endpoint
// later is a one-line data-source change (fetch → setState) with no UI churn.
//
// HD imagery uses Unsplash hotlinks for the mock; the live endpoint will return
// tenant-supplied asset URLs. Ratings.google is synced from Google Places by the
// backend on a schedule and served inside this payload.
const img = (id, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const STOREFRONT = {
  name: 'Saffron & Sage',
  tagline: 'Modern Indian kitchen — fire, spice, and soul on every plate.',
  branding: {
    logo: '',
    primaryColor: '#b8482e',
    heroImage: img('1517248135467-4c7edcad34c4', 2000), // restaurant interior
  },

  about: {
    heading: 'Where tradition meets the flame',
    body:
      'For over two decades, Saffron & Sage has served slow-cooked curries, ' +
      'tandoor-charred breads, and seasonal plates built from produce sourced ' +
      'each morning. Our kitchen blends heirloom family recipes with a modern, ' +
      'ingredient-led approach — bold, balanced, and unmistakably ours.',
    highlights: [
      { label: 'Est. 2003', detail: '20+ years serving the neighbourhood' },
      { label: 'Farm to table', detail: 'Produce sourced fresh daily' },
      { label: 'Tandoor fired', detail: 'Clay-oven breads & kebabs' },
      { label: 'Halal certified', detail: 'Ethically sourced meats' },
    ],
  },

  menu: {
    categories: [
      {
        name: 'Starters',
        items: [
          {
            name: 'Tandoori Wings',
            desc: 'Yoghurt-marinated, charred in the clay oven, mint chutney.',
            price: '£8.50',
            tags: ['spicy', 'gf'],
            image: img('1606491956689-2ea866880c84', 600),
          },
          {
            name: 'Paneer Tikka',
            desc: 'Cottage cheese, bell pepper, smoked chilli glaze.',
            price: '£7.90',
            tags: ['veg'],
            image: img('1567188040759-fb8a883dc6d8', 600),
          },
          {
            name: 'Samosa Chaat',
            desc: 'Crushed samosa, chickpeas, tamarind, yoghurt, sev.',
            price: '£6.50',
            tags: ['veg'],
            image: img('1601050690597-df0568f70950', 600),
          },
        ],
      },
      {
        name: 'Mains',
        items: [
          {
            name: 'Butter Chicken',
            desc: 'Tandoori chicken, silky tomato-fenugreek gravy, cream.',
            price: '£14.50',
            tags: ['signature'],
            image: img('1588166524941-3bf61a9c41db', 600),
          },
          {
            name: 'Lamb Rogan Josh',
            desc: 'Slow-braised lamb, Kashmiri chilli, aromatic spices.',
            price: '£16.00',
            tags: ['spicy'],
            image: img('1545247181-516773cae754', 600),
          },
          {
            name: 'Dal Makhani',
            desc: 'Black lentils simmered overnight, butter, cream.',
            price: '£11.50',
            tags: ['veg'],
            image: img('1546833999-b9f581a1996d', 600),
          },
        ],
      },
      {
        name: 'Breads & Sides',
        items: [
          {
            name: 'Garlic Naan',
            desc: 'Hand-stretched, clay-oven baked, fresh garlic & coriander.',
            price: '£3.50',
            tags: ['veg'],
            image: img('1610057099431-d73a1c9d2f2f', 600),
          },
          {
            name: 'Saffron Pilau',
            desc: 'Basmati rice, saffron, whole spices.',
            price: '£4.00',
            tags: ['veg', 'gf'],
            image: img('1516684732162-798a0062be99', 600),
          },
        ],
      },
    ],
  },

  // Per-platform ratings. Each platform carries its own aggregate score/count,
  // a deep link, and its own review cards. Google is synced from Google Places;
  // Swiggy/Zomato from their partner APIs. A platform with an empty `reviews`
  // array still contributes its aggregate (tab shows score only, no cards).
  ratings: {
    platforms: [
      {
        id: 'google',
        name: 'Google',
        score: 4.7,
        count: 1284,
        url: 'https://www.google.com/maps',
        reviews: [
          {
            author: 'Priya M.',
            score: 5,
            text: 'Best butter chicken in the city — rich, smoky, perfectly spiced. The naan is unreal.',
          },
          {
            author: 'James T.',
            score: 5,
            text: 'Cosy spot, attentive staff, and the rogan josh fell apart at the touch of a fork.',
          },
          {
            author: 'Aisha K.',
            score: 4,
            text: 'Great flavours and generous portions. Got busy on a Friday but worth the wait.',
          },
        ],
      },
      {
        id: 'swiggy',
        name: 'Swiggy',
        score: 4.4,
        count: 2310,
        url: 'https://www.swiggy.com',
        reviews: [
          {
            author: 'Rohan D.',
            score: 5,
            text: 'Delivery bang on time and still piping hot. Butter chicken travels really well.',
          },
          {
            author: 'Meera S.',
            score: 4,
            text: 'Generous portions, well packed, no spillage. Garlic naan was a bit soft by arrival.',
          },
          {
            author: 'Karthik V.',
            score: 4,
            text: 'Consistent quality order after order. Dal makhani is the standout for me.',
          },
        ],
      },
      {
        id: 'zomato',
        name: 'Zomato',
        score: 4.5,
        count: 1876,
        url: 'https://www.zomato.com',
        reviews: [
          {
            author: 'Sneha R.',
            score: 5,
            text: 'One of the best Indian spots on Zomato locally. Rogan josh is unreal value.',
          },
          {
            author: 'Daniel O.',
            score: 5,
            text: 'Ordered for a party of six — everything arrived neatly labelled and fresh.',
          },
          {
            author: 'Fatima A.',
            score: 4,
            text: 'Lovely flavours and quick delivery. Wish they offered more dessert options.',
          },
        ],
      },
    ],
  },

  gallery: [
    { src: img('1517248135467-4c7edcad34c4'), alt: 'Dining room' },
    { src: img('1555396273-367ea4eb4db5'), alt: 'Plated curry' },
    { src: img('1414235077428-338989a2e8c0'), alt: 'Table setting' },
    { src: img('1559339352-11d035aa65de'), alt: 'Chef plating' },
    { src: img('1565299624946-b28f40a0ae38'), alt: 'Fresh dishes' },
    { src: img('1551782450-a2132b4ba21d'), alt: 'Grilled platter' },
  ],

  contact: {
    address: '47 Brick Lane, London E1 6QL',
    phone: '+44 20 7946 0123',
    email: 'hello@saffronandsage.co.uk',
    hours: [
      { day: 'Mon', open: '12:00', close: '22:00' },
      { day: 'Tue', open: '12:00', close: '22:00' },
      { day: 'Wed', open: '12:00', close: '22:00' },
      { day: 'Thu', open: '12:00', close: '23:00' },
      { day: 'Fri', open: '12:00', close: '23:30' },
      { day: 'Sat', open: '11:00', close: '23:30' },
      { day: 'Sun', open: '11:00', close: '21:30' },
    ],
    social: [
      { platform: 'instagram', url: 'https://instagram.com' },
      { platform: 'facebook', url: 'https://facebook.com' },
      { platform: 'whatsapp', url: 'https://wa.me/442079460123' },
    ],
  },
};
