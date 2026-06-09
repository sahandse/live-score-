import { useState, useEffect } from 'react';

function toJalali(gy: number, gm: number, gd: number): [number, number, number] {
  let jy = 0, jm = 0, jd = 0;
  let gy2 = gm > 2 ? gy + 1 : gy;
  let g_day_no = 365 * (gy - 1) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400);
  for (let i = 0; i < gm - 1; i++) g_day_no += [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][i];
  g_day_no += gd - 1;
  let j_day_no = g_day_no - 79;
  let j_np = Math.floor(j_day_no / 12053);
  j_day_no %= 12053;
  jy = 979 + 33 * j_np + 4 * Math.floor(j_day_no / 1461);
  j_day_no %= 1461;
  if (j_day_no >= 366) {
    jy += Math.floor((j_day_no - 1) / 365);
    j_day_no = (j_day_no - 1) % 365;
  }
  for (let i = 0; i < 11 && j_day_no >= [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30][i]; i++) {
    j_day_no -= [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30][i];
    jm++;
  }
  jd = j_day_no + 1;
  return [jy, jm + 1, jd];
}

function toPersianNums(str: string | number): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(str).replace(/\d/g, d => persianDigits[parseInt(d)]);
}

const persianMonths = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
const persianDays = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];

export function usePersianDateTime() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const [jy, jm, jd] = toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());

  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  const timeString = toPersianNums(`${hours}:${minutes}:${seconds}`);
  const dateString = `${toPersianNums(jd)} ${persianMonths[jm - 1]} ${toPersianNums(jy)}`;
  const dayName = persianDays[now.getDay()];

  return { timeString, dateString, dayName, persianYear: jy, persianMonth: jm, persianDay: jd };
}

export function toPersian(num: number | string): string {
  return toPersianNums(num);
}
