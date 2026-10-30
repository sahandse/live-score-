import { useState, useEffect } from 'react';

// Every timestamp the feed publishes is Tehran-based, so the header clock follows the same zone.
const TEHRAN = 'Asia/Tehran';
const dateFmt = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: TEHRAN,
});
const timeFmt = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
  timeZone: TEHRAN,
});
const weekdayFmt = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { weekday: 'long', timeZone: TEHRAN });

export function usePersianDateTime() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return { timeString: timeFmt.format(now), dateString: dateFmt.format(now), dayName: weekdayFmt.format(now) };
}

export function toPersian(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(num).replace(/\d/g, (d) => persianDigits[parseInt(d, 10)]);
}
