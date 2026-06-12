import { useState, useEffect, useCallback } from 'react';
import { Trophy, Shield, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { toPersian } from '../hooks/usePersianDate';

interface WCTeam { id: string; fa: string; fl: string; g: string; conf: string; }
interface WCMatch { h: string; a: string; g: string; md: number; ld: string; st: string; }
interface MatchScore {
  hs: number | null;
  as: number | null;
  status: 'live' | 'ft' | 'ht' | 'upcoming';
  min?: number;
}

// Stadium UTC offsets in summer 2026
const ST_TZ: Record<string, number> = {
  '1':-5,'2':-5,'3':-5,'4':-5,'5':-5,'6':-5,
  '7':-4,'8':-4,'9':-4,'10':-4,'11':-4,'12':-4,
  '13':-7,'14':-7,'15':-7,'16':-7,
};

function toTehran(ld: string, st: string): Date {
  const [d, t] = ld.split(' ');
  const [mo, dy, yr] = d.split('/').map(Number);
  const [hr, mn] = t.split(':').map(Number);
  const tz = ST_TZ[st] ?? -5;
  return new Date(Date.UTC(yr, mo - 1, dy, hr, mn) - tz * 3600000);
}

const STD: Record<string, string> = {
  '1':'آزتکا','2':'آکرون','3':'BBVA','4':'AT&T','5':'NRG',
  '6':'Arrowhead','7':'Mercedes-Benz','8':'Hard Rock','9':'Gillette',
  '10':'Lincoln Financial','11':'MetLife','12':'BMO Field',
  '13':'BC Place','14':'Lumen Field','15':"Levi's",'16':'SoFi',
};

const CFCL: Record<string, string> = {
  UEFA:    'bg-blue-500/20 text-blue-400 border-blue-500/30',
  CONMEBOL:'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  AFC:     'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  CAF:     'bg-red-500/20 text-red-400 border-red-500/30',
  CONCACAF:'bg-orange-500/20 text-orange-400 border-orange-500/30',
  OFC:     'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

// ESPN name lookup
const ESPN_WC = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.worldcup';
const GH_RAW = 'https://raw.githubusercontent.com/rezarahiminia/worldcup2026/main';
// worldcup26.ir public endpoints – CORS origin:* for /get/* paths
const WC26_PATHS = [
  'https://worldcup26.ir/get/matches',
  'https://worldcup26.ir/api/matches',
  'https://worldcup26.ir/get/games',
  'https://worldcup26.ir/api/games',
];
const TNAME: Record<string, string> = {
  '1':'mexico','2':'south africa','3':'south korea','4':'czech republic',
  '5':'canada','6':'bosnia','7':'qatar','8':'switzerland',
  '9':'brazil','10':'morocco','11':'haiti','12':'scotland',
  '13':'united states','14':'paraguay','15':'australia','16':'turkey',
  '17':'germany','18':'curacao','19':'ivory coast','20':'ecuador',
  '21':'netherlands','22':'japan','23':'sweden','24':'tunisia',
  '25':'belgium','26':'egypt','27':'iran','28':'new zealand',
  '29':'spain','30':'cape verde','31':'saudi arabia','32':'uruguay',
  '33':'france','34':'senegal','35':'iraq','36':'norway',
  '37':'argentina','38':'algeria','39':'austria','40':'jordan',
  '41':'portugal','42':'congo','43':'uzbekistan','44':'colombia',
  '45':'england','46':'croatia','47':'ghana','48':'panama',
};
const N2ID = Object.fromEntries(Object.entries(TNAME).map(([id, n]) => [n, id]));
const ALIASES: Record<string, string> = {
  'usa':'13','korea republic':'3','republic of korea':'3',
  "cote d'ivoire":'19',"côte d'ivoire":'19','dr congo':'42',
  'democratic republic of congo':'42','türkiye':'16','turkiye':'16',
  'bosnia and herzegovina':'6','cape verde islands':'30',
  'new zealand':'28','saudi arabia':'31','curaçao':'18','curacao':'18',
};
function findTeamId(name: string): string | undefined {
  const l = name.toLowerCase().trim();
  if (N2ID[l]) return N2ID[l];
  if (ALIASES[l]) return ALIASES[l];
  return Object.entries(N2ID).find(([k]) => l.startsWith(k.slice(0,5)) || k.startsWith(l.slice(0,5)))?.[1];
}
function findMatchIdx(hName: string, aName: string): number {
  const hId = findTeamId(hName);
  const aId = findTeamId(aName);
  if (!hId || !aId) return -1;
  const idx = MATCHES.findIndex(m => m.h === hId && m.a === aId);
  return idx >= 0 ? idx : MATCHES.findIndex(m => m.h === aId && m.a === hId);
}

// Parse status from worldcup26.ir / GitHub raw format
function parseWC26Status(finished: string, elapsed: string): MatchScore['status'] {
  if (finished.toUpperCase() === 'TRUE') return 'ft';
  const el = elapsed.toLowerCase().trim();
  if (!el || el === 'notstarted' || el === 'not started' || el === 'false') return 'upcoming';
  if (el === 'ht' || el.includes('half')) return 'ht';
  return 'live';
}

// Convert worldcup26.ir / GitHub raw match array to score map
// GitHub IDs are 1-based = MATCHES index + 1 (group stage IDs 1–72)
function parseWC26Matches(arr: any[]): Record<number, MatchScore> {
  const map: Record<number, MatchScore> = {};
  for (const m of arr) {
    // Prefer ID-based lookup (most reliable, same ordering as MATCHES array)
    const rawId = m.id ?? m._id?.['$oid'];
    const idNum = parseInt(String(rawId), 10);
    let idx = !isNaN(idNum) && idNum >= 1 && idNum <= 72 ? idNum - 1 : -1;
    // Fallback: lookup by team IDs
    if (idx < 0) {
      const hId = String(m.home_team_id ?? m.homeTeamId ?? '');
      const aId = String(m.away_team_id ?? m.awayTeamId ?? '');
      if (hId && aId) idx = MATCHES.findIndex(mm => mm.h === hId && mm.a === aId);
    }
    if (idx < 0) continue;
    const fin = String(m.finished ?? m.is_finished ?? '');
    const el = String(m.time_elapsed ?? m.timeElapsed ?? m.minute ?? '');
    const status = parseWC26Status(fin, el);
    if (status === 'upcoming') continue;
    const hs = parseInt(String(m.home_score ?? m.homeScore ?? '0'), 10);
    const as_ = parseInt(String(m.away_score ?? m.awayScore ?? '0'), 10);
    map[idx] = {
      hs: isNaN(hs) ? 0 : hs,
      as: isNaN(as_) ? 0 : as_,
      status,
      min: status === 'live' ? (parseInt(el, 10) || undefined) : undefined,
    };
  }
  return map;
}

const TEAMS: WCTeam[] = [
  {id:'1', fa:'مکزیک',          fl:'mx',     g:'A', conf:'CONCACAF'},
  {id:'2', fa:'آفریقای جنوبی',  fl:'za',     g:'A', conf:'CAF'},
  {id:'3', fa:'کره جنوبی',      fl:'kr',     g:'A', conf:'AFC'},
  {id:'4', fa:'جمهوری چک',      fl:'cz',     g:'A', conf:'UEFA'},
  {id:'5', fa:'کانادا',          fl:'ca',     g:'B', conf:'CONCACAF'},
  {id:'6', fa:'بوسنی',           fl:'ba',     g:'B', conf:'UEFA'},
  {id:'7', fa:'قطر',             fl:'qa',     g:'B', conf:'AFC'},
  {id:'8', fa:'سوئیس',           fl:'ch',     g:'B', conf:'UEFA'},
  {id:'9', fa:'برزیل',           fl:'br',     g:'C', conf:'CONMEBOL'},
  {id:'10',fa:'مراکش',           fl:'ma',     g:'C', conf:'CAF'},
  {id:'11',fa:'هائیتی',          fl:'ht',     g:'C', conf:'CONCACAF'},
  {id:'12',fa:'اسکاتلند',        fl:'gb-sct', g:'C', conf:'UEFA'},
  {id:'13',fa:'آمریکا',          fl:'us',     g:'D', conf:'CONCACAF'},
  {id:'14',fa:'پاراگوئه',        fl:'py',     g:'D', conf:'CONMEBOL'},
  {id:'15',fa:'استرالیا',        fl:'au',     g:'D', conf:'AFC'},
  {id:'16',fa:'ترکیه',           fl:'tr',     g:'D', conf:'UEFA'},
  {id:'17',fa:'آلمان',           fl:'de',     g:'E', conf:'UEFA'},
  {id:'18',fa:'کوراسائو',        fl:'cw',     g:'E', conf:'CONCACAF'},
  {id:'19',fa:'ساحل عاج',        fl:'ci',     g:'E', conf:'CAF'},
  {id:'20',fa:'اکوادور',         fl:'ec',     g:'E', conf:'CONMEBOL'},
  {id:'21',fa:'هلند',            fl:'nl',     g:'F', conf:'UEFA'},
  {id:'22',fa:'ژاپن',            fl:'jp',     g:'F', conf:'AFC'},
  {id:'23',fa:'سوئد',            fl:'se',     g:'F', conf:'UEFA'},
  {id:'24',fa:'تونس',            fl:'tn',     g:'F', conf:'CAF'},
  {id:'25',fa:'بلژیک',           fl:'be',     g:'G', conf:'UEFA'},
  {id:'26',fa:'مصر',             fl:'eg',     g:'G', conf:'CAF'},
  {id:'27',fa:'ایران',           fl:'ir',     g:'G', conf:'AFC'},
  {id:'28',fa:'نیوزیلند',        fl:'nz',     g:'G', conf:'OFC'},
  {id:'29',fa:'اسپانیا',         fl:'es',     g:'H', conf:'UEFA'},
  {id:'30',fa:'کیپ ورد',         fl:'cv',     g:'H', conf:'CAF'},
  {id:'31',fa:'عربستان',         fl:'sa',     g:'H', conf:'AFC'},
  {id:'32',fa:'اروگوئه',         fl:'uy',     g:'H', conf:'CONMEBOL'},
  {id:'33',fa:'فرانسه',          fl:'fr',     g:'I', conf:'UEFA'},
  {id:'34',fa:'سنگال',           fl:'sn',     g:'I', conf:'CAF'},
  {id:'35',fa:'عراق',            fl:'iq',     g:'I', conf:'AFC'},
  {id:'36',fa:'نروژ',            fl:'no',     g:'I', conf:'UEFA'},
  {id:'37',fa:'آرژانتین',        fl:'ar',     g:'J', conf:'CONMEBOL'},
  {id:'38',fa:'الجزایر',         fl:'dz',     g:'J', conf:'CAF'},
  {id:'39',fa:'اتریش',           fl:'at',     g:'J', conf:'UEFA'},
  {id:'40',fa:'اردن',            fl:'jo',     g:'J', conf:'AFC'},
  {id:'41',fa:'پرتغال',          fl:'pt',     g:'K', conf:'UEFA'},
  {id:'42',fa:'کنگو',            fl:'cd',     g:'K', conf:'CAF'},
  {id:'43',fa:'ازبکستان',        fl:'uz',     g:'K', conf:'AFC'},
  {id:'44',fa:'کلمبیا',          fl:'co',     g:'K', conf:'CONMEBOL'},
  {id:'45',fa:'انگلستان',        fl:'gb-eng', g:'L', conf:'UEFA'},
  {id:'46',fa:'کرواسی',          fl:'hr',     g:'L', conf:'UEFA'},
  {id:'47',fa:'غنا',             fl:'gh',     g:'L', conf:'CAF'},
  {id:'48',fa:'پاناما',          fl:'pa',     g:'L', conf:'CONCACAF'},
];

const TM = Object.fromEntries(TEAMS.map(t => [t.id, t])) as Record<string, WCTeam>;

const MATCHES: WCMatch[] = [
  {h:'1', a:'2', g:'A',md:1,ld:'06/11/2026 13:00',st:'1'},
  {h:'3', a:'4', g:'A',md:1,ld:'06/11/2026 20:00',st:'2'},
  {h:'5', a:'6', g:'B',md:1,ld:'06/12/2026 15:00',st:'12'},
  {h:'13',a:'14',g:'D',md:1,ld:'06/12/2026 18:00',st:'16'},
  {h:'11',a:'12',g:'C',md:1,ld:'06/13/2026 21:00',st:'9'},
  {h:'15',a:'16',g:'D',md:1,ld:'06/13/2026 21:00',st:'13'},
  {h:'9', a:'10',g:'C',md:1,ld:'06/13/2026 18:00',st:'11'},
  {h:'7', a:'8', g:'B',md:1,ld:'06/13/2026 12:00',st:'15'},
  {h:'19',a:'20',g:'E',md:1,ld:'06/14/2026 19:00',st:'10'},
  {h:'17',a:'18',g:'E',md:1,ld:'06/14/2026 12:00',st:'5'},
  {h:'21',a:'22',g:'F',md:1,ld:'06/14/2026 15:00',st:'4'},
  {h:'23',a:'24',g:'F',md:1,ld:'06/14/2026 20:00',st:'3'},
  {h:'27',a:'28',g:'G',md:1,ld:'06/15/2026 18:00',st:'16'},
  {h:'29',a:'30',g:'H',md:1,ld:'06/15/2026 12:00',st:'7'},
  {h:'25',a:'26',g:'G',md:1,ld:'06/15/2026 12:00',st:'14'},
  {h:'31',a:'32',g:'H',md:1,ld:'06/15/2026 18:00',st:'8'},
  {h:'33',a:'34',g:'I',md:1,ld:'06/16/2026 15:00',st:'11'},
  {h:'35',a:'36',g:'I',md:1,ld:'06/16/2026 18:00',st:'9'},
  {h:'37',a:'38',g:'J',md:1,ld:'06/16/2026 20:00',st:'6'},
  {h:'39',a:'40',g:'J',md:1,ld:'06/16/2026 21:00',st:'15'},
  {h:'41',a:'42',g:'K',md:1,ld:'06/17/2026 12:00',st:'5'},
  {h:'45',a:'46',g:'L',md:1,ld:'06/17/2026 15:00',st:'4'},
  {h:'43',a:'44',g:'K',md:1,ld:'06/17/2026 20:00',st:'1'},
  {h:'47',a:'48',g:'L',md:1,ld:'06/17/2026 19:00',st:'12'},
  {h:'1', a:'3', g:'A',md:2,ld:'06/18/2026 19:00',st:'2'},
  {h:'8', a:'6', g:'B',md:2,ld:'06/18/2026 12:00',st:'16'},
  {h:'5', a:'7', g:'B',md:2,ld:'06/18/2026 15:00',st:'13'},
  {h:'4', a:'2', g:'A',md:2,ld:'06/18/2026 12:00',st:'7'},
  {h:'9', a:'11',g:'C',md:2,ld:'06/19/2026 21:00',st:'10'},
  {h:'12',a:'10',g:'C',md:2,ld:'06/19/2026 18:00',st:'9'},
  {h:'13',a:'15',g:'D',md:2,ld:'06/19/2026 12:00',st:'14'},
  {h:'16',a:'14',g:'D',md:2,ld:'06/19/2026 20:00',st:'15'},
  {h:'17',a:'19',g:'E',md:2,ld:'06/20/2026 16:00',st:'12'},
  {h:'20',a:'18',g:'E',md:2,ld:'06/20/2026 19:00',st:'6'},
  {h:'21',a:'23',g:'F',md:2,ld:'06/20/2026 12:00',st:'5'},
  {h:'24',a:'22',g:'F',md:2,ld:'06/20/2026 22:00',st:'3'},
  {h:'25',a:'27',g:'G',md:2,ld:'06/21/2026 12:00',st:'16'},
  {h:'28',a:'26',g:'G',md:2,ld:'06/21/2026 18:00',st:'13'},
  {h:'29',a:'31',g:'H',md:2,ld:'06/21/2026 12:00',st:'7'},
  {h:'32',a:'30',g:'H',md:2,ld:'06/21/2026 18:00',st:'8'},
  {h:'33',a:'35',g:'I',md:2,ld:'06/22/2026 17:00',st:'10'},
  {h:'36',a:'34',g:'I',md:2,ld:'06/22/2026 20:00',st:'11'},
  {h:'37',a:'39',g:'J',md:2,ld:'06/22/2026 12:00',st:'4'},
  {h:'40',a:'38',g:'J',md:2,ld:'06/22/2026 20:00',st:'15'},
  {h:'41',a:'43',g:'K',md:2,ld:'06/23/2026 12:00',st:'5'},
  {h:'48',a:'46',g:'L',md:2,ld:'06/23/2026 19:00',st:'12'},
  {h:'44',a:'42',g:'K',md:2,ld:'06/23/2026 20:00',st:'2'},
  {h:'45',a:'47',g:'L',md:2,ld:'06/23/2026 16:00',st:'9'},
  {h:'12',a:'9', g:'C',md:3,ld:'06/24/2026 18:00',st:'8'},
  {h:'10',a:'11',g:'C',md:3,ld:'06/24/2026 18:00',st:'7'},
  {h:'2', a:'3', g:'A',md:3,ld:'06/24/2026 19:00',st:'3'},
  {h:'4', a:'1', g:'A',md:3,ld:'06/24/2026 19:00',st:'1'},
  {h:'6', a:'7', g:'B',md:3,ld:'06/24/2026 12:00',st:'14'},
  {h:'8', a:'5', g:'B',md:3,ld:'06/24/2026 12:00',st:'13'},
  {h:'18',a:'19',g:'E',md:3,ld:'06/25/2026 16:00',st:'10'},
  {h:'20',a:'17',g:'E',md:3,ld:'06/25/2026 16:00',st:'11'},
  {h:'14',a:'15',g:'D',md:3,ld:'06/25/2026 19:00',st:'15'},
  {h:'16',a:'13',g:'D',md:3,ld:'06/25/2026 19:00',st:'16'},
  {h:'22',a:'23',g:'F',md:3,ld:'06/25/2026 18:00',st:'4'},
  {h:'24',a:'21',g:'F',md:3,ld:'06/25/2026 18:00',st:'6'},
  {h:'34',a:'35',g:'I',md:3,ld:'06/26/2026 15:00',st:'12'},
  {h:'36',a:'33',g:'I',md:3,ld:'06/26/2026 15:00',st:'9'},
  {h:'26',a:'27',g:'G',md:3,ld:'06/26/2026 20:00',st:'14'},
  {h:'28',a:'25',g:'G',md:3,ld:'06/26/2026 20:00',st:'13'},
  {h:'30',a:'31',g:'H',md:3,ld:'06/26/2026 19:00',st:'5'},
  {h:'32',a:'29',g:'H',md:3,ld:'06/26/2026 18:00',st:'2'},
  {h:'48',a:'45',g:'L',md:3,ld:'06/27/2026 17:00',st:'11'},
  {h:'46',a:'47',g:'L',md:3,ld:'06/27/2026 17:00',st:'10'},
  {h:'38',a:'39',g:'J',md:3,ld:'06/27/2026 21:00',st:'6'},
  {h:'40',a:'37',g:'J',md:3,ld:'06/27/2026 21:00',st:'4'},
  {h:'44',a:'41',g:'K',md:3,ld:'06/27/2026 19:30',st:'8'},
  {h:'42',a:'43',g:'K',md:3,ld:'06/27/2026 19:30',st:'7'},
];

const KNOCKOUT = [
  {phase:'یک‌هشتم نهایی', en:'Round of 32',    dates:'۳–۲۸ جون',    matches:16, tp:'r32'},
  {phase:'یک‌چهارم نهایی',en:'Round of 16',    dates:'۷–۴ جولای',   matches:8,  tp:'r16'},
  {phase:'ربع‌نهایی',     en:'Quarter-finals', dates:'۱۱–۹ جولای',  matches:4,  tp:'qf'},
  {phase:'نیمه‌نهایی',   en:'Semi-finals',     dates:'۱۵–۱۴ جولای', matches:2,  tp:'sf'},
  {phase:'رده سوم',       en:'3rd Place',       dates:'۱۸ جولای',    matches:1,  tp:'3rd'},
  {phase:'فینال',         en:'Final',           dates:'۱۹ جولای',    matches:1,  tp:'final'},
];

const PREV_WINNERS = [
  {year:2022,c:'آرژانتین', cf:'ar',     r:'فرانسه',    rf:'fr',    v:'قطر',            s:'3-3 (پ)'},
  {year:2018,c:'فرانسه',   cf:'fr',     r:'کرواسی',    rf:'hr',    v:'روسیه',          s:'4-2'},
  {year:2014,c:'آلمان',    cf:'de',     r:'آرژانتین',  rf:'ar',    v:'برزیل',          s:'1-0 و.ا.'},
  {year:2010,c:'اسپانیا',  cf:'es',     r:'هلند',      rf:'nl',    v:'آفریقای جنوبی', s:'1-0 و.ا.'},
  {year:2006,c:'ایتالیا',  cf:'it',     r:'فرانسه',    rf:'fr',    v:'آلمان',          s:'1-1 (پ)'},
  {year:2002,c:'برزیل',    cf:'br',     r:'آلمان',     rf:'de',    v:'کره/ژاپن',       s:'2-0'},
  {year:1998,c:'فرانسه',   cf:'fr',     r:'برزیل',     rf:'br',    v:'فرانسه',         s:'3-0'},
  {year:1994,c:'برزیل',    cf:'br',     r:'ایتالیا',   rf:'it',    v:'آمریکا',         s:'0-0 (پ)'},
  {year:1990,c:'آلمان',    cf:'de',     r:'آرژانتین',  rf:'ar',    v:'ایتالیا',        s:'1-0'},
  {year:1986,c:'آرژانتین', cf:'ar',     r:'آلمان',     rf:'de',    v:'مکزیک',          s:'3-2'},
  {year:1982,c:'ایتالیا',  cf:'it',     r:'آلمان',     rf:'de',    v:'اسپانیا',        s:'3-1'},
  {year:1978,c:'آرژانتین', cf:'ar',     r:'هلند',      rf:'nl',    v:'آرژانتین',       s:'3-1 و.ا.'},
  {year:1974,c:'آلمان',    cf:'de',     r:'هلند',      rf:'nl',    v:'آلمان',          s:'2-1'},
  {year:1970,c:'برزیل',    cf:'br',     r:'ایتالیا',   rf:'it',    v:'مکزیک',          s:'4-1'},
  {year:1966,c:'انگلستان', cf:'gb-eng', r:'آلمان',     rf:'de',    v:'انگلستان',       s:'4-2 و.ا.'},
  {year:1962,c:'برزیل',    cf:'br',     r:'چکسلواکی',  rf:'cz',    v:'شیلی',           s:'3-1'},
  {year:1958,c:'برزیل',    cf:'br',     r:'سوئد',      rf:'se',    v:'سوئد',           s:'5-2'},
  {year:1954,c:'آلمان',    cf:'de',     r:'مجارستان',  rf:'hu',    v:'سوئیس',          s:'3-2'},
  {year:1950,c:'اروگوئه',  cf:'uy',     r:'برزیل',     rf:'br',    v:'برزیل',          s:'2-1'},
  {year:1938,c:'ایتالیا',  cf:'it',     r:'مجارستان',  rf:'hu',    v:'فرانسه',         s:'4-2'},
  {year:1934,c:'ایتالیا',  cf:'it',     r:'چکسلواکی',  rf:'cz',    v:'ایتالیا',        s:'2-1 و.ا.'},
  {year:1930,c:'اروگوئه',  cf:'uy',     r:'آرژانتین',  rf:'ar',    v:'اروگوئه',        s:'4-2'},
];

const WC_STATS = [
  {c:'برزیل',    cf:'br',     wins:5},
  {c:'آلمان',    cf:'de',     wins:4},
  {c:'ایتالیا',  cf:'it',     wins:4},
  {c:'آرژانتین', cf:'ar',     wins:3},
  {c:'فرانسه',   cf:'fr',     wins:2},
  {c:'اروگوئه',  cf:'uy',     wins:2},
  {c:'انگلستان', cf:'gb-eng', wins:1},
  {c:'اسپانیا',  cf:'es',     wins:1},
];

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L'];
type Tab = 'groups' | 'teams' | 'bracket' | 'winners';

export default function WorldCup() {
  const { darkMode } = useApp();
  const [tab, setTab] = useState<Tab>('groups');
  const [selGroup, setSelGroup] = useState('G');
  const [confFilter, setConfFilter] = useState('all');
  const [started, setStarted] = useState(false);
  const [countdown, setCountdown] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
  const [scores, setScores] = useState<Record<number, MatchScore>>({});
  const [scoresUpdated, setScoresUpdated] = useState<Date | null>(null);
  const [fetchingScores, setFetchingScores] = useState(false);
  const [liveCount, setLiveCount] = useState(0);
  const [dataSource, setDataSource] = useState<'worldcup26' | 'github' | 'espn' | null>(null);

  useEffect(() => {
    const wcStart = new Date('2026-06-11T18:00:00Z');
    const tick = () => {
      const diff = wcStart.getTime() - Date.now();
      if (diff <= 0) { setStarted(true); setCountdown(null); return; }
      setStarted(false);
      setCountdown({
        d: Math.floor(diff / 86400000),
        h: Math.floor(diff % 86400000 / 3600000),
        m: Math.floor(diff % 3600000 / 60000),
        s: Math.floor(diff % 60000 / 1000),
      });
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchWCScores = useCallback(async () => {
    setFetchingScores(true);
    try {
      let newScores: Record<number, MatchScore> = {};
      let src: typeof dataSource = null;

      // ── 1. worldcup26.ir (primary – CORS open for /get/* from browsers) ──────
      for (const path of WC26_PATHS) {
        try {
          const r = await fetch(path, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(5000) });
          if (!r.ok) continue;
          const data = await r.json();
          const arr: any[] = Array.isArray(data) ? data : (data.matches ?? data.games ?? data.data ?? []);
          if (!arr.length) continue;
          const parsed = parseWC26Matches(arr);
          if (Object.keys(parsed).length > 0) {
            newScores = parsed; src = 'worldcup26'; break;
          }
        } catch { continue; }
      }

      // ── 2. GitHub raw football.matches.json (secondary – always accessible) ──
      if (!src) {
        try {
          const r = await fetch(`${GH_RAW}/football.matches.json`);
          if (r.ok) {
            const arr: any[] = await r.json();
            const parsed = parseWC26Matches(arr);
            if (Object.keys(parsed).length > 0) {
              newScores = parsed; src = 'github';
            }
          }
        } catch { /* ignore */ }
      }

      // ── 3. ESPN fallback ──────────────────────────────────────────────────────
      if (!src) {
        const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '');
        const today = new Date();
        const dates = Array.from({ length: 8 }, (_, i) =>
          fmt(new Date(today.getTime() - i * 86400000))
        );
        const results = await Promise.all(
          dates.map(d =>
            fetch(`${ESPN_WC}/scoreboard?dates=${d}`)
              .then(r => r.ok ? r.json() : null)
              .catch(() => null)
          )
        );
        for (const data of results) {
          if (!data?.events) continue;
          for (const e of data.events) {
            const comp = e.competitions?.[0];
            const home = comp?.competitors?.find((c: any) => c.homeAway === 'home');
            const away = comp?.competitors?.find((c: any) => c.homeAway === 'away');
            if (!home || !away) continue;
            const idx = findMatchIdx(home.team?.displayName ?? '', away.team?.displayName ?? '');
            if (idx < 0) continue;
            const sName = e.status?.type?.name ?? '';
            const isLive = sName === 'STATUS_IN_PROGRESS';
            const isHT   = sName === 'STATUS_HALFTIME';
            const isFT   = sName === 'STATUS_FINAL' || sName === 'STATUS_FULL_TIME';
            newScores[idx] = {
              hs: home.score != null ? parseInt(home.score, 10) : null,
              as: away.score != null ? parseInt(away.score, 10) : null,
              status: isLive ? 'live' : isHT ? 'ht' : isFT ? 'ft' : 'upcoming',
              min: isLive ? Math.floor(e.status?.clock ?? 0) : undefined,
            };
          }
        }
        if (Object.keys(newScores).length > 0) src = 'espn';
      }

      const live = Object.values(newScores).filter(s => s.status === 'live').length;
      setScores(newScores);
      setLiveCount(live);
      setDataSource(src);
      setScoresUpdated(new Date());
    } catch { /* ignore */ }
    finally { setFetchingScores(false); }
  }, []);

  useEffect(() => {
    fetchWCScores();
    // Poll every 2 minutes (worldcup26.ir updates live data frequently)
    const t = setInterval(fetchWCScores, 120000);
    return () => clearInterval(t);
  }, [fetchWCScores]);

  const displayTeams = confFilter === 'all' ? TEAMS : TEAMS.filter(t => t.conf === confFilter);
  const gTeams = (g: string) => TEAMS.filter(t => t.g === g);
  const gMatchesIdx = (g: string, md: number) =>
    MATCHES.map((m, idx) => ({ ...m, idx })).filter(m => m.g === g && m.md === md);

  // Compute real standings from fetched scores
  function computeStandings(g: string) {
    const teams = gTeams(g);
    type S = { p: number; w: number; d: number; l: number; gf: number; ga: number; pts: number };
    const st: Record<string, S> = {};
    teams.forEach(t => { st[t.id] = { p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0 }; });
    MATCHES.forEach((m, idx) => {
      if (m.g !== g) return;
      const sc = scores[idx];
      if (!sc || sc.status === 'upcoming' || sc.hs === null || sc.as === null) return;
      const { hs, as } = sc;
      st[m.h].p++; st[m.h].gf += hs; st[m.h].ga += as;
      st[m.a].p++; st[m.a].gf += as; st[m.a].ga += hs;
      if (hs > as) { st[m.h].w++; st[m.h].pts += 3; st[m.a].l++; }
      else if (as > hs) { st[m.a].w++; st[m.a].pts += 3; st[m.h].l++; }
      else { st[m.h].d++; st[m.a].d++; st[m.h].pts++; st[m.a].pts++; }
    });
    return [...teams].sort((a, b) => {
      const sa = st[a.id], sb = st[b.id];
      if (sb.pts !== sa.pts) return sb.pts - sa.pts;
      const gda = sa.gf - sa.ga, gdb = sb.gf - sb.ga;
      if (gdb !== gda) return gdb - gda;
      return sb.gf - sa.gf;
    }).map(t => ({ team: t, ...st[t.id] }));
  }

  const card = `rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">

      {/* Hero */}
      <div className={`${card} mb-4 overflow-hidden`}>
        <div className="bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 p-5 text-center">
          <div className="text-3xl mb-1">🏆</div>
          <h1 className="text-white text-xl font-black">جام جهانی ۲۰۲۶ FIFA</h1>
          <p className="text-white/70 text-sm mt-1">آمریکا · کانادا · مکزیک</p>
          <p className="text-white/50 text-xs mt-0.5">۱۱ جون – ۱۹ جولای · ۴۸ تیم · ۱۲ گروه · ۱۰۴ بازی</p>
        </div>
        <div className="px-4 py-4">
          {started ? (
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 live-pulse" />
                <span className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  در حال برگزاری است!
                  {liveCount > 0 && (
                    <span className="mr-2 text-red-400 font-black">{toPersian(liveCount)} بازی زنده</span>
                  )}
                </span>
              </div>
              {/* Live score status bar */}
              <div className={`flex items-center justify-between text-xs px-1 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                <span>
                  {scoresUpdated
                    ? `${dataSource === 'worldcup26' ? '🟢 worldcup26.ir' : dataSource === 'github' ? '🟡 GitHub' : '🔵 ESPN'} · ${scoresUpdated.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`
                    : 'در حال دریافت نتایج...'}
                </span>
                <button
                  onClick={fetchWCScores}
                  disabled={fetchingScores}
                  className={`p-1 rounded transition-colors ${fetchingScores ? 'animate-spin' : ''} ${
                    darkMode ? 'hover:text-gray-400' : 'hover:text-gray-600'
                  }`}
                >
                  <RefreshCw size={12} />
                </button>
              </div>
            </div>
          ) : countdown ? (
            <div>
              <p className={`text-center text-xs mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>تا شروع اولین بازی</p>
              <div className="flex justify-center gap-4">
                {[
                  { v: countdown.d, label: 'روز' },
                  { v: countdown.h, label: 'ساعت' },
                  { v: countdown.m, label: 'دقیقه' },
                  { v: countdown.s, label: 'ثانیه' },
                ].map(({ v, label }) => (
                  <div key={label} className="flex flex-col items-center">
                    <span className={`text-2xl font-black tabular-nums ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {toPersian(String(v).padStart(2, '0'))}
                    </span>
                    <span className={`text-xs mt-0.5 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex gap-1 p-1 rounded-2xl mb-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        {(['groups', 'teams', 'bracket', 'winners'] as Tab[]).map(k => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              tab === k
                ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow'
                : darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {k === 'groups' ? 'گروه‌ها' : k === 'teams' ? 'تیم‌ها' : k === 'bracket' ? 'براکت' : 'قهرمانان'}
          </button>
        ))}
      </div>

      {/* Groups Tab */}
      {tab === 'groups' && (
        <div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {GROUPS.map(g => {
              const hasLive = MATCHES.some((m, idx) => m.g === g && scores[idx]?.status === 'live');
              return (
                <button
                  key={g}
                  onClick={() => setSelGroup(g)}
                  className={`w-10 h-10 rounded-xl text-sm font-black transition-all relative ${
                    selGroup === g
                      ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow'
                      : darkMode ? 'bg-gray-800 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {g}
                  {hasLive && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 live-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Standing table */}
          {(() => {
            const rows = computeStandings(selGroup);
            return (
              <div className={`${card} overflow-hidden mb-3`}>
                <div className={`px-4 py-3 border-b text-sm font-bold flex items-center justify-between ${darkMode ? 'border-gray-800 text-gray-100' : 'border-gray-100 text-gray-900'}`}>
                  <span>گروه {selGroup}</span>
                  {scoresUpdated && (
                    <span className={`text-xs font-normal ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                      زنده {fetchingScores ? '...' : '✓'}
                    </span>
                  )}
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className={darkMode ? 'text-gray-600' : 'text-gray-400'}>
                      <th className="px-3 py-2 text-right">تیم</th>
                      <th className="px-2 py-2 text-center w-8">ب</th>
                      <th className="px-2 py-2 text-center w-8 text-emerald-500">و</th>
                      <th className="px-2 py-2 text-center w-8">م</th>
                      <th className="px-2 py-2 text-center w-8 text-red-400">ش</th>
                      <th className="px-2 py-2 text-center w-10">گل</th>
                      <th className="px-2 py-2 text-center w-8 font-bold">ام</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(({ team, p, w, d, l, gf, ga, pts }, i) => (
                      <tr key={team.id} className={`border-t ${darkMode ? 'border-gray-800' : 'border-gray-50'} ${i < 2 ? darkMode ? 'bg-emerald-950/10' : 'bg-emerald-50/50' : ''}`}>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs w-4 text-center font-bold ${i < 2 ? 'text-emerald-500' : darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{i + 1}</span>
                            <img
                              src={`https://flagcdn.com/w40/${team.fl}.png`}
                              alt={team.fa}
                              className="w-7 h-5 object-cover rounded-sm flex-shrink-0"
                            />
                            <span className={`font-semibold ${team.id === '27' ? 'text-emerald-400' : darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                              {team.fa}
                            </span>
                            {team.id === '27' && <span className="text-xs">💚</span>}
                          </div>
                        </td>
                        <td className={`px-2 py-2.5 text-center ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{toPersian(p)}</td>
                        <td className="px-2 py-2.5 text-center text-emerald-500 font-medium">{toPersian(w)}</td>
                        <td className={`px-2 py-2.5 text-center ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{toPersian(d)}</td>
                        <td className="px-2 py-2.5 text-center text-red-400 font-medium">{toPersian(l)}</td>
                        <td className={`px-2 py-2.5 text-center ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          {toPersian(gf)}:{toPersian(ga)}
                        </td>
                        <td className={`px-2 py-2.5 text-center font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{toPersian(pts)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}

          {/* Matches per matchday */}
          {[1, 2, 3].map(md => {
            const ms = gMatchesIdx(selGroup, md);
            if (!ms.length) return null;
            return (
              <div key={md} className={`${card} overflow-hidden mb-3`}>
                <div className={`px-4 py-2.5 border-b text-xs font-bold ${darkMode ? 'border-gray-800 text-gray-500' : 'border-gray-100 text-gray-400'}`}>
                  هفته {toPersian(md)}
                </div>
                {ms.map((m, i) => {
                  const ht = TM[m.h]; const at = TM[m.a];
                  const td = toTehran(m.ld, m.st);
                  const timeStr = td.toLocaleTimeString('fa-IR', { timeZone: 'Asia/Tehran', hour: '2-digit', minute: '2-digit' });
                  const dateStr = td.toLocaleDateString('fa-IR', { timeZone: 'Asia/Tehran', month: 'short', day: 'numeric' });
                  const sc = scores[m.idx];
                  const showScore = sc && sc.status !== 'upcoming' && sc.hs !== null && sc.as !== null;
                  return (
                    <div
                      key={i}
                      className={`flex items-center px-3 py-3 ${i > 0 ? `border-t ${darkMode ? 'border-gray-800' : 'border-gray-50'}` : ''} ${
                        sc?.status === 'live' ? darkMode ? 'bg-red-950/20' : 'bg-red-50/50' : ''
                      }`}
                    >
                      <div className="flex-1 flex items-center justify-end gap-2">
                        <span className={`text-xs font-semibold text-right ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{ht?.fa}</span>
                        <img src={`https://flagcdn.com/w40/${ht?.fl}.png`} alt="" className="w-8 h-5 object-cover rounded-sm flex-shrink-0" />
                      </div>

                      {/* Score or time */}
                      <div className="flex flex-col items-center mx-3 min-w-[72px]">
                        {showScore ? (
                          <>
                            <div className="flex items-center gap-1">
                              {sc.status === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 live-pulse flex-shrink-0" />}
                              <span className={`text-base font-black tabular-nums ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {toPersian(sc.hs!)} – {toPersian(sc.as!)}
                              </span>
                            </div>
                            <span className={`text-xs font-medium ${
                              sc.status === 'live' ? 'text-red-400' :
                              sc.status === 'ht' ? 'text-yellow-400' :
                              darkMode ? 'text-gray-500' : 'text-gray-400'
                            }`}>
                              {sc.status === 'live' ? `${toPersian(sc.min ?? 0)}'` :
                               sc.status === 'ht' ? 'نیمه' : 'پایان'}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className={`text-sm font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{timeStr}</span>
                            <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{dateStr}</span>
                            <span className={`text-xs ${darkMode ? 'text-gray-700' : 'text-gray-300'}`}>{STD[m.st]}</span>
                          </>
                        )}
                      </div>

                      <div className="flex-1 flex items-center gap-2">
                        <img src={`https://flagcdn.com/w40/${at?.fl}.png`} alt="" className="w-8 h-5 object-cover rounded-sm flex-shrink-0" />
                        <span className={`text-xs font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{at?.fa}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Teams Tab */}
      {tab === 'teams' && (
        <div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {['all', 'UEFA', 'CONMEBOL', 'AFC', 'CAF', 'CONCACAF'].map(cf => (
              <button
                key={cf}
                onClick={() => setConfFilter(cf)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  confFilter === cf
                    ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white'
                    : darkMode ? 'bg-gray-800 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cf === 'all' ? 'همه' : cf}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {displayTeams.map(team => (
              <div
                key={team.id}
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-colors ${
                  team.id === '27'
                    ? darkMode ? 'bg-emerald-950/50 border-emerald-800/60' : 'bg-emerald-50 border-emerald-200'
                    : darkMode ? 'bg-gray-900 border-gray-800 hover:border-gray-700' : 'bg-white border-gray-200 shadow-sm hover:shadow-md'
                }`}
              >
                <img
                  src={`https://flagcdn.com/w40/${team.fl}.png`}
                  alt={team.fa}
                  className="w-10 h-7 object-cover rounded flex-shrink-0 shadow-sm"
                />
                <div className="min-w-0">
                  <p className={`text-xs font-bold truncate ${team.id === '27' ? 'text-emerald-400' : darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {team.fa}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                    <span className={`text-xs px-1.5 py-0.5 rounded border ${CFCL[team.conf] ?? ''}`}>{team.conf}</span>
                    <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>گروه {team.g}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bracket Tab */}
      {tab === 'bracket' && (
        <div className="space-y-3">
          <div className={`${card} p-4 text-center`}>
            <p className={`text-sm font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>مرحله گروهی</p>
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>۱۱ – ۲۷ جون · ۷۲ بازی · ۱۲ گروه × ۴ تیم</p>
            <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}>۳۲ تیم صعود (۲ اول هر گروه + ۸ سوم برتر)</p>
          </div>
          {KNOCKOUT.map(phase => (
            <div
              key={phase.tp}
              className={`${card} p-4 ${phase.tp === 'final' ? darkMode ? 'border-yellow-800/50 bg-yellow-950/20' : 'border-yellow-300 bg-yellow-50' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {phase.tp === 'final'
                    ? <Trophy size={18} className="text-yellow-400 flex-shrink-0" />
                    : <Shield size={16} className={`flex-shrink-0 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                  }
                  <div>
                    <p className={`text-sm font-bold ${phase.tp === 'final' ? 'text-yellow-400' : darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      {phase.phase}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{phase.en}</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className={`text-xs font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{phase.dates}</p>
                  <p className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{toPersian(phase.matches)} بازی</p>
                </div>
              </div>
              <p className={`text-xs mt-2 pt-2 border-t text-center ${darkMode ? 'border-gray-800 text-gray-700' : 'border-gray-100 text-gray-300'}`}>
                {phase.tp === 'final' ? 'MetLife Stadium · نیویورک · ۱۹ جولای ۲۰۲۶' : 'در انتظار نتایج مرحله قبل'}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Winners Tab */}
      {tab === 'winners' && (
        <div>
          <div className={`${card} p-4 mb-4`}>
            <h3 className={`text-sm font-bold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>رکورد قهرمانی‌ها</h3>
            <div className="grid grid-cols-4 gap-2">
              {WC_STATS.map(s => (
                <div key={s.cf} className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <img src={`https://flagcdn.com/w40/${s.cf}.png`} alt={s.c} className="w-9 h-6 object-cover rounded shadow-sm" />
                  <span className={`text-xs font-bold text-center ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{s.c}</span>
                  <span className="text-xs font-black text-yellow-400">{toPersian(s.wins)} ×</span>
                </div>
              ))}
            </div>
          </div>

          <div className={`${card} overflow-hidden`}>
            <div className={`px-4 py-3 border-b text-sm font-bold ${darkMode ? 'border-gray-800 text-gray-200' : 'border-gray-100 text-gray-800'}`}>
              تاریخچه · {toPersian(PREV_WINNERS.length)} دوره ({toPersian(1930)}–{toPersian(2022)})
            </div>
            <div className="divide-y divide-gray-800/20">
              {PREV_WINNERS.map(w => (
                <div key={w.year} className={`flex items-center gap-3 px-4 py-3 ${darkMode ? 'hover:bg-gray-800/40' : 'hover:bg-gray-50'} transition-colors`}>
                  <span className={`text-sm font-black w-12 flex-shrink-0 tabular-nums ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {toPersian(w.year)}
                  </span>
                  <img src={`https://flagcdn.com/w40/${w.cf}.png`} alt="" className="w-8 h-5 object-cover rounded flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{w.c}</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{w.v} · {w.s}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <img src={`https://flagcdn.com/w40/${w.rf}.png`} alt="" className="w-6 h-4 object-cover rounded opacity-50" />
                    <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{w.r}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
