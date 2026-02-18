import { useState, useEffect, useRef, useCallback } from "react";

const BROWSER_HEADER = { "Content-Type": "application/json", "anthropic-dangerous-direct-browser-access": "true" };
const ANT_MODEL = "claude-sonnet-4-20250514";
const ANT_URL = "https://api.anthropic.com/v1/messages";

async function callOpenAI(messages, { max_tokens = 1000 } = {}) {
  try {
    const res = await fetch(ANT_URL, {
      method: "POST", headers: BROWSER_HEADER,
      body: JSON.stringify({ model: ANT_MODEL, max_tokens, messages: [{ role: "user", content: messages.map(m => `${m.role}: ${m.content}`).join("\n") }] })
    });
    const data = await res.json();
    return data.content?.map(c => c.text || "").join("") || "";
  } catch { return null; }
}

async function callVision(base64, prompt) {
  try {
    const res = await fetch(ANT_URL, {
      method: "POST", headers: BROWSER_HEADER,
      body: JSON.stringify({
        model: ANT_MODEL, max_tokens: 1000,
        messages: [{ role: "user", content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64 } },
          { type: "text", text: prompt }
        ]}]
      })
    });
    if (res.ok) { const d = await res.json(); return d.content?.map(c => c.text || "").join("") || ""; }
    const err = await res.text(); console.error("Vision API error:", res.status, err);
  } catch (e) { console.error("Vision fetch error:", e); }
  return null;
}

async function callChat(messages, { max_tokens = 800 } = {}) {
  try {
    const res = await fetch(ANT_URL, {
      method: "POST", headers: BROWSER_HEADER,
      body: JSON.stringify({
        model: ANT_MODEL, max_tokens,
        messages: [{ role: "user", content: messages.map(m => `${m.role}: ${m.content}`).join("\n") }],
      }),
    });
    const d = await res.json();
    return d.content?.map(c => c.text || "").join("") || "";
  } catch { return null; }
}

function buildSystemPrompt(dailyPlans, expenses = []) {
  const totalSpent = expenses.reduce((s, e) => s + (e.a || 0), 0);
  const plansStr = dailyPlans.map((d, i) =>
    `[${i}] ${d.date} (${d.city}): "${d.title}"\n${d.stops.map(s => `   ${s.time} ${s.icon} ${s.name} – ${s.tip}`).join("\n")}`
  ).join("\n\n");
  return `You are an expert Japan travel assistant for this specific trip:

TRIP OVERVIEW:
• Flight out: TG 682, Bangkok (BKK) → Tokyo Haneda (HND), Feb 19 22:45 → Feb 20 06:55+1
• Flight home: TG 683, Tokyo Haneda → Bangkok, Feb 27 10:35 → 15:40 (check out by 11AM!)
• Kyoto stay: Feb 20–22, The OneFive Kyoto Shijo (Shijo-dori Horikawa, 3 min to Omiya Stn, 7-Eleven in lobby)
• Tokyo stay: Feb 22–27, the b asakusa (Nishi-Asakusa 3-16-12, 1 min Tsukuba Express, 400m from Senso-ji, 7-Eleven across street)

BUDGET: ¥${totalSpent.toLocaleString()} spent so far${totalSpent > 0 ? ` (≈ $${(totalSpent * 0.0067).toFixed(0)})` : ""}

TRAVELER INTERESTS: Whiskey bars, vinyl/music bars, sushi & Japanese food, culture & history. Budget-conscious but willing to splurge on experiences.

CURRENT DAILY PLANS (0-indexed):
${plansStr}

YOUR CAPABILITIES – respond naturally but also:

1. TRAVEL ADVICE: Restaurant recs near hotels, transit directions, etiquette, packing tips
2. TRANSLATION: Japanese phrases with romaji. How to say things.
3. BUDGET ADVICE: Where to save vs splurge, konbini hacks, budget meal spots
4. REPLANNING: When asked to replan/modify a day, think through a better schedule. Always end with a fenced JSON block:
\`\`\`json
{"action":"replan","dayIndex":N,"dayTitle":"Short Day Title","stops":[{"time":"HH:MM","name":"Place Name","tip":"Insider tip here","icon":"emoji"}]}
\`\`\`
Use the 0-based dayIndex from the plan list above (0=Feb21, 1=Feb22, 2=Feb23, 3=Feb24, 4=Feb25, 5=Feb26).
5. RECOMMENDATIONS: Personalized to their hotel location and interests. Be specific with names & tips.

Keep responses concise and friendly (max 200 words unless replanning). Include Japanese phrases when relevant. 🇯🇵`;
}

const FLIGHTS = {
  outbound: { flight:"TG 682",airline:"Thai Airways",aircraft:"Boeing 777-300ER",date:"Feb 19 (Thu)",route:"Bangkok (BKK) → Tokyo Haneda (HND)",depart:"22:45",arrive:"06:55 +1",arriveDate:"Feb 20 (Fri)",terminal:{depart:"Suvarnabhumi",arrive:"Haneda T3"},duration:"6h 10m",distance:"4,589 km",codeshare:"NH5598 / LY8433",onTime:"70%",avgDelay:"20 min" },
  return: { flight:"TG 683",airline:"Thai Airways",aircraft:"Boeing 777-300ER",date:"Feb 27 (Fri)",route:"Tokyo Haneda (HND) → Bangkok (BKK)",depart:"10:35",arrive:"15:40",arriveDate:"Feb 27 (Fri)",terminal:{depart:"Haneda T3",arrive:"Suvarnabhumi T1"},duration:"7h 05m",distance:"4,589 km",codeshare:"NH5599 / LY8434",onTime:"84%",avgDelay:"17 min" }
};

const HOTELS = [
  { name:"The OneFive Kyoto Shijo",nameJa:"ザ・ワンファイブ京都四条",dates:"Feb 20–22",address:"〒600-8413 京都府京都市下京区四条通堀川東入ル柏屋町1番地",addressEn:"1 Kashiwaya-cho, Shijo-dori Horikawa, Shimogyo-ku, Kyoto",phone:"+81-75-284-1150",checkin:"3:00 PM",checkout:"10:00 AM",lat:35.0016,lng:135.7508,nearStation:"Omiya / Shijo Omiya Stn (3 min)" },
  { name:"the b asakusa",nameJa:"ザ・ビー浅草",dates:"Feb 22–27",address:"〒111-0035 東京都台東区西浅草3-16-12",addressEn:"3-16-12 Nishi Asakusa, Taito-ku, Tokyo",phone:"+81-3-5828-3300",checkin:"3:00 PM",checkout:"11:00 AM",lat:35.7118,lng:139.7918,nearStation:"Tsukuba Express Asakusa (1 min)" }
];

const TRIP_DATA = { segments: [
  { id:0,type:"travel",icon:"✈️",title:"Depart Bangkok → Tokyo",date:"Feb 19 (Thu)",time:"22:45 BKK → 06:55+1 HND",detail:"TG 682 • Thai Airways • Boeing 777-300ER • Haneda T3",note:"Night flight. Arrive Feb 20 morning. Buy Suica/Pasmo at Haneda." },
  { id:1,type:"travel",icon:"🚅",title:"Shinkansen → Kyoto",date:"Feb 20 (Fri)",time:"~2h 15m",detail:"Tokyo Stn → Kyoto Stn (Nozomi)",note:"SmartEX app to reserve. ¥13,320 one-way." },
  { id:2,type:"hotel",icon:"🏨",title:"The OneFive Kyoto Shijo",date:"Feb 20–22",time:"In 3PM / Out 10AM",detail:"Shimogyo-ku, Shijo-dori Horikawa • 3 min to Omiya Stn",note:"7-Eleven on ground floor! Nijo Castle 8 min." },
  { id:3,type:"explore",icon:"⛩️",title:"Explore Kyoto",date:"Feb 21–22",time:"Full days",detail:"Fushimi Inari, Kinkaku-ji, Arashiyama, Nishiki Market, Gion",note:"Buy Kyoto 1-day bus pass (¥700)" },
  { id:4,type:"travel",icon:"🚅",title:"Shinkansen → Tokyo",date:"Feb 22 (Sun)",time:"After check-out",detail:"Kyoto Stn → Tokyo Stn",note:"Same route back. ~2h 15m" },
  { id:5,type:"hotel",icon:"🏨",title:"the b asakusa",date:"Feb 22–27",time:"In 3PM / Out 11AM",detail:"Nishi Asakusa 3-16-12 • 1 min from Tsukuba Express",note:"400m from Sensoji. 7-Eleven across the street." },
  { id:6,type:"explore",icon:"🗼",title:"Explore Tokyo",date:"Feb 23–26",time:"Full days",detail:"Shibuya, Shinjuku, Akihabara, Harajuku, Tsukiji, Skytree",note:"Suica works everywhere. 72-hour metro pass ¥1,500" },
  { id:7,type:"travel",icon:"✈️",title:"Flight Home → Bangkok",date:"Feb 27 (Fri)",time:"10:35 HND → 15:40 BKK",detail:"TG 683 • Thai Airways • Haneda T3",note:"Check out 11AM. Allow 3+ hours before flight." },
]};

const PHRASES = [
  {en:"Hello",ja:"こんにちは",rom:"Konnichiwa",cat:"basics"},{en:"Thank you",ja:"ありがとうございます",rom:"Arigatou gozaimasu",cat:"basics"},
  {en:"Excuse me",ja:"すみません",rom:"Sumimasen",cat:"basics"},{en:"Sorry",ja:"ごめんなさい",rom:"Gomen nasai",cat:"basics"},
  {en:"Yes / No",ja:"はい / いいえ",rom:"Hai / Iie",cat:"basics"},{en:"I don't understand",ja:"わかりません",rom:"Wakarimasen",cat:"basics"},
  {en:"Do you speak English?",ja:"英語を話せますか？",rom:"Eigo o hanasemasu ka?",cat:"basics"},{en:"Please",ja:"おねがいします",rom:"Onegaishimasu",cat:"basics"},
  {en:"Good morning",ja:"おはようございます",rom:"Ohayou gozaimasu",cat:"basics"},{en:"Goodbye",ja:"さようなら",rom:"Sayounara",cat:"basics"},
  {en:"How much?",ja:"いくらですか？",rom:"Ikura desu ka?",cat:"shopping"},{en:"Too expensive",ja:"高すぎます",rom:"Takasugimasu",cat:"shopping"},
  {en:"I'll take this",ja:"これをください",rom:"Kore o kudasai",cat:"shopping"},{en:"Where is the toilet?",ja:"トイレはどこですか？",rom:"Toire wa doko desu ka?",cat:"navigate"},
  {en:"Where is the station?",ja:"駅はどこですか？",rom:"Eki wa doko desu ka?",cat:"navigate"},{en:"Please take me to…",ja:"…まで おねがいします",rom:"...made onegaishimasu",cat:"navigate"},
  {en:"I'm lost",ja:"迷いました",rom:"Mayoimashita",cat:"navigate"},{en:"Where is the trash can?",ja:"ゴミ箱はどこですか？",rom:"Gomibako wa doko desu ka?",cat:"navigate"},
  {en:"Menu, please",ja:"メニューをください",rom:"Menyuu o kudasai",cat:"food"},{en:"Water, please",ja:"お水をください",rom:"Omizu o kudasai",cat:"food"},
  {en:"The bill, please",ja:"お会計おねがいします",rom:"Okaikei onegaishimasu",cat:"food"},{en:"Delicious!",ja:"おいしい！",rom:"Oishii!",cat:"food"},
  {en:"No meat please",ja:"肉なしでおねがいします",rom:"Niku nashi de onegaishimasu",cat:"food"},{en:"I have an allergy",ja:"アレルギーがあります",rom:"Arerugii ga arimasu",cat:"food"},
  {en:"Cheers!",ja:"乾杯！",rom:"Kanpai!",cat:"food"},{en:"Help!",ja:"助けて！",rom:"Tasukete!",cat:"emergency"},
  {en:"Call an ambulance",ja:"救急車を呼んでください",rom:"Kyuukyuusha o yonde kudasai",cat:"emergency"},{en:"I need a doctor",ja:"医者が必要です",rom:"Isha ga hitsuyou desu",cat:"emergency"},
  {en:"I feel sick",ja:"気分が悪いです",rom:"Kibun ga warui desu",cat:"emergency"},
];

const EMERGENCY = [
  {icon:"🚑",label:"Ambulance/Fire",number:"119",note:"Free from any phone"},
  {icon:"🚔",label:"Police",number:"110",note:"Free from any phone"},
  {icon:"🌐",label:"Japan Helpline (24h EN)",number:"0570-064-211",note:"Multilingual"},
  {icon:"🏥",label:"AMDA Medical (EN)",number:"03-6233-9266",note:"Doctor referrals"},
  {icon:"📱",label:"NHK World Disaster",number:null,note:"Earthquake/typhoon alerts",url:"https://www3.nhk.or.jp/nhkworld/en/news/"},
];

const NIGHTLIFE = {
  whiskey:[
    {name:"Bar Benfiddich",area:"Shinjuku",desc:"World's 50 Best Bars. Mad-genius owner grows ingredients.",price:"¥¥¥",hours:"6PM–2AM",tip:"9F nondescript building. No menu — tell them what you like.",lat:35.6937,lng:139.6957},
    {name:"Zoetrope",area:"Nishi-Shinjuku",desc:"300+ Japanese whiskies. Film-buff owner screens movies.",price:"¥¥",hours:"5PM–12AM (closed Sun)",tip:"Small & intimate. Go early.",lat:35.6930,lng:139.6940},
    {name:"Star Bar Ginza",area:"Ginza",desc:"Legendary upmarket bar. Hand-carved ice. Impeccable service.",price:"¥¥¥¥",hours:"5PM–11PM (closed Sun)",tip:"Dress smart. No photos.",lat:35.6713,lng:139.7651},
  ],
  vinyl:[
    {name:"Grandfather's",area:"Shibuya",desc:"40-year OG listening bar. Perfect playlists.",price:"¥¥",hours:"7PM–2AM",tip:"¥700 Guinness on tap. Cozy.",lat:35.6595,lng:139.6990},
    {name:"JBS",area:"Shibuya",desc:"Incredible collection. Plays full sides of albums.",price:"¥¥",hours:"7PM–3AM",tip:"Just listen. Serious audiophile spot.",lat:35.6590,lng:139.6985},
    {name:"Meikyoku Kissa Lion",area:"Shibuya",desc:"Founded 1926. Oldest music cafe. Towering speakers.",price:"¥",hours:"11AM–10PM",tip:"No talking 3PM–7PM (concert hours).",lat:35.6580,lng:139.6960},
  ],
  entertainment:[
    {name:"Golden Gai",area:"Shinjuku",desc:"50-100 tiny bars in narrow alleys, each seats 5-6.",price:"¥–¥¥¥",hours:"8PM–late",tip:"Many charge ¥500-1000 cover.",lat:35.6940,lng:139.7035},
    {name:"Omoide Yokocho",area:"Shinjuku",desc:"Atmospheric alley of tiny yakitori stalls.",price:"¥",hours:"5PM–12AM",tip:"Smoky, cramped, perfect.",lat:35.6937,lng:139.6980},
    {name:"Hoppy Street",area:"Asakusa",desc:"Outdoor drinking street near your hotel!",price:"¥",hours:"3PM–11PM",tip:"400m from the b asakusa. Order Hoppy.",lat:35.7130,lng:139.7940},
  ]
};

const SHOPPING = [
  {name:"Don Quijote (Donki)",icon:"🪩",area:"Everywhere",desc:"Tax-free souvenirs, snacks, electronics. Open 24h.",tip:"Passport for tax-free on ¥5,000+.",cat:"general"},
  {name:"Nakamise Street",icon:"🎎",area:"Asakusa",desc:"Traditional souvenirs, snacks. 400m from hotel!",tip:"Compare prices on side streets.",cat:"souvenirs"},
  {name:"Akihabara Electric Town",icon:"🎮",area:"Akihabara",desc:"Electronics, anime, manga, retro games.",tip:"Yodobashi Camera for electronics.",cat:"electronics"},
  {name:"Nishiki Market",icon:"🐡",area:"Kyoto",desc:"400m covered market, 100+ food stalls.",tip:"Dashi tamago, mochi, matcha. Closes 5 PM.",cat:"food"},
  {name:"Disk Union",icon:"🎵",area:"Shinjuku",desc:"Japan's best used records. Genre-specific stores.",tip:"Shinjuku branch excels in jazz.",cat:"entertainment"},
  {name:"Tower Records Shibuya",icon:"💿",area:"Shibuya",desc:"9-floor music store. Japan-exclusive vinyl.",tip:"Great for music lovers.",cat:"entertainment"},
];

const ATTRACTIONS = {
  kyoto:[
    {name:"Fushimi Inari",icon:"⛩️",hours:"24h",price:"Free",time:"1.5–2h",tip:"Go at dawn. Full hike 2-3 hours.",lat:34.9671,lng:135.7727,mustSee:true},
    {name:"Kinkaku-ji",icon:"🏯",hours:"9–17",price:"¥500",time:"45m",tip:"Best photos from pond.",lat:35.0394,lng:135.7292,mustSee:true},
    {name:"Arashiyama Bamboo",icon:"🎋",hours:"24h",price:"Free",time:"30m",tip:"Before 8 AM for no crowds.",lat:35.0095,lng:135.6722,mustSee:true},
    {name:"Nishiki Market",icon:"🐡",hours:"9–17",price:"Free",time:"1–2h",tip:"Dashi tamago & mochi.",lat:35.0050,lng:135.7650},
    {name:"Kiyomizu-dera",icon:"🛕",hours:"6–18",price:"¥400",time:"1h",tip:"Wooden terrace = stunning views.",lat:34.9949,lng:135.7850,mustSee:true},
    {name:"Gion District",icon:"🎭",hours:"Evening",price:"Free",time:"1–2h",tip:"Hanamikoji at dusk for geisha.",lat:35.0037,lng:135.7756},
  ],
  tokyo:[
    {name:"Senso-ji",icon:"⛩️",hours:"6–17",price:"Free",time:"1h",tip:"400m from hotel!",lat:35.7148,lng:139.7967,mustSee:true},
    {name:"Shibuya Crossing",icon:"🚶",hours:"24h",price:"Free",time:"30m",tip:"Starbucks 2F or Shibuya Sky.",lat:35.6595,lng:139.7004,mustSee:true},
    {name:"Meiji Shrine",icon:"⛩️",hours:"Dawn–Dusk",price:"Free",time:"1h",tip:"Write wish on ema.",lat:35.6764,lng:139.6993,mustSee:true},
    {name:"Tokyo Skytree",icon:"🗼",hours:"10–21",price:"¥2,100+",time:"1–2h",tip:"634m tall. Book online.",lat:35.7101,lng:139.8107,mustSee:true},
    {name:"Akihabara",icon:"🎮",hours:"10–21",price:"Free",time:"2–4h",tip:"Electronics, anime, maid café.",lat:35.7023,lng:139.7745},
    {name:"Tsukiji Market",icon:"🍣",hours:"5–14",price:"Free",time:"1–2h",tip:"Best sushi breakfast ever!",lat:35.6654,lng:139.7707,mustSee:true},
    {name:"teamLab Borderless",icon:"🎨",hours:"10–19",price:"¥3,800",time:"2–3h",tip:"Book weeks ahead.",lat:35.6257,lng:139.7838},
  ]
};

const DAILY_PLANS = [
  {date:"Feb 21 (Sat)",city:"Kyoto",title:"Temples & Markets",stops:[
    {time:"6:00",name:"Fushimi Inari",tip:"Empty at dawn",icon:"⛩️"},{time:"9:00",name:"Nishiki Market",tip:"Dashi tamago, matcha",icon:"🐡"},
    {time:"10:30",name:"Kiyomizu-dera",tip:"Walk Higashiyama up",icon:"🛕"},{time:"12:30",name:"Gion lunch",tip:"Teishoku ¥800-1,200",icon:"🍱"},
    {time:"14:00",name:"Kinkaku-ji",tip:"Less crowded PM",icon:"🏯"},{time:"18:00",name:"Pontocho dinner",tip:"Atmospheric alley",icon:"🍶"},
  ]},
  {date:"Feb 22 (Sun)",city:"Kyoto→Tokyo",title:"Arashiyama & Transfer",stops:[
    {time:"7:00",name:"Bamboo Grove",tip:"Empty before 8 AM",icon:"🎋"},{time:"10:00",name:"Check out → Kyoto Stn",tip:"Grab ekiben!",icon:"🚅"},
    {time:"14:00",name:"Check in Tokyo",tip:"the b asakusa",icon:"🏨"},{time:"15:00",name:"Senso-ji",tip:"400m from hotel",icon:"⛩️"},
    {time:"18:00",name:"Hoppy Street",tip:"Yakitori & beer",icon:"🍻"},
  ]},
  {date:"Feb 23 (Mon)",city:"Tokyo",title:"Shibuya & Harajuku",stops:[
    {time:"9:00",name:"Meiji Shrine",tip:"Write wish on ema",icon:"⛩️"},{time:"10:30",name:"Takeshita Street",tip:"Crepes & fashion",icon:"🌈"},
    {time:"13:30",name:"Shibuya Crossing",tip:"Then Starbucks 2F",icon:"🚶"},{time:"14:30",name:"Shibuya Sky",tip:"360° views",icon:"🏙️"},
    {time:"19:00",name:"Golden Gai",tip:"Bar hopping",icon:"🍶"},
  ]},
  {date:"Feb 24 (Tue)",city:"Tokyo",title:"Culture & Whiskey",stops:[
    {time:"6:00",name:"Tsukiji Market",tip:"Best sushi breakfast",icon:"🍣"},{time:"9:00",name:"teamLab Borderless",tip:"2-3h",icon:"🎨"},
    {time:"14:30",name:"Imperial Palace",tip:"Free, Edo Castle",icon:"👑"},{time:"19:00",name:"Whiskey bars",tip:"Zoetrope or Benfiddich",icon:"🥃"},
  ]},
  {date:"Feb 25 (Wed)",city:"Tokyo",title:"Akihabara & Vinyl",stops:[
    {time:"11:00",name:"Akihabara",tip:"Electronics, anime",icon:"🎮"},{time:"14:30",name:"Tokyo Skytree",tip:"Book online",icon:"🗼"},
    {time:"17:00",name:"Disk Union",tip:"Best used records",icon:"🎵"},{time:"19:00",name:"Vinyl bar night",tip:"Grandfather's",icon:"🎶"},
  ]},
  {date:"Feb 26 (Thu)",city:"Tokyo",title:"Shopping & Last Night",stops:[
    {time:"Flex",name:"Revisit or explore",tip:"Buffer day!",icon:"🗺️"},{time:"Idea",name:"Don Quijote + Ginza",tip:"Tax-free souvenirs",icon:"🛍️"},
    {time:"Eve",name:"Last night splurge",tip:"Omakase/wagyu + Star Bar",icon:"🥩"},
  ]},
];

const PACKING_DATA = [
  {cat:"essentials",items:[{id:"p01",name:"Passport",note:"6+ months validity"},{id:"p02",name:"Flight tickets",note:"TG 682/683"},{id:"p03",name:"Hotel confirmations",note:"Print/save offline"},{id:"p04",name:"Travel insurance",note:"Save policy #"},{id:"p05",name:"Cards (notify bank)",note:"Japan travel dates"},{id:"p06",name:"Cash (JPY)",note:"¥20,000+ at airport"},{id:"p07",name:"Charger + cable",note:"Type A plugs (=US)"},{id:"p08",name:"Battery pack",note:"10,000+ mAh"}]},
  {cat:"tech",items:[{id:"p09",name:"eSIM / Pocket Wi-Fi",note:"Ubigi, Airalo"},{id:"p10",name:"Offline Google Maps",note:"Kyoto + Tokyo"},{id:"p11",name:"GO Taxi app",note:"Best taxi in Japan"},{id:"p12",name:"SmartEX app",note:"Reserve Shinkansen"},{id:"p13",name:"Earbuds",note:"No speakers on trains!"}]},
  {cat:"clothing",items:[{id:"p15",name:"Walking shoes",note:"15,000+ steps/day"},{id:"p16",name:"Slip-on shoes",note:"Temples & restaurants"},{id:"p17",name:"Warm layers",note:"Feb: 2–10°C"},{id:"p18",name:"Umbrella",note:"Compact"},{id:"p19",name:"Warm socks",note:"Cold in temples!"}]},
  {cat:"japan-specific",items:[{id:"p21",name:"Small trash bag",note:"No public bins!"},{id:"p22",name:"Hand towel",note:"No paper towels"},{id:"p23",name:"Coin purse",note:"Lots of coins"},{id:"p24",name:"Basic meds",note:"Ibuprofen, band-aids"}]},
];

const WMO_CODES={0:"☀️ Clear",1:"🌤️ Clear",2:"⛅ Cloudy",3:"☁️ Overcast",45:"🌫️ Fog",51:"🌦️ Drizzle",61:"🌧️ Rain",63:"🌧️ Rain",71:"🌨️ Snow",80:"🌧️ Showers",95:"⛈️ Storm"};
const speak=(text,lang="ja-JP")=>{if("speechSynthesis"in window){const u=new SpeechSynthesisUtterance(text);u.lang=lang;u.rate=0.85;speechSynthesis.speak(u);}};

const storage={
  async get(k){try{if(window.storage){const r=await window.storage.get(k);return r?JSON.parse(r.value):null;}}catch{}return null;},
  async set(k,v){try{if(window.storage){await window.storage.set(k,JSON.stringify(v));}}catch{}}
};

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
function TabBar({active,setActive}){
  const tabs=[{id:"trip",icon:"📋",l:"Trip"},{id:"planner",icon:"📅",l:"Plan"},{id:"translate",icon:"🗣️",l:"Talk"},
    {id:"camera",icon:"📷",l:"Lens"},{id:"explore",icon:"🧭",l:"Explore"},{id:"nightlife",icon:"🌙",l:"Night"},
    {id:"places",icon:"📍",l:"Places"},{id:"pack",icon:"🧳",l:"Pack"},{id:"expense",icon:"💰",l:"¥"},
    {id:"chat",icon:"🤖",l:"AI"},{id:"sos",icon:"🆘",l:"SOS"}];
  return(<div style={{position:"fixed",bottom:0,left:0,right:0,display:"flex",justifyContent:"space-around",
    background:"linear-gradient(to top, #1a1a2e, #16213e)",borderTop:"1px solid rgba(255,255,255,0.08)",
    paddingBottom:"env(safe-area-inset-bottom, 8px)",paddingTop:6,zIndex:100,overflowX:"auto"}}>
    {tabs.map(t=>(<button key={t.id} onClick={()=>setActive(t.id)} style={{background:"none",border:"none",
      color:active===t.id?"#f7768e":"#7982a9",display:"flex",flexDirection:"column",alignItems:"center",gap:1,
      fontSize:7,cursor:"pointer",transform:active===t.id?"scale(1.1)":"scale(1)",padding:"4px 2px",minWidth:0,flexShrink:0}}>
      <span style={{fontSize:13,filter:active===t.id?"drop-shadow(0 0 6px #f7768e)":"none"}}>{t.icon}</span>
      <span style={{fontWeight:active===t.id?700:400}}>{t.l}</span></button>))}
  </div>);
}

function Header(){
  const [now,setNow]=useState(new Date());const [weather,setWeather]=useState(null);const [city,setCity]=useState("tokyo");
  useEffect(()=>{const i=setInterval(()=>setNow(new Date()),60000);return()=>clearInterval(i);},[]);
  useEffect(()=>{const c=city==="kyoto"?{lat:35.01,lng:135.77}:{lat:35.68,lng:139.65};
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lng}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=Asia/Tokyo&forecast_days=3`)
    .then(r=>r.json()).then(d=>setWeather(d)).catch(()=>{});},[city]);
  const jp=now.toLocaleString("ja-JP",{timeZone:"Asia/Tokyo",hour:"2-digit",minute:"2-digit",hour12:false});
  const jpD=now.toLocaleDateString("en-US",{timeZone:"Asia/Tokyo",weekday:"short",month:"short",day:"numeric"});
  return(<div style={{background:"linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",padding:"16px 20px 12px",color:"#e0e0e0",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div><div style={{fontSize:11,color:"#7982a9",letterSpacing:2}}>日本旅行 • Japan 2026</div>
        <div style={{fontSize:22,fontWeight:300,marginTop:2,fontFamily:"serif",color:"#fff"}}>Feb 19 → 27</div></div>
      <div style={{textAlign:"right"}}><div style={{fontSize:24,fontWeight:200,fontFamily:"monospace",color:"#f7768e"}}>{jp}</div>
        <div style={{fontSize:11,color:"#7982a9"}}>🇯🇵 {jpD} JST</div></div></div>
    {weather?.current&&(<div style={{marginTop:10,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
      <div style={{display:"flex",gap:4}}>{["tokyo","kyoto"].map(c=>(<button key={c} onClick={()=>setCity(c)} style={{padding:"2px 10px",borderRadius:12,border:"none",cursor:"pointer",
        background:city===c?"rgba(247,118,142,0.2)":"rgba(255,255,255,0.05)",color:city===c?"#f7768e":"#565f89",fontSize:11,textTransform:"capitalize"}}>{c}</button>))}</div>
      <div style={{fontSize:13,color:"#c0caf5"}}>{WMO_CODES[weather.current.weather_code]||"–"} <span style={{fontWeight:700,color:"#fff"}}>{Math.round(weather.current.temperature_2m)}°C</span></div>
      {weather.daily&&(<div style={{display:"flex",gap:8,marginLeft:"auto"}}>{weather.daily.time.slice(0,3).map((d,i)=>(<div key={i} style={{textAlign:"center",fontSize:10,color:"#7982a9"}}>
        <div>{new Date(d+"T00:00").toLocaleDateString("en",{weekday:"short"})}</div>
        <div style={{fontSize:14}}>{(WMO_CODES[weather.daily.weather_code[i]]||"–").split(" ")[0]}</div>
        <div style={{color:"#9aa5ce"}}>{Math.round(weather.daily.temperature_2m_min[i])}°/{Math.round(weather.daily.temperature_2m_max[i])}°</div></div>))}</div>)}
    </div>)}
  </div>);
}

function FlightCard({f,label}){return(
  <div style={{background:"linear-gradient(135deg, rgba(122,162,247,0.08), rgba(187,154,247,0.06))",borderRadius:14,padding:16,marginBottom:12,border:"1px solid rgba(122,162,247,0.15)"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
      <div style={{fontSize:11,color:"#7aa2f7",fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>{label}</div>
      <span style={{fontSize:12,color:"#bb9af7",fontWeight:700}}>✈️ {f.flight}</span></div>
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
      <div style={{textAlign:"center",flex:1}}><div style={{fontSize:24,fontWeight:700,color:"#fff",fontFamily:"monospace"}}>{f.depart}</div>
        <div style={{fontSize:11,color:"#9aa5ce"}}>{f.terminal.depart}</div><div style={{fontSize:10,color:"#7982a9"}}>{f.date}</div></div>
      <div style={{flex:1,textAlign:"center"}}><div style={{fontSize:10,color:"#7982a9"}}>{f.duration}</div>
        <div style={{height:1,background:"linear-gradient(90deg, #7aa2f7, #bb9af7)"}}></div></div>
      <div style={{textAlign:"center",flex:1}}><div style={{fontSize:24,fontWeight:700,color:"#fff",fontFamily:"monospace"}}>{f.arrive}</div>
        <div style={{fontSize:11,color:"#9aa5ce"}}>{f.terminal.arrive}</div><div style={{fontSize:10,color:"#7982a9"}}>{f.arriveDate}</div></div></div>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",fontSize:10,color:"#7982a9"}}><span>🛩️ {f.aircraft}</span><span>📊 On-time: {f.onTime}</span></div>
  </div>);}

function HotelTaxiCard({h}){return(
  <div style={{background:"linear-gradient(135deg, rgba(247,118,142,0.06), rgba(224,175,104,0.06))",borderRadius:14,padding:16,marginBottom:12,border:"1px solid rgba(247,118,142,0.12)"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
      <div style={{fontSize:14,fontWeight:700,color:"#f7768e"}}>🏨 {h.name}</div><div style={{fontSize:10,color:"#7982a9"}}>{h.dates}</div></div>
    <div style={{background:"rgba(0,0,0,0.3)",borderRadius:10,padding:12,marginBottom:8,border:"1px solid rgba(255,255,255,0.06)"}}>
      <div style={{fontSize:9,color:"#e0af68",marginBottom:4,textTransform:"uppercase",letterSpacing:1}}>🚕 SHOW TO TAXI DRIVER:</div>
      <div style={{fontSize:20,color:"#fff",fontFamily:"serif",lineHeight:1.6}}>{h.nameJa}</div>
      <div style={{fontSize:14,color:"#c0caf5",marginTop:4}}>{h.address}</div></div>
    <div style={{fontSize:12,color:"#9aa5ce",marginBottom:4}}>{h.addressEn}</div>
    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:8}}>
      <a href={`tel:${h.phone}`} style={{padding:"6px 12px",borderRadius:8,background:"rgba(158,206,106,0.12)",color:"#9ece6a",fontSize:11,textDecoration:"none",fontWeight:600}}>📞 {h.phone}</a>
      <a href={`https://www.google.com/maps/search/?api=1&query=${h.lat},${h.lng}`} target="_blank" rel="noopener"
        style={{padding:"6px 12px",borderRadius:8,background:"rgba(122,162,247,0.12)",color:"#7aa2f7",fontSize:11,textDecoration:"none",fontWeight:600}}>📍 Maps</a></div>
    <div style={{display:"flex",gap:12,marginTop:8,fontSize:11,color:"#7982a9"}}><span>🔑 In: {h.checkin}</span><span>🔓 Out: {h.checkout}</span><span>🚃 {h.nearStation}</span></div>
  </div>);}

function TripTab(){
  const [sf,setSf]=useState(false);const [sh,setSh]=useState(false);
  return(<div style={{padding:"12px 16px 100px"}}>
    <button onClick={()=>setSf(!sf)} style={{width:"100%",padding:"12px 14px",borderRadius:12,border:"none",cursor:"pointer",
      background:"linear-gradient(135deg, rgba(122,162,247,0.12), rgba(187,154,247,0.08))",color:"#7aa2f7",fontSize:14,fontWeight:600,marginBottom:12,
      display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <span>✈️ Flight Details</span><span style={{transform:sf?"rotate(180deg)":"",transition:"0.2s"}}>▼</span></button>
    {sf&&<div><FlightCard f={FLIGHTS.outbound} label="Outbound – Feb 19"/><FlightCard f={FLIGHTS.return} label="Return – Feb 27"/></div>}
    <button onClick={()=>setSh(!sh)} style={{width:"100%",padding:"12px 14px",borderRadius:12,border:"none",cursor:"pointer",
      background:"linear-gradient(135deg, rgba(247,118,142,0.1), rgba(224,175,104,0.08))",color:"#f7768e",fontSize:14,fontWeight:600,marginBottom:12,
      display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <span>🏨 Hotel Cards (Taxi Driver)</span><span style={{transform:sh?"rotate(180deg)":"",transition:"0.2s"}}>▼</span></button>
    {sh&&HOTELS.map((h,i)=><HotelTaxiCard key={i} h={h}/>)}
    <h2 style={{fontSize:16,color:"#9aa5ce",fontWeight:400,marginBottom:16}}>Your Itinerary</h2>
    {TRIP_DATA.segments.map((s,i)=>(<div key={s.id} style={{display:"flex",gap:12,marginBottom:4}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:28}}>
        <div style={{width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,
          background:s.type==="hotel"?"rgba(247,118,142,0.15)":s.type==="travel"?"rgba(122,162,247,0.15)":"rgba(158,206,106,0.15)",flexShrink:0}}>{s.icon}</div>
        {i<TRIP_DATA.segments.length-1&&<div style={{width:1,flexGrow:1,minHeight:20,background:"rgba(255,255,255,0.08)"}}/>}</div>
      <div style={{flex:1,background:"rgba(255,255,255,0.03)",borderRadius:10,padding:"10px 14px",marginBottom:8,border:"1px solid rgba(255,255,255,0.06)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
          <span style={{fontSize:14,fontWeight:600,color:"#c0caf5"}}>{s.title}</span><span style={{fontSize:11,color:"#565f89"}}>{s.date}</span></div>
        <div style={{fontSize:11,color:"#7982a9",marginTop:2}}>{s.time}</div>
        <div style={{fontSize:12,color:"#9aa5ce",marginTop:6}}>{s.detail}</div>
        {s.note&&<div style={{fontSize:11,color:"#e0af68",marginTop:6,padding:"6px 8px",background:"rgba(224,175,104,0.08)",borderRadius:6}}>💡 {s.note}</div>}</div>
    </div>))}
  </div>);}

function PlannerTab({dailyPlans,setDailyPlans}){
  const [di,setDi]=useState(0);const [aiOpen,setAiOpen]=useState(false);const [aiInput,setAiInput]=useState("");
  const [aiLoading,setAiLoading]=useState(false);const [aiResponse,setAiResponse]=useState(null);const [pendingPlan,setPendingPlan]=useState(null);
  const d=dailyPlans[di];
  const askAI=async()=>{
    if(!aiInput.trim()||aiLoading)return;
    setAiLoading(true);setAiResponse(null);setPendingPlan(null);
    try{
      const stopsStr=d.stops.map(s=>`${s.time} ${s.icon} ${s.name}: ${s.tip}`).join("\n");
      const msgs=[
        {role:"system",content:`You are a Japan travel day planner. The user wants to modify their itinerary for ${d.date} in ${d.city}.\n\nCurrent plan "${d.title}":\n${stopsStr}\n\nWhen replanning, give a brief friendly explanation, then end with:\n\`\`\`json\n{"action":"replan","dayTitle":"Short Title","stops":[{"time":"HH:MM","name":"Place","tip":"Insider tip","icon":"emoji"}]}\n\`\`\`\nKeep responses under 160 words.`},
        {role:"user",content:aiInput}
      ];
      const text=await callChat(msgs,{max_tokens:600});
      const jsonMatch=text?.match(/```json\n([\s\S]*?)\n```/);
      if(jsonMatch){try{const p=JSON.parse(jsonMatch[1]);if(p.action==="replan")setPendingPlan(p);}catch{}}
      setAiResponse(text?.replace(/```json[\s\S]*?```/g,"").trim()||"");
    }catch{setAiResponse("Couldn't connect. Please try again.");}
    setAiLoading(false);
  };
  const applyPlan=()=>{
    if(!pendingPlan)return;
    setDailyPlans(prev=>prev.map((plan,i)=>i===di?{...plan,title:pendingPlan.dayTitle||plan.title,stops:pendingPlan.stops}:plan));
    setPendingPlan(null);setAiResponse(null);setAiInput("");setAiOpen(false);
  };
  const QUICK_PROMPTS=["Make it more relaxed","Add a great lunch spot","Rearrange for less walking","What's nearby I'm missing?"];
  return(<div style={{padding:"12px 16px 100px"}}>
    <h2 style={{fontSize:16,color:"#9aa5ce",fontWeight:400,marginBottom:12}}>📅 Daily Planner</h2>
    <div style={{display:"flex",gap:6,marginBottom:16,overflowX:"auto",paddingBottom:4}}>
      {dailyPlans.map((p,i)=>(<button key={i} onClick={()=>{setDi(i);setAiOpen(false);setAiResponse(null);setPendingPlan(null);}} style={{padding:"6px 12px",borderRadius:10,border:"none",cursor:"pointer",
        background:di===i?"rgba(247,118,142,0.2)":"rgba(255,255,255,0.04)",color:di===i?"#f7768e":"#7982a9",fontSize:11,fontWeight:600,whiteSpace:"nowrap",flexShrink:0}}>
        {p.date.split(" ")[0]} {p.date.split(" ")[1]}</button>))}</div>
    <div style={{background:"rgba(122,162,247,0.06)",borderRadius:12,padding:14,marginBottom:14,border:"1px solid rgba(122,162,247,0.12)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div><div style={{fontSize:15,fontWeight:600,color:"#c0caf5"}}>{d.title}</div>
        <div style={{fontSize:12,color:"#7aa2f7",marginTop:2}}>{d.date} • {d.city}</div></div>
      <button onClick={()=>setAiOpen(!aiOpen)} style={{padding:"7px 13px",borderRadius:9,border:"1px solid rgba(187,154,247,0.25)",
        background:aiOpen?"rgba(187,154,247,0.2)":"rgba(187,154,247,0.08)",color:"#bb9af7",fontSize:12,cursor:"pointer",fontWeight:600,whiteSpace:"nowrap"}}>
        ✨ AI Replan</button></div>
    {aiOpen&&(<div style={{background:"rgba(187,154,247,0.05)",borderRadius:12,padding:14,marginBottom:14,border:"1px solid rgba(187,154,247,0.18)"}}>
      <div style={{fontSize:12,color:"#bb9af7",fontWeight:600,marginBottom:6}}>✨ AI Day Planner</div>
      <div style={{display:"flex",gap:5,marginBottom:10,flexWrap:"wrap"}}>
        {QUICK_PROMPTS.map((q,i)=>(<button key={i} onClick={()=>setAiInput(q)} style={{padding:"4px 10px",borderRadius:16,
          border:"1px solid rgba(187,154,247,0.2)",background:"rgba(187,154,247,0.06)",color:"#bb9af7",fontSize:10,cursor:"pointer"}}>{q}</button>))}</div>
      <div style={{display:"flex",gap:8}}>
        <input value={aiInput} onChange={e=>setAiInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&askAI()}
          placeholder="How should I change this day?"
          style={{flex:1,padding:"10px 12px",borderRadius:10,border:"1px solid rgba(187,154,247,0.2)",background:"rgba(0,0,0,0.3)",color:"#c0caf5",fontSize:13,outline:"none"}}/>
        <button onClick={askAI} disabled={aiLoading} style={{padding:"0 16px",borderRadius:10,border:"none",cursor:"pointer",
          background:"rgba(187,154,247,0.2)",color:"#bb9af7",fontSize:15,fontWeight:700}}>{aiLoading?"⏳":"→"}</button></div>
      {aiResponse&&(<div style={{marginTop:12,padding:12,background:"rgba(0,0,0,0.25)",borderRadius:10,border:"1px solid rgba(255,255,255,0.06)"}}>
        <div style={{fontSize:12,color:"#9aa5ce",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{aiResponse}</div>
        {pendingPlan&&(<div style={{marginTop:12}}>
          <div style={{fontSize:11,color:"#bb9af7",fontWeight:600,marginBottom:8}}>✨ New plan: "{pendingPlan.dayTitle}"</div>
          {pendingPlan.stops?.map((s,i)=>(<div key={i} style={{display:"flex",gap:8,alignItems:"center",marginBottom:5,padding:"6px 8px",borderRadius:7,background:"rgba(187,154,247,0.07)"}}>
            <span style={{fontSize:10,color:"#7aa2f7",fontFamily:"monospace",width:42,flexShrink:0}}>{s.time}</span>
            <span style={{fontSize:14}}>{s.icon}</span>
            <div><div style={{fontSize:12,color:"#c0caf5"}}>{s.name}</div><div style={{fontSize:10,color:"#e0af68",marginTop:1}}>{s.tip}</div></div></div>))}
          <button onClick={applyPlan} style={{marginTop:10,width:"100%",padding:"10px",borderRadius:10,border:"none",cursor:"pointer",
            background:"linear-gradient(135deg,rgba(187,154,247,0.3),rgba(122,162,247,0.2))",color:"#bb9af7",fontSize:13,fontWeight:700}}>
            ✅ Apply This Plan</button></div>)}</div>)}</div>)}
    {d.stops.map((s,i)=>(<div key={i} style={{display:"flex",gap:10,marginBottom:4}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:45,flexShrink:0}}>
        <div style={{fontSize:10,color:"#7aa2f7",fontFamily:"monospace",fontWeight:600}}>{s.time}</div>
        {i<d.stops.length-1&&<div style={{width:1,flexGrow:1,minHeight:20,background:"rgba(255,255,255,0.06)",marginTop:4}}/>}</div>
      <div style={{flex:1,padding:"10px 12px",borderRadius:10,marginBottom:4,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:18}}>{s.icon}</span><span style={{fontSize:13,fontWeight:600,color:"#c0caf5"}}>{s.name}</span></div>
        <div style={{fontSize:11,color:"#e0af68",marginTop:4,padding:"4px 6px",background:"rgba(224,175,104,0.06)",borderRadius:4}}>💡 {s.tip}</div></div>
    </div>))}
  </div>);}

function TranslateTab(){
  const [input,setInput]=useState("");const [result,setResult]=useState(null);const [loading,setLoading]=useState(false);
  const [listening,setListening]=useState(false);const [pf,setPf]=useState("all");
  const doTranslate=async(text)=>{if(!text.trim())return;setLoading(true);
    try{
      const raw=await callOpenAI([
        {role:"system",content:'You are a Japanese-English translator for a tourist. Return ONLY JSON: {"original":"...","translated":"...","romanji":"...","context":"..."}. No markdown.'},
        {role:"user",content:text}
      ]);
      const jsonMatch=raw?.replace(/```json|```/g,"").trim().match(/\{[\s\S]*\}/);
      setResult(jsonMatch?JSON.parse(jsonMatch[0]):{original:text,translated:raw||"Error",romanji:"",context:""});
    }catch{setResult({original:text,translated:"Translation error",romanji:"",context:""});}setLoading(false);};
  const startListen=useCallback(()=>{
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return;
    const r=new SR();r.lang="en-US";r.interimResults=false;
    r.onresult=e=>{const t=e.results[0][0].transcript;setInput(t);setListening(false);doTranslate(t);};
    r.onerror=()=>setListening(false);r.onend=()=>setListening(false);r.start();setListening(true);},[]);
  const cats=["all","basics","food","navigate","shopping","emergency"];
  const filtered=pf==="all"?PHRASES:PHRASES.filter(p=>p.cat===pf);
  return(<div style={{padding:"12px 16px 100px"}}>
    <div style={{background:"rgba(247,118,142,0.06)",borderRadius:14,padding:16,marginBottom:16,border:"1px solid rgba(247,118,142,0.12)"}}>
      <div style={{fontSize:13,color:"#9aa5ce",marginBottom:10}}>🎙️ AI Translation</div>
      <div style={{display:"flex",gap:8}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doTranslate(input)}
          placeholder="Type English or Japanese..." style={{flex:1,padding:"10px 14px",borderRadius:10,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(0,0,0,0.3)",color:"#c0caf5",fontSize:14,outline:"none"}}/>
        <button onClick={startListen} style={{width:44,height:44,borderRadius:"50%",border:"none",cursor:"pointer",
          background:listening?"#f7768e":"rgba(122,162,247,0.2)",color:"#fff",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>
          {listening?"⏹":"🎤"}</button>
        <button onClick={()=>doTranslate(input)} style={{padding:"0 16px",borderRadius:10,border:"none",cursor:"pointer",
          background:"rgba(122,162,247,0.2)",color:"#7aa2f7",fontSize:13,fontWeight:600}}>{loading?"...":"→"}</button></div>
      {result&&(<div style={{marginTop:12,padding:12,background:"rgba(0,0,0,0.2)",borderRadius:10}}>
        <div style={{fontSize:22,color:"#fff",fontFamily:"serif",marginBottom:4}}>{result.translated}</div>
        {result.romanji&&<div style={{fontSize:13,color:"#7aa2f7",marginBottom:4}}>{result.romanji}</div>}
        {result.context&&<div style={{fontSize:11,color:"#e0af68"}}>💡 {result.context}</div>}
        <button onClick={()=>speak(result.translated)} style={{marginTop:8,padding:"6px 14px",borderRadius:8,border:"none",cursor:"pointer",background:"rgba(158,206,106,0.15)",color:"#9ece6a",fontSize:12}}>🔊 Listen</button></div>)}</div>
    <div style={{fontSize:13,color:"#9aa5ce",marginBottom:8}}>📖 Phrasebook</div>
    <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
      {cats.map(c=><button key={c} onClick={()=>setPf(c)} style={{padding:"4px 12px",borderRadius:20,border:"none",cursor:"pointer",
        background:pf===c?"rgba(247,118,142,0.2)":"rgba(255,255,255,0.04)",color:pf===c?"#f7768e":"#7982a9",fontSize:11,textTransform:"capitalize"}}>{c}</button>)}</div>
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      {filtered.map((p,i)=>(<button key={i} onClick={()=>speak(p.ja)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
        padding:"10px 14px",borderRadius:10,border:"1px solid rgba(255,255,255,0.05)",background:"rgba(255,255,255,0.02)",cursor:"pointer",textAlign:"left"}}>
        <div><div style={{fontSize:13,color:"#c0caf5",fontWeight:500}}>{p.en}</div>
          <div style={{fontSize:15,color:"#fff",fontFamily:"serif",marginTop:2}}>{p.ja}</div>
          <div style={{fontSize:11,color:"#7aa2f7",marginTop:1}}>{p.rom}</div></div>
        <span style={{fontSize:18,opacity:0.5}}>🔊</span></button>))}</div>
  </div>);}

function CameraTab(){
  const videoRef=useRef(null);const canvasRef=useRef(null);
  const [streaming,setStreaming]=useState(false);const [result,setResult]=useState(null);
  const [loading,setLoading]=useState(false);const [mode,setMode]=useState("upload");
  const [preview,setPreview]=useState(null);const [errMsg,setErrMsg]=useState(null);

  const startCamera=async()=>{
    setErrMsg(null);
    try{
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1280},height:{ideal:720}}});
      if(videoRef.current){videoRef.current.srcObject=stream;videoRef.current.play();setStreaming(true);}
    }catch{setErrMsg("Camera access denied. Use Upload mode instead.");setMode("upload");}
  };
  const stopCamera=()=>{if(videoRef.current?.srcObject){videoRef.current.srcObject.getTracks().forEach(t=>t.stop());setStreaming(false);}};
  useEffect(()=>{if(mode==="camera")startCamera();else stopCamera();return()=>stopCamera();},[mode]);

  const translateImage=async(base64)=>{
    setLoading(true);setResult(null);setErrMsg(null);
    try{
      const raw=await callVision(base64,
        `You are a Japanese-to-English translator helping a tourist in Japan.
Find ALL Japanese text (kanji, hiragana, katakana) in this image.
Return ONLY valid JSON, no markdown:
{"items":[{"japanese":"...","romaji":"...","english":"...","context":"..."}],"summary":"..."}
If no Japanese text: {"items":[],"summary":"No Japanese text found in this image"}`
      );
      if(!raw){setResult({items:[],summary:"Could not connect to AI. Please try again."});setLoading(false);return;}
      const jsonMatch=raw.match(/\{[\s\S]*\}/);
      let parsed=null;
      if(jsonMatch){try{parsed=JSON.parse(jsonMatch[0]);}catch{}}
      setResult(parsed||{items:[],summary:raw.slice(0,300)});
    }catch(err){setResult({items:[],summary:`Error: ${err.message}`});}
    setLoading(false);
  };

  const captureAndTranslate=async()=>{
    if(!videoRef.current||!canvasRef.current)return;
    const v=videoRef.current;const c=canvasRef.current;
    if(!v.videoWidth||!v.videoHeight){setErrMsg("Camera not ready yet.");return;}
    c.width=v.videoWidth;c.height=v.videoHeight;
    c.getContext("2d").drawImage(v,0,0);
    const dataUrl=c.toDataURL("image/jpeg",0.92);
    const base64=dataUrl.split(",")[1];
    if(!base64||base64.length<100){setErrMsg("Could not capture image.");return;}
    setPreview(dataUrl);
    await translateImage(base64);
  };

  const handleUpload=async(e)=>{
    const file=e.target.files?.[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=async(ev)=>{
      const dataUrl=ev.target.result;setPreview(dataUrl);
      await translateImage(dataUrl.split(",")[1]);
    };
    reader.readAsDataURL(file);
  };

  return(<div style={{padding:"12px 16px 100px"}}>
    <h2 style={{fontSize:16,color:"#9aa5ce",fontWeight:400,marginBottom:12}}>📷 Camera Translator</h2>
    <div style={{display:"flex",gap:6,marginBottom:12}}>
      {["camera","upload"].map(m=>(<button key={m} onClick={()=>{setMode(m);setResult(null);setPreview(null);setErrMsg(null);}} style={{flex:1,padding:"8px",borderRadius:10,border:"none",cursor:"pointer",
        background:mode===m?"rgba(247,118,142,0.2)":"rgba(255,255,255,0.04)",color:mode===m?"#f7768e":"#7982a9",fontSize:12,fontWeight:600}}>
        {m==="camera"?"📷 Live Camera":"📁 Upload Photo"}</button>))}</div>

    {errMsg&&<div style={{marginBottom:12,padding:10,borderRadius:8,background:"rgba(247,118,142,0.1)",border:"1px solid rgba(247,118,142,0.2)",color:"#f7768e",fontSize:12}}>{errMsg}</div>}

    {mode==="camera"&&(<div style={{position:"relative",borderRadius:14,overflow:"hidden",marginBottom:12,background:"#000",aspectRatio:"4/3"}}>
      <video ref={videoRef} style={{width:"100%",height:"100%",objectFit:"cover"}} playsInline muted/>
      <canvas ref={canvasRef} style={{display:"none"}}/>
      <button onClick={captureAndTranslate} disabled={loading||!streaming}
        style={{position:"absolute",bottom:16,left:"50%",transform:"translateX(-50%)",
          width:70,height:70,borderRadius:"50%",border:"4px solid rgba(255,255,255,0.8)",cursor:"pointer",
          background:loading?"rgba(247,118,142,0.8)":"rgba(255,255,255,0.2)",
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,color:"#fff",
          backdropFilter:"blur(4px)"}}>
        {loading?"⏳":"📸"}</button>
      {!streaming&&!errMsg&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",color:"#7982a9",fontSize:13}}>Starting camera…</div>}
    </div>)}

    {mode==="upload"&&(<div style={{marginBottom:12}}>
      <label style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:30,borderRadius:14,
        border:"2px dashed rgba(122,162,247,0.3)",background:"rgba(122,162,247,0.04)",cursor:"pointer",textAlign:"center"}}>
        <span style={{fontSize:40}}>📁</span>
        <span style={{fontSize:13,color:"#7aa2f7"}}>Tap to select a photo</span>
        <span style={{fontSize:11,color:"#7982a9"}}>Menu, sign, label — any Japanese text</span>
        <input type="file" accept="image/*" onChange={handleUpload} style={{display:"none"}}/>
      </label>
    </div>)}

    {preview&&(<div style={{marginBottom:12,borderRadius:10,overflow:"hidden"}}>
      <img src={preview} style={{width:"100%",maxHeight:200,objectFit:"cover",borderRadius:10}} alt="captured"/>
    </div>)}

    {loading&&(<div style={{textAlign:"center",padding:20,color:"#7aa2f7",fontSize:13}}>
      <div style={{fontSize:30,marginBottom:8}}>🔍</div>Analyzing image with AI…</div>)}

    {result&&(<div style={{background:"rgba(0,0,0,0.2)",borderRadius:14,padding:16,border:"1px solid rgba(255,255,255,0.08)"}}>
      {result.summary&&<div style={{fontSize:12,color:"#e0af68",marginBottom:12,padding:"8px 10px",background:"rgba(224,175,104,0.08)",borderRadius:8}}>📝 {result.summary}</div>}
      {result.items?.length>0?(<div style={{display:"flex",flexDirection:"column",gap:8}}>
        {result.items.map((item,i)=>(<div key={i} style={{padding:"10px 12px",borderRadius:10,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}>
          <div style={{fontSize:18,color:"#fff",fontFamily:"serif"}}>{item.japanese}</div>
          {item.romaji&&<div style={{fontSize:12,color:"#7aa2f7",marginTop:2}}>{item.romaji}</div>}
          <div style={{fontSize:14,color:"#9ece6a",marginTop:4,fontWeight:600}}>{item.english}</div>
          {item.context&&<div style={{fontSize:11,color:"#7982a9",marginTop:2}}>{item.context}</div>}
          <button onClick={()=>speak(item.japanese)} style={{marginTop:6,padding:"4px 10px",borderRadius:6,border:"none",cursor:"pointer",background:"rgba(158,206,106,0.1)",color:"#9ece6a",fontSize:11}}>🔊 Listen</button>
        </div>))}
      </div>):(!loading&&<div style={{textAlign:"center",color:"#565f89",fontSize:13,padding:12}}>No Japanese text detected.</div>)}
    </div>)}

    <div style={{marginTop:16,padding:14,borderRadius:12,background:"rgba(224,175,104,0.06)",border:"1px solid rgba(224,175,104,0.12)"}}>
      <div style={{fontSize:12,color:"#e0af68",fontWeight:600,marginBottom:6}}>💡 Tips for best results</div>
      <div style={{fontSize:11,color:"#9aa5ce",lineHeight:1.8}}>
        • Good lighting helps a lot<br/>• Works great on: menus, signs, train schedules, labels<br/>• Upload mode works for saved photos too</div>
    </div>
  </div>);}

function CurrencyConverter(){
  const [a,setA]=useState("1000");const [d,setD]=useState("jpy");
  const r=0.0067;const c=d==="jpy"?(parseFloat(a||0)*r).toFixed(2):(parseFloat(a||0)/r).toFixed(0);
  return(<div style={{background:"rgba(224,175,104,0.06)",borderRadius:14,padding:16,marginBottom:16,border:"1px solid rgba(224,175,104,0.12)"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
      <div style={{fontSize:13,color:"#e0af68",fontWeight:600}}>💱 Currency</div>
      <button onClick={()=>setD(x=>x==="jpy"?"usd":"jpy")} style={{padding:"3px 10px",borderRadius:8,border:"none",cursor:"pointer",background:"rgba(224,175,104,0.15)",color:"#e0af68",fontSize:11}}>
        {d==="jpy"?"¥→$":"$→¥"} ⇄</button></div>
    <div style={{display:"flex",gap:8,alignItems:"center"}}>
      <div style={{flex:1}}><input value={a} onChange={e=>setA(e.target.value.replace(/[^0-9.]/g,""))}
        style={{width:"100%",padding:"8px 12px",borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(0,0,0,0.3)",color:"#fff",fontSize:18,fontWeight:700,outline:"none",fontFamily:"monospace"}}/></div>
      <div style={{fontSize:20,color:"#565f89"}}>→</div>
      <div style={{flex:1}}><div style={{padding:"8px 12px",borderRadius:8,background:"rgba(158,206,106,0.1)",color:"#9ece6a",fontSize:18,fontWeight:700,fontFamily:"monospace"}}>
        {d==="jpy"?"$":"¥"}{c}</div></div></div>
    <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
      {(d==="jpy"?[500,1000,3000,5000,10000]:[5,10,20,50,100]).map(x=>(<button key={x} onClick={()=>setA(String(x))} style={{padding:"4px 10px",borderRadius:6,border:"none",cursor:"pointer",
        background:"rgba(255,255,255,0.05)",color:"#9aa5ce",fontSize:11}}>{d==="jpy"?`¥${x.toLocaleString()}`:`$${x}`}</button>))}</div></div>);}

function ExploreTab(){
  const [loc,setLoc]=useState(null);
  const getLoc=()=>{navigator.geolocation?.getCurrentPosition(p=>setLoc({lat:p.coords.latitude,lng:p.coords.longitude}),()=>{},{enableHighAccuracy:true});};
  const openM=q=>{const u=loc?`https://www.google.com/maps/search/${encodeURIComponent(q)}/@${loc.lat},${loc.lng},15z`:`https://www.google.com/maps/search/${encodeURIComponent(q)}`;window.open(u,"_blank");};
  const konbini=[{i:"🏪",l:"7-Eleven",q:"7-Eleven near me"},{i:"🔵",l:"Lawson",q:"Lawson near me"},{i:"🟢",l:"FamilyMart",q:"FamilyMart near me"},{i:"🟡",l:"Ministop",q:"Ministop near me"}];
  const atmSpots=[
    {i:"🏧",l:"7-Eleven ATM",q:"7-Eleven ATM near me",note:"Most reliable. 24/7."},
    {i:"🏧",l:"Japan Post ATM",q:"Japan Post ATM near me",note:"Works with Visa/MC."},
    {i:"🏧",l:"Lawson ATM",q:"Lawson Bank ATM near me",note:"Accepts most international cards."},
    {i:"🏦",l:"AEON Bank ATM",q:"AEON Bank ATM near me",note:"In malls. Good for foreign cards."},
  ];
  const qs=[{i:"🍜",l:"Ramen",q:"ramen near me"},{i:"⛩️",l:"Temples",q:"temple shrine near me"},
    {i:"🍣",l:"Sushi",q:"sushi near me"},{i:"💊",l:"Pharmacy",q:"pharmacy near me"},
    {i:"☕",l:"Café",q:"cafe near me"},{i:"🍺",l:"Izakaya",q:"izakaya near me"},
    {i:"🪩",l:"Donki",q:"Don Quijote near me"},{i:"🚻",l:"Toilet",q:"public toilet near me"}];
  return(<div style={{padding:"12px 16px 100px"}}>
    <CurrencyConverter/>
    <div style={{background:"rgba(122,162,247,0.06)",borderRadius:14,padding:14,marginBottom:16,border:"1px solid rgba(122,162,247,0.12)"}}>
      <button onClick={getLoc} style={{width:"100%",padding:"10px",borderRadius:10,border:"none",cursor:"pointer",
        background:"rgba(122,162,247,0.15)",color:"#7aa2f7",fontSize:13,fontWeight:600}}>
        {loc?`📍 ${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`:"📍 Enable Location"}</button></div>
    <div style={{fontSize:13,color:"#9ece6a",fontWeight:600,marginBottom:8}}>🏪 Convenience Stores</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(2, 1fr)",gap:8,marginBottom:16}}>
      {konbini.map((s,i)=>(<button key={i} onClick={()=>openM(s.q)} style={{padding:"14px 10px",borderRadius:12,border:"1px solid rgba(255,255,255,0.06)",
        background:"rgba(255,255,255,0.03)",cursor:"pointer",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
        <span style={{fontSize:26}}>{s.i}</span><span style={{fontSize:12,color:"#c0caf5",fontWeight:600}}>{s.l}</span></button>))}</div>
    <div style={{background:"rgba(187,154,247,0.06)",borderRadius:14,padding:14,marginBottom:16,border:"1px solid rgba(187,154,247,0.12)"}}>
      <div style={{fontSize:13,color:"#bb9af7",fontWeight:600,marginBottom:10}}>🏧 ATM Finder (Foreign Cards)</div>
      {atmSpots.map((a,i)=>(<button key={i} onClick={()=>openM(a.q)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,
        border:"1px solid rgba(255,255,255,0.05)",background:"rgba(255,255,255,0.02)",cursor:"pointer",textAlign:"left",width:"100%",marginBottom:6}}>
        <span style={{fontSize:22}}>{a.i}</span>
        <div style={{flex:1}}><div style={{fontSize:13,color:"#c0caf5",fontWeight:600}}>{a.l}</div>
          <div style={{fontSize:10,color:"#7982a9"}}>{a.note}</div></div>
        <span style={{color:"#bb9af7",fontSize:12}}>→</span></button>))}
      <div style={{marginTop:8,padding:"8px 10px",borderRadius:8,background:"rgba(224,175,104,0.08)",fontSize:11,color:"#e0af68"}}>
        💡 7-Eleven ATMs most reliable. 24/7 nationwide!</div></div>
    <div style={{fontSize:13,color:"#9aa5ce",marginBottom:10}}>🔍 Find Nearby</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(2, 1fr)",gap:8,marginBottom:20}}>
      {qs.map((s,i)=>(<button key={i} onClick={()=>openM(s.q)} style={{padding:"14px 10px",borderRadius:12,border:"1px solid rgba(255,255,255,0.06)",
        background:"rgba(255,255,255,0.03)",cursor:"pointer",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
        <span style={{fontSize:26}}>{s.i}</span><span style={{fontSize:12,color:"#c0caf5",fontWeight:500}}>{s.l}</span></button>))}</div>
    <div style={{fontSize:13,color:"#9aa5ce",marginBottom:10}}>🚖 Taxi & Transit</div>
    {[{n:"GO Taxi",d:"Most popular taxi app",u:"https://go.goinc.jp/"},{n:"Tokyo Metro Map",d:"Subway map",u:"https://www.tokyometro.jp/en/subwaymap/"},{n:"Google Maps Transit",d:"All routes",u:"https://www.google.com/maps/@35.68,139.65,12z"}]
      .map((t,i)=>(<a key={i} href={t.u} target="_blank" rel="noopener" style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderRadius:10,marginBottom:6,
        border:"1px solid rgba(255,255,255,0.06)",background:"rgba(255,255,255,0.03)",textDecoration:"none"}}>
        <div><div style={{fontSize:13,color:"#c0caf5",fontWeight:600}}>{t.n}</div><div style={{fontSize:11,color:"#7982a9"}}>{t.d}</div></div>
        <span style={{marginLeft:"auto",color:"#565f89",fontSize:12}}>→</span></a>))}
  </div>);}

function NightlifeTab(){
  const [sec,setSec]=useState("whiskey");
  const secs=[{id:"whiskey",icon:"🥃",l:"Whiskey"},{id:"vinyl",icon:"🎶",l:"Vinyl"},{id:"entertainment",icon:"🎉",l:"Nightlife"},{id:"shopping",icon:"🛍️",l:"Shopping"}];
  const items=sec==="shopping"?SHOPPING:NIGHTLIFE[sec]||[];
  return(<div style={{padding:"12px 16px 100px"}}>
    <h2 style={{fontSize:16,color:"#9aa5ce",fontWeight:400,marginBottom:12}}>🌙 Nightlife & Shopping</h2>
    <div style={{display:"flex",gap:6,marginBottom:16,overflowX:"auto"}}>
      {secs.map(s=>(<button key={s.id} onClick={()=>setSec(s.id)} style={{padding:"8px 14px",borderRadius:10,border:"none",cursor:"pointer",
        background:sec===s.id?"rgba(187,154,247,0.2)":"rgba(255,255,255,0.04)",color:sec===s.id?"#bb9af7":"#7982a9",fontSize:12,fontWeight:600,whiteSpace:"nowrap",flexShrink:0}}>
        {s.icon} {s.l}</button>))}</div>
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {items.map((v,i)=>(<div key={i} style={{padding:"12px 14px",borderRadius:12,border:"1px solid rgba(255,255,255,0.06)",background:"rgba(255,255,255,0.03)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
          <div style={{fontSize:14,fontWeight:600,color:"#c0caf5"}}>{v.icon||""} {v.name}</div>
          <span style={{fontSize:10,color:"#bb9af7"}}>{v.area}</span></div>
        <div style={{fontSize:12,color:"#9aa5ce",lineHeight:1.5,marginBottom:4}}>{v.desc}</div>
        {v.hours&&<div style={{fontSize:11,color:"#7982a9",marginBottom:4}}>🕐 {v.hours}</div>}
        <div style={{fontSize:11,color:"#e0af68",padding:"4px 6px",background:"rgba(224,175,104,0.06)",borderRadius:4,marginBottom:8}}>💡 {v.tip}</div>
        {v.lat&&<a href={`https://www.google.com/maps/search/?api=1&query=${v.lat},${v.lng}`} target="_blank" rel="noopener"
          style={{display:"block",padding:"6px",borderRadius:6,textAlign:"center",background:"rgba(122,162,247,0.1)",color:"#7aa2f7",fontSize:11,textDecoration:"none",fontWeight:600}}>📍 Maps</a>}
      </div>))}</div>
  </div>);}

function PlacesTab(){
  const [city,setCity]=useState("kyoto");const [exp,setExp]=useState(null);const [fil,setFil]=useState("all");
  const atts=ATTRACTIONS[city];const filtered=fil==="must-see"?atts.filter(a=>a.mustSee):atts;
  return(<div style={{padding:"12px 16px 100px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <h2 style={{fontSize:16,color:"#9aa5ce",fontWeight:400}}>{city==="kyoto"?"⛩ Kyoto":"🗼 Tokyo"}</h2>
      <div style={{display:"flex",gap:4}}>{["kyoto","tokyo"].map(c=>(<button key={c} onClick={()=>{setCity(c);setExp(null);}} style={{padding:"4px 14px",borderRadius:10,border:"none",cursor:"pointer",
        background:city===c?"rgba(247,118,142,0.2)":"rgba(255,255,255,0.05)",color:city===c?"#f7768e":"#7982a9",fontSize:12,fontWeight:600,textTransform:"capitalize"}}>{c}</button>))}</div></div>
    <div style={{display:"flex",gap:6,marginBottom:12}}>
      {["all","must-see"].map(f=>(<button key={f} onClick={()=>setFil(f)} style={{padding:"4px 12px",borderRadius:20,border:"none",cursor:"pointer",
        background:fil===f?"rgba(158,206,106,0.2)":"rgba(255,255,255,0.04)",color:fil===f?"#9ece6a":"#7982a9",fontSize:11}}>{f==="must-see"?"⭐ Must-See":"All"}</button>))}</div>
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {filtered.map((a,i)=>(<div key={i} style={{borderRadius:12,border:"1px solid rgba(255,255,255,0.06)",background:"rgba(255,255,255,0.03)",overflow:"hidden"}}>
        <button onClick={()=>setExp(exp===i?null:i)} style={{width:"100%",padding:"12px 14px",border:"none",cursor:"pointer",background:"transparent",textAlign:"left",display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:24}}>{a.icon}</span><div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:14,fontWeight:600,color:"#c0caf5"}}>{a.name}</span>
              {a.mustSee&&<span style={{fontSize:9,padding:"1px 6px",borderRadius:4,background:"rgba(247,118,142,0.2)",color:"#f7768e"}}>MUST SEE</span>}</div>
            <div style={{fontSize:11,color:"#7982a9",marginTop:2}}>{a.hours} • {a.price} • {a.time}</div></div>
          <span style={{color:"#565f89",transform:exp===i?"rotate(180deg)":"",transition:"0.2s"}}>▼</span></button>
        {exp===i&&(<div style={{padding:"0 14px 14px"}}>
          <div style={{fontSize:12,color:"#e0af68",padding:"10px",marginTop:8,background:"rgba(224,175,104,0.08)",borderRadius:8}}>💡 {a.tip}</div>
          <a href={`https://www.google.com/maps/search/?api=1&query=${a.lat},${a.lng}`} target="_blank" rel="noopener"
            style={{display:"block",marginTop:8,padding:"8px",borderRadius:8,textAlign:"center",background:"rgba(122,162,247,0.15)",color:"#7aa2f7",fontSize:12,textDecoration:"none",fontWeight:600}}>📍 Open in Maps</a>
        </div>)}</div>))}</div>
  </div>);}

function PackTab(){
  const [ch,setCh]=useState({});const [ld,setLd]=useState(false);
  useEffect(()=>{storage.get("japan-packing").then(d=>{if(d)setCh(d);setLd(true);});},[]);
  useEffect(()=>{if(ld)storage.set("japan-packing",ch);},[ch,ld]);
  const tog=id=>setCh(p=>({...p,[id]:!p[id]}));
  const tot=PACKING_DATA.reduce((s,c)=>s+c.items.length,0);const pk=Object.values(ch).filter(Boolean).length;const pct=tot>0?Math.round((pk/tot)*100):0;
  const cl={essentials:"📄 Essentials",tech:"📱 Tech",clothing:"👕 Clothing","japan-specific":"🇯🇵 Japan"};
  return(<div style={{padding:"12px 16px 100px"}}>
    <h2 style={{fontSize:16,color:"#9aa5ce",fontWeight:400,marginBottom:12}}>🧳 Packing</h2>
    <div style={{background:"rgba(122,162,247,0.06)",borderRadius:12,padding:14,marginBottom:16,border:"1px solid rgba(122,162,247,0.12)"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:13,color:"#c0caf5"}}>{pk}/{tot}</span>
        <span style={{fontSize:13,color:pct===100?"#9ece6a":"#7aa2f7",fontWeight:600}}>{pct===100?"✅ Ready!":`${pct}%`}</span></div>
      <div style={{height:6,borderRadius:3,background:"rgba(0,0,0,0.3)"}}>
        <div style={{height:"100%",borderRadius:3,width:`${pct}%`,background:pct===100?"#9ece6a":"linear-gradient(90deg, #7aa2f7, #f7768e)",transition:"width 0.3s"}}/></div></div>
    {PACKING_DATA.map((cat,ci)=>(<div key={ci} style={{marginBottom:16}}>
      <div style={{fontSize:13,color:"#9aa5ce",fontWeight:600,marginBottom:8}}>{cl[cat.cat]||cat.cat}</div>
      {cat.items.map(item=>(<button key={item.id} onClick={()=>tog(item.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,
        border:"1px solid rgba(255,255,255,0.05)",background:ch[item.id]?"rgba(158,206,106,0.06)":"rgba(255,255,255,0.02)",
        cursor:"pointer",textAlign:"left",width:"100%",opacity:ch[item.id]?0.6:1,marginBottom:4}}>
        <div style={{width:22,height:22,borderRadius:6,flexShrink:0,border:ch[item.id]?"2px solid #9ece6a":"2px solid rgba(255,255,255,0.15)",
          background:ch[item.id]?"rgba(158,206,106,0.2)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#9ece6a"}}>
          {ch[item.id]?"✓":""}</div>
        <div style={{flex:1}}><div style={{fontSize:13,color:"#c0caf5",fontWeight:500,textDecoration:ch[item.id]?"line-through":"none"}}>{item.name}</div>
          <div style={{fontSize:11,color:"#7982a9"}}>{item.note}</div></div></button>))}</div>))}
    <button onClick={()=>setCh({})} style={{width:"100%",padding:"10px",borderRadius:10,border:"1px solid rgba(247,118,142,0.15)",
      background:"rgba(247,118,142,0.06)",color:"#f7768e",cursor:"pointer",fontSize:12}}>🔄 Reset</button>
  </div>);}

function ExpenseTab(){
  const [ex,setEx]=useState([]);const [ld,setLd]=useState(false);const [sa,setSa]=useState(false);const [ne,setNe]=useState({n:"",a:"",c:"food"});
  useEffect(()=>{storage.get("japan-expenses").then(d=>{if(d)setEx(d);setLd(true);});},[]);
  useEffect(()=>{if(ld)storage.set("japan-expenses",ex);},[ex,ld]);
  const add=()=>{if(!ne.n||!ne.a)return;setEx(p=>[...p,{id:Date.now(),n:ne.n,a:parseFloat(ne.a),c:ne.c,d:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"})}]);setNe({n:"",a:"",c:"food"});setSa(false);};
  const tot=ex.reduce((s,e)=>s+e.a,0);const ci={food:"🍜",transport:"🚃",shopping:"🛍️",tickets:"🎫",hotel:"🏨",other:"📦"};
  return(<div style={{padding:"12px 16px 100px"}}>
    <h2 style={{fontSize:16,color:"#9aa5ce",fontWeight:400,marginBottom:12}}>💰 Budget</h2>
    <div style={{background:"linear-gradient(135deg, rgba(224,175,104,0.1), rgba(247,118,142,0.08))",borderRadius:14,padding:18,marginBottom:16,border:"1px solid rgba(224,175,104,0.15)",textAlign:"center"}}>
      <div style={{fontSize:11,color:"#7982a9",letterSpacing:2}}>TOTAL SPENT</div>
      <div style={{fontSize:32,fontWeight:700,color:"#fff",fontFamily:"monospace",marginTop:4}}>¥{tot.toLocaleString()}</div>
      <div style={{fontSize:13,color:"#9ece6a",marginTop:2}}>≈ ${(tot*0.0067).toFixed(2)}</div></div>
    <button onClick={()=>setSa(!sa)} style={{width:"100%",padding:"12px",borderRadius:10,border:"none",cursor:"pointer",
      background:sa?"rgba(247,118,142,0.15)":"rgba(158,206,106,0.15)",color:sa?"#f7768e":"#9ece6a",fontSize:14,fontWeight:600,marginBottom:12}}>
      {sa?"✕ Cancel":"+ Add Expense"}</button>
    {sa&&(<div style={{background:"rgba(255,255,255,0.04)",borderRadius:12,padding:14,marginBottom:16,border:"1px solid rgba(255,255,255,0.08)"}}>
      <input value={ne.n} onChange={e=>setNe(p=>({...p,n:e.target.value}))} placeholder="What?"
        style={{width:"100%",padding:"10px",borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(0,0,0,0.3)",color:"#c0caf5",fontSize:14,outline:"none",marginBottom:8}}/>
      <input value={ne.a} onChange={e=>setNe(p=>({...p,a:e.target.value.replace(/[^0-9]/g,"")}))} placeholder="¥ Amount"
        style={{width:"100%",padding:"10px",borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(0,0,0,0.3)",color:"#c0caf5",fontSize:14,outline:"none",fontFamily:"monospace",marginBottom:8}}/>
      <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:10}}>
        {Object.entries(ci).map(([k,v])=>(<button key={k} onClick={()=>setNe(p=>({...p,c:k}))} style={{padding:"4px 10px",borderRadius:6,border:"none",cursor:"pointer",
          background:ne.c===k?"rgba(247,118,142,0.2)":"rgba(255,255,255,0.05)",color:ne.c===k?"#f7768e":"#7982a9",fontSize:11}}>{v} {k}</button>))}</div>
      <button onClick={add} style={{width:"100%",padding:"10px",borderRadius:8,border:"none",cursor:"pointer",background:"rgba(158,206,106,0.2)",color:"#9ece6a",fontSize:13,fontWeight:600}}>✓ Save</button></div>)}
    {[...ex].reverse().map(e=>(<div key={e.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,marginBottom:6,
      border:"1px solid rgba(255,255,255,0.05)",background:"rgba(255,255,255,0.02)"}}>
      <span style={{fontSize:20}}>{ci[e.c]||"📦"}</span><div style={{flex:1}}><div style={{fontSize:13,color:"#c0caf5"}}>{e.n}</div>
        <div style={{fontSize:10,color:"#7982a9"}}>{e.d}</div></div>
      <div style={{fontSize:15,fontWeight:700,color:"#fff",fontFamily:"monospace"}}>¥{e.a.toLocaleString()}</div>
      <button onClick={()=>setEx(p=>p.filter(x=>x.id!==e.id))} style={{width:24,height:24,borderRadius:"50%",border:"none",cursor:"pointer",
        background:"rgba(247,118,142,0.1)",color:"#f7768e",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button></div>))}
    {ex.length===0&&<div style={{textAlign:"center",padding:30,color:"#565f89",fontSize:13}}>No expenses yet</div>}
  </div>);}

function ChatTab({dailyPlans,setDailyPlans,expenses}){
  const WELCOME=`こんにちは！ I'm your Japan AI travel assistant 🇯🇵\n\nAsk me anything:\n• "Replan Feb 24 – I'm exhausted"\n• "Best ramen near Asakusa under ¥1,500?"\n• "How do I say 'table for two' in Japanese?"\n• "Which whiskey bar tonight?"`;
  const [msgs,setMsgs]=useState([{role:"assistant",content:WELCOME}]);
  const [input,setInput]=useState("");const [loading,setLoading]=useState(false);
  const [pendingPlan,setPendingPlan]=useState(null);const endRef=useRef(null);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs,pendingPlan]);

  const QUICK_Q=[
    {label:"🍜 Ramen near hotel",q:"Best ramen near my hotel?"},
    {label:"🔄 Replan a day",q:"I'm tired on Feb 25 – make it more relaxed?"},
    {label:"🚇 Subway help",q:"How do I get from Asakusa to Shibuya?"},
    {label:"🥃 Whiskey bar",q:"Which whiskey bar tonight in Tokyo?"},
    {label:"💴 Save money",q:"Best budget meals near Asakusa?"},
    {label:"🗣️ Phrase help",q:"How do I say 'table for two, non-smoking' in Japanese?"},
  ];

  const send=async(overrideText)=>{
    const userMsg=(overrideText||input).trim();
    if(!userMsg||loading)return;
    setInput("");setPendingPlan(null);
    setMsgs(p=>[...p,{role:"user",content:userMsg}]);
    setLoading(true);
    try{
      const sysMsg={role:"system",content:buildSystemPrompt(dailyPlans,expenses||[])};
      const history=msgs.slice(-10).map(m=>({role:m.role,content:m.content}));
      const text=await callChat([sysMsg,...history,{role:"user",content:userMsg}],{max_tokens:700});
      const jsonMatch=text?.match(/```json\n([\s\S]*?)\n```/);
      if(jsonMatch){try{const p=JSON.parse(jsonMatch[1]);if(p.action==="replan")setPendingPlan(p);}catch{}}
      const cleanText=text?.replace(/```json[\s\S]*?```/g,"").trim();
      setMsgs(p=>[...p,{role:"assistant",content:cleanText||"Sorry, couldn't respond. Try again."}]);
    }catch{setMsgs(p=>[...p,{role:"assistant",content:"Connection error. Please try again."}]);}
    setLoading(false);
  };

  const applyPlan=(plan)=>{
    const idx=plan?.dayIndex;
    if(idx==null||idx<0||idx>=dailyPlans.length){
      setMsgs(p=>[...p,{role:"assistant",content:"Couldn't identify which day. Try 'Replan Feb 24' with a specific date."}]);
      setPendingPlan(null);return;
    }
    setDailyPlans(prev=>prev.map((d,i)=>i===idx?{...d,title:plan.dayTitle||d.title,stops:plan.stops}:d));
    setMsgs(p=>[...p,{role:"assistant",content:`✅ Done! ${dailyPlans[idx]?.date} updated to "${plan.dayTitle}". Check the 📅 Plan tab!`}]);
    setPendingPlan(null);
  };

  return(<div style={{padding:"12px 16px 100px",display:"flex",flexDirection:"column",height:"calc(100vh - 140px)"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <h2 style={{fontSize:16,color:"#9aa5ce",fontWeight:400}}>🤖 Japan AI Assistant</h2>
      {msgs.length>1&&<button onClick={()=>{setMsgs([{role:"assistant",content:WELCOME}]);setPendingPlan(null);}}
        style={{padding:"4px 10px",borderRadius:8,border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.03)",color:"#565f89",fontSize:11,cursor:"pointer"}}>↺ Reset</button>}</div>
    {msgs.length<=1&&(<div style={{marginBottom:14}}>
      <div style={{fontSize:11,color:"#565f89",marginBottom:8}}>Try asking:</div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {QUICK_Q.map((q,i)=>(<button key={i} onClick={()=>send(q.q)}
          style={{padding:"7px 13px",borderRadius:20,border:"1px solid rgba(122,162,247,0.15)",
            background:"rgba(122,162,247,0.06)",color:"#7aa2f7",fontSize:11,cursor:"pointer",whiteSpace:"nowrap"}}>
          {q.label}</button>))}</div></div>)}
    <div style={{flex:1,overflowY:"auto",marginBottom:12,display:"flex",flexDirection:"column",gap:8}}>
      {msgs.map((m,i)=>(<div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
        <div style={{maxWidth:"88%",padding:"10px 14px",
          borderRadius:m.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",
          background:m.role==="user"?"rgba(122,162,247,0.15)":"rgba(255,255,255,0.04)",
          border:`1px solid ${m.role==="user"?"rgba(122,162,247,0.2)":"rgba(255,255,255,0.06)"}`,
          fontSize:13,color:m.role==="user"?"#c0caf5":"#9aa5ce",lineHeight:1.65,whiteSpace:"pre-wrap"}}>
          {m.content}</div></div>))}
      {pendingPlan&&!loading&&(
        <div style={{maxWidth:"88%",padding:14,borderRadius:12,background:"rgba(187,154,247,0.07)",border:"1px solid rgba(187,154,247,0.22)"}}>
          <div style={{fontSize:12,color:"#bb9af7",fontWeight:700,marginBottom:10}}>
            ✨ Suggested: "{pendingPlan.dayTitle}"
            {pendingPlan.dayIndex>=0&&pendingPlan.dayIndex<dailyPlans.length&&
              <span style={{fontWeight:400,color:"#9aa5ce"}}> · {dailyPlans[pendingPlan.dayIndex]?.date}</span>}</div>
          {pendingPlan.stops?.map((s,i)=>(<div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:6,padding:"6px 8px",borderRadius:7,background:"rgba(187,154,247,0.07)"}}>
            <span style={{fontSize:10,color:"#7aa2f7",fontFamily:"monospace",width:42,flexShrink:0,paddingTop:1}}>{s.time}</span>
            <span style={{fontSize:15,flexShrink:0}}>{s.icon}</span>
            <div><div style={{fontSize:12,color:"#c0caf5",fontWeight:500}}>{s.name}</div>
              <div style={{fontSize:10,color:"#e0af68",marginTop:1}}>{s.tip}</div></div></div>))}
          <div style={{display:"flex",gap:8,marginTop:10}}>
            {pendingPlan.dayIndex>=0&&pendingPlan.dayIndex<dailyPlans.length&&(
              <button onClick={()=>applyPlan(pendingPlan)} style={{flex:1,padding:"9px",borderRadius:9,border:"none",cursor:"pointer",
                background:"rgba(187,154,247,0.25)",color:"#bb9af7",fontSize:12,fontWeight:700}}>
                ✅ Apply to Planner</button>)}
            <button onClick={()=>setPendingPlan(null)} style={{padding:"9px 14px",borderRadius:9,border:"1px solid rgba(255,255,255,0.08)",
              background:"transparent",color:"#565f89",fontSize:12,cursor:"pointer"}}>Dismiss</button></div></div>)}
      {loading&&(<div style={{display:"flex",justifyContent:"flex-start"}}>
        <div style={{padding:"10px 16px",borderRadius:"14px 14px 14px 4px",background:"rgba(255,255,255,0.04)",fontSize:20,color:"#565f89",letterSpacing:4}}>•••</div></div>)}
      <div ref={endRef}/></div>
    <div style={{display:"flex",gap:8,position:"sticky",bottom:70}}>
      <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()}
        placeholder="Ask anything – replan days, food, phrases, transit..."
        style={{flex:1,padding:"12px 14px",borderRadius:12,border:"1px solid rgba(255,255,255,0.1)",
          background:"rgba(0,0,0,0.35)",color:"#c0caf5",fontSize:14,outline:"none"}}/>
      <button onClick={()=>send()} disabled={loading} style={{padding:"0 20px",borderRadius:12,border:"none",cursor:"pointer",
        background:loading?"rgba(122,162,247,0.08)":"rgba(122,162,247,0.2)",color:"#7aa2f7",fontSize:16,fontWeight:700}}>
        {loading?"⏳":"→"}</button></div>
  </div>);}

function SOSTab(){return(<div style={{padding:"12px 16px 100px"}}>
  <div style={{textAlign:"center",marginBottom:20}}>
    <a href="tel:110" style={{display:"inline-flex",width:120,height:120,borderRadius:"50%",alignItems:"center",justifyContent:"center",textDecoration:"none",
      background:"radial-gradient(circle, #f7768e 0%, #db4b4b 100%)",boxShadow:"0 0 40px rgba(247,118,142,0.3)",
      fontSize:18,fontWeight:800,color:"#fff",letterSpacing:3}}>SOS</a>
    <div style={{fontSize:11,color:"#7982a9",marginTop:8}}>Tap to call Police (110)</div></div>
  {EMERGENCY.map((e,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:10,marginBottom:8,
    border:"1px solid rgba(247,118,142,0.1)",background:"rgba(247,118,142,0.04)"}}>
    <span style={{fontSize:28}}>{e.icon}</span><div style={{flex:1}}><div style={{fontSize:14,color:"#c0caf5",fontWeight:600}}>{e.label}</div>
      <div style={{fontSize:11,color:"#7982a9"}}>{e.note}</div></div>
    {e.number?<a href={`tel:${e.number}`} style={{padding:"6px 14px",borderRadius:8,background:"rgba(247,118,142,0.15)",color:"#f7768e",fontSize:13,fontWeight:700,textDecoration:"none",fontFamily:"monospace"}}>{e.number}</a>
      :e.url?<a href={e.url} target="_blank" rel="noopener" style={{padding:"6px 14px",borderRadius:8,background:"rgba(122,162,247,0.15)",color:"#7aa2f7",fontSize:12,textDecoration:"none"}}>Open ↗</a>:null}
  </div>))}
  <div style={{fontSize:13,color:"#f7768e",marginBottom:10,fontWeight:600,marginTop:12}}>Emergency Phrases</div>
  {PHRASES.filter(p=>p.cat==="emergency").map((p,i)=>(<button key={i} onClick={()=>speak(p.ja)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
    padding:"12px 14px",borderRadius:10,border:"1px solid rgba(247,118,142,0.1)",background:"rgba(247,118,142,0.04)",cursor:"pointer",textAlign:"left",width:"100%",marginBottom:6}}>
    <div><div style={{fontSize:13,color:"#c0caf5",fontWeight:500}}>{p.en}</div>
      <div style={{fontSize:17,color:"#fff",fontFamily:"serif",marginTop:2}}>{p.ja}</div>
      <div style={{fontSize:11,color:"#7aa2f7",marginTop:1}}>{p.rom}</div></div>
    <span style={{fontSize:20}}>🔊</span></button>))}
  <div style={{marginTop:16,padding:14,borderRadius:12,background:"rgba(224,175,104,0.06)",border:"1px solid rgba(224,175,104,0.12)"}}>
    <div style={{fontSize:13,color:"#e0af68",fontWeight:600,marginBottom:8}}>📋 Good to Know</div>
    <div style={{fontSize:12,color:"#9aa5ce",lineHeight:1.8}}>
      • Japan is extremely safe<br/>• Police boxes (交番 kōban) everywhere<br/>
      • Keep passport photo + hotel address on phone<br/>• Hotel front desk helps with emergencies</div></div>
</div>);}

export default function JapanTravelAssistant(){
  const [tab,setTab]=useState("trip");
  const [dailyPlans,setDailyPlans]=useState(DAILY_PLANS);
  const [expenses,setExpenses]=useState([]);
  useEffect(()=>{storage.get("japan-expenses").then(d=>{if(d)setExpenses(d);});},[tab]);
  return(<div style={{minHeight:"100vh",background:"#1a1a2e",color:"#c0caf5",fontFamily:"-apple-system, sans-serif",maxWidth:480,margin:"0 auto",position:"relative"}}>
    <style>{`*{box-sizing:border-box;margin:0;padding:0;}::-webkit-scrollbar{width:0;}body{background:#1a1a2e;}input::placeholder{color:#565f89;}button:active{opacity:0.8;}`}</style>
    <Header/>
    {tab==="trip"&&<TripTab/>}
    {tab==="planner"&&<PlannerTab dailyPlans={dailyPlans} setDailyPlans={setDailyPlans}/>}
    {tab==="translate"&&<TranslateTab/>}
    {tab==="camera"&&<CameraTab/>}
    {tab==="explore"&&<ExploreTab/>}
    {tab==="nightlife"&&<NightlifeTab/>}
    {tab==="places"&&<PlacesTab/>}
    {tab==="pack"&&<PackTab/>}
    {tab==="expense"&&<ExpenseTab/>}
    {tab==="chat"&&<ChatTab dailyPlans={dailyPlans} setDailyPlans={setDailyPlans} expenses={expenses}/>}
    {tab==="sos"&&<SOSTab/>}
    <TabBar active={tab} setActive={setTab}/>
  </div>);}
