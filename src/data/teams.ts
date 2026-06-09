export interface Player {
  id: string;
  name: string;
  persianName: string;
  position: string;
  persianPosition: string;
  number: number;
  nationality: string;
  nationalityPersian: string;
  flag: string;
  age: number;
  goals?: number;
  assists?: number;
  rating?: number;
}

export interface Team {
  id: string;
  name: string;
  persianName: string;
  flag: string;
  badge: string;
  country: string;
  countryPersian: string;
  leagueId: string;
  founded?: number;
  stadium?: string;
  stadiumPersian?: string;
  players: Player[];
  type: 'club' | 'national';
}

export const clubTeams: Team[] = [
  {
    id: 'mancity', name: 'Manchester City', persianName: 'منچسترسیتی', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', badge: '🔵',
    country: 'England', countryPersian: 'انگلستان', leagueId: 'epl', founded: 1880,
    stadium: 'Etihad Stadium', stadiumPersian: 'اتحاد استدیوم', type: 'club',
    players: [
      { id: 'haaland', name: 'Erling Haaland', persianName: 'ارلینگ هالاند', position: 'ST', persianPosition: 'مهاجم', number: 9, nationality: 'Norway', nationalityPersian: 'نروژ', flag: '🇳🇴', age: 24, goals: 27, assists: 5, rating: 9.1 },
      { id: 'devbruyne', name: 'Kevin De Bruyne', persianName: 'کوین دبروینه', position: 'CM', persianPosition: 'هافبک', number: 17, nationality: 'Belgium', nationalityPersian: 'بلژیک', flag: '🇧🇪', age: 33, goals: 8, assists: 15, rating: 8.7 },
      { id: 'rodri', name: 'Rodri', persianName: 'رودری', position: 'DM', persianPosition: 'هافبک دفاعی', number: 16, nationality: 'Spain', nationalityPersian: 'اسپانیا', flag: '🇪🇸', age: 28, goals: 4, assists: 8, rating: 8.9 },
      { id: 'silva_b', name: 'Bernardo Silva', persianName: 'برناردو سیلوا', position: 'CM', persianPosition: 'هافبک', number: 20, nationality: 'Portugal', nationalityPersian: 'پرتغال', flag: '🇵🇹', age: 30, goals: 10, assists: 12, rating: 8.5 },
      { id: 'ederson', name: 'Ederson', persianName: 'ادرسون', position: 'GK', persianPosition: 'دروازه‌بان', number: 31, nationality: 'Brazil', nationalityPersian: 'برزیل', flag: '🇧🇷', age: 31, goals: 0, assists: 0, rating: 8.3 },
    ]
  },
  {
    id: 'arsenal', name: 'Arsenal', persianName: 'آرسنال', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', badge: '🔴',
    country: 'England', countryPersian: 'انگلستان', leagueId: 'epl', founded: 1886,
    stadium: 'Emirates Stadium', stadiumPersian: 'امارات استدیوم', type: 'club',
    players: [
      { id: 'saka', name: 'Bukayo Saka', persianName: 'بوکایو ساکا', position: 'RW', persianPosition: 'مهاجم راست', number: 7, nationality: 'England', nationalityPersian: 'انگلستان', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', age: 23, goals: 17, assists: 14, rating: 8.8 },
      { id: 'odegaard', name: 'Martin Ødegaard', persianName: 'مارتین اودگارد', position: 'AM', persianPosition: 'هافبک تهاجمی', number: 8, nationality: 'Norway', nationalityPersian: 'نروژ', flag: '🇳🇴', age: 26, goals: 14, assists: 11, rating: 8.6 },
      { id: 'martinelli', name: 'Gabriel Martinelli', persianName: 'گابریل مارتینلی', position: 'LW', persianPosition: 'مهاجم چپ', number: 11, nationality: 'Brazil', nationalityPersian: 'برزیل', flag: '🇧🇷', age: 23, goals: 13, assists: 8, rating: 8.2 },
      { id: 'ramsdale', name: 'David Raya', persianName: 'دیوید رایا', position: 'GK', persianPosition: 'دروازه‌بان', number: 22, nationality: 'Spain', nationalityPersian: 'اسپانیا', flag: '🇪🇸', age: 29, goals: 0, assists: 0, rating: 8.1 },
      { id: 'saliba', name: 'William Saliba', persianName: 'ویلیام سالیبا', position: 'CB', persianPosition: 'مدافع مرکزی', number: 12, nationality: 'France', nationalityPersian: 'فرانسه', flag: '🇫🇷', age: 23, goals: 3, assists: 2, rating: 8.5 },
    ]
  },
  {
    id: 'rmadrid', name: 'Real Madrid', persianName: 'رئال مادرید', flag: '🇪🇸', badge: '⚪',
    country: 'Spain', countryPersian: 'اسپانیا', leagueId: 'laliga', founded: 1902,
    stadium: 'Santiago Bernabéu', stadiumPersian: 'سانتیاگو برنابئو', type: 'club',
    players: [
      { id: 'vinicius', name: 'Vinicius Jr.', persianName: 'وینیسیوس جونیور', position: 'LW', persianPosition: 'مهاجم چپ', number: 7, nationality: 'Brazil', nationalityPersian: 'برزیل', flag: '🇧🇷', age: 24, goals: 23, assists: 10, rating: 9.0 },
      { id: 'mbappe', name: 'Kylian Mbappé', persianName: 'کیلیان امباپه', position: 'ST', persianPosition: 'مهاجم', number: 9, nationality: 'France', nationalityPersian: 'فرانسه', flag: '🇫🇷', age: 26, goals: 32, assists: 9, rating: 9.2 },
      { id: 'bellingham', name: 'Jude Bellingham', persianName: 'جود بلینگهام', position: 'CM', persianPosition: 'هافبک', number: 5, nationality: 'England', nationalityPersian: 'انگلستان', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', age: 21, goals: 18, assists: 12, rating: 9.1 },
      { id: 'modric', name: 'Luka Modrić', persianName: 'لوکا مودریچ', position: 'CM', persianPosition: 'هافبک', number: 10, nationality: 'Croatia', nationalityPersian: 'کرواسی', flag: '🇭🇷', age: 39, goals: 5, assists: 10, rating: 8.2 },
      { id: 'courtois', name: 'Thibaut Courtois', persianName: 'تیبو کورتوا', position: 'GK', persianPosition: 'دروازه‌بان', number: 1, nationality: 'Belgium', nationalityPersian: 'بلژیک', flag: '🇧🇪', age: 32, goals: 0, assists: 0, rating: 8.8 },
    ]
  },
  {
    id: 'barcelona', name: 'Barcelona', persianName: 'بارسلونا', flag: '🇪🇸', badge: '🔵🔴',
    country: 'Spain', countryPersian: 'اسپانیا', leagueId: 'laliga', founded: 1899,
    stadium: 'Spotify Camp Nou', stadiumPersian: 'اسپاتیفای کمپ نو', type: 'club',
    players: [
      { id: 'yamal', name: 'Lamine Yamal', persianName: 'لامین یامال', position: 'RW', persianPosition: 'مهاجم راست', number: 19, nationality: 'Spain', nationalityPersian: 'اسپانیا', flag: '🇪🇸', age: 17, goals: 15, assists: 18, rating: 9.0 },
      { id: 'lewandowski', name: 'Robert Lewandowski', persianName: 'رابرت لواندوفسکی', position: 'ST', persianPosition: 'مهاجم', number: 9, nationality: 'Poland', nationalityPersian: 'لهستان', flag: '🇵🇱', age: 36, goals: 25, assists: 7, rating: 8.6 },
      { id: 'pedri', name: 'Pedri', persianName: 'پدری', position: 'CM', persianPosition: 'هافبک', number: 8, nationality: 'Spain', nationalityPersian: 'اسپانیا', flag: '🇪🇸', age: 22, goals: 8, assists: 14, rating: 8.7 },
      { id: 'gavi', name: 'Gavi', persianName: 'گاوی', position: 'CM', persianPosition: 'هافبک', number: 6, nationality: 'Spain', nationalityPersian: 'اسپانیا', flag: '🇪🇸', age: 20, goals: 5, assists: 9, rating: 8.4 },
      { id: 'ter_stegen', name: 'Marc-André ter Stegen', persianName: 'مارک آندره تر اشتگن', position: 'GK', persianPosition: 'دروازه‌بان', number: 1, nationality: 'Germany', nationalityPersian: 'آلمان', flag: '🇩🇪', age: 33, goals: 0, assists: 0, rating: 8.3 },
    ]
  },
  {
    id: 'bayernmunich', name: 'Bayern Munich', persianName: 'بایرن مونیخ', flag: '🇩🇪', badge: '🔴',
    country: 'Germany', countryPersian: 'آلمان', leagueId: 'bundesliga', founded: 1900,
    stadium: 'Allianz Arena', stadiumPersian: 'آلیانز آرنا', type: 'club',
    players: [
      { id: 'kane', name: 'Harry Kane', persianName: 'هری کین', position: 'ST', persianPosition: 'مهاجم', number: 9, nationality: 'England', nationalityPersian: 'انگلستان', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', age: 31, goals: 36, assists: 8, rating: 9.0 },
      { id: 'muller', name: 'Thomas Müller', persianName: 'توماس مولر', position: 'AM', persianPosition: 'هافبک تهاجمی', number: 25, nationality: 'Germany', nationalityPersian: 'آلمان', flag: '🇩🇪', age: 35, goals: 10, assists: 17, rating: 8.1 },
      { id: 'musiala', name: 'Jamal Musiala', persianName: 'جمال موسیاله', position: 'AM', persianPosition: 'هافبک تهاجمی', number: 42, nationality: 'Germany', nationalityPersian: 'آلمان', flag: '🇩🇪', age: 21, goals: 20, assists: 15, rating: 8.9 },
      { id: 'neuer', name: 'Manuel Neuer', persianName: 'مانوئل نویر', position: 'GK', persianPosition: 'دروازه‌بان', number: 1, nationality: 'Germany', nationalityPersian: 'آلمان', flag: '🇩🇪', age: 39, goals: 0, assists: 0, rating: 8.0 },
      { id: 'kimmich', name: 'Joshua Kimmich', persianName: 'جوشوا کیمیش', position: 'DM', persianPosition: 'هافبک دفاعی', number: 6, nationality: 'Germany', nationalityPersian: 'آلمان', flag: '🇩🇪', age: 30, goals: 5, assists: 12, rating: 8.6 },
    ]
  },
  {
    id: 'psg', name: 'Paris Saint-Germain', persianName: 'پاری سن ژرمن', flag: '🇫🇷', badge: '🔵',
    country: 'France', countryPersian: 'فرانسه', leagueId: 'ligue1', founded: 1970,
    stadium: 'Parc des Princes', stadiumPersian: 'پارک دپرنس', type: 'club',
    players: [
      { id: 'dembele', name: 'Ousmane Dembélé', persianName: 'اوسمان دمبله', position: 'RW', persianPosition: 'مهاجم راست', number: 10, nationality: 'France', nationalityPersian: 'فرانسه', flag: '🇫🇷', age: 27, goals: 18, assists: 13, rating: 8.5 },
      { id: 'donarumma', name: 'Gianluigi Donnarumma', persianName: 'جان لوییجی دوناروما', position: 'GK', persianPosition: 'دروازه‌بان', number: 99, nationality: 'Italy', nationalityPersian: 'ایتالیا', flag: '🇮🇹', age: 26, goals: 0, assists: 0, rating: 8.2 },
      { id: 'marquinhos', name: 'Marquinhos', persianName: 'مارکینیوس', position: 'CB', persianPosition: 'مدافع مرکزی', number: 5, nationality: 'Brazil', nationalityPersian: 'برزیل', flag: '🇧🇷', age: 30, goals: 4, assists: 2, rating: 8.3 },
      { id: 'hakimi', name: 'Achraf Hakimi', persianName: 'اشرف حکیمی', position: 'RB', persianPosition: 'مدافع راست', number: 2, nationality: 'Morocco', nationalityPersian: 'مراکش', flag: '🇲🇦', age: 26, goals: 5, assists: 9, rating: 8.4 },
      { id: 'vitinha', name: 'Vitinha', persianName: 'ویتینیا', position: 'CM', persianPosition: 'هافبک', number: 17, nationality: 'Portugal', nationalityPersian: 'پرتغال', flag: '🇵🇹', age: 25, goals: 7, assists: 10, rating: 8.2 },
    ]
  },
  {
    id: 'inter', name: 'Inter Milan', persianName: 'اینترمیلان', flag: '🇮🇹', badge: '⚫🔵',
    country: 'Italy', countryPersian: 'ایتالیا', leagueId: 'seriea', founded: 1908,
    stadium: 'San Siro', stadiumPersian: 'سان سیرو', type: 'club',
    players: [
      { id: 'lautaro', name: 'Lautaro Martínez', persianName: 'لائوتارو مارتینز', position: 'ST', persianPosition: 'مهاجم', number: 10, nationality: 'Argentina', nationalityPersian: 'آرژانتین', flag: '🇦🇷', age: 27, goals: 24, assists: 7, rating: 8.9 },
      { id: 'thuram', name: 'Marcus Thuram', persianName: 'مارکوس توروم', position: 'ST', persianPosition: 'مهاجم', number: 9, nationality: 'France', nationalityPersian: 'فرانسه', flag: '🇫🇷', age: 27, goals: 15, assists: 10, rating: 8.3 },
      { id: 'calhanoglu', name: 'Hakan Çalhanoğlu', persianName: 'هاکان چالهانوغلو', position: 'DM', persianPosition: 'هافبک دفاعی', number: 20, nationality: 'Turkey', nationalityPersian: 'ترکیه', flag: '🇹🇷', age: 31, goals: 9, assists: 11, rating: 8.6 },
      { id: 'sommer', name: 'Yann Sommer', persianName: 'یان سامر', position: 'GK', persianPosition: 'دروازه‌بان', number: 1, nationality: 'Switzerland', nationalityPersian: 'سوئیس', flag: '🇨🇭', age: 36, goals: 0, assists: 0, rating: 8.2 },
      { id: 'barella', name: 'Nicolò Barella', persianName: 'نیکولو بارلا', position: 'CM', persianPosition: 'هافبک', number: 23, nationality: 'Italy', nationalityPersian: 'ایتالیا', flag: '🇮🇹', age: 27, goals: 7, assists: 12, rating: 8.7 },
    ]
  },
  {
    id: 'liverpoolfc', name: 'Liverpool', persianName: 'لیورپول', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', badge: '🔴',
    country: 'England', countryPersian: 'انگلستان', leagueId: 'epl', founded: 1892,
    stadium: 'Anfield', stadiumPersian: 'انفیلد', type: 'club',
    players: [
      { id: 'salah', name: 'Mohamed Salah', persianName: 'محمد صلاح', position: 'RW', persianPosition: 'مهاجم راست', number: 11, nationality: 'Egypt', nationalityPersian: 'مصر', flag: '🇪🇬', age: 32, goals: 29, assists: 14, rating: 9.2 },
      { id: 'nunez', name: 'Darwin Núñez', persianName: 'داروین نونز', position: 'ST', persianPosition: 'مهاجم', number: 9, nationality: 'Uruguay', nationalityPersian: 'اروگوئه', flag: '🇺🇾', age: 25, goals: 18, assists: 9, rating: 8.3 },
      { id: 'szoboszlai', name: 'Dominik Szoboszlai', persianName: 'دومینیک سوبوزلای', position: 'CM', persianPosition: 'هافبک', number: 8, nationality: 'Hungary', nationalityPersian: 'مجارستان', flag: '🇭🇺', age: 23, goals: 10, assists: 13, rating: 8.4 },
      { id: 'alisson', name: 'Alisson Becker', persianName: 'آلیسون بکر', position: 'GK', persianPosition: 'دروازه‌بان', number: 1, nationality: 'Brazil', nationalityPersian: 'برزیل', flag: '🇧🇷', age: 32, goals: 0, assists: 0, rating: 8.7 },
      { id: 'alexander_arnold', name: 'Trent Alexander-Arnold', persianName: 'ترنت الکساندر آرنولد', position: 'RB', persianPosition: 'مدافع راست', number: 66, nationality: 'England', nationalityPersian: 'انگلستان', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', age: 26, goals: 7, assists: 16, rating: 8.8 },
    ]
  },
  // ایران
  {
    id: 'persepolis', name: 'Persepolis', persianName: 'پرسپولیس', flag: '🇮🇷', badge: '🔴',
    country: 'Iran', countryPersian: 'ایران', leagueId: 'pgpl', founded: 1963,
    stadium: 'Azadi Stadium', stadiumPersian: 'ورزشگاه آزادی', type: 'club',
    players: [
      { id: 'hosseini_mehdi', name: 'Mehdi Hosseini', persianName: 'مهدی حسینی', position: 'GK', persianPosition: 'دروازه‌بان', number: 1, nationality: 'Iran', nationalityPersian: 'ایران', flag: '🇮🇷', age: 32, goals: 0, assists: 0, rating: 7.8 },
      { id: 'iranpouryari', name: 'Soroush Rafiei', persianName: 'سروش رفیعی', position: 'CM', persianPosition: 'هافبک', number: 8, nationality: 'Iran', nationalityPersian: 'ایران', flag: '🇮🇷', age: 28, goals: 7, assists: 9, rating: 7.9 },
      { id: 'ghoddos', name: 'Saman Ghoddos', persianName: 'سامان قدوس', position: 'AM', persianPosition: 'هافبک تهاجمی', number: 10, nationality: 'Iran', nationalityPersian: 'ایران', flag: '🇮🇷', age: 30, goals: 12, assists: 8, rating: 8.1 },
      { id: 'hosseini_h', name: 'Hossein Hosseini', persianName: 'حسین حسینی', position: 'CB', persianPosition: 'مدافع مرکزی', number: 5, nationality: 'Iran', nationalityPersian: 'ایران', flag: '🇮🇷', age: 27, goals: 2, assists: 1, rating: 7.6 },
      { id: 'welle', name: 'Cheick Diabaté', persianName: 'چیک دیاباته', position: 'ST', persianPosition: 'مهاجم', number: 9, nationality: 'Senegal', nationalityPersian: 'سنگال', flag: '🇸🇳', age: 33, goals: 18, assists: 5, rating: 8.0 },
    ]
  },
  {
    id: 'esteghlal', name: 'Esteghlal', persianName: 'استقلال', flag: '🇮🇷', badge: '🔵',
    country: 'Iran', countryPersian: 'ایران', leagueId: 'pgpl', founded: 1945,
    stadium: 'Azadi Stadium', stadiumPersian: 'ورزشگاه آزادی', type: 'club',
    players: [
      { id: 'akhbari', name: 'Mehdi Akhbari', persianName: 'مهدی اخباری', position: 'GK', persianPosition: 'دروازه‌بان', number: 1, nationality: 'Iran', nationalityPersian: 'ایران', flag: '🇮🇷', age: 35, goals: 0, assists: 0, rating: 7.9 },
      { id: 'mahini', name: 'Reza Mahini', persianName: 'رضا محینی', position: 'CB', persianPosition: 'مدافع مرکزی', number: 5, nationality: 'Iran', nationalityPersian: 'ایران', flag: '🇮🇷', age: 29, goals: 3, assists: 1, rating: 7.7 },
      { id: 'nouri', name: 'Mehdi Ghayedi', persianName: 'مهدی قائدی', position: 'LW', persianPosition: 'مهاجم چپ', number: 11, nationality: 'Iran', nationalityPersian: 'ایران', flag: '🇮🇷', age: 25, goals: 14, assists: 7, rating: 8.2 },
      { id: 'karimi_e', name: 'Aliakbar Karimi', persianName: 'علی‌اکبر کریمی', position: 'CM', persianPosition: 'هافبک', number: 8, nationality: 'Iran', nationalityPersian: 'ایران', flag: '🇮🇷', age: 27, goals: 5, assists: 10, rating: 7.8 },
      { id: 'ansari_h', name: 'Hamid Ansari', persianName: 'حمید انصاری', position: 'ST', persianPosition: 'مهاجم', number: 9, nationality: 'Iran', nationalityPersian: 'ایران', flag: '🇮🇷', age: 26, goals: 16, assists: 4, rating: 7.9 },
    ]
  },
];

export const nationalTeams: Team[] = [
  {
    id: 'iran', name: 'Iran', persianName: 'ایران', flag: '🇮🇷', badge: '🇮🇷',
    country: 'Iran', countryPersian: 'ایران', leagueId: 'afc', type: 'national',
    stadium: 'Azadi Stadium', stadiumPersian: 'ورزشگاه آزادی',
    players: [
      { id: 'beiranvand', name: 'Alireza Beiranvand', persianName: 'علیرضا بیرانوند', position: 'GK', persianPosition: 'دروازه‌بان', number: 1, nationality: 'Iran', nationalityPersian: 'ایران', flag: '🇮🇷', age: 32, goals: 0, assists: 0, rating: 8.0 },
      { id: 'taremi', name: 'Mehdi Taremi', persianName: 'مهدی طارمی', position: 'ST', persianPosition: 'مهاجم', number: 9, nationality: 'Iran', nationalityPersian: 'ایران', flag: '🇮🇷', age: 32, goals: 46, assists: 18, rating: 8.5 },
      { id: 'azmoun', name: 'Sardar Azmoun', persianName: 'سردار آزمون', position: 'ST', persianPosition: 'مهاجم', number: 18, nationality: 'Iran', nationalityPersian: 'ایران', flag: '🇮🇷', age: 30, goals: 42, assists: 14, rating: 8.3 },
      { id: 'ghoddos_nt', name: 'Saman Ghoddos', persianName: 'سامان قدوس', position: 'AM', persianPosition: 'هافبک تهاجمی', number: 10, nationality: 'Iran', nationalityPersian: 'ایران', flag: '🇮🇷', age: 30, goals: 10, assists: 12, rating: 7.9 },
      { id: 'hajsafi', name: 'Ehsan Hajsafi', persianName: 'احسان حاج صفی', position: 'LB', persianPosition: 'مدافع چپ', number: 3, nationality: 'Iran', nationalityPersian: 'ایران', flag: '🇮🇷', age: 34, goals: 5, assists: 8, rating: 7.8 },
      { id: 'pouraliganji', name: 'Roozbeh Cheshmi', persianName: 'روزبه چشمی', position: 'CB', persianPosition: 'مدافع مرکزی', number: 5, nationality: 'Iran', nationalityPersian: 'ایران', flag: '🇮🇷', age: 31, goals: 4, assists: 2, rating: 7.7 },
    ]
  },
  {
    id: 'brazil', name: 'Brazil', persianName: 'برزیل', flag: '🇧🇷', badge: '🇧🇷',
    country: 'Brazil', countryPersian: 'برزیل', leagueId: 'wc2026', type: 'national',
    players: [
      { id: 'vini_nt', name: 'Vinicius Jr.', persianName: 'وینیسیوس جونیور', position: 'LW', persianPosition: 'مهاجم چپ', number: 7, nationality: 'Brazil', nationalityPersian: 'برزیل', flag: '🇧🇷', age: 24, goals: 24, assists: 12, rating: 9.0 },
      { id: 'rodrygo', name: 'Rodrygo', persianName: 'رودریگو', position: 'RW', persianPosition: 'مهاجم راست', number: 11, nationality: 'Brazil', nationalityPersian: 'برزیل', flag: '🇧🇷', age: 24, goals: 18, assists: 9, rating: 8.4 },
      { id: 'paqueta', name: 'Lucas Paquetá', persianName: 'لوکاس پاکتا', position: 'CM', persianPosition: 'هافبک', number: 10, nationality: 'Brazil', nationalityPersian: 'برزیل', flag: '🇧🇷', age: 27, goals: 8, assists: 14, rating: 8.3 },
      { id: 'ederson_nt', name: 'Ederson', persianName: 'ادرسون', position: 'GK', persianPosition: 'دروازه‌بان', number: 1, nationality: 'Brazil', nationalityPersian: 'برزیل', flag: '🇧🇷', age: 31, goals: 0, assists: 0, rating: 8.4 },
    ]
  },
  {
    id: 'france', name: 'France', persianName: 'فرانسه', flag: '🇫🇷', badge: '🇫🇷',
    country: 'France', countryPersian: 'فرانسه', leagueId: 'wc2026', type: 'national',
    players: [
      { id: 'mbappe_nt', name: 'Kylian Mbappé', persianName: 'کیلیان امباپه', position: 'ST', persianPosition: 'مهاجم', number: 10, nationality: 'France', nationalityPersian: 'فرانسه', flag: '🇫🇷', age: 26, goals: 49, assists: 23, rating: 9.3 },
      { id: 'griezmann', name: 'Antoine Griezmann', persianName: 'آنتوان گریزمن', position: 'AM', persianPosition: 'هافبک تهاجمی', number: 7, nationality: 'France', nationalityPersian: 'فرانسه', flag: '🇫🇷', age: 33, goals: 44, assists: 20, rating: 8.5 },
      { id: 'dembele_nt', name: 'Ousmane Dembélé', persianName: 'اوسمان دمبله', position: 'RW', persianPosition: 'مهاجم راست', number: 11, nationality: 'France', nationalityPersian: 'فرانسه', flag: '🇫🇷', age: 27, goals: 15, assists: 18, rating: 8.4 },
      { id: 'mike_maignan', name: 'Mike Maignan', persianName: 'مایک مانیان', position: 'GK', persianPosition: 'دروازه‌بان', number: 16, nationality: 'France', nationalityPersian: 'فرانسه', flag: '🇫🇷', age: 29, goals: 0, assists: 0, rating: 8.5 },
    ]
  },
  {
    id: 'argentina', name: 'Argentina', persianName: 'آرژانتین', flag: '🇦🇷', badge: '🇦🇷',
    country: 'Argentina', countryPersian: 'آرژانتین', leagueId: 'wc2026', type: 'national',
    players: [
      { id: 'messi_nt', name: 'Lionel Messi', persianName: 'لیونل مسی', position: 'RW', persianPosition: 'مهاجم راست', number: 10, nationality: 'Argentina', nationalityPersian: 'آرژانتین', flag: '🇦🇷', age: 37, goals: 109, assists: 56, rating: 9.5 },
      { id: 'lautaro_nt', name: 'Lautaro Martínez', persianName: 'لائوتارو مارتینز', position: 'ST', persianPosition: 'مهاجم', number: 22, nationality: 'Argentina', nationalityPersian: 'آرژانتین', flag: '🇦🇷', age: 27, goals: 33, assists: 14, rating: 8.8 },
      { id: 'depaul', name: 'Rodrigo De Paul', persianName: 'رودریگو دپائول', position: 'CM', persianPosition: 'هافبک', number: 7, nationality: 'Argentina', nationalityPersian: 'آرژانتین', flag: '🇦🇷', age: 30, goals: 9, assists: 15, rating: 8.3 },
      { id: 'dibu', name: 'Emiliano Martínez', persianName: 'امیلیانو مارتینز', position: 'GK', persianPosition: 'دروازه‌بان', number: 1, nationality: 'Argentina', nationalityPersian: 'آرژانتین', flag: '🇦🇷', age: 32, goals: 0, assists: 0, rating: 9.0 },
    ]
  },
  {
    id: 'england', name: 'England', persianName: 'انگلستان', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', badge: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    country: 'England', countryPersian: 'انگلستان', leagueId: 'wc2026', type: 'national',
    players: [
      { id: 'bellingham_nt', name: 'Jude Bellingham', persianName: 'جود بلینگهام', position: 'CM', persianPosition: 'هافبک', number: 10, nationality: 'England', nationalityPersian: 'انگلستان', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', age: 21, goals: 17, assists: 14, rating: 9.0 },
      { id: 'saka_nt', name: 'Bukayo Saka', persianName: 'بوکایو ساکا', position: 'RW', persianPosition: 'مهاجم راست', number: 7, nationality: 'England', nationalityPersian: 'انگلستان', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', age: 23, goals: 16, assists: 12, rating: 8.7 },
      { id: 'kane_nt', name: 'Harry Kane', persianName: 'هری کین', position: 'ST', persianPosition: 'مهاجم', number: 9, nationality: 'England', nationalityPersian: 'انگلستان', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', age: 31, goals: 68, assists: 24, rating: 8.9 },
      { id: 'pickford', name: 'Jordan Pickford', persianName: 'جردن پیکفورد', position: 'GK', persianPosition: 'دروازه‌بان', number: 1, nationality: 'England', nationalityPersian: 'انگلستان', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', age: 31, goals: 0, assists: 0, rating: 8.0 },
    ]
  },
  {
    id: 'spain', name: 'Spain', persianName: 'اسپانیا', flag: '🇪🇸', badge: '🇪🇸',
    country: 'Spain', countryPersian: 'اسپانیا', leagueId: 'wc2026', type: 'national',
    players: [
      { id: 'yamal_nt', name: 'Lamine Yamal', persianName: 'لامین یامال', position: 'RW', persianPosition: 'مهاجم راست', number: 19, nationality: 'Spain', nationalityPersian: 'اسپانیا', flag: '🇪🇸', age: 17, goals: 12, assists: 15, rating: 8.9 },
      { id: 'pedri_nt', name: 'Pedri', persianName: 'پدری', position: 'CM', persianPosition: 'هافبک', number: 8, nationality: 'Spain', nationalityPersian: 'اسپانیا', flag: '🇪🇸', age: 22, goals: 6, assists: 13, rating: 8.6 },
      { id: 'morata', name: 'Álvaro Morata', persianName: 'آلوارو موراتا', position: 'ST', persianPosition: 'مهاجم', number: 7, nationality: 'Spain', nationalityPersian: 'اسپانیا', flag: '🇪🇸', age: 32, goals: 35, assists: 16, rating: 8.0 },
      { id: 'unai_simon', name: 'Unai Simón', persianName: 'اونای سیمون', position: 'GK', persianPosition: 'دروازه‌بان', number: 1, nationality: 'Spain', nationalityPersian: 'اسپانیا', flag: '🇪🇸', age: 27, goals: 0, assists: 0, rating: 8.2 },
    ]
  },
  {
    id: 'germany', name: 'Germany', persianName: 'آلمان', flag: '🇩🇪', badge: '🇩🇪',
    country: 'Germany', countryPersian: 'آلمان', leagueId: 'wc2026', type: 'national',
    players: [
      { id: 'musiala_nt', name: 'Jamal Musiala', persianName: 'جمال موسیاله', position: 'AM', persianPosition: 'هافبک تهاجمی', number: 10, nationality: 'Germany', nationalityPersian: 'آلمان', flag: '🇩🇪', age: 21, goals: 14, assists: 12, rating: 8.8 },
      { id: 'havertz', name: 'Kai Havertz', persianName: 'کای هاورتز', position: 'ST', persianPosition: 'مهاجم', number: 9, nationality: 'Germany', nationalityPersian: 'آلمان', flag: '🇩🇪', age: 26, goals: 20, assists: 10, rating: 8.3 },
      { id: 'kimmich_nt', name: 'Joshua Kimmich', persianName: 'جوشوا کیمیش', position: 'DM', persianPosition: 'هافبک دفاعی', number: 6, nationality: 'Germany', nationalityPersian: 'آلمان', flag: '🇩🇪', age: 30, goals: 5, assists: 10, rating: 8.5 },
      { id: 'neuer_nt', name: 'Manuel Neuer', persianName: 'مانوئل نویر', position: 'GK', persianPosition: 'دروازه‌بان', number: 1, nationality: 'Germany', nationalityPersian: 'آلمان', flag: '🇩🇪', age: 39, goals: 0, assists: 0, rating: 8.0 },
    ]
  },
  {
    id: 'portugal', name: 'Portugal', persianName: 'پرتغال', flag: '🇵🇹', badge: '🇵🇹',
    country: 'Portugal', countryPersian: 'پرتغال', leagueId: 'wc2026', type: 'national',
    players: [
      { id: 'ronaldo', name: 'Cristiano Ronaldo', persianName: 'کریستیانو رونالدو', position: 'ST', persianPosition: 'مهاجم', number: 7, nationality: 'Portugal', nationalityPersian: 'پرتغال', flag: '🇵🇹', age: 40, goals: 135, assists: 42, rating: 8.7 },
      { id: 'felix', name: 'João Félix', persianName: 'ژوائو فلیکس', position: 'AM', persianPosition: 'هافبک تهاجمی', number: 11, nationality: 'Portugal', nationalityPersian: 'پرتغال', flag: '🇵🇹', age: 25, goals: 16, assists: 12, rating: 8.2 },
      { id: 'ruben_dias', name: 'Rúben Dias', persianName: 'روبن دیاس', position: 'CB', persianPosition: 'مدافع مرکزی', number: 3, nationality: 'Portugal', nationalityPersian: 'پرتغال', flag: '🇵🇹', age: 27, goals: 4, assists: 3, rating: 8.7 },
      { id: 'costa_diogo', name: 'Diogo Costa', persianName: 'دیوگو کوستا', position: 'GK', persianPosition: 'دروازه‌بان', number: 1, nationality: 'Portugal', nationalityPersian: 'پرتغال', flag: '🇵🇹', age: 25, goals: 0, assists: 0, rating: 8.5 },
    ]
  },
  {
    id: 'usa', name: 'USA', persianName: 'آمریکا', flag: '🇺🇸', badge: '🇺🇸',
    country: 'USA', countryPersian: 'آمریکا', leagueId: 'wc2026', type: 'national',
    players: [
      { id: 'pulisic', name: 'Christian Pulisic', persianName: 'کریستین پولیسیچ', position: 'AM', persianPosition: 'هافبک تهاجمی', number: 10, nationality: 'USA', nationalityPersian: 'آمریکا', flag: '🇺🇸', age: 26, goals: 28, assists: 19, rating: 8.3 },
      { id: 'weah', name: 'Timothy Weah', persianName: 'تیموتی وه', position: 'RW', persianPosition: 'مهاجم راست', number: 21, nationality: 'USA', nationalityPersian: 'آمریکا', flag: '🇺🇸', age: 24, goals: 8, assists: 6, rating: 7.8 },
      { id: 'gio_reyna', name: 'Giovanni Reyna', persianName: 'جیووانی رینا', position: 'AM', persianPosition: 'هافبک تهاجمی', number: 7, nationality: 'USA', nationalityPersian: 'آمریکا', flag: '🇺🇸', age: 22, goals: 5, assists: 8, rating: 7.9 },
      { id: 'turner', name: 'Matt Turner', persianName: 'مت ترنر', position: 'GK', persianPosition: 'دروازه‌بان', number: 1, nationality: 'USA', nationalityPersian: 'آمریکا', flag: '🇺🇸', age: 30, goals: 0, assists: 0, rating: 7.7 },
    ]
  },
  {
    id: 'morocco', name: 'Morocco', persianName: 'مراکش', flag: '🇲🇦', badge: '🇲🇦',
    country: 'Morocco', countryPersian: 'مراکش', leagueId: 'wc2026', type: 'national',
    players: [
      { id: 'hakimi_nt', name: 'Achraf Hakimi', persianName: 'اشرف حکیمی', position: 'RB', persianPosition: 'مدافع راست', number: 2, nationality: 'Morocco', nationalityPersian: 'مراکش', flag: '🇲🇦', age: 26, goals: 10, assists: 14, rating: 8.5 },
      { id: 'ziyech', name: 'Hakim Ziyech', persianName: 'حکیم زیاش', position: 'RW', persianPosition: 'مهاجم راست', number: 7, nationality: 'Morocco', nationalityPersian: 'مراکش', flag: '🇲🇦', age: 32, goals: 22, assists: 18, rating: 8.1 },
      { id: 'en_nesyri', name: 'Youssef En-Nesyri', persianName: 'یوسف النصیری', position: 'ST', persianPosition: 'مهاجم', number: 19, nationality: 'Morocco', nationalityPersian: 'مراکش', flag: '🇲🇦', age: 27, goals: 20, assists: 6, rating: 8.0 },
      { id: 'bono', name: 'Yassine Bounou', persianName: 'یاسین بونو', position: 'GK', persianPosition: 'دروازه‌بان', number: 1, nationality: 'Morocco', nationalityPersian: 'مراکش', flag: '🇲🇦', age: 33, goals: 0, assists: 0, rating: 8.4 },
    ]
  },
  {
    id: 'mexico', name: 'Mexico', persianName: 'مکزیک', flag: '🇲🇽', badge: '🇲🇽',
    country: 'Mexico', countryPersian: 'مکزیک', leagueId: 'wc2026', type: 'national',
    players: [
      { id: 'raul_jimenez', name: 'Raúl Jiménez', persianName: 'رائول خیمنز', position: 'ST', persianPosition: 'مهاجم', number: 9, nationality: 'Mexico', nationalityPersian: 'مکزیک', flag: '🇲🇽', age: 33, goals: 36, assists: 11, rating: 7.9 },
      { id: 'lozano', name: 'Hirving Lozano', persianName: 'هیروینگ لوزانو', position: 'RW', persianPosition: 'مهاجم راست', number: 22, nationality: 'Mexico', nationalityPersian: 'مکزیک', flag: '🇲🇽', age: 29, goals: 20, assists: 14, rating: 8.0 },
      { id: 'guillermo_ochoa', name: 'Guillermo Ochoa', persianName: 'گیلرمو اوچوا', position: 'GK', persianPosition: 'دروازه‌بان', number: 13, nationality: 'Mexico', nationalityPersian: 'مکزیک', flag: '🇲🇽', age: 39, goals: 0, assists: 0, rating: 7.9 },
      { id: 'guardado', name: 'Andrés Guardado', persianName: 'آندرس گواردادو', position: 'CM', persianPosition: 'هافبک', number: 18, nationality: 'Mexico', nationalityPersian: 'مکزیک', flag: '🇲🇽', age: 38, goals: 9, assists: 12, rating: 7.7 },
    ]
  },
  {
    id: 'japan', name: 'Japan', persianName: 'ژاپن', flag: '🇯🇵', badge: '🇯🇵',
    country: 'Japan', countryPersian: 'ژاپن', leagueId: 'afc', type: 'national',
    players: [
      { id: 'mitoma', name: 'Kaoru Mitoma', persianName: 'کائورو میتوما', position: 'LW', persianPosition: 'مهاجم چپ', number: 9, nationality: 'Japan', nationalityPersian: 'ژاپن', flag: '🇯🇵', age: 27, goals: 15, assists: 12, rating: 8.3 },
      { id: 'endo', name: 'Wataru Endo', persianName: 'واتارو اندو', position: 'DM', persianPosition: 'هافبک دفاعی', number: 7, nationality: 'Japan', nationalityPersian: 'ژاپن', flag: '🇯🇵', age: 31, goals: 4, assists: 6, rating: 8.0 },
      { id: 'kamada', name: 'Daichi Kamada', persianName: 'دایچی کامادا', position: 'AM', persianPosition: 'هافبک تهاجمی', number: 10, nationality: 'Japan', nationalityPersian: 'ژاپن', flag: '🇯🇵', age: 28, goals: 12, assists: 9, rating: 8.1 },
      { id: 'gonda', name: 'Shuichi Gonda', persianName: 'شویچی گوندا', position: 'GK', persianPosition: 'دروازه‌بان', number: 1, nationality: 'Japan', nationalityPersian: 'ژاپن', flag: '🇯🇵', age: 35, goals: 0, assists: 0, rating: 7.8 },
    ]
  },
  {
    id: 'senegal', name: 'Senegal', persianName: 'سنگال', flag: '🇸🇳', badge: '🇸🇳',
    country: 'Senegal', countryPersian: 'سنگال', leagueId: 'wc2026', type: 'national',
    players: [
      { id: 'mane', name: 'Sadio Mané', persianName: 'سادیو مانه', position: 'LW', persianPosition: 'مهاجم چپ', number: 10, nationality: 'Senegal', nationalityPersian: 'سنگال', flag: '🇸🇳', age: 32, goals: 35, assists: 15, rating: 8.5 },
      { id: 'dia', name: 'Boulaye Dia', persianName: 'بولای دیا', position: 'ST', persianPosition: 'مهاجم', number: 9, nationality: 'Senegal', nationalityPersian: 'سنگال', flag: '🇸🇳', age: 27, goals: 12, assists: 8, rating: 7.9 },
      { id: 'mendy_e', name: 'Édouard Mendy', persianName: 'ادوار مندی', position: 'GK', persianPosition: 'دروازه‌بان', number: 16, nationality: 'Senegal', nationalityPersian: 'سنگال', flag: '🇸🇳', age: 32, goals: 0, assists: 0, rating: 8.0 },
      { id: 'gueye', name: 'Idrissa Gueye', persianName: 'ادریسا گوئه', position: 'DM', persianPosition: 'هافبک دفاعی', number: 7, nationality: 'Senegal', nationalityPersian: 'سنگال', flag: '🇸🇳', age: 35, goals: 3, assists: 7, rating: 7.8 },
    ]
  },
];
