import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not configured');
}

const sql = postgres(connectionString, {
  ssl: 'require',
  max: 1,
});

async function seed() {
  try {
    console.log('Starting business trip data seeding...');

    // Insert Countries
    console.log('Inserting countries...');
    await sql`
      INSERT INTO countries (code, name_ko, name_en, created_at) VALUES
      ('KR', '대한민국', 'South Korea', NOW()),
      ('JP', '일본', 'Japan', NOW()),
      ('DE', '독일', 'Germany', NOW()),
      ('US', '미국', 'United States', NOW()),
      ('GB', '영국', 'United Kingdom', NOW()),
      ('FR', '프랑스', 'France', NOW()),
      ('SG', '싱가포르', 'Singapore', NOW()),
      ('HK', '홍콩', 'Hong Kong', NOW()),
      ('AE', '아랍에미리트', 'United Arab Emirates', NOW()),
      ('AU', '호주', 'Australia', NOW())
      ON CONFLICT (code) DO NOTHING
    `;
    console.log('✓ Countries inserted');

    // Insert Cities
    console.log('Inserting cities...');
    await sql`
      INSERT INTO cities (name, name_en, country_code, timezone, latitude, longitude, created_at) VALUES
      ('서울', 'Seoul', 'KR', 'Asia/Seoul', 37.5665, 126.9780, NOW()),
      ('도쿄', 'Tokyo', 'JP', 'Asia/Tokyo', 35.6762, 139.6503, NOW()),
      ('베를린', 'Berlin', 'DE', 'Europe/Berlin', 52.5200, 13.4050, NOW()),
      ('뉴욕', 'New York', 'US', 'America/New_York', 40.7128, -74.0060, NOW()),
      ('런던', 'London', 'GB', 'Europe/London', 51.5074, -0.1278, NOW()),
      ('파리', 'Paris', 'FR', 'Europe/Paris', 48.8566, 2.3522, NOW()),
      ('싱가포르', 'Singapore', 'SG', 'Asia/Singapore', 1.3521, 103.8198, NOW()),
      ('홍콩', 'Hong Kong', 'HK', 'Asia/Hong_Kong', 22.3193, 114.1694, NOW()),
      ('두바이', 'Dubai', 'AE', 'Asia/Dubai', 25.2048, 55.2708, NOW()),
      ('시드니', 'Sydney', 'AU', 'Australia/Sydney', -33.8688, 151.2093, NOW())
    `;
    console.log('✓ Cities inserted');

    // Get city IDs
    const [seoul] = await sql`SELECT id FROM cities WHERE name_en = 'Seoul'`;
    const [tokyo] = await sql`SELECT id FROM cities WHERE name_en = 'Tokyo'`;
    const [berlin] = await sql`SELECT id FROM cities WHERE name_en = 'Berlin'`;
    const [newyork] = await sql`SELECT id FROM cities WHERE name_en = 'New York'`;
    const [london] = await sql`SELECT id FROM cities WHERE name_en = 'London'`;

    // Insert Hotels
    console.log('Inserting hotels...');
    await sql`
      INSERT INTO places (name, type, city_id, address, phone, website, notes, average_rating, visit_count, last_visit_date, created_at, updated_at) VALUES
      -- Berlin Hotels
      ('Hilton Berlin', 'HOTEL', ${berlin.id}, 'Mohrenstraße 30, 10117 Berlin, Germany', '+49 30 2023 0', 'https://www.hilton.com', '공항 픽업 서비스 가능', 4.50, 4, '2025-08-26', NOW(), NOW()),
      ('Hotel Adlon Kempinski', 'HOTEL', ${berlin.id}, 'Unter den Linden 77, 10117 Berlin, Germany', '+49 30 22610', 'https://www.kempinski.com', '브란덴부르크 문 앞', 4.80, 2, '2025-07-15', NOW(), NOW()),
      ('The Ritz-Carlton Berlin', 'HOTEL', ${berlin.id}, 'Potsdamer Platz 3, 10785 Berlin, Germany', '+49 30 337777', 'https://www.ritzcarlton.com', 'VIP 고객 추천', 4.70, 3, '2025-06-10', NOW(), NOW()),

      -- Tokyo Hotels
      ('The Peninsula Tokyo', 'HOTEL', ${tokyo.id}, '1-8-1 Yurakucho, Chiyoda-ku, Tokyo 100-0006, Japan', '+81 3 6270 2888', 'https://www.peninsula.com', '황궁 근처, 고급 서비스', 4.90, 5, '2025-09-15', NOW(), NOW()),
      ('Park Hyatt Tokyo', 'HOTEL', ${tokyo.id}, '3-7-1-2 Nishi Shinjuku, Shinjuku-ku, Tokyo 163-1055, Japan', '+81 3 5322 1234', 'https://www.hyatt.com', '신주쿠 위치, 스카이라인 뷰', 4.75, 3, '2025-08-20', NOW(), NOW()),

      -- Seoul Hotels
      ('Four Seasons Seoul', 'HOTEL', ${seoul.id}, '97 Saemunan-ro, Jongno-gu, Seoul 03183, South Korea', '+82 2 6388 5000', 'https://www.fourseasons.com', '광화문 근처, 미팅룸 완비', 4.85, 6, '2025-10-01', NOW(), NOW()),
      ('Grand Hyatt Seoul', 'HOTEL', ${seoul.id}, '322 Sowol-ro, Yongsan-gu, Seoul 04347, South Korea', '+82 2 797 1234', 'https://www.hyatt.com', '남산 전망', 4.60, 4, '2025-09-25', NOW(), NOW()),

      -- New York Hotels
      ('The St. Regis New York', 'HOTEL', ${newyork.id}, '2 E 55th St, New York, NY 10022, United States', '+1 212 753 4500', 'https://www.marriott.com', '5번가 위치', 4.80, 3, '2025-07-30', NOW(), NOW()),

      -- London Hotels
      ('The Savoy', 'HOTEL', ${london.id}, 'Strand, London WC2R 0EZ, United Kingdom', '+44 20 7836 4343', 'https://www.fairmont.com', '템즈강 뷰', 4.85, 2, '2025-08-12', NOW(), NOW())
    `;
    console.log('✓ Hotels inserted');

    // Insert Restaurants
    console.log('Inserting restaurants...');
    await sql`
      INSERT INTO places (name, type, city_id, address, phone, website, notes, average_rating, visit_count, last_visit_date, created_at, updated_at) VALUES
      -- Berlin Restaurants
      ('Nobelhart & Schmutzig', 'RESTAURANT', ${berlin.id}, 'Friedrichstraße 218, 10969 Berlin, Germany', '+49 30 2594 0610', 'https://www.nobelhartundschmutzig.com', '미슐랭 1스타, 로컬 식재료', 4.60, 3, '2025-08-25', NOW(), NOW()),
      ('Tim Raue', 'RESTAURANT', ${berlin.id}, 'Rudi-Dutschke-Straße 26, 10969 Berlin, Germany', '+49 30 2593 7930', 'https://www.tim-raue.com', '미슐랭 2스타, 아시안 퓨전', 4.80, 2, '2025-07-20', NOW(), NOW()),
      ('Lorenz Adlon Esszimmer', 'RESTAURANT', ${berlin.id}, 'Unter den Linden 77, 10117 Berlin, Germany', '+49 30 2261 1960', 'https://www.lorenzadlon-esszimmer.de', '미슐랭 2스타, 파인다이닝', 4.70, 2, '2025-06-15', NOW(), NOW()),

      -- Tokyo Restaurants
      ('Sukiyabashi Jiro', 'RESTAURANT', ${tokyo.id}, '4-2-15 Ginza, Chuo-ku, Tokyo 104-0061, Japan', '+81 3 3535 3600', NULL, '미슐랭 3스타 스시', 5.00, 4, '2025-09-14', NOW(), NOW()),
      ('Narisawa', 'RESTAURANT', ${tokyo.id}, '2-6-15 Minami-Aoyama, Minato-ku, Tokyo 107-0062, Japan', '+81 3 5785 0799', 'https://www.narisawa-yoshihiro.com', '미슐랭 2스타, 혁신적 일식', 4.85, 3, '2025-08-18', NOW(), NOW()),
      ('Florilège', 'RESTAURANT', ${tokyo.id}, 'B1F, 2-5-4 Jingumae, Shibuya-ku, Tokyo 150-0001, Japan', '+81 3 6440 0878', 'https://www.aoyama-florilege.jp', '미슐랭 2스타, 프렌치', 4.75, 2, '2025-07-22', NOW(), NOW()),

      -- Seoul Restaurants
      ('Mingles', 'RESTAURANT', ${seoul.id}, '19 Dosan-daero 67-gil, Gangnam-gu, Seoul 06015, South Korea', '+82 2 515 7306', 'https://www.restaurant-mingles.com', '미슐랭 2스타, 한식 모던', 4.80, 5, '2025-09-30', NOW(), NOW()),
      ('La Yeon', 'RESTAURANT', ${seoul.id}, '23F, The Shilla Seoul, 249 Dongho-ro, Jung-gu, Seoul 04605, South Korea', '+82 2 2230 3367', NULL, '미슐랭 3스타, 한식', 4.90, 4, '2025-09-20', NOW(), NOW()),

      -- New York Restaurants
      ('Eleven Madison Park', 'RESTAURANT', ${newyork.id}, '11 Madison Ave, New York, NY 10010, United States', '+1 212 889 0905', 'https://www.elevenmadisonpark.com', '미슐랭 3스타', 4.95, 2, '2025-07-28', NOW(), NOW()),

      -- London Restaurants
      ('Restaurant Gordon Ramsay', 'RESTAURANT', ${london.id}, '68 Royal Hospital Road, London SW3 4HP, United Kingdom', '+44 20 7352 4441', 'https://www.gordonramsayrestaurants.com', '미슐랭 3스타', 4.90, 2, '2025-08-10', NOW(), NOW())
    `;
    console.log('✓ Restaurants inserted');

    console.log('\n✅ Business trip seed data completed successfully!');
    console.log('\n📊 Summary:');
    console.log('  - 10 countries');
    console.log('  - 10 cities with coordinates');
    console.log('  - 9 hotels');
    console.log('  - 10 restaurants');
    console.log('\n💡 Note: Visit records and reviews require user authentication.');
    console.log('   You can add them through the API after logging in.');

  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

seed();
