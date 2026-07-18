import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// ─── Cloudinary Upload Helper ────────────────────────────
// If Cloudinary keys are set, images are uploaded to Cloudinary and DB stores Cloudinary URLs.
// If keys are NOT set, DB stores local /images/... paths (images served from /public).

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUD_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUD_SECRET = process.env.CLOUDINARY_API_SECRET;
const CLOUD_FOLDER = process.env.CLOUDINARY_UPLOAD_FOLDER || 'naijabites';

const hasCloudinary = !!(CLOUD_NAME && CLOUD_KEY && CLOUD_SECRET);

// Cache: localPath → cloudinaryUrl (avoid re-uploading on re-seed)
const uploadCache = new Map<string, string>();

async function uploadToCloudinary(localPath: string, fallbackPath: string): Promise<string> {
  if (!hasCloudinary) return fallbackPath;

  // Check cache first
  if (uploadCache.has(localPath)) return uploadCache.get(localPath)!;

  const fullPath = path.join(process.cwd(), 'public', localPath);

  // If file doesn't exist on disk, just use the fallback path
  if (!fs.existsSync(fullPath)) {
    console.log(`   ⚠️  File not found: ${localPath} — using fallback path`);
    return fallbackPath;
  }

  try {
    // Dynamically import cloudinary (only when keys are set)
    const { v2: cloudinary } = await import('cloudinary');
    cloudinary.config({
      cloud_name: CLOUD_NAME,
      api_key: CLOUD_KEY,
      api_secret: CLOUD_SECRET,
    });

    const buffer = fs.readFileSync(fullPath);
    const publicId = `${CLOUD_FOLDER}/${localPath.replace(/^\//, '').replace(/\.[^.]+$/, '')}`;

    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            public_id: publicId,
            folder: CLOUD_FOLDER,
            resource_type: 'image',
            transformation: [{ quality: 'auto', fetch_format: 'auto' }],
            overwrite: true, // re-upload if already exists
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result!);
          }
        )
        .end(buffer);
    });

    uploadCache.set(localPath, result.secure_url);
    console.log(`   ☁️  Uploaded: ${localPath} → Cloudinary`);
    return result.secure_url;
  } catch (err) {
    console.log(`   ❌ Cloudinary upload failed for ${localPath}: ${err}`);
    return fallbackPath;
  }
}

async function main() {
  console.log('🌱 Seeding database...\n');

  if (hasCloudinary) {
    console.log('☁️  Cloudinary keys detected — images will be uploaded to Cloudinary\n');
  } else {
    console.log('📁 No Cloudinary keys — images will use local /images/... paths\n');
  }

  // ─── Admin User ─────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@naijabites.ng' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@naijabites.ng',
      password: adminPassword,
      phone: '+2348012345678',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Admin user: ${admin.email}`);

  // ─── Restaurant Owner Users ─────────────────────────
  const ownerPassword = await bcrypt.hash('owner123', 12);
  
  const ownersData = [
    { name: 'Mama Calabar', email: 'mama@calabar.ng', phone: '+2348011111111' },
    { name: 'Alhaji Suya', email: 'suya@spot.ng', phone: '+2348022222222' },
    { name: 'Chef Wok', email: 'wok@roll.ng', phone: '+2348033333333' },
    { name: 'Sharp Sharp', email: 'sharp@sharp.ng', phone: '+2348044444444' },
    { name: 'Zobo Master', email: 'zobo@palace.ng', phone: '+2348055555555' },
  ];

  const owners: Record<string, { id: string }> = {};
  for (const o of ownersData) {
    const record = await prisma.user.upsert({
      where: { email: o.email },
      update: {},
      create: {
        name: o.name,
        email: o.email,
        password: ownerPassword,
        phone: o.phone,
        role: 'RESTAURANT_OWNER',
        status: 'ACTIVE',
      },
    });
    owners[o.email] = record;
    console.log(`✅ Restaurant Owner: ${o.name} (${o.email})`);
  }

  // ─── Customer User ──────────────────────────────────
  const customerPassword = await bcrypt.hash('password123', 12);
  const customer = await prisma.user.upsert({
    where: { email: 'customer@test.com' },
    update: {},
    create: {
      name: 'Chidi Okafor',
      email: 'customer@test.com',
      password: customerPassword,
      phone: '+2348098765432',
      address: '15 Admiralty Way',
      city: 'Lagos',
      state: 'Lagos',
      role: 'CUSTOMER',
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Customer user: ${customer.email}`);

  // ─── Categories ─────────────────────────────────────
  console.log('\n📂 Creating categories...');
  const categoriesData = [
    { name: 'Nigerian', description: 'Traditional Nigerian dishes — jollof rice, suya, pounded yam and more', image: '/images/categories/nigerian.jpg' },
    { name: 'Continental', description: 'European and American-style dishes with a local twist', image: '/images/categories/continental.jpg' },
    { name: 'Chinese', description: 'Authentic Chinese cuisine — stir-fry, noodles, and dim sum', image: '/images/categories/chinese.jpg' },
    { name: 'Fast Food', description: 'Quick bites — burgers, shawarma, pizza, and fries', image: '/images/categories/fast-food.jpg' },
    { name: 'Drinks & Beverages', description: 'Refreshing drinks — zobo, palm wine, smoothies, and cocktails', image: '/images/categories/drinks.jpg' },
    { name: 'Desserts & Snacks', description: 'Sweet treats and small chops — puff-puff, chin chin, and cakes', image: '/images/categories/desserts.jpg' },
  ];

  const categories: Record<string, { id: string }> = {};
  for (const cat of categoriesData) {
    const imageUrl = await uploadToCloudinary(cat.image, cat.image);
    const record = await prisma.category.upsert({
      where: { name: cat.name },
      update: { image: imageUrl },
      create: { ...cat, image: imageUrl },
    });
    categories[cat.name] = record;
    console.log(`✅ Category: ${cat.name}`);
  }

  // ─── Restaurants (with owners linked) ───────────────
  console.log('\n🏪 Creating restaurants...');
  const restaurantsData = [
    {
      name: 'Mama Calabar Kitchen',
      description: 'Authentic Calabar dishes — edikaikong, afang soup, and ofada rice. Taste the real South-South flavour!',
      email: 'info@macalabar.ng',
      phone: '+2348011111111',
      address: '23 Awolowo Road, Ikoyi',
      city: 'Lagos',
      state: 'Lagos',
      openTime: '08:00',
      closeTime: '22:00',
      openDays: 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
      image: '/images/restaurants/mama-calabar.jpg',
      categoryId: categories['Nigerian'].id,
      ownerId: owners['mama@calabar.ng'].id,
      commissionRate: 10,
    },
    {
      name: 'The Suya Spot',
      description: 'The best suya in town! Kilishi, gyro, and spicy grilled meats straight from the north.',
      email: 'hello@suyaspot.ng',
      phone: '+2348022222222',
      address: '45 Allen Avenue, Ikeja',
      city: 'Lagos',
      state: 'Lagos',
      openTime: '10:00',
      closeTime: '23:00',
      openDays: 'Mon,Tue,Wed,Thu,Fri,Sat',
      image: '/images/restaurants/suya-spot.jpg',
      categoryId: categories['Nigerian'].id,
      ownerId: owners['suya@spot.ng'].id,
      commissionRate: 10,
    },
    {
      name: 'Wok & Roll',
      description: 'Premium Chinese cuisine — fried rice, sweet & sour chicken, and hot pot. Wok hey guaranteed!',
      email: 'order@wokroll.ng',
      phone: '+2348033333333',
      address: '12 Akin Adesola Street, Victoria Island',
      city: 'Lagos',
      state: 'Lagos',
      openTime: '11:00',
      closeTime: '22:00',
      openDays: 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
      image: '/images/restaurants/wok-roll.jpg',
      categoryId: categories['Chinese'].id,
      ownerId: owners['wok@roll.ng'].id,
      commissionRate: 10,
    },
    {
      name: 'Sharp Sharp Bites',
      description: 'Fast food, Naija style! Shawarma, burgers, small chops, and everything nice.',
      email: 'info@sharpsarp.ng',
      phone: '+2348044444444',
      address: '8 Opebi Road, Ikeja',
      city: 'Lagos',
      state: 'Lagos',
      openTime: '09:00',
      closeTime: '00:00',
      openDays: 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
      image: '/images/restaurants/sharp-sharp.jpg',
      categoryId: categories['Fast Food'].id,
      ownerId: owners['sharp@sharp.ng'].id,
      commissionRate: 10,
    },
    {
      name: 'Zobo Palace',
      description: 'Chilled zobo, palm wine, smoothies, and the best Chapman in Abuja. Cool vibes only!',
      email: 'drink@zobopalace.ng',
      phone: '+2348055555555',
      address: '55 Aminu Kano Crescent, Wuse 2',
      city: 'Abuja',
      state: 'FCT',
      openTime: '10:00',
      closeTime: '23:00',
      openDays: 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
      image: '/images/restaurants/zobo-palace.jpg',
      categoryId: categories['Drinks & Beverages'].id,
      ownerId: owners['zobo@palace.ng'].id,
      commissionRate: 10,
    },
  ];

  const restaurants: Record<string, { id: string }> = {};
  for (const r of restaurantsData) {
    const imageUrl = await uploadToCloudinary(r.image, r.image);
    const existing = await prisma.restaurant.findFirst({ where: { name: r.name } });
    if (existing) {
      // Update image to Cloudinary URL on re-seed
      await prisma.restaurant.update({ where: { id: existing.id }, data: { image: imageUrl } });
      restaurants[r.name] = existing;
    } else {
      const record = await prisma.restaurant.create({ data: { ...r, image: imageUrl } });
      restaurants[r.name] = record;
    }
    console.log(`✅ Restaurant: ${r.name}`);
  }

  // ─── Food Items ─────────────────────────────────────
  console.log('\n🍽️  Creating food items...');
  const foodsData = [
    // Mama Calabar Kitchen — Nigerian
    { name: 'Jollof Rice & Chicken', description: 'Smoky party jollof rice with succulent fried chicken and plantain', price: 2500, image: '/images/foods/jollof-chicken.jpg', categoryId: categories['Nigerian'].id, restaurantId: restaurants['Mama Calabar Kitchen'].id, isAvailable: true },
    { name: 'Pounded Yam & Egusi', description: 'Smooth pounded yam with rich egusi soup loaded with assorted meat', price: 3000, image: '/images/foods/pounded-yam-egusi.jpg', categoryId: categories['Nigerian'].id, restaurantId: restaurants['Mama Calabar Kitchen'].id, isAvailable: true },
    { name: 'Ofada Rice & Stew', description: 'Local ofada rice with designer ofada stew and assorted meat', price: 2800, image: '/images/foods/ofada-rice.jpg', categoryId: categories['Nigerian'].id, restaurantId: restaurants['Mama Calabar Kitchen'].id, isAvailable: true },
    { name: 'Pepper Soup (Goat)', description: 'Spicy goat meat pepper soup with local spices — perfect for cold evenings', price: 2000, image: '/images/foods/goat-pepper-soup.jpg', categoryId: categories['Nigerian'].id, restaurantId: restaurants['Mama Calabar Kitchen'].id, isAvailable: true },
    { name: 'Edikaikong Soup & Fufu', description: 'Calabar-style edikaikong with waterleaf and ugu served with fufu', price: 3200, image: '/images/foods/edikaikong.jpg', categoryId: categories['Nigerian'].id, restaurantId: restaurants['Mama Calabar Kitchen'].id, isAvailable: true },

    // The Suya Spot — Nigerian
    { name: 'Suya Platter (Beef)', description: 'Spicy grilled beef suya with onions, tomatoes, and yaji spice', price: 1800, image: '/images/foods/suya-beef.jpg', categoryId: categories['Nigerian'].id, restaurantId: restaurants['The Suya Spot'].id, isAvailable: true },
    { name: 'Kilishi', description: 'Dried spicy beef jerky — Hausa-style dried meat snack', price: 1500, image: '/images/foods/kilishi.jpg', categoryId: categories['Nigerian'].id, restaurantId: restaurants['The Suya Spot'].id, isAvailable: true },
    { name: 'Gyro Wrap', description: 'Spicy gyro wrap with grilled chicken, veggies, and sauce', price: 1200, image: '/images/foods/gyro-wrap.jpg', categoryId: categories['Nigerian'].id, restaurantId: restaurants['The Suya Spot'].id, isAvailable: true },
    { name: 'Asun (Spicy Goat)', description: 'Smoky, spicy diced goat meat with peppers — party starter!', price: 2500, image: '/images/foods/asun.jpg', categoryId: categories['Nigerian'].id, restaurantId: restaurants['The Suya Spot'].id, isAvailable: true },

    // Wok & Roll — Chinese
    { name: 'Fried Rice & Chicken', description: 'Classic Chinese-style fried rice with crispy chicken', price: 2000, image: '/images/foods/fried-rice-chicken.jpg', categoryId: categories['Chinese'].id, restaurantId: restaurants['Wok & Roll'].id, isAvailable: true },
    { name: 'Sweet & Sour Chicken', description: 'Crispy chicken in tangy sweet and sour sauce with peppers', price: 2200, image: '/images/foods/sweet-sour.jpg', categoryId: categories['Chinese'].id, restaurantId: restaurants['Wok & Roll'].id, isAvailable: true },
    { name: 'Beef Noodle Soup', description: 'Rich beef broth with hand-pulled noodles and vegetables', price: 1800, image: '/images/foods/beef-noodle.jpg', categoryId: categories['Chinese'].id, restaurantId: restaurants['Wok & Roll'].id, isAvailable: true },

    // Sharp Sharp Bites — Fast Food
    { name: 'Chicken Shawarma', description: 'Loaded chicken shawarma with garlic sauce and veggies', price: 1500, image: '/images/foods/shawarma.jpg', categoryId: categories['Fast Food'].id, restaurantId: restaurants['Sharp Sharp Bites'].id, isAvailable: true },
    { name: 'Beef Burger & Fries', description: 'Juicy beef burger with cheese, lettuce, and crispy fries', price: 1800, image: '/images/foods/burger-fries.jpg', categoryId: categories['Fast Food'].id, restaurantId: restaurants['Sharp Sharp Bites'].id, isAvailable: true },
    { name: 'Small Chops Platter', description: 'Puff-puff, spring rolls, samosa, and peppered gizzard', price: 2500, image: '/images/foods/small-chops.jpg', categoryId: categories['Fast Food'].id, restaurantId: restaurants['Sharp Sharp Bites'].id, isAvailable: true },
    { name: 'Peppered Snail', description: 'Spicy peppered snail — a Nigerian delicacy', price: 3000, image: '/images/foods/peppered-snail.jpg', categoryId: categories['Fast Food'].id, restaurantId: restaurants['Sharp Sharp Bites'].id, isAvailable: true },

    // Zobo Palace — Drinks & Beverages
    { name: 'Fresh Zobo', description: 'Chilled hibiscus drink with ginger and pineapple', price: 500, image: '/images/foods/zobo.jpg', categoryId: categories['Drinks & Beverages'].id, restaurantId: restaurants['Zobo Palace'].id, isAvailable: true },
    { name: 'Chapman', description: 'Classic Nigerian cocktail — Fanta, Sprite, grenadine, and citrus', price: 800, image: '/images/foods/chapman.jpg', categoryId: categories['Drinks & Beverages'].id, restaurantId: restaurants['Zobo Palace'].id, isAvailable: true },
    { name: 'Palm Wine', description: 'Fresh palm wine tapped this morning — the real deal', price: 600, image: '/images/foods/palm-wine.jpg', categoryId: categories['Drinks & Beverages'].id, restaurantId: restaurants['Zobo Palace'].id, isAvailable: true },

    // Desserts & Snacks (cross-restaurant)
    { name: 'Puff-Puff (6 pcs)', description: 'Golden, fluffy Nigerian puff-puff — sweet and crispy', price: 400, image: '/images/foods/puff-puff.jpg', categoryId: categories['Desserts & Snacks'].id, restaurantId: restaurants['Mama Calabar Kitchen'].id, isAvailable: true },
    { name: 'Chin Chin (Pack)', description: 'Crunchy fried snack — the perfect nibble', price: 300, image: '/images/foods/chin-chin.jpg', categoryId: categories['Desserts & Snacks'].id, restaurantId: restaurants['Mama Calabar Kitchen'].id, isAvailable: true },
  ];

  for (const food of foodsData) {
    const imageUrl = await uploadToCloudinary(food.image, food.image);
    const existing = await prisma.food.findFirst({ where: { name: food.name, restaurantId: food.restaurantId } });
    if (existing) {
      // Update image to Cloudinary URL on re-seed
      await prisma.food.update({ where: { id: existing.id }, data: { image: imageUrl } });
    } else {
      await prisma.food.create({ data: { ...food, image: imageUrl } });
    }
  }
  console.log(`✅ ${foodsData.length} food items created`);

  console.log('\n🎉 Seeding complete!');
  console.log('\n📋 Test Credentials:');
  console.log('   Admin:    admin@naijabites.ng / admin123');
  console.log('   Customer: customer@test.com / password123');
  console.log('   Owner (Mama Calabar):  mama@calabar.ng / owner123');
  console.log('   Owner (Suya Spot):     suya@spot.ng / owner123');
  console.log('   Owner (Wok & Roll):    wok@roll.ng / owner123');
  console.log('   Owner (Sharp Sharp):   sharp@sharp.ng / owner123');
  console.log('   Owner (Zobo Palace):   zobo@palace.ng / owner123');

  if (hasCloudinary) {
    console.log('\n☁️  Images uploaded to Cloudinary — DB now stores Cloudinary URLs');
  } else {
    console.log('\n📁 Images using local paths — set Cloudinary keys in .env to enable cloud uploads');
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
