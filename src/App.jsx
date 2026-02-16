import { useState, useEffect, useRef, useCallback } from "react";

const TRIP_DATA = {
  title: "Japan Trip 2026",
  dates: "Feb 20 – Feb 27",
  segments: [
    {
      id: 1, type: "travel", icon: "✈️", title: "Arrive Tokyo",
      date: "Feb 20 (Fri)", time: "—",
      detail: "Land at Tokyo airport → Transfer to Tokyo Station",
      note: "Buy Suica/Pasmo IC card at airport for all transit"
    },
    {
      id: 2, type: "travel", icon: "🚅", title: "Shinkansen → Kyoto",
      date: "Feb 20 (Fri)", time: "~2h 15m ride",
      detail: "Tokyo Station → Kyoto Station (Tokaido Shinkansen Nozomi)",
      note: "Reserve seat in advance. ¥13,320 one-way. JR Pass accepted on Hikari/Kodama only"
    },
    {
      id: 3, type: "hotel", icon: "🏨", title: "The OneFive Kyoto Shijo",
      date: "Feb 20–22", time: "Check-in 3:00 PM / Check-out 10:00 AM",
      detail: "Shimogyo-ku, Shijo-dori Horikawa • 3 min walk to Omiya & Shijo Omiya Station",
      note: "7-Eleven on ground floor! Nijo Castle 8 min drive. Bus stops right outside.",
      lat: 35.0016, lng: 135.7508
    },
    {
      id: 4, type: "explore", icon: "⛩️", title: "Explore Kyoto",
      date: "Feb 21–22", time: "Full days",
      detail: "Fushimi Inari, Kinkaku-ji, Arashiyama, Nishiki Market, Gion district",
      note: "Buy Kyoto 1-day bus pass (¥700) at hotel front desk"
    },
    {
      id: 5, type: "travel", icon: "🚅", title: "Shinkansen → Tokyo",
      date: "Feb 22 (Sun)", time: "After check-out",
      detail: "Kyoto Station → Tokyo Station (Tokaido Shinkansen)",
      note: "Same route back. ~2h 15m"
    },
    {
      id: 6, type: "hotel", icon: "🏨", title: "the b asakusa",
      date: "Feb 22–27", time: "Check-in 3:00 PM / Check-out 11:00 AM",
      detail: "Nishi Asakusa 3-16-12, Taito-ku • 1 min walk from Tsukuba Express Asakusa Stn",
      note: "400m from Sensoji Temple. 7-Eleven across the street. Breakfast buffet available (¥1,650).",
      lat: 35.7118, lng: 139.7918
    },
    {
      id: 7, type: "explore", icon: "🗼", title: "Explore Tokyo",
      date: "Feb 23–26", time: "Full days",
      detail: "Shibuya, Shinjuku, Akihabara, Harajuku, Tsukiji, Meiji Shrine, Skytree",
      note: "Suica card works everywhere. Get 72-hour Tokyo subway pass (¥1,500)"
    },
    {
      id: 8, type: "travel", icon: "✈️", title: "Flight Home",
      date: "Feb 27 (Fri)", time: "Early morning",
      detail: "Check out → Transfer to airport",
      note: "Narita Express from Asakusa area ~70 min. Allow 3+ hours before flight."
    }
  ]
};

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

const EMERGENCY = [
  { icon: "🚑", label: "Ambulance / Fire", number: "119", note: "Free from any phone" },
  { icon: "🚔", label: "Police", number: "110", note: "Free from any phone" },
  { icon: "🌏", label: "Japan Helpline (24h English)", number: "0570-064-211", note: "Multilingual support" },
  { icon: "🏥", label: "AMDA Medical Info (English)", number: "03-6233-9266", note: "Doctor referrals in English" },
  { icon: "🏛️", label: "Embassy Locator", number: null, note: "Search your embassy in Tokyo/Osaka", url: "https://www.mofa.go.jp/about/emb_cons/protocol/index.html" },
  { icon: "📱", label: "Disaster Info (NHK World)", number: null, note: "Earthquake/typhoon alerts", url: "https://www3.nhk.or.jp/nhkworld/en/news/" },
];

const TAXI_APPS = [
  { name: "GO Taxi", icon: "🚖", desc: "Most popular in Japan", url: "https://go.goinc.jp/", deep: "gotaxi://", color: "#00C853" },
  { name: "Uber Japan", icon: "🚗", desc: "Works in major cities", url: "https://www.uber.com/jp/en/", deep: "uber://", color: "#000" },
  { name: "Grab", icon: "🟢", desc: "Limited in Japan", url: "https://www.grab.com/", deep: "grab://", color: "#00B14F" },
  { name: "S.RIDE", icon: "🟡", desc: "Tokyo area taxi", url: "https://www.sride.jp/", deep: "sride://", color: "#FFD600" },
];

const speak = (text, lang = "ja-JP") => {
  if ("speechSynthesis" in window) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.85;
    speechSynthesis.speak(u);
  }
};

// --- UI Components ---

function TabBar({ active, setActive }) {
  const tabs = [
    { id: "trip", icon: "📋", label: "Trip" },
    { id: "translate", icon: "🗣️", label: "Translate" },
    { id: "explore", icon: "🧭", label: "Explore" },
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
          fontSize: 10, fontFamily: "'Noto Sans JP', sans-serif", cursor: "pointer",
          transition: "all 0.2s", transform: active === t.id ? "scale(1.1)" : "scale(1)",
          padding: "4px 12px",
        }}>
          <span style={{ fontSize: 20, filter: active === t.id ? "drop-shadow(0 0 6px #f7768e)" : "none" }}>{t.icon}</span>
          <span style={{ fontWeight: active === t.id ? 700 : 400 }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

function Header() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const i = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(i); }, []);
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
    </div>
  );
}

function TripTab() {
  return (
    <div style={{ padding: "12px 16px 100px" }}>
      <h2 style={{ fontSize: 16, color: "#9aa5ce", fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 400, marginBottom: 16 }}>
        Your Itinerary
      </h2>
      {TRIP_DATA.segments.map((s, i) => (
        <div key={s.id} style={{
          display: "flex", gap: 12, marginBottom: 4,
        }}>
          {/* Timeline line */}
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
          {/* Card */}
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
    } catch (err) {
      setResult({ original: text, translated: "Translation error — check connection", romanji: "", context: "" });
    }
    setLoading(false);
  };

  const cats = ["all", "basics", "food", "navigate", "shopping", "emergency"];
  const filtered = phraseFilter === "all" ? PHRASES : PHRASES.filter(p => p.cat === phraseFilter);

  return (
    <div style={{ padding: "12px 16px 100px" }}>
      {/* Voice translate section */}
      <div style={{
        background: "rgba(247,118,142,0.06)", borderRadius: 14, padding: 16, marginBottom: 16,
        border: "1px solid rgba(247,118,142,0.12)",
      }}>
        <div style={{ fontSize: 13, color: "#9aa5ce", marginBottom: 10, fontFamily: "'Noto Sans JP', sans-serif" }}>
          🎙️ Voice / Text Translation (AI-powered)
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
          <div style={{
            marginTop: 12, padding: 12, background: "rgba(0,0,0,0.2)", borderRadius: 10,
          }}>
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
      (err) => { setLocErr("Location access denied. Enable in phone settings."); setSearching(false); },
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
    { icon: "🏧", label: "ATM", query: "ATM near me" },
    { icon: "💊", label: "Pharmacy", query: "pharmacy drugstore near me" },
    { icon: "☕", label: "Café", query: "cafe coffee near me" },
    { icon: "🍺", label: "Izakaya", query: "izakaya bar near me" },
    { icon: "🛍️", label: "Don Quijote", query: "Don Quijote near me" },
    { icon: "📮", label: "Post Office", query: "post office near me" },
  ];

  return (
    <div style={{ padding: "12px 16px 100px" }}>
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
          {searching ? "Locating..." : loc ? `📍 ${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)} — Tap to refresh` : "Enable Location"}
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

      {/* Travel Tips Box */}
      <div style={{
        marginTop: 16, padding: 14, borderRadius: 12,
        background: "rgba(224,175,104,0.06)", border: "1px solid rgba(224,175,104,0.12)",
      }}>
        <div style={{ fontSize: 13, color: "#e0af68", fontWeight: 600, marginBottom: 8 }}>🗺️ Travel Recommendations</div>
        <div style={{ fontSize: 12, color: "#9aa5ce", lineHeight: 1.7 }}>
          <strong style={{ color: "#c0caf5" }}>Kyoto:</strong> Get the <strong style={{ color: "#e0af68" }}>1-day bus pass (¥700)</strong> — covers most sightseeing. Buses run every 10-15 min. For Fushimi Inari & Arashiyama use JR lines.
          <br /><br />
          <strong style={{ color: "#c0caf5" }}>Tokyo:</strong> Get a <strong style={{ color: "#e0af68" }}>Suica/Pasmo IC card</strong> at any station — tap-and-go for all trains, buses, and konbini payments. Consider the <strong style={{ color: "#e0af68" }}>72-hour metro pass (¥1,500)</strong>.
          <br /><br />
          <strong style={{ color: "#c0caf5" }}>Shinkansen:</strong> Book at Tokyo/Kyoto station JR ticket office or use <strong style={{ color: "#e0af68" }}>SmartEX app</strong> to reserve seats on your phone. Nozomi is fastest (~2h15m). JR Pass only valid on Hikari/Kodama.
        </div>
      </div>
    </div>
  );
}

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

function SOSTab() {
  return (
    <div style={{ padding: "12px 16px 100px" }}>
      {/* Big SOS Button */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <a href="tel:110" style={{
          display: "inline-flex", width: 120, height: 120, borderRadius: "50%", alignItems: "center",
          justifyContent: "center", textDecoration: "none",
          background: "radial-gradient(circle, #f7768e 0%, #db4b4b 100%)",
          boxShadow: "0 0 40px rgba(247,118,142,0.3), inset 0 -3px 8px rgba(0,0,0,0.2)",
          border: "3px solid rgba(255,255,255,0.15)",
          fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: 3,
        }}>
          SOS
        </a>
        <div style={{ fontSize: 11, color: "#7982a9", marginTop: 8 }}>Tap to call Police (110)</div>
      </div>

      {/* Emergency Numbers */}
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
                color: "#f7768e", fontSize: 13, fontWeight: 700, textDecoration: "none",
                fontFamily: "monospace",
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

      {/* Quick Emergency Phrases */}
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

      {/* Useful Info */}
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
      {tab === "culture" && <CultureTab />}
      {tab === "sos" && <SOSTab />}

      <TabBar active={tab} setActive={setTab} />
    </div>
  );
}
