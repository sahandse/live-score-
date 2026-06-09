export interface League {
  id: string;
  name: string;
  persianName: string;
  country: string;
  countryPersian: string;
  flag: string;
  logo: string;
  season: string;
  type: 'club' | 'international';
}

export const leagues: League[] = [
  { id: 'epl', name: 'Premier League', persianName: 'لیگ برتر انگلیس', country: 'England', countryPersian: 'انگلستان', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', logo: '⚽', season: '2025/26', type: 'club' },
  { id: 'laliga', name: 'La Liga', persianName: 'لالیگا', country: 'Spain', countryPersian: 'اسپانیا', flag: '🇪🇸', logo: '⚽', season: '2025/26', type: 'club' },
  { id: 'bundesliga', name: 'Bundesliga', persianName: 'بوندسلیگا', country: 'Germany', countryPersian: 'آلمان', flag: '🇩🇪', logo: '⚽', season: '2025/26', type: 'club' },
  { id: 'seriea', name: 'Serie A', persianName: 'سری آ', country: 'Italy', countryPersian: 'ایتالیا', flag: '🇮🇹', logo: '⚽', season: '2025/26', type: 'club' },
  { id: 'ligue1', name: 'Ligue 1', persianName: 'لیگ ۱ فرانسه', country: 'France', countryPersian: 'فرانسه', flag: '🇫🇷', logo: '⚽', season: '2025/26', type: 'club' },
  { id: 'ucl', name: 'UEFA Champions League', persianName: 'لیگ قهرمانان اروپا', country: 'Europe', countryPersian: 'اروپا', flag: '🇪🇺', logo: '🏆', season: '2025/26', type: 'club' },
  { id: 'uel', name: 'UEFA Europa League', persianName: 'لیگ اروپا', country: 'Europe', countryPersian: 'اروپا', flag: '🇪🇺', logo: '🏆', season: '2025/26', type: 'club' },
  { id: 'pgpl', name: 'Persian Gulf Pro League', persianName: 'لیگ برتر ایران', country: 'Iran', countryPersian: 'ایران', flag: '🇮🇷', logo: '⚽', season: '1404/05', type: 'club' },
  { id: 'eredivisie', name: 'Eredivisie', persianName: 'اردیویزیه', country: 'Netherlands', countryPersian: 'هلند', flag: '🇳🇱', logo: '⚽', season: '2025/26', type: 'club' },
  { id: 'primeiraliga', name: 'Primeira Liga', persianName: 'لیگ برتر پرتغال', country: 'Portugal', countryPersian: 'پرتغال', flag: '🇵🇹', logo: '⚽', season: '2025/26', type: 'club' },
  { id: 'superlig', name: 'Süper Lig', persianName: 'سوپرلیگ ترکیه', country: 'Turkey', countryPersian: 'ترکیه', flag: '🇹🇷', logo: '⚽', season: '2025/26', type: 'club' },
  { id: 'russianpl', name: 'Russian Premier League', persianName: 'لیگ برتر روسیه', country: 'Russia', countryPersian: 'روسیه', flag: '🇷🇺', logo: '⚽', season: '2025/26', type: 'club' },
  { id: 'mls', name: 'MLS', persianName: 'لیگ فوتبال آمریکا', country: 'USA', countryPersian: 'آمریکا', flag: '🇺🇸', logo: '⚽', season: '2026', type: 'club' },
  { id: 'wc2026', name: 'FIFA World Cup 2026', persianName: 'جام جهانی ۲۰۲۶', country: 'World', countryPersian: 'جهان', flag: '🌍', logo: '🏆', season: '2026', type: 'international' },
  { id: 'euro2024', name: 'UEFA EURO 2024', persianName: 'یورو ۲۰۲۴', country: 'Europe', countryPersian: 'اروپا', flag: '🇪🇺', logo: '🏆', season: '2024', type: 'international' },
  { id: 'afc', name: 'AFC Asian Cup', persianName: 'جام ملت‌های آسیا', country: 'Asia', countryPersian: 'آسیا', flag: '🌏', logo: '🏆', season: '2027', type: 'international' },
  { id: 'concacaf', name: 'CONCACAF Gold Cup', persianName: 'کاپ طلایی کنکاکاف', country: 'CONCACAF', countryPersian: 'کنکاکاف', flag: '🌎', logo: '🏆', season: '2025', type: 'international' },
  { id: 'copaafrica', name: 'Africa Cup of Nations', persianName: 'جام ملت‌های آفریقا', country: 'Africa', countryPersian: 'آفریقا', flag: '🌍', logo: '🏆', season: '2027', type: 'international' },
];
