import { useState, useEffect, useRef, useCallback } from "react";

// ━━━ FLIGHT DATA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const FLIGHTS = {
  outbound: {
    flight: "TG 682", airline: "Thai Airways", aircraft: "Boeing 777-300ER",
    date: "Feb 19 (Thu)", route: "Bangkok (BKK) → Tokyo Haneda (HND)",
    depart: "22:45", arrive: "06:55 +1", arriveDate: "Feb 20 (Fri)",
    terminal: { depart: "Suvarnabhumi", arrive: "Haneda T3" },
    duration: "6h 10m", distance: "4,589 km", codeshare: "NH5598 / LY8433", onTime: "70%", avgDelay: "20 min",
  },
  return: {
    flight: "TG 683", airline: "Thai Airways", aircraft: "Boeing 777-300ER",
    date: "Feb 27 (Fri)", route: "Tokyo Haneda (HND) → Bangkok (BKK)",
    depart: "10:35", arrive: "15:40", arriveDate: "Feb 27 (Fri)",
    terminal: { depart: "Haneda T3", arrive: "Suvarnabhumi T1" },
    duration: "7h 05m", distance: "4,589 km", codeshare: "NH5599 / LY8434", onTime: "84%", avgDelay: "17 min",
  }
};

const HOTELS = [
  { name: "The OneFive Kyoto Shijo", nameJa: "ザ・ワンファイブ京都四条", dates: "Feb 20–22",
    address: "〒600-8413 京都府京都市下京区四条通堀川東入ル柏屋町1番地",
    addressEn: "1 Kashiwaya-cho, Shijo-dori Horikawa, Shimogyo-ku, Kyoto",
    phone: "+81-75-284-1150", checkin: "3:00 PM", checkout: "10:00 AM",
    lat: 35.0016, lng: 135.7508, nearStation: "Omiya / Shijo Omiya Stn (3 min)" },
  { name: "the b asakusa", nameJa: "ザ・ビー浅草", dates: "Feb 22–27",
    address: "〒111-0035 東京都台東区西浅草3-16-12",
    addressEn: "3-16-12 Nishi Asakusa, Taito-ku, Tokyo",
    phone: "+81-3-5828-3300", checkin: "3:00 PM", checkout: "11:00 AM",
    lat: 35.7118, lng: 139.7918, nearStation: "Tsukuba Express Asakusa (1 min)" }
];

const TRIP_DATA = {
  segments: [
    { id:0, type:"travel", icon:"✈️", title:"Depart Bangkok → Tokyo", date:"Feb 19 (Thu)", time:"22:45 BKK → 06:55+1 HND", detail:"TG 682 • Thai Airways • Boeing 777-300ER • Haneda T3", note:"Night flight. Arrive Feb 20 morning. Buy Suica/Pasmo at Haneda." },
    { id:1, type:"travel", icon:"🚅", title:"Shinkansen → Kyoto", date:"Feb 20 (Fri)", time:"~2h 15m", detail:"Tokyo Stn → Kyoto Stn (Nozomi)", note:"SmartEX app to reserve. ¥13,320 one-way." },
    { id:2, type:"hotel", icon:"🏨", title:"The OneFive Kyoto Shijo", date:"Feb 20–22", time:"In 3PM / Out 10AM", detail:"Shimogyo-ku, Shijo-dori Horikawa • 3 min to Omiya Stn", note:"7-Eleven on ground floor! Nijo Castle 8 min." },
    { id:3, type:"explore", icon:"⛩️", title:"Explore Kyoto", date:"Feb 21–22", time:"Full days", detail:"Fushimi Inari, Kinkaku-ji, Arashiyama, Nishiki Market, Gion", note:"Buy Kyoto 1-day bus pass (¥700)" },
    { id:4, type:"travel", icon:"🚅", title:"Shinkansen → Tokyo", date:"Feb 22 (Sun)", time:"After check-out", detail:"Kyoto Stn → Tokyo Stn", note:"Same route back. ~2h 15m" },
    { id:5, type:"hotel", icon:"🏨", title:"the b asakusa", date:"Feb 22–27", time:"In 3PM / Out 11AM", detail:"Nishi Asakusa 3-16-12 • 1 min from Tsukuba Express", note:"400m from Sensoji. 7-Eleven across the street." },
    { id:6, type:"explore", icon:"🗼", title:"Explore Tokyo", date:"Feb 23–26", time:"Full days", detail:"Shibuya, Shinjuku, Akihabara, Harajuku, Tsukiji, Skytree", note:"Suica works everywhere. 72-hour metro pass ¥1,500" },
    { id:7, type:"travel", icon:"✈️", title:"Flight Home → Bangkok", date:"Feb 27 (Fri)", time:"10:35 HND → 15:40 BKK", detail:"TG 683 • Thai Airways • Haneda T3", note:"Check out 11AM. Allow 3+ hours before flight." },
  ]
};

const PHRASES = [
  { en:"Hello", ja:"こんにちは", rom:"Konnichiwa", cat:"basics" },
  { en:"Thank you", ja:"ありがとうございます", rom:"Arigatou gozaimasu", cat:"basics" },
  { en:"Excuse me", ja:"すみません", rom:"Sumimasen", cat:"basics" },
  { en:"Sorry", ja:"ごめんなさい", rom:"Gomen nasai", cat:"basics" },
  { en:"Yes / No", ja:"はい / いいえ", rom:"Hai / Iie", cat:"basics" },
  { en:"I don't understand", ja:"わかりません", rom:"Wakarimasen", cat:"basics" },
  { en:"Do you speak English?", ja:"英語を話せますか？", rom:"Eigo o hanasemasu ka?", cat:"basics" },
  { en:"Please", ja:"お願いします", rom:"Onegaishimasu", cat:"basics" },
  { en:"Good morning", ja:"おはようございます", rom:"Ohayou gozaimasu", cat:"basics" },
  { en:"Goodbye", ja:"さようなら", rom:"Sayounara", cat:"basics" },
  { en:"How much?", ja:"いくらですか？", rom:"Ikura desu ka?", cat:"shopping" },
  { en:"Too expensive", ja:"高すぎます", rom:"Takasugimasu", cat:"shopping" },
  { en:"I'll take this", ja:"これをください", rom:"Kore o kudasai", cat:"shopping" },
  { en:"Where is the toilet?", ja:"トイレはどこですか？", rom:"Toire wa doko desu ka?", cat:"navigate" },
  { en:"Where is the station?", ja:"駅はどこですか？", rom:"Eki wa doko desu ka?", cat:"navigate" },
  { en:"Please take me to…", ja:"…まで お願いします", rom:"...made onegaishimasu", cat:"navigate" },
  { en:"I'm lost", ja:"迷いました", rom:"Mayoimashita", cat:"navigate" },
  { en:"Where is the trash can?", ja:"ゴミ箱はどこですか？", rom:"Gomibako wa doko desu ka?", cat:"navigate" },
  { en:"Menu, please", ja:"メニューをください", rom:"Menyuu o kudasai", cat:"food" },
  { en:"Water, please", ja:"お水をください", rom:"Omizu o kudasai", cat:"food" },
  { en:"The bill, please", ja:"お会計お願いします", rom:"Okaikei onegaishimasu", cat:"food" },
  { en:"Delicious!", ja:"おいしい！", rom:"Oishii!", cat:"food" },
  { en:"No meat please", ja:"肉なしでお願いします", rom:"Niku nashi de onegaishimasu", cat:"food" },
  { en:"I have an allergy", ja:"アレルギーがあります", rom:"Arerugii ga arimasu", cat:"food" },
  { en:"Cheers!", ja:"乾杯！", rom:"Kanpai!", cat:"food" },
  { en:"Help!", ja:"助けて！", rom:"Tasukete!", cat:"emergency" },
  { en:"Call an ambulance", ja:"救急車を呼んでください", rom:"Kyuukyuusha o yonde kudasai", cat:"emergency" },
  { en:"I need a doctor", ja:"医者が必要です", rom:"Isha ga hitsuyou desu", cat:"emergency" },
  { en:"I feel sick", ja:"気分が悪いです", rom:"Kibun ga warui desu", cat:"emergency" },
];

const ETIQUETTE = [
  { icon:"🙇", title:"Bowing", text:"Slight nod (15°) for casual meetings. Deeper bows show more respect." },
  { icon:"👟", title:"Shoes Off", text:"Remove shoes at homes, ryokans, temples, some restaurants. Look for genkan." },
  { icon:"🍜", title:"Slurping OK", text:"Slurping noodles is polite — shows you enjoy the food." },
  { icon:"🥢", title:"Chopsticks", text:"Never stick upright in rice. Don't pass food chopstick-to-chopstick." },
  { icon:"💴", title:"Cash & No Tips", text:"Very cash-based. NEVER tip — it's rude. Use the payment tray." },
  { icon:"🚃", title:"Train Manners", text:"No calls on trains. Keep voice low. Don't eat on local trains." },
  { icon:"🗑️", title:"Trash", text:"Very few public bins. Carry a bag. Konbini & stations have bins." },
  { icon:"📸", title:"Photography", text:"Ask before photographing people. Many temples ban indoor photos." },
  { icon:"🪪", title:"Konbini", text:"7-Eleven, Lawson, FamilyMart: ATMs, food, tickets, Wi-Fi. 24/7." },
  { icon:"🛁", title:"Onsen", text:"Wash before entering. No swimwear. Tattoos may restrict entry." },
  { icon:"🗣️", title:"Volume", text:"Keep voice low in trains, restaurants, and shrines." },
];

const EMERGENCY = [
  { icon:"🚑", label:"Ambulance/Fire", number:"119", note:"Free from any phone" },
  { icon:"🚔", label:"Police", number:"110", note:"Free from any phone" },
  { icon:"🌐", label:"Japan Helpline (24h EN)", number:"0570-064-211", note:"Multilingual" },
  { icon:"🥏", label:"AMDA Medical (EN)", number:"03-6233-9266", note:"Doctor referrals" },
  { icon:"📱", label:"NHK World Disaster", number:null, note:"Earthquake/typhoon alerts", url:"https://www3.nhk.or.jp/nhkworld/en/news/" },
];

const NIGHTLIFE = {
  whiskey: [
    { name:"Bar Benfiddich", area:"Shinjuku", desc:"World's 50 Best Bars. Mad-genius owner grows ingredients. Rare vintage bottles.", price:"¥¥¥", hours:"6PM–2AM", tip:"9F of nondescript building. No menu — tell them what you like.", lat:35.6937, lng:139.6957 },
    { name:"Zoetrope", area:"Nishi-Shinjuku", desc:"300+ Japanese whiskies. Film-buff owner screens movies while you sip.", price:"¥¥", hours:"5PM–12AM (closed Sun)", tip:"Small and intimate. Go early — stop entry 30 min before close.", lat:35.6930, lng:139.6940 },
    { name:"Bar Hermit West", area:"Nishi-Shinjuku", desc:"Choose 'Scotch' or 'Bourbon' at the door. Ridiculous rare selection.", price:"¥¥¥", hours:"6PM–2AM", tip:"Barrel-end signs on wall. Sushi next door after.", lat:35.6932, lng:139.6935 },
    { name:"Aloha Whisky", area:"Ikebukuro", desc:"Bar of the Year winner. Hawaiian owner David is incredibly warm.", price:"¥¥", hours:"3PM–12AM", tip:"Open afternoons — rare for whisky bars. Great daytime tasting.", lat:35.7312, lng:139.7098 },
    { name:"Star Bar Ginza", area:"Ginza", desc:"Legendary upmarket bar. Hand-carved 'ninja ice'. Impeccable service.", price:"¥¥¥¥", hours:"5PM–11PM (closed Sun)", tip:"Dress smart. No photos. Bespoke drinks to your taste.", lat:35.6713, lng:139.7651 },
    { name:"Whisky Salon", area:"Shinjuku", desc:"Run by 1 of only 13 'Masters of Whisky' worldwide. Near Golden Gai.", price:"¥¥¥", hours:"6PM–1AM", tip:"Try the Whiskolaschka — whisky paired with yuzu & truffle salt.", lat:35.6940, lng:139.7030 },
  ],
  vinyl: [
    { name:"Grandfather's", area:"Shibuya", desc:"40-year OG listening bar. Yacht rock to Bruno Mars. Perfect playlists.", price:"¥¥", hours:"7PM–2AM", tip:"¥700 Guinness on tap. Cozy and friendly. Can get smoky.", lat:35.6595, lng:139.6990 },
    { name:"JBS", area:"Shibuya", desc:"Unbelievable collection. Plays full sides of albums. Serious audiophile.", price:"¥¥", hours:"7PM–3AM", tip:"Owner can be prickly but music is incredible. Just listen.", lat:35.6590, lng:139.6985 },
    { name:"Ginza Music Bar", area:"Ginza", desc:"3,000 vinyls, Tannoy speakers, plush blue seating. By DJ Osawa.", price:"¥¥¥", hours:"6PM–1AM", tip:"Make a reservation — gets busy. Expert cocktails.", lat:35.6710, lng:139.7645 },
    { name:"Cave Shibuya", area:"Shibuya", desc:"Basement bar. 3,000 records. Soul, funk, disco classics.", price:"¥¥", hours:"6PM–2AM", tip:"Fancy cocktails and spinny bar stools on Meiji Street.", lat:35.6600, lng:139.7020 },
    { name:"Little Soul Cafe", area:"Shimokitazawa", desc:"15,000+ vinyls since 1999. Soul, funk, jazz, dance.", price:"¥", hours:"9PM–3AM", tip:"Narrow corridor space. Intimate. True music lover's paradise.", lat:35.6613, lng:139.6683 },
    { name:"Meikyoku Kissa Lion", area:"Shibuya", desc:"Founded 1926. Oldest music cafe. Towering custom wood speakers.", price:"¥", hours:"11AM–10PM", tip:"No talking 3PM–7PM (concert hours). Request records outside that.", lat:35.6580, lng:139.6960 },
  ],
  entertainment: [
    { name:"Golden Gai", area:"Shinjuku", desc:"50-100 tiny bars in narrow alleys, each seats 5-6. Unique themes.", price:"¥–¥¥¥", hours:"8PM–late", tip:"Many charge ¥500-1000 cover. Look for 'tourist-friendly' signs.", lat:35.6940, lng:139.7035 },
    { name:"Omoide Yokocho", area:"Shinjuku", desc:"Atmospheric alley of tiny yakitori stalls near Shinjuku Station.", price:"¥", hours:"5PM–12AM", tip:"Get yakitori and a beer. Smoky, cramped, perfect.", lat:35.6937, lng:139.6980 },
    { name:"Hoppy Street", area:"Asakusa", desc:"Outdoor drinking street near your hotel! Yakitori & lively vibes.", price:"¥", hours:"3PM–11PM", tip:"400m from the b asakusa. Order Hoppy — local specialty.", lat:35.7130, lng:139.7940 },
    { name:"Nonbei Yokocho", area:"Shibuya", desc:"40+ tiny bars with distinct personality. Less touristy than Golden Gai.", price:"¥–¥¥", hours:"6PM–late", tip:"More local feel. Wander and peek inside — most are welcoming.", lat:35.6594, lng:139.7005 },
    { name:"Kabukicho Tower", area:"Shinjuku", desc:"New entertainment complex: bars, restaurants, cinema, rooftop.", price:"¥¥", hours:"10AM–11PM", tip:"Namco arcade floors + trendy restaurants. New Shinjuku landmark.", lat:35.6955, lng:139.7010 },
  ]
};

const SHOPPING = [
  { name:"Don Quijote (Donki)", icon:"🏪", area:"Everywhere", desc:"Tax-free souvenirs, snacks, electronics. Open 24h.", tip:"Passport for tax-free on ¥5,000+.", cat:"general" },
  { name:"Nakamise Street", icon:"🎎", area:"Asakusa", desc:"Traditional souvenirs, snacks, fans. 400m from hotel!", tip:"Compare prices on side streets.", cat:"souvenirs" },
  { name:"Omotesando", icon:"👔", area:"Harajuku", desc:"Tokyo's Champs-Élysées. Luxury brands, designer boutiques.", tip:"Side streets (Ura-Harajuku) for indie Japanese designers.", cat:"fashion" },
  { name:"Takeshita Street", icon:"🌈", area:"Harajuku", desc:"Youth fashion, quirky accessories, crepes.", tip:"Weekday mornings to avoid crowds. Try Marion Crêpes.", cat:"fashion" },
  { name:"Akihabara Electric Town", icon:"🎮", area:"Akihabara", desc:"Electronics, anime, manga, retro games. Multi-floor shops.", tip:"Yodobashi Camera for electronics. Mandarake for rare manga.", cat:"electronics" },
  { name:"Nishiki Market", icon:"🍡", area:"Kyoto", desc:"400m covered market, 100+ food stalls. Kyoto's kitchen.", tip:"Dashi tamago, mochi, matcha everything. Closes 5 PM.", cat:"food" },
  { name:"Tokyu Hands / Loft", icon:"🎨", area:"Shibuya", desc:"Japanese stationery, crafts, gadgets, unique gifts.", tip:"Stationery floor is incredible — pens, washi tape, notebooks.", cat:"general" },
  { name:"Depachika (Basements)", icon:"🍱", area:"Everywhere", desc:"Dept store food floors. Stunning bento & sweets.", tip:"Isetan Shinjuku is best. 30 min before close for discounts.", cat:"food" },
  { name:"Disk Union", icon:"🎵", area:"Shinjuku", desc:"Japan's best used records. Genre-specific stores. Jazz, rock.", tip:"Shinjuku branch excels in jazz. Competitive prices.", cat:"entertainment" },
  { name:"Tower Records Shibuya", icon:"💿", area:"Shibuya", desc:"9-floor music store. 6th floor has amazing vinyl.", tip:"Japan-exclusive vinyl pressings. Great for music lovers.", cat:"entertainment" },
  { name:"Uniqlo Ginza", icon:"👕", area:"Ginza", desc:"12-floor flagship. Japan-exclusive items.", tip:"UT floor has Japan-only graphic tees. Cheaper than abroad.", cat:"fashion" },
];

const TRASH_TIPS = [
  { icon:"🪪", name:"Convenience Stores", desc:"7-Eleven, Lawson, FamilyMart all have bins. Best option!", reliable:true },
  { icon:"🚃", name:"Train Stations", desc:"Most JR/Metro stations have bins on platforms.", reliable:true },
  { icon:"🏪", name:"Vending Machines", desc:"Recycling bins always next to vending machines.", reliable:true },
  { icon:"🏬", name:"Shopping Malls", desc:"Restroom areas and food courts have bins.", reliable:true },
  { icon:"🍔", name:"Fast Food / Cafés", desc:"McDonald's, Starbucks etc. have bins inside.", reliable:true },
  { icon:"🎒", name:"Carry a Bag!", desc:"Pro tip: Always carry a small plastic bag for trash!", reliable:true },
];

const ATTRACTIONS = {
  kyoto: [
    { name:"Fushimi Inari", icon:"⛩️", hours:"24h", price:"Free", time:"1.5–2h", tip:"Go at dawn. Full hike 2-3 hours.", lat:34.9671, lng:135.7727, mustSee:true },
    { name:"Kinkaku-ji", icon:"🏯", hours:"9–17", price:"¥500", time:"45m", tip:"Best photos from pond. Less crowded PM.", lat:35.0394, lng:135.7292, mustSee:true },
    { name:"Arashiyama Bamboo", icon:"🎋", hours:"24h", price:"Free", time:"30m", tip:"Before 8 AM for no crowds.", lat:35.0095, lng:135.6722, mustSee:true },
    { name:"Nishiki Market", icon:"🍡", hours:"9–17", price:"Free", time:"1–2h", tip:"Dashi tamago & mochi. Closes 5 PM.", lat:35.0050, lng:135.7650 },
    { name:"Kiyomizu-dera", icon:"🛕", hours:"6–18", price:"¥400", time:"1h", tip:"Wooden terrace = stunning views.", lat:34.9949, lng:135.7850, mustSee:true },
    { name:"Gion District", icon:"🎭", hours:"Evening", price:"Free", time:"1–2h", tip:"Hanamikoji at dusk for geisha.", lat:35.0037, lng:135.7756 },
    { name:"Nijo Castle", icon:"🏰", hours:"8:45–16", price:"¥800", time:"1h", tip:"Nightingale floors squeak!", lat:35.0142, lng:135.7481 },
    { name:"Nara Day Trip", icon:"🦌", hours:"All day", price:"Transit", time:"Half day", tip:"45 min by JR. Deer crackers ¥200.", lat:34.6851, lng:135.8050 },
  ],
  tokyo: [
    { name:"Senso-ji", icon:"⛩️", hours:"6–17", price:"Free", time:"1h", tip:"400m from hotel! Nakamise snacks.", lat:35.7148, lng:139.7967, mustSee:true },
    { name:"Shibuya Crossing", icon:"🚶", hours:"24h", price:"Free", time:"30m", tip:"Starbucks 2F or Shibuya Sky view.", lat:35.6595, lng:139.7004, mustSee:true },
    { name:"Meiji Shrine", icon:"⛩️", hours:"Dawn–Dusk", price:"Free", time:"1h", tip:"Forested shrine. Write wish on ema.", lat:35.6764, lng:139.6993, mustSee:true },
    { name:"Tokyo Skytree", icon:"🗼", hours:"10–21", price:"¥2,100+", time:"1–2h", tip:"634m tall. Book online.", lat:35.7101, lng:139.8107, mustSee:true },
    { name:"Akihabara", icon:"🎮", hours:"10–21", price:"Free", time:"2–4h", tip:"Electronics, anime. Try maid café.", lat:35.7023, lng:139.7745 },
    { name:"Harajuku", icon:"🌈", hours:"10–20", price:"Free", time:"1–2h", tip:"Marion Crêpes. Omotesando nearby.", lat:35.6704, lng:139.7028 },
    { name:"Tsukiji Market", icon:"🍣", hours:"5–14", price:"Free", time:"1–2h", tip:"Best sushi breakfast ever. Go early!", lat:35.6654, lng:139.7707, mustSee:true },
    { name:"teamLab Borderless", icon:"🎨", hours:"10–19", price:"¥3,800", time:"2–3h", tip:"Book weeks ahead. Mind-blowing.", lat:35.6257, lng:139.7838 },
    { name:"Shibuya Sky", icon:"🏙️", hours:"10–22:30", price:"¥2,000", time:"1h", tip:"Open-air deck. Best at sunset.", lat:35.6584, lng:139.7022 },
  ]
};

const PACKING_DATA = [
  { cat:"essentials", items:[
    {id:"p01",name:"Passport",note:"6+ months validity"},{id:"p02",name:"Flight tickets",note:"TG 682/683"},
    {id:"p03",name:"Hotel confirmations",note:"Print/save offline"},{id:"p04",name:"Travel insurance",note:"Save policy #"},
    {id:"p05",name:"Cards (notify bank)",note:"Japan travel dates"},{id:"p06",name:"Cash (JPY)",note:"¥20,000+ at airport"},
    {id:"p07",name:"Charger + cable",note:"Type A plugs (=US)"},{id:"p08",name:"Battery pack",note:"10,000+ mAh"},
  ]},
  { cat:"tech", items:[
    {id:"p09",name:"eSIM / Pocket Wi-Fi",note:"Ubigi, Airalo"},{id:"p10",name:"Offline Google Maps",note:"Kyoto + Tokyo"},
    {id:"p11",name:"GO Taxi app",note:"Best taxi in Japan"},{id:"p12",name:"SmartEX app",note:"Reserve Shinkansen"},
    {id:"p13",name:"Earbuds",note:"For trains — no speakers!"},
  ]},
  { cat:"clothing", items:[
    {id:"p15",name:"Walking shoes",note:"15,000+ steps/day"},{id:"p16",name:"Slip-on shoes",note:"Temples & restaurants"},
    {id:"p17",name:"Warm layers",note:"Feb: 2–10°C"},{id:"p18",name:"Umbrella",note:"Compact"},
    {id:"p19",name:"Warm socks",note:"Cold feet in temples!"},{id:"p20",name:"Scarf/hat/gloves",note:"Wind chill"},
  ]},
  { cat:"japan-specific", items:[
    {id:"p21",name:"Small trash bag",note:"No public bins!"},{id:"p22",name:"Hand towel",note:"No paper towels in restrooms"},
    {id:"p23",name:"Coin purse",note:"Lots of coins"},{id:"p24",name:"Basic meds",note:"Ibuprofen, Pepto, band-aids"},
  ]},
];

const DAILY_PLANS = [
  { date:"Feb 21 (Sat)", city:"Kyoto", title:"Temples & Markets", stops:[
    {time:"6:00",name:"Fushimi Inari",tip:"Empty at dawn",icon:"⛩️"},{time:"9:00",name:"Nishiki Market breakfast",tip:"Dashi tamago, matcha, mochi",icon:"🍡"},
    {time:"10:30",name:"Kiyomizu-dera",tip:"Walk Higashiyama streets up",icon:"🛕"},{time:"12:30",name:"Gion lunch",tip:"Teishoku set ¥800-1,200",icon:"🍱"},
    {time:"14:00",name:"Kinkaku-ji",tip:"Less crowded afternoon",icon:"🏯"},{time:"16:00",name:"Nijo Castle",tip:"Nightingale floors!",icon:"🏰"},
    {time:"18:00",name:"Pontocho dinner",tip:"Atmospheric alley",icon:"🍶"},
  ]},
  { date:"Feb 22 (Sun)", city:"Kyoto→Tokyo", title:"Arashiyama & Transfer", stops:[
    {time:"7:00",name:"Bamboo Grove",tip:"Empty before 8 AM",icon:"🎋"},{time:"8:00",name:"Tenryu-ji",tip:"UNESCO garden",icon:"⛩️"},
    {time:"9:00",name:"Monkey Park",tip:"15-min hike, feed monkeys",icon:"🐒"},{time:"10:00",name:"Check out",tip:"→ Kyoto Station",icon:"🏨"},
    {time:"11:30",name:"Shinkansen",tip:"Grab ekiben bento!",icon:"🚅"},{time:"14:00",name:"Check in Tokyo",tip:"the b asakusa",icon:"🏨"},
    {time:"15:00",name:"Senso-ji",tip:"400m from hotel",icon:"⛩️"},{time:"18:00",name:"Hoppy Street",tip:"Yakitori & beer near hotel",icon:"🍻"},
  ]},
  { date:"Feb 23 (Mon)", city:"Tokyo", title:"Shibuya & Harajuku", stops:[
    {time:"9:00",name:"Meiji Shrine",tip:"Write wish on ema",icon:"⛩️"},{time:"10:30",name:"Takeshita Street",tip:"Crepes & fashion",icon:"🌈"},
    {time:"12:00",name:"Omotesando lunch",tip:"Trendy cafés",icon:"🍜"},{time:"13:30",name:"Shibuya Crossing",tip:"Then Starbucks 2F",icon:"🚶"},
    {time:"14:30",name:"Shibuya Sky",tip:"Book ahead for 360° views",icon:"🏙️"},{time:"16:30",name:"Shinjuku Gyoen",tip:"Three garden styles",icon:"🌳"},
    {time:"19:00",name:"Golden Gai",tip:"Bar hopping in tiny alleys",icon:"🍶"},
  ]},
  { date:"Feb 24 (Tue)", city:"Tokyo", title:"Culture & Whiskey", stops:[
    {time:"6:00",name:"Tsukiji Market",tip:"Best sushi breakfast ever",icon:"🍣"},{time:"9:00",name:"teamLab Borderless",tip:"Book ahead, 2-3h",icon:"🎨"},
    {time:"12:00",name:"Odaiba",tip:"Gundam + food court",icon:"🌉"},{time:"14:30",name:"Imperial Palace Gardens",tip:"Free entry, Edo Castle",icon:"👑"},
    {time:"16:30",name:"Ueno Park",tip:"National Museum or stroll",icon:"🏛️"},{time:"19:00",name:"Whiskey bar night",tip:"Zoetrope or Bar Benfiddich",icon:"🥃"},
  ]},
  { date:"Feb 25 (Wed)", city:"Tokyo", title:"Akihabara & Vinyl", stops:[
    {time:"9:00",name:"Yanaka District",tip:"Old Tokyo: cats, temples",icon:"🏘️"},{time:"11:00",name:"Akihabara",tip:"Electronics, anime, maid café",icon:"🎮"},
    {time:"13:00",name:"Ramen lunch",tip:"Great shops in the area",icon:"🍜"},{time:"14:30",name:"Tokyo Skytree",tip:"Book online, skip queue",icon:"🗼"},
    {time:"17:00",name:"Disk Union",tip:"Best used records. Jazz!",icon:"🎵"},{time:"19:00",name:"Vinyl listening bar",tip:"Grandfather's in Shibuya",icon:"🎶"},
  ]},
  { date:"Feb 26 (Thu)", city:"Tokyo", title:"Shopping & Last Night", stops:[
    {time:"Flex",name:"Revisit or explore",tip:"Buffer day — no pressure!",icon:"🗺️"},
    {time:"Idea",name:"Don Quijote + Ginza Six",tip:"Tax-free souvenirs, depachika",icon:"🛍️"},
    {time:"Idea",name:"Day trip Kamakura",tip:"Great Buddha, 1h by train",icon:"🧘"},
    {time:"Eve",name:"Last night splurge",tip:"Omakase/wagyu + Star Bar Ginza",icon:"🥩"},
  ]},
];

const WMO_CODES = {0:"☀️ Clear",1:"🌤️ Clear",2:"⛅ Cloudy",3:"☁️ Overcast",45:"🌫️ Fog",51:"🌦️ Drizzle",61:"🌧️ Rain",63:"🌧️ Rain",71:"🌨️ Snow",80:"🌧️ Showers",95:"⛈️ Storm"};

const speak = (text, lang="ja-JP") => { if("speechSynthesis" in window){const u=new SpeechSynthesisUtterance(text);u.lang=lang;u.rate=0.85;speechSynthesis.speak(u);} };

const storage = {
  async get(k){try{if(window.storage){const r=await window.storage.get(k);return r?JSON.parse(r.value):null;}}catch(e){}try{const v=localStorage.getItem(k);return v?JSON.parse(v):null;}catch(e){return null;}},
  async set(k,v){try{if(window.storage){await window.storage.set(k,JSON.stringify(v));return;}}catch(e){}try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
};

// ━━━ COMPONENTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function TabBar({active,setActive}){
  const tabs=[{id:"trip",icon:"📋",l:"Trip"},{id:"planner",icon:"📅",l:"Plan"},{id:"translate",icon:"🗣️",l:"Talk"},
    {id:"explore",icon:"🧭",l:"Explore"},{id:"nightlife",icon:"🌙",l:"Night"},{id:"places",icon:"📍",l:"Places"},
    {id:"pack",icon:"🧳",l:"Pack"},{id:"expense",icon:"💰",l:"¥"},{id:"chat",icon:"🤖",l:"AI"},{id:"sos",icon:"🆘",l:"SOS"}];
  return(<div style={{position:"fixed",bottom:0,left:0,right:0,display:"flex",justifyContent:"space-around",
    background:"linear-gradient(to top, #1a1a2e, #16213e)",borderTop:"1px solid rgba(255,255,255,0.08)",
    paddingBottom:"env(safe-area-inset-bottom, 8px)",paddingTop:6,zIndex:100,overflowX:"auto"}}>
    {tabs.map(t=>(<button key={t.id} onClick={()=>setActive(t.id)} style={{background:"none",border:"none",
      color:active===t.id?"#f7768e":"#7982a9",display:"flex",flexDirection:"column",alignItems:"center",gap:1,
      fontSize:7,cursor:"pointer",transform:active===t.id?"scale(1.1)":"scale(1)",padding:"4px 3px",minWidth:0,flexShrink:0}}>
      <span style={{fontSize:14,filter:active===t.id?"drop-shadow(0 0 6px #f7768e)":"none"}}>{t.icon}</span>
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
        <div style={{fontSize:22,fontWeight:300,marginTop:2,fontFamily:"'Noto Serif JP', serif",color:"#fff"}}>Feb 19 → 27</div></div>
      <div style={{textAlign:"right"}}><div style={{fontSize:24,fontWeight:200,fontFamily:"monospace",color:"#f7768e"}}>{jp}</div>
        <div style={{fontSize:11,color:"#7982a9"}}>🇯🇵 {jpD} JST</div></div></div>
    {weather?.current&&(<div style={{marginTop:10,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
      <div style={{display:"flex",gap:4}}>{["tokyo","kyoto"].map(c=>(<button key={c} onClick={()=>setCity(c)} style={{padding:"2px 10px",borderRadius:12,border:"none",cursor:"pointer",
        background:city===c?"rgba(247,118,142,0.2)":"rgba(255,255,255,0.05)",color:city===c?"#f7768e":"#565f89",fontSize:11,textTransform:"capitalize"}}>{c}</button>))}</div>
      <div style={{fontSize:13,color:"#c0caf5"}}>{WMO_CODES[weather.current.weather_code]||"—"} <span style={{fontWeight:700,color:"#fff"}}>{Math.round(weather.current.temperature_2m)}°C</span></div>
      {weather.daily&&(<div style={{display:"flex",gap:8,marginLeft:"auto"}}>{weather.daily.time.slice(0,3).map((d,i)=>(<div key={i} style={{textAlign:"center",fontSize:10,color:"#7982a9"}}>
        <div>{new Date(d+"T00:00").toLocaleDateString("en",{weekday:"short"})}</div>
        <div style={{fontSize:14}}>{(WMO_CODES[weather.daily.weather_code[i]]||"—").split(" ")[0]}</div>
        <div style={{color:"#9aa5ce"}}>{Math.round(weather.daily.temperature_2m_min[i])}°/{Math.round(weather.daily.temperature_2m_max[i])}°</div></div>))}</div>)}
    </div>)}
  </div>);
}

function FlightCard({f,label}){return(
  <div style={{background:"linear-gradient(135deg, rgba(122,162,247,0.08), rgba(187,154,247,0.06))",borderRadius:14,padding:16,marginBottom:12,border:"1px solid rgba(122,162,247,0.15)"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
      <div style={{fontSize:11,color:"#7aa2f7",fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>{label}</div>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <span style={{fontSize:12,color:"#bb9af7",fontWeight:700}}>✈️ {f.flight}</span>
        <span style={{fontSize:10,padding:"2px 8px",borderRadius:4,background:"rgba(158,206,106,0.15)",color:"#9ece6a"}}>{f.airline}</span></div></div>
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
      <div style={{textAlign:"center",flex:1}}><div style={{fontSize:24,fontWeight:700,color:"#fff",fontFamily:"monospace"}}>{f.depart}</div>
        <div style={{fontSize:11,color:"#9aa5ce"}}>{f.terminal.depart}</div><div style={{fontSize:10,color:"#7982a9"}}>{f.date}</div></div>
      <div style={{flex:1,textAlign:"center"}}><div style={{fontSize:10,color:"#7982a9",marginBottom:2}}>{f.duration}</div>
        <div style={{height:1,background:"linear-gradient(90deg, #7aa2f7, #bb9af7)"}}></div>
        <div style={{fontSize:9,color:"#565f89",marginTop:4}}>{f.distance}</div></div>
      <div style={{textAlign:"center",flex:1}}><div style={{fontSize:24,fontWeight:700,color:"#fff",fontFamily:"monospace"}}>{f.arrive}</div>
        <div style={{fontSize:11,color:"#9aa5ce"}}>{f.terminal.arrive}</div><div style={{fontSize:10,color:"#7982a9"}}>{f.arriveDate}</div></div></div>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",fontSize:10,color:"#7982a9"}}>
      <span>🛩️ {f.aircraft}</span><span>📊 On-time: {f.onTime}</span><span>⏱️ Avg delay: {f.avgDelay}</span></div>
    <div style={{fontSize:10,color:"#565f89",marginTop:4}}>Codeshare: {f.codeshare}</div>
    <a href={`https://www.flightradar24.com/data/flights/${f.flight.toLowerCase().replace(" ","")}`} target="_blank" rel="noopener"
      style={{display:"block",marginTop:10,padding:"8px",borderRadius:8,textAlign:"center",background:"rgba(122,162,247,0.12)",color:"#7aa2f7",fontSize:12,textDecoration:"none",fontWeight:600}}>🔴 Track Live Status →</a>
  </div>);}

function HotelTaxiCard({h}){return(
  <div style={{background:"linear-gradient(135deg, rgba(247,118,142,0.06), rgba(224,175,104,0.06))",borderRadius:14,padding:16,marginBottom:12,border:"1px solid rgba(247,118,142,0.12)"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
      <div style={{fontSize:14,fontWeight:700,color:"#f7768e"}}>🏨 {h.name}</div><div style={{fontSize:10,color:"#7982a9"}}>{h.dates}</div></div>
    <div style={{background:"rgba(0,0,0,0.3)",borderRadius:10,padding:12,marginBottom:8,border:"1px solid rgba(255,255,255,0.06)"}}>
      <div style={{fontSize:9,color:"#e0af68",marginBottom:4,textTransform:"uppercase",letterSpacing:1}}>🚕 SHOW TO TAXI DRIVER:</div>
      <div style={{fontSize:20,color:"#fff",fontFamily:"'Noto Serif JP', serif",lineHeight:1.6}}>{h.nameJa}</div>
      <div style={{fontSize:14,color:"#c0caf5",marginTop:4}}>{h.address}</div></div>
    <div style={{fontSize:12,color:"#9aa5ce",marginBottom:4}}>{h.addressEn}</div>
    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:8}}>
      <a href={`tel:${h.phone}`} style={{padding:"6px 12px",borderRadius:8,background:"rgba(158,206,106,0.12)",color:"#9ece6a",fontSize:11,textDecoration:"none",fontWeight:600}}>📞 {h.phone}</a>
      <a href={`https://www.google.com/maps/search/?api=1&query=${h.lat},${h.lng}`} target="_blank" rel="noopener"
        style={{padding:"6px 12px",borderRadius:8,background:"rgba(122,162,247,0.12)",color:"#7aa2f7",fontSize:11,textDecoration:"none",fontWeight:600}}>📍 Maps</a></div>
    <div style={{display:"flex",gap:12,marginTop:8,fontSize:11,color:"#7982a9"}}>
      <span>🔑 In: {h.checkin}</span><span>🔓 Out: {h.checkout}</span><span>🚃 {h.nearStation}</span></div>
  </div>);}

function TripTab(){
  const [sf,setSf]=useState(false);const [sh,setSh]=useState(false);
  return(<div style={{padding:"12px 16px 100px"}}>
    <button onClick={()=>setSf(!sf)} style={{width:"100%",padding:"12px 14px",borderRadius:12,border:"none",cursor:"pointer",
      background:"linear-gradient(135deg, rgba(122,162,247,0.12), rgba(187,154,247,0.08))",color:"#7aa2f7",fontSize:14,fontWeight:600,marginBottom:12,
      display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <span>✈️ Flight Details (TG 682 / TG 683)</span><span style={{transform:sf?"rotate(180deg)":"",transition:"0.2s"}}>▼</span></button>
    {sf&&<div><FlightCard f={FLIGHTS.outbound} label="Outbound — Feb 19"/><FlightCard f={FLIGHTS.return} label="Return — Feb 27"/></div>}
    <button onClick={()=>setSh(!sh)} style={{width:"100%",padding:"12px 14px",borderRadius:12,border:"none",cursor:"pointer",
      background:"linear-gradient(135deg, rgba(247,118,142,0.1), rgba(224,175,104,0.08))",color:"#f7768e",fontSize:14,fontWeight:600,marginBottom:12,
      display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <span>🏨 Hotel Cards (Show to Taxi Driver)</span><span style={{transform:sh?"rotate(180deg)":"",transition:"0.2s"}}>▼</span></button>
    {sh&&HOTELS.map((h,i)=><HotelTaxiCard key={i} h={h}/>)}
    <h2 style={{fontSize:16,color:"#9aa5ce",fontWeight:400,marginBottom:16}}>Your Itinerary</h2>
    {TRIP_DATA.segments.map((s,i)=>(<div key={s.id} style={{display:"flex",gap:12,marginBottom:4}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:28}}>
        <div style={{width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,
          background:s.type==="hotel"?"rgba(247,118,142,0.15)":s.type==="travel"?"rgba(122,162,247,0.15)":"rgba(158,206,106,0.15)",
          border:`1px solid ${s.type==="hotel"?"rgba(247,118,142,0.3)":s.type==="travel"?"rgba(122,162,247,0.3)":"rgba(158,206,106,0.3)"}`,flexShrink:0}}>{s.icon}</div>
        {i<TRIP_DATA.segments.length-1&&<div style={{width:1,flexGrow:1,minHeight:20,background:"rgba(255,255,255,0.08)"}}/>}</div>
      <div style={{flex:1,background:"rgba(255,255,255,0.03)",borderRadius:10,padding:"10px 14px",marginBottom:8,border:"1px solid rgba(255,255,255,0.06)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
          <span style={{fontSize:14,fontWeight:600,color:"#c0caf5"}}>{s.title}</span><span style={{fontSize:11,color:"#565f89"}}>{s.date}</span></div>
        <div style={{fontSize:11,color:"#7982a9",marginTop:2}}>{s.time}</div>
        <div style={{fontSize:12,color:"#9aa5ce",marginTop:6,lineHeight:1.5}}>{s.detail}</div>
        {s.note&&<div style={{fontSize:11,color:"#e0af68",marginTop:6,padding:"6px 8px",background:"rgba(224,175,104,0.08)",borderRadius:6}}>💡 {s.note}</div>}</div>
    </div>))}
  </div>);}

function PlannerTab(){
  const [di,setDi]=useState(0);const d=DAILY_PLANS[di];
  return(<div style={{padding:"12px 16px 100px"}}>
    <h2 style={{fontSize:16,color:"#9aa5ce",fontWeight:400,marginBottom:12}}>📅 Daily Planner</h2>
    <div style={{display:"flex",gap:6,marginBottom:16,overflowX:"auto",paddingBottom:4}}>
      {DAILY_PLANS.map((p,i)=>(<button key={i} onClick={()=>setDi(i)} style={{padding:"6px 12px",borderRadius:10,border:"none",cursor:"pointer",
        background:di===i?"rgba(247,118,142,0.2)":"rgba(255,255,255,0.04)",color:di===i?"#f7768e":"#7982a9",fontSize:11,fontWeight:600,whiteSpace:"nowrap",flexShrink:0}}>
        {p.date.split(" ")[0]} {p.date.split(" ")[1]}</button>))}</div>
    <div style={{background:"rgba(122,162,247,0.06)",borderRadius:12,padding:14,marginBottom:14,border:"1px solid rgba(122,162,247,0.12)"}}>
      <div style={{fontSize:15,fontWeight:600,color:"#c0caf5"}}>{d.title}</div><div style={{fontSize:12,color:"#7aa2f7",marginTop:2}}>{d.date} • {d.city}</div></div>
    <div style={{display:"flex",flexDirection:"column",gap:4}}>
      {d.stops.map((s,i)=>(<div key={i} style={{display:"flex",gap:10}}>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:45,flexShrink:0}}>
          <div style={{fontSize:10,color:"#7aa2f7",fontFamily:"monospace",fontWeight:600,whiteSpace:"nowrap"}}>{s.time}</div>
          {i<d.stops.length-1&&<div style={{width:1,flexGrow:1,minHeight:20,background:"rgba(255,255,255,0.06)",marginTop:4}}/>}</div>
        <div style={{flex:1,padding:"10px 12px",borderRadius:10,marginBottom:4,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:18}}>{s.icon}</span><span style={{fontSize:13,fontWeight:600,color:"#c0caf5"}}>{s.name}</span></div>
          <div style={{fontSize:11,color:"#e0af68",marginTop:4,padding:"4px 6px",background:"rgba(224,175,104,0.06)",borderRadius:4}}>💡 {s.tip}</div></div>
      </div>))}</div>
  </div>);}

function TranslateTab(){
  const [input,setInput]=useState("");const [result,setResult]=useState(null);const [loading,setLoading]=useState(false);
  const [listening,setListening]=useState(false);const [pf,setPf]=useState("all");
  const startListen=useCallback(()=>{
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){alert("Try Chrome.");return;}
    const r=new SR();r.lang="en-US";r.interimResults=false;
    r.onresult=e=>{const t=e.results[0][0].transcript;setInput(t);setListening(false);doTranslate(t);};
    r.onerror=()=>setListening(false);r.onend=()=>setListening(false);r.start();setListening(true);},[]);
  const doTranslate=async(text)=>{if(!text.trim())return;setLoading(true);
    try{const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,
        messages:[{role:"user",content:`Translate for tourist. English→Japanese or Japanese→English. Return ONLY JSON: {"original","translated","romanji","context"}. No markdown.\n\nText: "${text}"`}]})});
      const data=await res.json();const raw=data.content[0].text.replace(/```json|```/g,"").trim();setResult(JSON.parse(raw));
    }catch{setResult({original:text,translated:"Translation error",romanji:"",context:""});}setLoading(false);};
  const cats=["all","basics","food","navigate","shopping","emergency"];
  const filtered=pf==="all"?PHRASES:PHRASES.filter(p=>p.cat===pf);
  return(<div style={{padding:"12px 16px 100px"}}>
    <div style={{background:"rgba(247,118,142,0.06)",borderRadius:14,padding:16,marginBottom:16,border:"1px solid rgba(247,118,142,0.12)"}}>
      <div style={{fontSize:13,color:"#9aa5ce",marginBottom:10}}>🎙️ AI Translation</div>
      <div style={{display:"flex",gap:8}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doTranslate(input)}
          placeholder="Type English or Japanese..." style={{flex:1,padding:"10px 14px",borderRadius:10,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(0,0,0,0.3)",color:"#c0caf5",fontSize:14,outline:"none"}}/>
        <button onClick={startListen} style={{width:44,height:44,borderRadius:"50%",border:"none",cursor:"pointer",
          background:listening?"#f7768e":"rgba(122,162,247,0.2)",color:"#fff",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",
          animation:listening?"pulse 1s infinite":"none"}}>{listening?"⏹":"🎤"}</button>
        <button onClick={()=>doTranslate(input)} style={{padding:"0 16px",borderRadius:10,border:"none",cursor:"pointer",
          background:"rgba(122,162,247,0.2)",color:"#7aa2f7",fontSize:13,fontWeight:600}}>{loading?"...":"→"}</button></div>
      {result&&(<div style={{marginTop:12,padding:12,background:"rgba(0,0,0,0.2)",borderRadius:10}}>
        <div style={{fontSize:22,color:"#fff",fontFamily:"'Noto Serif JP', serif",marginBottom:4}}>{result.translated}</div>
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
          <div style={{fontSize:15,color:"#fff",fontFamily:"'Noto Serif JP', serif",marginTop:2}}>{p.ja}</div>
          <div style={{fontSize:11,color:"#7aa2f7",marginTop:1}}>{p.rom}</div></div>
        <span style={{fontSize:18,opacity:0.5}}>🔊</span></button>))}</div>
  </div>);}

function ExploreTab(){
  const [loc,setLoc]=useState(null);
  const getLoc=()=>{navigator.geolocation?.getCurrentPosition(p=>setLoc({lat:p.coords.latitude,lng:p.coords.longitude}),()=>{},{enableHighAccuracy:true});};
  const openM=q=>{const u=loc?`https://www.google.com/maps/search/${encodeURIComponent(q)}/@${loc.lat},${loc.lng},15z`:`https://www.google.com/maps/search/${encodeURIComponent(q)}`;window.open(u,"_blank");};
  const qs=[{i:"🪪",l:"7-Eleven",q:"7-Eleven near me"},{i:"🍜",l:"Ramen",q:"ramen near me"},{i:"⛩️",l:"Temples",q:"temple shrine near me"},
    {i:"🍣",l:"Sushi",q:"sushi near me"},{i:"🧊",l:"ATM",q:"ATM near me"},{i:"💊",l:"Pharmacy",q:"pharmacy near me"},
    {i:"☕",l:"Café",q:"cafe near me"},{i:"🍺",l:"Izakaya",q:"izakaya near me"},{i:"🗑️",l:"Trash (Konbini)",q:"convenience store near me"},{i:"🏪",l:"Donki",q:"Don Quijote near me"}];
  return(<div style={{padding:"12px 16px 100px"}}>
    {/* Currency */}
    <CurrencyConverter/>
    {/* Trash tips */}
    <div style={{background:"rgba(158,206,106,0.06)",borderRadius:14,padding:14,marginBottom:16,border:"1px solid rgba(158,206,106,0.1)"}}>
      <div style={{fontSize:13,color:"#9ece6a",fontWeight:600,marginBottom:8}}>🗑️ Trash Can Finder</div>
      <div style={{fontSize:11,color:"#9aa5ce",marginBottom:8}}>Japan has almost no public trash cans! Here's where to find them:</div>
      {TRASH_TIPS.map((t,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 8px",borderRadius:6,marginBottom:2,background:"rgba(255,255,255,0.02)"}}>
        <span style={{fontSize:14}}>{t.icon}</span><div style={{flex:1}}><span style={{fontSize:11,fontWeight:600,color:"#c0caf5"}}>{t.name}</span>
        {t.reliable&&<span style={{fontSize:8,padding:"1px 4px",borderRadius:3,background:"rgba(158,206,106,0.15)",color:"#9ece6a",marginLeft:4}}>✓</span>}
        <div style={{fontSize:10,color:"#7982a9"}}>{t.desc}</div></div></div>))}
      <button onClick={()=>openM("convenience store near me")} style={{width:"100%",marginTop:8,padding:"8px",borderRadius:8,border:"none",cursor:"pointer",
        background:"rgba(158,206,106,0.15)",color:"#9ece6a",fontSize:12,fontWeight:600}}>🗑️ Find Nearest Konbini →</button></div>
    {/* Location */}
    <div style={{background:"rgba(122,162,247,0.06)",borderRadius:14,padding:14,marginBottom:16,border:"1px solid rgba(122,162,247,0.12)"}}>
      <button onClick={getLoc} style={{width:"100%",padding:"10px",borderRadius:10,border:"none",cursor:"pointer",
        background:"rgba(122,162,247,0.15)",color:"#7aa2f7",fontSize:13,fontWeight:600}}>
        {loc?`📍 ${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`:"📍 Enable Location"}</button>
      {loc&&<button onClick={()=>{const m=`https://www.google.com/maps?q=${loc.lat},${loc.lng}`;navigator.share?navigator.share({title:"My Location",text:m}):navigator.clipboard?.writeText(m);}}
        style={{width:"100%",padding:"8px",borderRadius:8,border:"none",cursor:"pointer",background:"rgba(247,118,142,0.12)",color:"#f7768e",fontSize:12,fontWeight:600,marginTop:8}}>📤 Share Location</button>}</div>
    {/* Quick search grid */}
    <div style={{fontSize:13,color:"#9aa5ce",marginBottom:10}}>🔍 Find Nearby</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(2, 1fr)",gap:8,marginBottom:20}}>
      {qs.map((s,i)=>(<button key={i} onClick={()=>openM(s.q)} style={{padding:"14px 10px",borderRadius:12,border:"1px solid rgba(255,255,255,0.06)",
        background:"rgba(255,255,255,0.03)",cursor:"pointer",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
        <span style={{fontSize:26}}>{s.i}</span><span style={{fontSize:12,color:"#c0caf5",fontWeight:500}}>{s.l}</span></button>))}</div>
    {/* Taxi */}
    <div style={{fontSize:13,color:"#9aa5ce",marginBottom:10}}>🚖 Taxi Apps</div>
    {[{n:"GO Taxi",d:"Most popular",u:"https://go.goinc.jp/"},{n:"Uber Japan",d:"Major cities",u:"https://www.uber.com/jp/en/"},{n:"S.RIDE",d:"Tokyo area",u:"https://www.sride.jp/"}]
      .map((t,i)=>(<a key={i} href={t.u} target="_blank" rel="noopener" style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:10,marginBottom:8,
        border:"1px solid rgba(255,255,255,0.06)",background:"rgba(255,255,255,0.03)",textDecoration:"none"}}>
        <span style={{fontSize:22}}>🚖</span><div><div style={{fontSize:14,color:"#c0caf5",fontWeight:600}}>{t.n}</div><div style={{fontSize:11,color:"#7982a9"}}>{t.d}</div></div>
        <span style={{marginLeft:"auto",fontSize:12,color:"#565f89"}}>→</span></a>))}
    {/* Transit links */}
    <div style={{fontSize:13,color:"#9aa5ce",marginBottom:10,marginTop:12}}>🚃 Getting Around</div>
    {[{l:"Tokyo Metro Map",u:"https://www.tokyometro.jp/en/subwaymap/"},{l:"Hyperdia Trains",u:"https://www.hyperdia.com/"},{l:"Google Maps Transit",u:"https://www.google.com/maps/@35.68,139.65,12z"}]
      .map((t,i)=>(<a key={i} href={t.u} target="_blank" rel="noopener" style={{display:"flex",justifyContent:"space-between",alignItems:"center",
        padding:"10px 14px",borderRadius:10,border:"1px solid rgba(255,255,255,0.05)",background:"rgba(255,255,255,0.02)",textDecoration:"none",marginBottom:6}}>
        <span style={{fontSize:13,color:"#c0caf5"}}>{t.l}</span><span style={{color:"#565f89",fontSize:12}}>↗</span></a>))}
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
      <div style={{flex:1}}><div style={{padding:"8px 12px",borderRadius:8,background:"rgba(158,206,106,0.1)",color:"#9ece6a",fontSize:18,fontWeight:700,fontFamily:"monospace",
        border:"1px solid rgba(158,206,106,0.15)"}}>{d==="jpy"?"$":"¥"}{c}</div></div></div>
    <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
      {(d==="jpy"?[500,1000,3000,5000,10000]:[5,10,20,50,100]).map(x=>(<button key={x} onClick={()=>setA(String(x))} style={{padding:"4px 10px",borderRadius:6,border:"none",cursor:"pointer",
        background:"rgba(255,255,255,0.05)",color:"#9aa5ce",fontSize:11}}>{d==="jpy"?`¥${x.toLocaleString()}`:`$${x}`}</button>))}</div>
    <div style={{fontSize:10,color:"#565f89",marginTop:6}}>~¥150 = $1 (approx)</div></div>);}

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
    {sec==="shopping"?(<div style={{display:"flex",flexDirection:"column",gap:8}}>
      {items.map((s,i)=>(<div key={i} style={{padding:"12px 14px",borderRadius:12,border:"1px solid rgba(255,255,255,0.06)",background:"rgba(255,255,255,0.03)"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
          <span style={{fontSize:22}}>{s.icon}</span><div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:600,color:"#c0caf5"}}>{s.name}</div><div style={{fontSize:11,color:"#bb9af7"}}>{s.area}</div></div>
          <span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:"rgba(224,175,104,0.12)",color:"#e0af68"}}>{s.cat}</span></div>
        <div style={{fontSize:12,color:"#9aa5ce",lineHeight:1.5,marginBottom:4}}>{s.desc}</div>
        <div style={{fontSize:11,color:"#e0af68",padding:"4px 6px",background:"rgba(224,175,104,0.06)",borderRadius:4}}>💡 {s.tip}</div></div>))}
    </div>):(<div style={{display:"flex",flexDirection:"column",gap:8}}>
      {items.map((v,i)=>(<div key={i} style={{padding:"12px 14px",borderRadius:12,border:"1px solid rgba(255,255,255,0.06)",background:"rgba(255,255,255,0.03)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
          <div style={{fontSize:14,fontWeight:600,color:"#c0caf5"}}>{v.name}</div>
          <div style={{display:"flex",gap:4}}><span style={{fontSize:10,color:"#bb9af7"}}>{v.area}</span>
            <span style={{fontSize:10,padding:"1px 6px",borderRadius:4,background:"rgba(224,175,104,0.12)",color:"#e0af68"}}>{v.price}</span></div></div>
        <div style={{fontSize:12,color:"#9aa5ce",lineHeight:1.5,marginBottom:4}}>{v.desc}</div>
        <div style={{fontSize:11,color:"#7982a9",marginBottom:4}}>🕐 {v.hours}</div>
        <div style={{fontSize:11,color:"#e0af68",padding:"4px 6px",background:"rgba(224,175,104,0.06)",borderRadius:4,marginBottom:8}}>💡 {v.tip}</div>
        <a href={`https://www.google.com/maps/search/?api=1&query=${v.lat},${v.lng}`} target="_blank" rel="noopener"
          style={{display:"block",padding:"6px",borderRadius:6,textAlign:"center",background:"rgba(122,162,247,0.1)",color:"#7aa2f7",fontSize:11,textDecoration:"none",fontWeight:600}}>📍 Maps</a>
      </div>))}</div>)}
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
          <span style={{color:"#565f89",fontSize:14,transform:exp===i?"rotate(180deg)":"",transition:"0.2s"}}>▼</span></button>
        {exp===i&&(<div style={{padding:"0 14px 14px",borderTop:"1px solid rgba(255,255,255,0.04)"}}>
          <div style={{fontSize:12,color:"#e0af68",padding:"10px",marginTop:8,background:"rgba(224,175,104,0.08)",borderRadius:8}}>💡 {a.tip}</div>
          <div style={{display:"flex",gap:8,marginTop:10}}>
            <a href={`https://www.google.com/maps/search/?api=1&query=${a.lat},${a.lng}`} target="_blank" rel="noopener"
              style={{flex:1,padding:"8px",borderRadius:8,textAlign:"center",background:"rgba(122,162,247,0.15)",color:"#7aa2f7",fontSize:12,textDecoration:"none",fontWeight:600}}>📍 Maps</a>
            <a href={`https://www.google.com/search?q=${encodeURIComponent(a.name+" "+city+" Japan")}`} target="_blank" rel="noopener"
              style={{flex:1,padding:"8px",borderRadius:8,textAlign:"center",background:"rgba(158,206,106,0.15)",color:"#9ece6a",fontSize:12,textDecoration:"none",fontWeight:600}}>🔎 Info</a></div>
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
          {ch[item.id]?"✔":""}</div>
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
      <button onClick={add} style={{width:"100%",padding:"10px",borderRadius:8,border:"none",cursor:"pointer",background:"rgba(158,206,106,0.2)",color:"#9ece6a",fontSize:13,fontWeight:600}}>✔ Save</button></div>)}
    {[...ex].reverse().map(e=>(<div key={e.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,marginBottom:6,
      border:"1px solid rgba(255,255,255,0.05)",background:"rgba(255,255,255,0.02)"}}>
      <span style={{fontSize:20}}>{ci[e.c]||"📦"}</span><div style={{flex:1}}><div style={{fontSize:13,color:"#c0caf5"}}>{e.n}</div>
        <div style={{fontSize:10,color:"#7982a9"}}>{e.d}</div></div>
      <div style={{fontSize:15,fontWeight:700,color:"#fff",fontFamily:"monospace"}}>¥{e.a.toLocaleString()}</div>
      <button onClick={()=>setEx(p=>p.filter(x=>x.id!==e.id))} style={{width:24,height:24,borderRadius:"50%",border:"none",cursor:"pointer",
        background:"rgba(247,118,142,0.1)",color:"#f7768e",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button></div>))}
    {ex.length===0&&<div style={{textAlign:"center",padding:30,color:"#565f89",fontSize:13}}>No expenses yet</div>}
  </div>);}

// ━━━ AI CHAT TAB ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function ChatTab(){
  const [msgs,setMsgs]=useState([{role:"assistant",content:"こんにちは! I'm your Japan travel AI assistant. Ask me anything about your trip — restaurants, directions, cultural tips, or language help! 🇯🇵"}]);
  const [input,setInput]=useState("");const [loading,setLoading]=useState(false);const endRef=useRef(null);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);
  const send=async()=>{
    if(!input.trim()||loading)return;const userMsg=input.trim();setInput("");
    setMsgs(p=>[...p,{role:"user",content:userMsg}]);setLoading(true);
    try{
      const sysPrompt=`You are a helpful Japan travel assistant for someone visiting Kyoto (Feb 20-22) and Tokyo (Feb 22-27, 2026). Hotels: The OneFive Kyoto Shijo and the b asakusa in Tokyo. Flights: TG 682 BKK→HND Feb 19, TG 683 HND→BKK Feb 27. Be concise, practical, and friendly. Include Japanese phrases when helpful. Use emoji sparingly. Max 150 words per response.`;
      const apiMsgs=[{role:"user",content:sysPrompt+"\\n\\nConversation so far:\\n"+msgs.slice(-6).map(m=>`${m.role}: ${m.content}`).join("\\n")+"\\n\\nUser: "+userMsg}];
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:apiMsgs})});
      const data=await res.json();
      const text=data.content.map(c=>c.text||"").join("");
      setMsgs(p=>[...p,{role:"assistant",content:text}]);
    }catch(e){setMsgs(p=>[...p,{role:"assistant",content:"Sorry, I couldn't connect. Check your internet and try again."}]);}
    setLoading(false);
  };
  const quickQ=["Best ramen near my hotel?","How to use the subway?","What should I do tonight?","Translate: Where is the exit?"];
  return(<div style={{padding:"12px 16px 100px",display:"flex",flexDirection:"column",height:"calc(100vh - 140px)"}}>
    <h2 style={{fontSize:16,color:"#9aa5ce",fontWeight:400,marginBottom:12}}>🤖 Japan AI Assistant</h2>
    {/* Quick questions */}
    {msgs.length<=1&&(<div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
      {quickQ.map((q,i)=>(<button key={i} onClick={()=>{setInput(q);}} style={{padding:"6px 12px",borderRadius:20,border:"1px solid rgba(122,162,247,0.15)",
        background:"rgba(122,162,247,0.06)",color:"#7aa2f7",fontSize:11,cursor:"pointer"}}>{q}</button>))}</div>)}
    {/* Messages */}
    <div style={{flex:1,overflowY:"auto",marginBottom:12,display:"flex",flexDirection:"column",gap:8}}>
      {msgs.map((m,i)=>(<div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
        <div style={{maxWidth:"85%",padding:"10px 14px",borderRadius:m.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",
          background:m.role==="user"?"rgba(122,162,247,0.15)":"rgba(255,255,255,0.04)",
          border:`1px solid ${m.role==="user"?"rgba(122,162,247,0.2)":"rgba(255,255,255,0.06)"}`,
          fontSize:13,color:m.role==="user"?"#c0caf5":"#9aa5ce",lineHeight:1.6,whiteSpace:"pre-wrap"}}>{m.content}</div></div>))}
      {loading&&<div style={{display:"flex",justifyContent:"flex-start"}}><div style={{padding:"10px 14px",borderRadius:"14px 14px 14px 4px",
        background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)",fontSize:13,color:"#565f89"}}>Thinking...</div></div>}
      <div ref={endRef}/></div>
    {/* Input */}
    <div style={{display:"flex",gap:8,position:"sticky",bottom:70}}>
      <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()}
        placeholder="Ask anything about Japan..." style={{flex:1,padding:"12px 14px",borderRadius:12,border:"1px solid rgba(255,255,255,0.1)",
        background:"rgba(0,0,0,0.3)",color:"#c0caf5",fontSize:14,outline:"none"}}/>
      <button onClick={send} disabled={loading} style={{padding:"0 20px",borderRadius:12,border:"none",cursor:"pointer",
        background:loading?"rgba(122,162,247,0.1)":"rgba(122,162,247,0.2)",color:"#7aa2f7",fontSize:16,fontWeight:700}}>
        {loading?"⏳":"→"}</button></div>
  </div>);}

function CultureTab(){return(<div style={{padding:"12px 16px 100px"}}>
  <div style={{background:"rgba(158,206,106,0.06)",borderRadius:14,padding:14,marginBottom:16,border:"1px solid rgba(158,206,106,0.1)"}}>
    <div style={{fontSize:14,color:"#9ece6a",fontWeight:600,marginBottom:4}}>🇯🇵 Respect & Harmony</div>
    <div style={{fontSize:12,color:"#9aa5ce",lineHeight:1.6}}>Japanese culture values 和 (wa) — harmony. Being polite, quiet, and respectful goes a long way. A bow and "arigatou gozaimasu" is always appreciated.</div></div>
  <div style={{display:"flex",flexDirection:"column",gap:8}}>
    {ETIQUETTE.map((e,i)=>(<div key={i} style={{padding:"12px 14px",borderRadius:10,border:"1px solid rgba(255,255,255,0.05)",background:"rgba(255,255,255,0.02)"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><span style={{fontSize:22}}>{e.icon}</span>
        <span style={{fontSize:14,color:"#c0caf5",fontWeight:600}}>{e.title}</span></div>
      <div style={{fontSize:12,color:"#9aa5ce",lineHeight:1.6,paddingLeft:30}}>{e.text}</div></div>))}</div></div>);}

function SOSTab(){return(<div style={{padding:"12px 16px 100px"}}>
  <div style={{textAlign:"center",marginBottom:20}}>
    <a href="tel:110" style={{display:"inline-flex",width:120,height:120,borderRadius:"50%",alignItems:"center",justifyContent:"center",textDecoration:"none",
      background:"radial-gradient(circle, #f7768e 0%, #db4b4b 100%)",boxShadow:"0 0 40px rgba(247,118,142,0.3)",
      border:"3px solid rgba(255,255,255,0.15)",fontSize:18,fontWeight:800,color:"#fff",letterSpacing:3}}>SOS</a>
    <div style={{fontSize:11,color:"#7982a9",marginTop:8}}>Tap to call Police (110)</div></div>
  <div style={{fontSize:13,color:"#f7768e",marginBottom:10,fontWeight:600}}>Emergency Contacts</div>
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
      <div style={{fontSize:17,color:"#fff",fontFamily:"'Noto Serif JP', serif",marginTop:2}}>{p.ja}</div>
      <div style={{fontSize:11,color:"#7aa2f7",marginTop:1}}>{p.rom}</div></div>
    <span style={{fontSize:20}}>🔊</span></button>))}
  <div style={{marginTop:16,padding:14,borderRadius:12,background:"rgba(224,175,104,0.06)",border:"1px solid rgba(224,175,104,0.12)"}}>
    <div style={{fontSize:13,color:"#e0af68",fontWeight:600,marginBottom:8}}>📋 Good to Know</div>
    <div style={{fontSize:12,color:"#9aa5ce",lineHeight:1.8}}>
      • Japan is extremely safe — stay aware in crowded areas<br/>
      • Police boxes (交番 kōban) are everywhere — they help with directions too<br/>
      • Keep a photo of your passport and hotel address on your phone<br/>
      • Your hotel front desk can assist with most emergencies</div></div></div>);}

// ━━━ MAIN APP ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function JapanTravelAssistant(){
  const [tab,setTab]=useState("trip");
  return(<div style={{minHeight:"100vh",background:"#1a1a2e",color:"#c0caf5",fontFamily:"'Noto Sans JP', -apple-system, sans-serif",maxWidth:480,margin:"0 auto",position:"relative"}}>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;600;700&family=Noto+Serif+JP:wght@400;600&display=swap');
      @keyframes pulse{0%,100%{transform:scale(1);box-shadow:0 0 0 0 rgba(247,118,142,0.4);}50%{transform:scale(1.05);box-shadow:0 0 0 12px rgba(247,118,142,0);}}
      *{box-sizing:border-box;margin:0;padding:0;}::-webkit-scrollbar{width:0;}body{background:#1a1a2e;}
      input::placeholder{color:#565f89;}button:active{opacity:0.8;}a:active{opacity:0.8;}
    `}</style>
    <Header/>
    {tab==="trip"&&<TripTab/>}
    {tab==="planner"&&<PlannerTab/>}
    {tab==="translate"&&<TranslateTab/>}
    {tab==="explore"&&<ExploreTab/>}
    {tab==="nightlife"&&<NightlifeTab/>}
    {tab==="places"&&<PlacesTab/>}
    {tab==="pack"&&<PackTab/>}
    {tab==="expense"&&<ExpenseTab/>}
    {tab==="chat"&&<ChatTab/>}
    {tab==="sos"&&<SOSTab/>}
    <TabBar active={tab} setActive={setTab}/>
  </div>);}
