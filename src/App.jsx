import { useState, useEffect, useRef, useCallback } from "react";

// ─── TRIP DATA ───────────────────────────────────────────────
const TRIP_DATA = {
  title: "Japan Trip 2026",
  dates: "Feb 20 – Feb 27",
  segments: [
    { id: 1, type: "travel", icon: "✈️", title: "Arrive Tokyo", date: "Feb 20 (Fri)", time: "—", detail: "Land at Tokyo airport → Transfer to Tokyo Station", note: "Buy Suica/Pasmo IC card at airport for all transit" },
    { id: 2, type: "travel", icon: "🚅", title: "Shinkansen → Kyoto", date: "Feb 20 (Fri)", time: "~2h 15m ride", detail: "Tokyo Station → Kyoto Station (Tokaido Shinkansen Nozomi)", note: "Reserve seat in advance. ¥13,320 one-way. JR Pass accepted on Hikari/Kodama only" },
    { id: 3, type: "hotel", icon: "🏨", title: "The OneFive Kyoto Shijo", date: "Feb 20–22", time: "Check-in 3:00 PM / Check-out 10:00 AM", detail: "Shimogyo-ku, Shijo-dori Horikawa • 3 min walk to Omiya & Shijo Omiya Station", note: "7-Eleven on ground floor! Nijo Castle 8 min drive. Bus stops right outside.", lat: 35.0016, lng: 135.7508 },
    { id: 4, type: "explore", icon: "⛩️", title: "Explore Kyoto", date: "Feb 21–22", time: "Full days", detail: "Fushimi Inari, Kinkaku-ji, Arashiyama, Nishiki Market, Gion district", note: "Buy Kyoto 1-day bus pass (¥700) at hotel front desk" },
    { id: 5, type: "travel", icon: "🚅", title: "Shinkansen → Tokyo", date: "Feb 22 (Sun)", time: "After check-out", detail: "Kyoto Station → Tokyo Station (Tokaido Shinkansen)", note: "Same route back. ~2h 15m" },
    { id: 6, type: "hotel", icon: "🏨", title: "the b asakusa", date: "Feb 22–27", time: "Check-in 3:00 PM / Check-out 11:00 AM", detail: "Nishi Asakusa 3-16-12, Taito-ku • 1 min walk from Tsukuba Express Asakusa Stn", note: "400m from Sensoji Temple. 7-Eleven across the street. Breakfast buffet available (¥1,650).", lat: 35.7118, lng: 139.7918 },
    { id: 7, type: "explore", icon: "🗼", title: "Explore Tokyo", date: "Feb 23–26", time: "Full days", detail: "Shibuya, Shinjuku, Akihabara, Harajuku, Tsukiji, Meiji Shrine, Skytree", note: "Suica card works everywhere. Get 72-hour Tokyo subway pass (¥1,500)" },
    { id: 8, type: "travel", icon: "✈️", title: "Flight Home", date: "Feb 27 (Fri)", time: "Early morning", detail: "Check out → Transfer to airport", note: "Narita Express from Asakusa area ~70 min. Allow 3+ hours before flight." },
  ]
};

// ─── PHRASES ─────────────────────────────────────────────────
const PHRASES = [
  { en: "Hello", ja: "こんにちは", rom: "Konnichiwa", cat: "basics" },
  { en: "Thank you", ja: "ありがとうございます", rom: "Arigatou gozaimasu", cat: "basics" },
  { en: "Excuse me", ja: "すみません", rom: "Sumimasen", cat: "basics" },
  { en: "Sorry", ja: "ごめんなさい", rom: "Gomen nasai", cat: "basics" },
  { en: "Yes / No", ja: "はい / いいえ", rom: "Hai / Iie", cat: "basics" },
  { en: "I don't understand", ja: "わかりません", rom: "Wakarimasen", cat: "basics" },
  { en: "Do you speak English?", ja: "英語を話せますか？", rom: "Eigo o hanasemasu ka?", cat: "basics" },
  { en: "Please", ja: "お願いします", rom: "Onegaishimasu", cat: "basics" },
  { en: "Good morning", ja: "おはようございます", rom: "Ohayou gozaimasu", cat: "basics" },
  { en: "Good evening", ja: "こんばんは", rom: "Konbanwa", cat: "basics" },
  { en: "Goodbye", ja: "さようなら", rom: "Sayounara", cat: "basics" },
  { en: "How much is this?", ja: "これはいくらですか？", rom: "Kore wa ikura desu ka?", cat: "shopping" },
  { en: "Too expensive", ja: "高すぎます", rom: "Takasugimasu", cat: "shopping" },
  { en: "I'll take this", ja: "これをください", rom: "Kore o kudasai", cat: "shopping" },
  { en: "Where is the toilet?", ja: "トイレはどこですか？", rom: "Toire wa doko desu ka?", cat: "navigate" },
  { en: "Where is the station?", ja: "駅はどこですか？", rom: "Eki wa doko desu ka?", cat: "navigate" },
  { en: "Please take me to…", ja: "…まで お願いします", rom: "...made onegaishimasu", cat: "navigate" },
  { en: "I'm lost", ja: "迷いました", rom: "Mayoimashita", cat: "navigate" },
  { en: "One ticket, please", ja: "切符を一枚ください", rom: "Kippu o ichimai kudasai", cat: "navigate" },
  { en: "Menu, please", ja: "メニューをください", rom: "Menyuu o kudasai", cat: "food" },
  { en: "Water, please", ja: "お水をください", rom: "Omizu o kudasai", cat: "food" },
  { en: "The bill, please", ja: "お会計お願いします", rom: "Okaikei onegaishimasu", cat: "food" },
  { en: "Delicious!", ja: "おいしい！", rom: "Oishii!", cat: "food" },
  { en: "No meat, please", ja: "肉なしでお願いします", rom: "Niku nashi de onegaishimasu", cat: "food" },
  { en: "I have an allergy", ja: "アレルギーがあります", rom: "Arerugii ga arimasu", cat: "food" },
  { en: "Cheers!", ja: "乾杯！", rom: "Kanpai!", cat: "food" },
  { en: "Help!", ja: "助けて！", rom: "Tasukete!", cat: "emergency" },
  { en: "Please call an ambulance", ja: "救急車を呼んでください", rom: "Kyuukyuusha o yonde kudasai", cat: "emergency" },
  { en: "I need a doctor", ja: "医者が必要です", rom: "Isha ga hitsuyou desu", cat: "emergency" },
  { en: "I feel sick", ja: "気分が悪いです", rom: "Kibun ga warui desu", cat: "emergency" },
];

// ─── ETIQUETTE ───────────────────────────────────────────────
const ETIQUETTE = [
  { icon: "🙇", title: "Bowing", text: "Bow when greeting. A slight nod (15°) is fine for casual meetings. Deeper bows show more respect. Don't bow while walking." },
  { icon: "👟", title: "Shoes Off", text: "Remove shoes when entering homes, ryokans, temples, and some restaurants. Look for a genkan (entryway). Slippers are often provided." },
  { icon: "🍜", title: "Slurping is OK", text: "Slurping noodles (ramen, soba, udon) is polite — it shows you enjoy the food. Don't slurp soup from a spoon though." },
  { icon: "🥢", title: "Chopstick Rules", text: "Never stick chopsticks upright in rice (funeral ritual). Don't pass food chopstick-to-chopstick. Don't point with them." },
  { icon: "💴", title: "Cash & Tipping", text: "Japan is still very cash-based. Many small shops don't take cards. NEVER tip — it's considered rude. Use the tray for payment." },
  { icon: "🚃", title: "Train Manners", text: "No phone calls on trains. Keep voice low. Don't eat on local trains (Shinkansen is OK). Stand on the LEFT side of escalators in Kyoto, LEFT in Tokyo." },
  { icon: "🗑️", title: "Trash", text: "There are very few public trash cans. Carry a small bag for your trash. Convenience stores have bins you can use." },
  { icon: "🚬", title: "Smoking", text: "No smoking while walking in most areas. Use designated smoking areas. Some cafes/restaurants still allow it." },
  { icon: "📸", title: "Photography", text: "Ask before photographing people, especially geisha in Gion. Many temples prohibit indoor photography. Look for signs." },
  { icon: "🏪", title: "Konbini Culture", text: "7-Eleven, Lawson, FamilyMart are lifesavers — ATMs, food, tickets, printing, toilet, Wi-Fi. Available 24/7 everywhere." },
  { icon: "🛁", title: "Onsen Rules", text: "Wash thoroughly before entering the bath. No swimwear. Small towel on head, not in water. Tattoos may restrict entry — check first." },
  { icon: "🗣️", title: "Volume", text: "Japanese culture values quiet public spaces. Keep voice low in trains, restaurants, and shrines. No loud phone conversations." },
];

// ─── EMERGENCY ───────────────────────────────────────────────
const EMERGENCY = [
  { icon: "🚑", label: "Ambulance / Fire", number: "119", note: "Free from any phone" },
  { icon: "🚓", label: "Police", number: "110", note: "Free from any phone" },
  { icon: "🌐", label: "Japan Helpline (24h English)", number: "0570-064-211", note: "Multilingual support" },
  { icon: "🏥", label: "AMDA Medical Info (English)", number: "03-6233-9266", note: "Doctor referrals in English" },
  { icon: "🏛️", label: "Embassy Locator", number: null, note: "Search your embassy in Tokyo/Osaka", url: "https://www.mofa.go.jp/about/emb_cons/protocol/index.html" },
  { icon: "📱", label: "Disaster Info (NHK World)", number: null, note: "Earthquake/typhoon alerts", url: "https://www3.nhk.or.jp/nhkworld/en/news/" },
];

const TAXI_APPS = [
  { name: "GO Taxi", icon: "🚖", desc: "Most popular in Japan", url: "https://go.goinc.jp/", color: "#00C853" },
  { name: "Uber Japan", icon: "🚗", desc: "Works in major cities", url: "https://www.uber.com/jp/en/", color: "#000" },
  { name: "Grab", icon: "🟢", desc: "Limited in Japan", url: "https://www.grab.com/", color: "#00B14F" },
  { name: "S.RIDE", icon: "🟡", desc: "Tokyo area taxi", url: "https://www.sride.jp/", color: "#FFD600" },
];

// ─── ATTRACTIONS DATABASE (Phase 2) ─────────────────────────
const ATTRACTIONS = {
  kyoto: [
    { name: "Fushimi Inari Taisha", icon: "⛩️", hours: "24 hours", price: "Free", time: "1.5–2h", tip: "Go at dawn for empty torii gates. The full hike takes 2-3 hours.", lat: 34.9671, lng: 135.7727, mustSee: true },
    { name: "Kinkaku-ji (Golden Pavilion)", icon: "🏯", hours: "9:00–17:00", price: "¥500", time: "45 min", tip: "Best photos from the pond. Less crowded in late afternoon.", lat: 35.0394, lng: 135.7292, mustSee: true },
    { name: "Arashiyama Bamboo Grove", icon: "🎋", hours: "24 hours", price: "Free", time: "30 min", tip: "Arrive before 8 AM for photos without crowds. Combine with Tenryu-ji.", lat: 35.0095, lng: 135.6722, mustSee: true },
    { name: "Nishiki Market", icon: "🏮", hours: "9:00–17:00 (varies)", price: "Free entry", time: "1–2h", tip: "Try the dashi tamago (rolled egg) and mochi. Most stalls close by 5 PM.", lat: 35.0050, lng: 135.7650 },
    { name: "Kiyomizu-dera", icon: "🏛️", hours: "6:00–18:00", price: "¥400", time: "1h", tip: "The wooden terrace offers stunning views. Night illumination during special events.", lat: 34.9949, lng: 135.7850, mustSee: true },
    { name: "Gion District", icon: "🎭", hours: "All day (evening best)", price: "Free", time: "1–2h", tip: "Walk Hanamikoji Street at dusk for geisha sightings. Don't photograph geisha without permission.", lat: 35.0037, lng: 135.7756 },
    { name: "Nijo Castle", icon: "🏰", hours: "8:45–16:00", price: "¥800", time: "1h", tip: "Listen for the 'nightingale floors' that squeak to detect intruders.", lat: 35.0142, lng: 135.7481 },
    { name: "Philosopher's Path", icon: "🌸", hours: "24 hours", price: "Free", time: "1h walk", tip: "Beautiful canal-side walk between Ginkaku-ji and Nanzen-ji. Cherry blossoms in spring.", lat: 35.0272, lng: 135.7942 },
    { name: "Tenryu-ji Temple", icon: "⛩️", hours: "8:30–17:00", price: "¥500", time: "45 min", tip: "UNESCO site. The garden is one of Japan's finest. Adjacent to bamboo grove.", lat: 35.0155, lng: 135.6745 },
    { name: "Nara (Day Trip)", icon: "🦌", hours: "All day", price: "Transit only", time: "Half day", tip: "45 min from Kyoto by JR. Friendly deer roam free. Buy deer crackers (¥200).", lat: 34.6851, lng: 135.8050 },
    { name: "Tofuku-ji Temple", icon: "🍁", hours: "9:00–16:00", price: "¥500", time: "45 min", tip: "Famous for autumn leaves. The Tsutenkyo bridge view is iconic.", lat: 34.9762, lng: 135.7740 },
    { name: "Monkey Park Iwatayama", icon: "🐒", hours: "9:00–16:30", price: "¥550", time: "1h", tip: "15-min hike up from Arashiyama. Feed wild monkeys. Amazing city view from top.", lat: 35.0095, lng: 135.6775 },
    { name: "Kyoto Imperial Palace", icon: "👑", hours: "9:00–16:20 (closed Mon)", price: "Free", time: "1h", tip: "No reservation needed since 2016. The park around it is lovely for a stroll.", lat: 35.0254, lng: 135.7621 },
    { name: "Pontocho Alley", icon: "🏮", hours: "Evening best", price: "Free", time: "30 min–1h", tip: "Narrow atmospheric alley with restaurants. Some have riverside terrace dining in summer.", lat: 35.0066, lng: 135.7710 },
    { name: "Ryoan-ji (Rock Garden)", icon: "🪨", hours: "8:00–17:00", price: "¥500", time: "30 min", tip: "Japan's most famous zen rock garden. Sit and contemplate—can you see all 15 rocks?", lat: 35.0345, lng: 135.7185 },
  ],
  tokyo: [
    { name: "Senso-ji Temple", icon: "⛩️", hours: "6:00–17:00", price: "Free", time: "1h", tip: "Oldest temple in Tokyo. Nakamise shopping street has great snacks. 400m from your hotel!", lat: 35.7148, lng: 139.7967, mustSee: true },
    { name: "Shibuya Crossing", icon: "🚶", hours: "24 hours", price: "Free", time: "30 min", tip: "World's busiest crossing. Best view from Starbucks on 2F or Shibuya Sky rooftop.", lat: 35.6595, lng: 139.7004, mustSee: true },
    { name: "Meiji Shrine", icon: "⛩️", hours: "Dawn–Dusk", price: "Free", time: "1h", tip: "Massive forested shrine in central Tokyo. Write a wish on an ema wooden plaque.", lat: 35.6764, lng: 139.6993, mustSee: true },
    { name: "Tokyo Skytree", icon: "🗼", hours: "10:00–21:00", price: "¥2,100–3,400", time: "1–2h", tip: "634m tall, Japan's tallest structure. Book tickets online to skip lines.", lat: 35.7101, lng: 139.8107, mustSee: true },
    { name: "Akihabara", icon: "🎮", hours: "10:00–21:00 (shops)", price: "Free to explore", time: "2–4h", tip: "Electronics, anime, manga paradise. Try a maid café for the experience.", lat: 35.7023, lng: 139.7745 },
    { name: "Harajuku / Takeshita St", icon: "🌈", hours: "~10:00–20:00", price: "Free", time: "1–2h", tip: "Youth fashion capital. Try a crepe from Marion Crêpes. Omotesando for luxury brands.", lat: 35.6704, lng: 139.7028 },
    { name: "Shinjuku Gyoen Garden", icon: "🌳", hours: "9:00–16:00 (closed Mon)", price: "¥500", time: "1–2h", tip: "One of Tokyo's best parks. Three distinct garden styles. Cherry blossom hotspot.", lat: 35.6852, lng: 139.7100 },
    { name: "Tsukiji Outer Market", icon: "🍣", hours: "5:00–14:00", price: "Free entry", time: "1–2h", tip: "The inner market moved to Toyosu, but the outer market is still amazing for food.", lat: 35.6654, lng: 139.7707, mustSee: true },
    { name: "teamLab Borderless", icon: "🎨", hours: "10:00–19:00", price: "¥3,800", time: "2–3h", tip: "Mind-blowing digital art museum. Book online weeks ahead. Wear light clothing.", lat: 35.6257, lng: 139.7838 },
    { name: "Shibuya Sky", icon: "🏙️", hours: "10:00–22:30", price: "¥2,000", time: "1h", tip: "Open-air observation deck on Shibuya Scramble Square. Best at sunset.", lat: 35.6584, lng: 139.7022 },
    { name: "Ueno Park & Museums", icon: "🏛️", hours: "5:00–23:00 (park)", price: "Free (museums vary)", time: "2–4h", tip: "Tokyo National Museum (¥1,000), Zoo, and several art museums all in one area.", lat: 35.7146, lng: 139.7714 },
    { name: "Odaiba", icon: "🌉", hours: "All day", price: "Transit only", time: "Half day", tip: "Waterfront area with Gundam statue, DiverCity, and Rainbow Bridge views.", lat: 35.6266, lng: 139.7771 },
    { name: "Imperial Palace East Gardens", icon: "👑", hours: "9:00–16:30 (closed Mon/Fri)", price: "Free", time: "1h", tip: "Former Edo Castle grounds. Beautiful moats and gardens. Free entry!", lat: 35.6852, lng: 139.7528 },
    { name: "Roppongi Hills Mori Tower", icon: "🌃", hours: "10:00–22:00", price: "¥2,000", time: "1–2h", tip: "Art museum + observation deck combo. Great Tokyo Tower views at night.", lat: 35.6604, lng: 139.7292 },
    { name: "Yanaka District", icon: "🏘️", hours: "All day", price: "Free", time: "2h", tip: "Tokyo's most traditional neighborhood. Cat-themed street, old temples, local artisans.", lat: 35.7268, lng: 139.7668 },
  ]
};

// ─── SPEECH UTILITY ──────────────────────────────────────────
const speak = (text, lang = "ja-JP") => {
  if ("speechSynthesis" in window) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.85;
    speechSynthesis.speak(u);
  }
};

// ─── WEATHER CODES ───────────────────────────────────────────
const WMO_CODES = {
  0: "☀️ Clear", 1: "🌤️ Mostly Clear", 2: "⛅ Partly Cloudy", 3: "☁️ Overcast",
  45: "🌫️ Fog", 48: "🌫️ Rime Fog", 51: "🌦️ Light Drizzle", 53: "🌦️ Drizzle",
  55: "🌧️ Heavy Drizzle", 61: "🌧️ Light Rain", 63: "🌧️ Rain", 65: "🌧️ Heavy Rain",
  71: "🌨️ Light Snow", 73: "🌨️ Snow", 75: "❄️ Heavy Snow", 80: "🌧️ Showers",
  81: "🌧️ Heavy Showers", 82: "⛈️ Violent Showers", 95: "⛈️ Thunderstorm",
};

// ─── TAB BAR ─────────────────────────────────────────────────
function TabBar({ active, setActive }) {
  const tabs = [
    { id: "trip", icon: "📋", label: "Trip" },
    { id: "translate", icon: "🗣️", label: "Translate" },
    { id: "explore", icon: "🧭", label: "Explore" },
    { id: "places", icon: "📍", label: "Places" },
    { id: "culture", icon: "🎌", label: "Culture" },
    { id: "sos", icon: "🆘", label: "SOS" },
  ];
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      display: "flex", justifyContent: "space-around",
      background: "linear-gradient(to top, #1a1a2e, #16213e)",
      borderTop: "1px solid rgba(255,255,255,0.08)",
      paddingBottom: "env(safe-area-inset-bottom, 8px)",
      paddingTop: 6, zIndex: 100,
      backdropFilter: "blur(20px)",
    }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => setActive(t.id)} style={{
          background: "none", border: "none", color: active === t.id ? "#f7768e" : "#7982a9",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
          fontSize: 9, fontFamily: "'Noto Sans JP', sans-serif", cursor: "pointer",
          transition: "all 0.2s", transform: active === t.id ? "scale(1.1)" : "scale(1)",
          padding: "4px 8px",
        }}>
          <span style={{ fontSize: 18, filter: active === t.id ? "drop-shadow(0 0 6px #f7768e)" : "none" }}>{t.icon}</span>
          <span style={{ fontWeight: active === t.id ? 700 : 400 }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── HEADER WITH WEATHER ─────────────────────────────────────
function Header() {
  const [now, setNow] = useState(new Date());
  const [weather, setWeather] = useState(null);
  const [city, setCity] = useState("tokyo");

  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    const coords = city === "kyoto" ? { lat: 35.0116, lng: 135.7681 } : { lat: 35.6762, lng: 139.6503 };
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&current=temperature_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=Asia/Tokyo&forecast_days=3`)
      .then(r => r.json())
      .then(d => setWeather(d))
      .catch(() => {});
  }, [city]);

  const jp = now.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit", hour12: false });
  const jpDate = now.toLocaleDateString("en-US", { timeZone: "Asia/Tokyo", weekday: "short", month: "short", day: "numeric" });

  return (
    <div style={{
      background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
      padding: "16px 20px 12px", color: "#e0e0e0",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, color: "#7982a9", letterSpacing: 2, textTransform: "uppercase", fontFamily: "'Noto Sans JP', sans-serif" }}>
            日本旅行 • Japan Trip 2026
          </div>
          <div style={{ fontSize: 22, fontWeight: 300, marginTop: 2, fontFamily: "'Noto Serif JP', serif", color: "#fff" }}>
            Feb 20 → 27
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 24, fontWeight: 200, fontFamily: "monospace", color: "#f7768e" }}>{jp}</div>
          <div style={{ fontSize: 11, color: "#7982a9" }}>🇯🇵 {jpDate} JST</div>
        </div>
      </div>

      {/* Weather Strip */}
      {weather?.current && (
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 4 }}>
            {["tokyo", "kyoto"].map(c => (
              <button key={c} onClick={() => setCity(c)} style={{
                padding: "2px 10px", borderRadius: 12, border: "none", cursor: "pointer",
                background: city === c ? "rgba(247,118,142,0.2)" : "rgba(255,255,255,0.05)",
                color: city === c ? "#f7768e" : "#565f89", fontSize: 11, textTransform: "capitalize",
              }}>{c}</button>
            ))}
          </div>
          <div style={{ fontSize: 13, color: "#c0caf5" }}>
            {WMO_CODES[weather.current.weather_code] || "—"}{" "}
            <span style={{ fontWeight: 700, color: "#fff" }}>{Math.round(weather.current.temperature_2m)}°C</span>
          </div>
          {weather.daily && (
            <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
              {weather.daily.time.slice(0, 3).map((d, i) => (
                <div key={i} style={{ textAlign: "center", fontSize: 10, color: "#7982a9" }}>
                  <div>{new Date(d + "T00:00").toLocaleDateString("en", { weekday: "short" })}</div>
                  <div style={{ fontSize: 14 }}>{(WMO_CODES[weather.daily.weather_code[i]] || "—").split(" ")[0]}</div>
                  <div style={{ color: "#9aa5ce" }}>
                    {Math.round(weather.daily.temperature_2m_min[i])}° / {Math.round(weather.daily.temperature_2m_max[i])}°
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── CURRENCY CONVERTER (Phase 2) ───────────────────────────
function CurrencyConverter() {
  const [amount, setAmount] = useState("1000");
  const [direction, setDirection] = useState("jpy-to-usd");
  // Fallback rate, would use API in production
  const rate = 0.0067; // ~¥1 = $0.0067 (approx ¥150 = $1)
  const inverseRate = 1 / rate;

  const converted = direction === "jpy-to-usd"
    ? (parseFloat(amount || 0) * rate).toFixed(2)
    : (parseFloat(amount || 0) * inverseRate).toFixed(0);

  const quickAmounts = direction === "jpy-to-usd"
    ? [500, 1000, 3000, 5000, 10000, 20000]
    : [5, 10, 20, 50, 100, 200];

  return (
    <div style={{
      background: "rgba(224,175,104,0.06)", borderRadius: 14, padding: 16, marginBottom: 16,
      border: "1px solid rgba(224,175,104,0.12)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 13, color: "#e0af68", fontWeight: 600 }}>💱 Currency Converter</div>
        <button onClick={() => setDirection(d => d === "jpy-to-usd" ? "usd-to-jpy" : "jpy-to-usd")} style={{
          padding: "3px 10px", borderRadius: 8, border: "none", cursor: "pointer",
          background: "rgba(224,175,104,0.15)", color: "#e0af68", fontSize: 11,
        }}>
          {direction === "jpy-to-usd" ? "¥ → $" : "$ → ¥"} ⇄
        </button>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: "#7982a9", marginBottom: 2 }}>{direction === "jpy-to-usd" ? "JPY ¥" : "USD $"}</div>
          <input value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} style={{
            width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(0,0,0,0.3)", color: "#fff", fontSize: 18, fontWeight: 700, outline: "none",
            fontFamily: "monospace",
          }} />
        </div>
        <div style={{ fontSize: 20, color: "#565f89" }}>→</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: "#7982a9", marginBottom: 2 }}>{direction === "jpy-to-usd" ? "USD $" : "JPY ¥"}</div>
          <div style={{
            padding: "8px 12px", borderRadius: 8, background: "rgba(158,206,106,0.1)",
            color: "#9ece6a", fontSize: 18, fontWeight: 700, fontFamily: "monospace",
            border: "1px solid rgba(158,206,106,0.15)",
          }}>
            {direction === "jpy-to-usd" ? "$" : "¥"}{converted}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
        {quickAmounts.map(a => (
          <button key={a} onClick={() => setAmount(String(a))} style={{
            padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer",
            background: "rgba(255,255,255,0.05)", color: "#9aa5ce", fontSize: 11,
          }}>
            {direction === "jpy-to-usd" ? `¥${a.toLocaleString()}` : `$${a}`}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 10, color: "#565f89", marginTop: 6 }}>
        Rate: ~¥150 = $1 (approximate, check current rates)
      </div>
    </div>
  );
}

// ─── TRIP TAB ────────────────────────────────────────────────
function TripTab() {
  return (
    <div style={{ padding: "12px 16px 100px" }}>
      <h2 style={{ fontSize: 16, color: "#9aa5ce", fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 400, marginBottom: 16 }}>
        Your Itinerary
      </h2>
      {TRIP_DATA.segments.map((s, i) => (
        <div key={s.id} style={{ display: "flex", gap: 12, marginBottom: 4 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 28 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14,
              background: s.type === "hotel" ? "rgba(247,118,142,0.15)" : s.type === "travel" ? "rgba(122,162,247,0.15)" : "rgba(158,206,106,0.15)",
              border: `1px solid ${s.type === "hotel" ? "rgba(247,118,142,0.3)" : s.type === "travel" ? "rgba(122,162,247,0.3)" : "rgba(158,206,106,0.3)"}`,
              flexShrink: 0,
            }}>{s.icon}</div>
            {i < TRIP_DATA.segments.length - 1 && (
              <div style={{ width: 1, flexGrow: 1, minHeight: 20, background: "rgba(255,255,255,0.08)" }} />
            )}
          </div>
          <div style={{
            flex: 1, background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "10px 14px", marginBottom: 8,
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#c0caf5" }}>{s.title}</span>
              <span style={{ fontSize: 11, color: "#565f89" }}>{s.date}</span>
            </div>
            <div style={{ fontSize: 11, color: "#7982a9", marginTop: 2 }}>{s.time}</div>
            <div style={{ fontSize: 12, color: "#9aa5ce", marginTop: 6, lineHeight: 1.5 }}>{s.detail}</div>
            {s.note && (
              <div style={{
                fontSize: 11, color: "#e0af68", marginTop: 6, padding: "6px 8px",
                background: "rgba(224,175,104,0.08)", borderRadius: 6, lineHeight: 1.4,
              }}>💡 {s.note}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── TRANSLATE TAB (OpenAI API) ──────────────────────────────
function TranslateTab() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [phraseFilter, setPhraseFilter] = useState("all");
  const recognitionRef = useRef(null);

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Speech recognition not supported in this browser. Try Chrome on Android."); return; }
    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setInput(text);
      setListening(false);
      translateText(text);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.start();
    setListening(true);
    recognitionRef.current = recognition;
  }, []);

  const translateText = async (text) => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // In production, use a proxy server to hide your API key
          // "Authorization": "Bearer YOUR_OPENAI_KEY"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{
            role: "system",
            content: "You are a Japanese-English translator for a tourist in Japan. Translate the given text. If the input is in English, translate to Japanese. If in Japanese, translate to English. Return ONLY a JSON object with these fields: \"original\", \"translated\", \"romanji\" (romanized Japanese if translating to Japanese), \"context\" (a very brief usage tip, max 10 words). No markdown, no backticks, just raw JSON."
          }, {
            role: "user",
            content: text
          }],
          temperature: 0.3,
        })
      });
      const data = await response.json();
      const raw = data.choices[0].message.content.replace(/```json|```/g, "").trim();
      setResult(JSON.parse(raw));
    } catch (err) {
      // Fallback: try Anthropic API (works inside Claude.ai artifacts)
      try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            messages: [{
              role: "user",
              content: `You are a Japanese-English translator for a tourist in Japan. Translate the following text. If the input is in English, translate to Japanese. If in Japanese, translate to English. Return ONLY a JSON object with these fields: "original", "translated", "romanji" (romanized Japanese if translating to Japanese), "context" (a very brief usage tip, max 10 words). No markdown, no backticks, just JSON.\n\nText: "${text}"`
            }]
          })
        });
        const data = await response.json();
        const raw = data.content[0].text.replace(/```json|```/g, "").trim();
        setResult(JSON.parse(raw));
      } catch (err2) {
        setResult({ original: text, translated: "Translation error – check connection", romanji: "", context: "" });
      }
    }
    setLoading(false);
  };

  const cats = ["all", "basics", "food", "navigate", "shopping", "emergency"];
  const filtered = phraseFilter === "all" ? PHRASES : PHRASES.filter(p => p.cat === phraseFilter);

  return (
    <div style={{ padding: "12px 16px 100px" }}>
      <div style={{
        background: "rgba(247,118,142,0.06)", borderRadius: 14, padding: 16, marginBottom: 16,
        border: "1px solid rgba(247,118,142,0.12)",
      }}>
        <div style={{ fontSize: 13, color: "#9aa5ce", marginBottom: 10, fontFamily: "'Noto Sans JP', sans-serif" }}>
          🎙️ Voice / Text Translation (AI-powered via OpenAI)
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && translateText(input)}
            placeholder="Type English or Japanese..."
            style={{
              flex: 1, padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(0,0,0,0.3)", color: "#c0caf5", fontSize: 14, outline: "none",
              fontFamily: "'Noto Sans JP', sans-serif",
            }}
          />
          <button onClick={startListening} style={{
            width: 44, height: 44, borderRadius: "50%", border: "none", cursor: "pointer",
            background: listening ? "#f7768e" : "rgba(122,162,247,0.2)",
            color: "#fff", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
            animation: listening ? "pulse 1s infinite" : "none",
            transition: "all 0.2s",
          }}>
            {listening ? "⏹" : "🎤"}
          </button>
          <button onClick={() => translateText(input)} style={{
            padding: "0 16px", borderRadius: 10, border: "none", cursor: "pointer",
            background: "rgba(122,162,247,0.2)", color: "#7aa2f7", fontSize: 13, fontWeight: 600,
          }}>
            {loading ? "..." : "→"}
          </button>
        </div>
        {result && (
          <div style={{ marginTop: 12, padding: 12, background: "rgba(0,0,0,0.2)", borderRadius: 10 }}>
            <div style={{ fontSize: 22, color: "#fff", fontFamily: "'Noto Serif JP', serif", marginBottom: 4 }}>
              {result.translated}
            </div>
            {result.romanji && (
              <div style={{ fontSize: 13, color: "#7aa2f7", marginBottom: 4 }}>{result.romanji}</div>
            )}
            {result.context && (
              <div style={{ fontSize: 11, color: "#e0af68" }}>💡 {result.context}</div>
            )}
            <button onClick={() => speak(result.translated)} style={{
              marginTop: 8, padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
              background: "rgba(158,206,106,0.15)", color: "#9ece6a", fontSize: 12,
            }}>
              🔊 Listen
            </button>
          </div>
        )}
      </div>

      {/* Phrasebook */}
      <div style={{ fontSize: 13, color: "#9aa5ce", marginBottom: 8, fontFamily: "'Noto Sans JP', sans-serif" }}>
        📖 Quick Phrasebook
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {cats.map(c => (
          <button key={c} onClick={() => setPhraseFilter(c)} style={{
            padding: "4px 12px", borderRadius: 20, border: "none", cursor: "pointer",
            background: phraseFilter === c ? "rgba(247,118,142,0.2)" : "rgba(255,255,255,0.04)",
            color: phraseFilter === c ? "#f7768e" : "#7982a9", fontSize: 11, textTransform: "capitalize",
            transition: "all 0.2s",
          }}>{c}</button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {filtered.map((p, i) => (
          <button key={i} onClick={() => speak(p.ja)} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(255,255,255,0.02)", cursor: "pointer", textAlign: "left",
            transition: "all 0.15s",
          }}>
            <div>
              <div style={{ fontSize: 13, color: "#c0caf5", fontWeight: 500 }}>{p.en}</div>
              <div style={{ fontSize: 15, color: "#fff", fontFamily: "'Noto Serif JP', serif", marginTop: 2 }}>{p.ja}</div>
              <div style={{ fontSize: 11, color: "#7aa2f7", marginTop: 1 }}>{p.rom}</div>
            </div>
            <span style={{ fontSize: 18, opacity: 0.5 }}>🔊</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── EXPLORE TAB ─────────────────────────────────────────────
function ExploreTab() {
  const [loc, setLoc] = useState(null);
  const [locErr, setLocErr] = useState(null);
  const [searching, setSearching] = useState(false);

  const getLocation = () => {
    setSearching(true);
    setLocErr(null);
    if (!navigator.geolocation) { setLocErr("Geolocation not supported"); setSearching(false); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setSearching(false); },
      () => { setLocErr("Location access denied. Enable in phone settings."); setSearching(false); },
      { enableHighAccuracy: true }
    );
  };

  const openMaps = (query) => {
    const url = loc
      ? `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${loc.lat},${loc.lng},15z`
      : `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
    window.open(url, "_blank");
  };

  const quickSearch = [
    { icon: "🏪", label: "7-Eleven", query: "7-Eleven near me" },
    { icon: "🍜", label: "Ramen", query: "ramen restaurant near me" },
    { icon: "⛩️", label: "Temples", query: "temple shrine near me" },
    { icon: "🍣", label: "Sushi", query: "sushi restaurant near me" },
    { icon: "🧊", label: "ATM", query: "ATM near me" },
    { icon: "💊", label: "Pharmacy", query: "pharmacy drugstore near me" },
    { icon: "☕", label: "Café", query: "cafe coffee near me" },
    { icon: "🍺", label: "Izakaya", query: "izakaya bar near me" },
    { icon: "🛍️", label: "Don Quijote", query: "Don Quijote near me" },
    { icon: "📮", label: "Post Office", query: "post office near me" },
  ];

  return (
    <div style={{ padding: "12px 16px 100px" }}>
      {/* Currency Converter - Phase 2 */}
      <CurrencyConverter />

      {/* Location */}
      <div style={{
        background: "rgba(122,162,247,0.06)", borderRadius: 14, padding: 16, marginBottom: 16,
        border: "1px solid rgba(122,162,247,0.12)",
      }}>
        <div style={{ fontSize: 13, color: "#9aa5ce", marginBottom: 10 }}>📍 Your Location</div>
        <button onClick={getLocation} style={{
          width: "100%", padding: "10px", borderRadius: 10, border: "none", cursor: "pointer",
          background: "rgba(122,162,247,0.15)", color: "#7aa2f7", fontSize: 13, fontWeight: 600,
        }}>
          {searching ? "Locating..." : loc ? `📍 ${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)} – Tap to refresh` : "Enable Location"}
        </button>
        {locErr && <div style={{ fontSize: 11, color: "#f7768e", marginTop: 6 }}>{locErr}</div>}
      </div>

      {/* Quick Search Grid */}
      <div style={{ fontSize: 13, color: "#9aa5ce", marginBottom: 10 }}>🔍 Find Nearby</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 20 }}>
        {quickSearch.map((s, i) => (
          <button key={i} onClick={() => openMaps(s.query)} style={{
            padding: "14px 10px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.03)", cursor: "pointer", textAlign: "center",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            transition: "all 0.15s",
          }}>
            <span style={{ fontSize: 26 }}>{s.icon}</span>
            <span style={{ fontSize: 12, color: "#c0caf5", fontWeight: 500 }}>{s.label}</span>
          </button>
        ))}
      </div>

      {/* Taxi Apps */}
      <div style={{ fontSize: 13, color: "#9aa5ce", marginBottom: 10 }}>🚖 Call a Taxi</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {TAXI_APPS.map((t, i) => (
          <a key={i} href={t.url} target="_blank" rel="noopener" style={{
            display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)",
            textDecoration: "none", transition: "all 0.15s",
          }}>
            <span style={{ fontSize: 26 }}>{t.icon}</span>
            <div>
              <div style={{ fontSize: 14, color: "#c0caf5", fontWeight: 600 }}>{t.name}</div>
              <div style={{ fontSize: 11, color: "#7982a9" }}>{t.desc}</div>
            </div>
            <span style={{ marginLeft: "auto", fontSize: 12, color: "#565f89" }}>Open →</span>
          </a>
        ))}
      </div>

      {/* Transportation */}
      <div style={{ fontSize: 13, color: "#9aa5ce", marginBottom: 10 }}>🚃 Getting Around</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { label: "Kyoto Bus/Subway Map", url: "https://www.city.kyoto.lg.jp/kotsu/page/0000028337.html", note: "Official Kyoto transit" },
          { label: "Tokyo Metro Map", url: "https://www.tokyometro.jp/en/subwaymap/", note: "All Tokyo subway lines" },
          { label: "Hyperdia (Train Schedules)", url: "https://www.hyperdia.com/", note: "Plan any JR/metro route" },
          { label: "Japan Transit Planner", url: "https://world.jorudan.co.jp/mln/en/", note: "Jorudan route search" },
          { label: "Google Maps Transit", url: "https://www.google.com/maps/@35.6762,139.6503,12z/data=!5m1!1e2", note: "Real-time directions" },
          { label: "Navitime Japan Travel", url: "https://japantravel.navitime.com/en/area/jp/", note: "English transit planner" },
        ].map((t, i) => (
          <a key={i} href={t.url} target="_blank" rel="noopener" style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(255,255,255,0.02)", textDecoration: "none",
          }}>
            <div>
              <div style={{ fontSize: 13, color: "#c0caf5", fontWeight: 500 }}>{t.label}</div>
              <div style={{ fontSize: 11, color: "#7982a9" }}>{t.note}</div>
            </div>
            <span style={{ color: "#565f89", fontSize: 12 }}>↗</span>
          </a>
        ))}
      </div>

      {/* Travel Tips */}
      <div style={{
        marginTop: 16, padding: 14, borderRadius: 12,
        background: "rgba(224,175,104,0.06)", border: "1px solid rgba(224,175,104,0.12)",
      }}>
        <div style={{ fontSize: 13, color: "#e0af68", fontWeight: 600, marginBottom: 8 }}>🗺️ Travel Recommendations</div>
        <div style={{ fontSize: 12, color: "#9aa5ce", lineHeight: 1.7 }}>
          <strong style={{ color: "#c0caf5" }}>Kyoto:</strong> Get the <strong style={{ color: "#e0af68" }}>1-day bus pass (¥700)</strong> – covers most sightseeing. Buses run every 10-15 min. For Fushimi Inari & Arashiyama use JR lines.
          <br /><br />
          <strong style={{ color: "#c0caf5" }}>Tokyo:</strong> Get a <strong style={{ color: "#e0af68" }}>Suica/Pasmo IC card</strong> at any station – tap-and-go for all trains, buses, and konbini payments. Consider the <strong style={{ color: "#e0af68" }}>72-hour metro pass (¥1,500)</strong>.
          <br /><br />
          <strong style={{ color: "#c0caf5" }}>Shinkansen:</strong> Book at Tokyo/Kyoto station JR ticket office or use <strong style={{ color: "#e0af68" }}>SmartEX app</strong> to reserve seats on your phone. Nozomi is fastest (~2h15m). JR Pass only valid on Hikari/Kodama.
        </div>
      </div>
    </div>
  );
}

// ─── PLACES TAB (Phase 2 — Attraction Database) ─────────────
function PlacesTab() {
  const [city, setCity] = useState("kyoto");
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter] = useState("all");

  const attractions = ATTRACTIONS[city];
  const filtered = filter === "must-see" ? attractions.filter(a => a.mustSee) : attractions;

  return (
    <div style={{ padding: "12px 16px 100px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ fontSize: 16, color: "#9aa5ce", fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 400 }}>
          {city === "kyoto" ? "📍 Kyoto Attractions" : "📍 Tokyo Attractions"}
        </h2>
        <div style={{ display: "flex", gap: 4 }}>
          {["kyoto", "tokyo"].map(c => (
            <button key={c} onClick={() => { setCity(c); setExpanded(null); }} style={{
              padding: "4px 14px", borderRadius: 10, border: "none", cursor: "pointer",
              background: city === c ? "rgba(247,118,142,0.2)" : "rgba(255,255,255,0.05)",
              color: city === c ? "#f7768e" : "#7982a9", fontSize: 12, fontWeight: 600,
              textTransform: "capitalize",
            }}>{c}</button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {["all", "must-see"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "4px 12px", borderRadius: 20, border: "none", cursor: "pointer",
            background: filter === f ? "rgba(158,206,106,0.2)" : "rgba(255,255,255,0.04)",
            color: filter === f ? "#9ece6a" : "#7982a9", fontSize: 11, textTransform: "capitalize",
          }}>{f === "must-see" ? "⭐ Must-See" : "All"}</button>
        ))}
        <div style={{ marginLeft: "auto", fontSize: 11, color: "#565f89", alignSelf: "center" }}>
          {filtered.length} places
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map((a, i) => (
          <div key={i} style={{
            borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.03)", overflow: "hidden",
            transition: "all 0.2s",
          }}>
            <button onClick={() => setExpanded(expanded === i ? null : i)} style={{
              width: "100%", padding: "12px 14px", border: "none", cursor: "pointer",
              background: "transparent", textAlign: "left", display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{ fontSize: 24 }}>{a.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#c0caf5" }}>{a.name}</span>
                  {a.mustSee && <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 4, background: "rgba(247,118,142,0.2)", color: "#f7768e" }}>MUST SEE</span>}
                </div>
                <div style={{ fontSize: 11, color: "#7982a9", marginTop: 2 }}>
                  {a.hours} • {a.price} • {a.time}
                </div>
              </div>
              <span style={{ color: "#565f89", fontSize: 14, transition: "transform 0.2s", transform: expanded === i ? "rotate(180deg)" : "rotate(0)" }}>▼</span>
            </button>
            {expanded === i && (
              <div style={{ padding: "0 14px 14px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{
                  fontSize: 12, color: "#e0af68", padding: "10px 10px", marginTop: 8,
                  background: "rgba(224,175,104,0.08)", borderRadius: 8, lineHeight: 1.5,
                }}>
                  💡 {a.tip}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${a.lat},${a.lng}`}
                    target="_blank" rel="noopener"
                    style={{
                      flex: 1, padding: "8px", borderRadius: 8, textAlign: "center",
                      background: "rgba(122,162,247,0.15)", color: "#7aa2f7",
                      fontSize: 12, textDecoration: "none", fontWeight: 600,
                    }}>
                    📍 Open in Maps
                  </a>
                  <a href={`https://www.google.com/search?q=${encodeURIComponent(a.name + " " + city + " Japan")}`}
                    target="_blank" rel="noopener"
                    style={{
                      flex: 1, padding: "8px", borderRadius: 8, textAlign: "center",
                      background: "rgba(158,206,106,0.15)", color: "#9ece6a",
                      fontSize: 12, textDecoration: "none", fontWeight: 600,
                    }}>
                    🔍 More Info
                  </a>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CULTURE TAB ─────────────────────────────────────────────
function CultureTab() {
  return (
    <div style={{ padding: "12px 16px 100px" }}>
      <div style={{
        background: "rgba(158,206,106,0.06)", borderRadius: 14, padding: 14, marginBottom: 16,
        border: "1px solid rgba(158,206,106,0.1)",
      }}>
        <div style={{ fontSize: 14, color: "#9ece6a", fontWeight: 600, marginBottom: 4 }}>🇯🇵 Respect & Harmony</div>
        <div style={{ fontSize: 12, color: "#9aa5ce", lineHeight: 1.6 }}>
          Japanese culture deeply values 和 (wa) — harmony. Being polite, quiet, and respectful of others' space will be greatly appreciated. A simple bow and "arigatou gozaimasu" goes a long way.
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {ETIQUETTE.map((e, i) => (
          <div key={i} style={{
            padding: "12px 14px", borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 22 }}>{e.icon}</span>
              <span style={{ fontSize: 14, color: "#c0caf5", fontWeight: 600 }}>{e.title}</span>
            </div>
            <div style={{ fontSize: 12, color: "#9aa5ce", lineHeight: 1.6, paddingLeft: 30 }}>{e.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SOS TAB ─────────────────────────────────────────────────
function SOSTab() {
  return (
    <div style={{ padding: "12px 16px 100px" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <a href="tel:110" style={{
          display: "inline-flex", width: 120, height: 120, borderRadius: "50%", alignItems: "center",
          justifyContent: "center", textDecoration: "none",
          background: "radial-gradient(circle, #f7768e 0%, #db4b4b 100%)",
          boxShadow: "0 0 40px rgba(247,118,142,0.3), inset 0 -3px 8px rgba(0,0,0,0.2)",
          border: "3px solid rgba(255,255,255,0.15)",
          fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: 3,
        }}>SOS</a>
        <div style={{ fontSize: 11, color: "#7982a9", marginTop: 8 }}>Tap to call Police (110)</div>
      </div>
      <div style={{ fontSize: 13, color: "#f7768e", marginBottom: 10, fontWeight: 600 }}>Emergency Contacts</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {EMERGENCY.map((e, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10,
            border: "1px solid rgba(247,118,142,0.1)", background: "rgba(247,118,142,0.04)",
          }}>
            <span style={{ fontSize: 28 }}>{e.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: "#c0caf5", fontWeight: 600 }}>{e.label}</div>
              <div style={{ fontSize: 11, color: "#7982a9" }}>{e.note}</div>
            </div>
            {e.number ? (
              <a href={`tel:${e.number}`} style={{
                padding: "6px 14px", borderRadius: 8, background: "rgba(247,118,142,0.15)",
                color: "#f7768e", fontSize: 13, fontWeight: 700, textDecoration: "none", fontFamily: "monospace",
              }}>{e.number}</a>
            ) : e.url ? (
              <a href={e.url} target="_blank" rel="noopener" style={{
                padding: "6px 14px", borderRadius: 8, background: "rgba(122,162,247,0.15)",
                color: "#7aa2f7", fontSize: 12, textDecoration: "none",
              }}>Open ↗</a>
            ) : null}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 13, color: "#f7768e", marginBottom: 10, fontWeight: 600 }}>Emergency Phrases</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {PHRASES.filter(p => p.cat === "emergency").map((p, i) => (
          <button key={i} onClick={() => speak(p.ja)} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(247,118,142,0.1)",
            background: "rgba(247,118,142,0.04)", cursor: "pointer", textAlign: "left",
          }}>
            <div>
              <div style={{ fontSize: 13, color: "#c0caf5", fontWeight: 500 }}>{p.en}</div>
              <div style={{ fontSize: 17, color: "#fff", fontFamily: "'Noto Serif JP', serif", marginTop: 2 }}>{p.ja}</div>
              <div style={{ fontSize: 11, color: "#7aa2f7", marginTop: 1 }}>{p.rom}</div>
            </div>
            <span style={{ fontSize: 20 }}>🔊</span>
          </button>
        ))}
      </div>
      <div style={{
        marginTop: 16, padding: 14, borderRadius: 12,
        background: "rgba(224,175,104,0.06)", border: "1px solid rgba(224,175,104,0.12)",
      }}>
        <div style={{ fontSize: 13, color: "#e0af68", fontWeight: 600, marginBottom: 8 }}>📋 Good to Know</div>
        <div style={{ fontSize: 12, color: "#9aa5ce", lineHeight: 1.8 }}>
          • Japan is extremely safe — but stay aware in crowded areas<br />
          • Police boxes (交番 kōban) are everywhere — officers can help with directions too<br />
          • Most hospitals won't have English speakers — use AMDA helpline first<br />
          • Keep a photo of your passport and hotel address on your phone<br />
          • Travel insurance docs should be accessible offline<br />
          • Your hotel front desk can assist with most emergencies
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────
export default function JapanTravelAssistant() {
  const [tab, setTab] = useState("trip");

  return (
    <div style={{
      minHeight: "100vh",
      background: "#1a1a2e",
      color: "#c0caf5",
      fontFamily: "'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif",
      maxWidth: 480,
      margin: "0 auto",
      position: "relative",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;600;700&family=Noto+Serif+JP:wght@400;600&display=swap');
        @keyframes pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(247,118,142,0.4); }
          50% { transform: scale(1.05); box-shadow: 0 0 0 12px rgba(247,118,142,0); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 0; }
        body { background: #1a1a2e; }
        input::placeholder { color: #565f89; }
        button:active { opacity: 0.8; transform: scale(0.98); }
        a:active { opacity: 0.8; }
      `}</style>

      <Header />

      {tab === "trip" && <TripTab />}
      {tab === "translate" && <TranslateTab />}
      {tab === "explore" && <ExploreTab />}
      {tab === "places" && <PlacesTab />}
      {tab === "culture" && <CultureTab />}
      {tab === "sos" && <SOSTab />}

      <TabBar active={tab} setActive={setTab} />
    </div>
  );
}
