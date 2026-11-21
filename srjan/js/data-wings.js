/* Srjan: Architecture and Design wings (demo content).
   Photographs load live from Wikipedia / Wikimedia Commons under their own open licences.
   Credit and licence for each image are on its Wikimedia source page ("Learn more" in the viewer).
   Stories are written from general knowledge and should be fact-checked before launch. */

window.WINGS.forEach(w => { w.ready = true; });

window.ROOMS.push(
  { id: "Historic Interiors", wing: "Spaces", fit: "cover", name: "Historic Interiors", years: "1600 to 1900",
    blurb: "Rooms designed as a whole: walls, light, furniture and the art inside them." },
  { id: "Indian Heritage", wing: "Spaces", fit: "cover", name: "Landmarks of India", years: "3rd century BCE to 1924",
    blurb: "Temples, tombs, palaces and railway stations that shaped how India looks." },
  { id: "Wonders of the World", wing: "Spaces", hidden: true, fit: "cover", name: "Wonders of the World", years: "5th century BCE to 1889",
    blurb: "Landmarks from antiquity to the age of iron, seen as designs: structure, light and ambition." },
  { id: "Objects and Furniture", wing: "Design", fit: "cover", name: "Objects and Furniture", years: "1700 to 1920",
    blurb: "Chairs, lamps and treasures where the way a thing is made becomes its beauty." },
  { id: "Pattern and Craft", wing: "Design", fit: "cover", name: "Pattern and Craft", years: "1500 to 1900",
    blurb: "Textiles and metalwork where a repeating pattern carries a whole culture." }
);

Object.assign(window.ARTISTS, {
  /* architecture */
  lahori:   { n: "Ustad Ahmad Lahori", life: "about 1580 to 1649", from: "Mughal India",
    bio: "Chief architect at the court of Shah Jahan, traditionally credited with the design of the Taj Mahal and the Red Fort in Delhi. Written records of Mughal architects are thin, so some attributions are still debated." },
  mirak:    { n: "Mirak Mirza Ghiyas", life: "16th century", from: "Herat and Delhi",
    bio: "A Persian architect brought to India by the Mughals. He designed Humayun's Tomb, the first great garden tomb of the subcontinent." },
  lalchand: { n: "Lal Chand Ustad", life: "18th century", from: "Jaipur, India",
    bio: "The architect of the Hawa Mahal, built for Maharaja Sawai Pratap Singh of Jaipur in 1799." },
  ganga:    { n: "Eastern Ganga builders", life: "11th to 15th century", from: "Odisha, India",
    bio: "The royal workshops of the Eastern Ganga dynasty, who built the great temples of Odisha in carved stone." },
  chola:    { n: "Chola builders", life: "9th to 13th century", from: "Tamil Nadu, India",
    bio: "The temple architects and sculptors of the Chola kings, masters of granite and of the towering vimana." },
  maurya:   { n: "Mauryan and Satavahana builders", life: "3rd century BCE onward", from: "Central India",
    bio: "The builders of the early Buddhist monuments of central India, from Ashoka's stupa to its carved gateways." },
  nayak:    { n: "Madurai Nayak builders", life: "16th to 17th century", from: "Tamil Nadu, India",
    bio: "The Nayak rulers of Madurai rebuilt and expanded the great temple city with towering painted gateways." },
  stevens:  { n: "F. W. Stevens", life: "1847 to 1900", from: "England and India", pw: "Frederick William Stevens",
    bio: "British architect in Bombay who designed Victoria Terminus, now Chhatrapati Shivaji Terminus, blending Gothic Revival with Indian palace motifs." },
  wittet:   { n: "George Wittet", life: "1878 to 1926", from: "Scotland and India", pw: "George Wittet",
    bio: "Consulting architect to the Government of Bombay and a leading figure of the Indo Saracenic style." },
  aibak:    { n: "Qutb ud Din Aibak", life: "died 1210", from: "Delhi Sultanate",
    bio: "The first Sultan of Delhi, who began the Qutb Minar and the mosque beside it." },
  greek:    { n: "Iktinos and Kallikrates", life: "5th century BCE", from: "Athens",
    bio: "The architects of the Parthenon, working under the statesman Pericles, with the sculptor Phidias directing its carved decoration." },
  roman:    { n: "Roman builders", life: "1st to 2nd century CE", from: "Rome",
    bio: "Roman engineers who made concrete the material of monumental architecture, from the Colosseum to the Pantheon." },
  anthemius:{ n: "Anthemius and Isidore", life: "6th century", from: "Byzantium",
    bio: "A mathematician and a physicist, the unlikely architects of Hagia Sophia for the emperor Justinian." },
  nasrid:   { n: "Nasrid builders", life: "13th to 15th century", from: "Granada, Spain",
    bio: "The craftsmen of the last Muslim dynasty in Spain, who made the Alhambra from plaster, tile, wood and water." },
  khmer:    { n: "Khmer builders", life: "9th to 15th century", from: "Cambodia",
    bio: "The architects of the Khmer empire, who built vast temple cities in sandstone around Angkor." },
  gothic:   { n: "Gothic master masons", life: "12th to 14th century", from: "France",
    bio: "The anonymous masons and carpenters who raised the great cathedrals of medieval Europe." },
  eiffel:   { n: "Gustave Eiffel", life: "1832 to 1923", from: "France", pw: "Gustave Eiffel",
    bio: "French engineer whose company built bridges, viaducts and the tower that bears his name. The tower's first design came from his engineers Maurice Koechlin and Émile Nouguier." },
  nabataean:{ n: "Nabataean builders", life: "1st century BCE to 1st century CE", from: "Petra, Jordan",
    bio: "A trading people of the desert who carved a city, its tombs and its temples straight out of rose red sandstone cliffs." },
  inca:     { n: "Inca builders", life: "15th century", from: "Peru",
    bio: "Master stonemasons of the Andes, who fitted massive blocks together without mortar." },
  /* design */
  thonet:   { n: "Michael Thonet", life: "1796 to 1871", from: "Germany and Austria", pw: "Michael Thonet",
    bio: "Cabinetmaker who perfected bending beech wood with steam, and so made well designed furniture cheap enough for everyone." },
  tiffany:  { n: "Louis Comfort Tiffany", life: "1848 to 1933", from: "USA", pw: "Louis Comfort Tiffany",
    bio: "American artist and designer who built a studio around coloured glass, from windows to lamps." },
  faberge:  { n: "Peter Carl Fabergé", life: "1846 to 1920", from: "Russia", pw: "Peter Carl Fabergé",
    bio: "Court jeweller to the Russian tsars, famous for the jewelled Imperial Easter eggs." },
  shakers:  { n: "The Shakers", life: "18th to 19th century", from: "United States",
    bio: "A religious community whose plain, useful furniture still looks modern two centuries later." },
  ming:     { n: "Ming workshops", life: "1368 to 1644", from: "China",
    bio: "The cabinetmakers of the Ming dynasty, who built elegant furniture from hardwood using joinery instead of nails." },
  morris:   { n: "William Morris", life: "1834 to 1896", from: "England", pw: "William Morris",
    bio: "Designer, poet and socialist who led the Arts and Crafts movement and filled English homes with patterns drawn from gardens." },
  kashmiri: { n: "Kashmiri weavers", life: "17th to 19th century", from: "Kashmir, India",
    bio: "Master weavers who made fine shawls from the wool of Himalayan goats, on small looms with many hands at work." },
  bidri:    { n: "Bidri artisans", life: "14th century onward", from: "Bidar, Karnataka",
    bio: "Metalworkers of the Deccan who inlay silver into a blackened alloy, a craft that grew up at the court of the Bahmani sultans." },
  phulkari: { n: "Punjabi women embroiderers", life: "centuries old tradition", from: "Punjab",
    bio: "Women who stitched phulkari ('flower work') in silk floss on cotton, often as gifts for a daughter's wedding." },
  chikan:   { n: "Lucknow chikan artisans", life: "centuries old tradition", from: "Lucknow, India",
    bio: "Craftspeople who work delicate white thread embroidery on fine cloth, the hallmark of Lucknow." },
  jamdani:  { n: "Bengal jamdani weavers", life: "centuries old tradition", from: "Bengal",
    bio: "Weavers who build figured patterns thread by thread into the cloth on the loom itself." }
});

window.PAINTINGS.push(
  /* ---------- Architecture: Indian Heritage ---------- */
  { t: "Taj Mahal", a: "lahori", y: "1632 to 1653", med: "White marble inlaid with semiprecious stones", loc: "Agra, India", mv: "Indian Heritage", w: "Taj Mahal",
    s: "Emperor Shah Jahan commissioned it as a tomb for his wife Mumtaz Mahal, who died in 1631. Some 20,000 craftsmen are said to have worked on it for about two decades. The four minarets lean slightly outward, so that in an earthquake they would fall away from the tomb. The marble seems to change colour through the day, pale at dawn, white at noon, gold at sunset." },
  { t: "Humayun's Tomb", a: "mirak", y: "1565 to 1572", med: "Red sandstone and white marble", loc: "Delhi, India", mv: "Indian Heritage", w: "Humayun's Tomb",
    s: "Built for the second Mughal emperor by his widow Bega Begum, it was the first great garden tomb in India. Its double dome, high arches and garden divided into four parts were the model for the Taj Mahal, built about sixty years later." },
  { t: "Hawa Mahal", a: "lalchand", y: "1799", med: "Red and pink sandstone", loc: "Jaipur, India", mv: "Indian Heritage", w: "Hawa Mahal",
    s: "Its front, five storeys high, is pierced by 953 small windows. Royal women could watch street processions from behind the screens without being seen, while the breeze passing through kept the rooms cool. Despite its palace look, it is really a façade only one room deep." },
  { t: "Konark Sun Temple", a: "ganga", y: "about 1250", med: "Khondalite stone", loc: "Odisha, India", mv: "Indian Heritage", w: "Konark Sun Temple",
    s: "The temple is designed as a colossal chariot of the sun god Surya, with 24 carved wheels pulled by seven horses. The wheels double as sundials that can still tell the time. It is a UNESCO World Heritage Site." },
  { t: "Brihadisvara Temple", a: "chola", y: "1010", med: "Granite", loc: "Thanjavur, Tamil Nadu", mv: "Indian Heritage", w: "Brihadisvara Temple, Thanjavur",
    s: "Completed in 1010 by the Chola king Rajaraja I, its tower rises about 66 metres. The huge capstone is traditionally said to weigh around 80 tonnes, and the tower is said to stand without any binding material. Its walls are covered in sculpture and inscription." },
  { t: "Great Stupa at Sanchi", a: "maurya", y: "3rd century BCE onward", med: "Stone and brick", loc: "Madhya Pradesh, India", mv: "Indian Heritage", w: "Sanchi",
    s: "Begun under the emperor Ashoka, the Great Stupa is among the oldest stone structures in India. Its four carved gateways were added later and tell the stories of the Buddha in crowded, lively relief." },
  { t: "Meenakshi Amman Temple", a: "nayak", y: "17th century rebuilding", med: "Granite, brick and stucco", loc: "Madurai, Tamil Nadu", mv: "Indian Heritage", w: "Meenakshi Temple",
    s: "A walled temple city with fourteen towering gateways, the tallest rising about 50 metres, every inch crowded with painted figures. It was largely rebuilt in its present form under the Nayak rulers and is still a living centre of worship." },
  { t: "Chhatrapati Shivaji Terminus", a: "stevens", y: "1888", med: "Stone and brick", loc: "Mumbai, India", mv: "Indian Heritage", w: "Chhatrapati Shivaji Terminus",
    s: "Designed as Victoria Terminus, this railway station mixes Victorian Gothic Revival with Indian palace domes, turrets and carved animals. A UNESCO World Heritage Site, it is still one of the busiest stations in the world." },
  { t: "Gateway of India", a: "wittet", y: "1924", med: "Basalt", loc: "Mumbai, India", mv: "Indian Heritage", w: "Gateway of India",
    s: "An arch on Mumbai's waterfront, built to mark the 1911 visit of King George V and Queen Mary. George Wittet drew on the architecture of Gujarat for its Indo Saracenic design." },
  { t: "Qutb Minar", a: "aibak", y: "from 1199", med: "Red sandstone and marble", loc: "Delhi, India", mv: "Indian Heritage", w: "Qutb Minar",
    s: "Begun by Qutb ud Din Aibak and finished by his successors, the tower rises about 73 metres in five storeys, each ringed with balconies and carved bands of calligraphy. It stands beside one of the earliest mosques in India." },

  /* ---------- Architecture: Wonders of the World ---------- */
  { t: "The Parthenon", a: "greek", y: "447 to 432 BCE", med: "Pentelic marble", loc: "Athens, Greece", mv: "Wonders of the World", w: "Parthenon",
    s: "A temple to Athena on the Acropolis. Its columns swell slightly and its base curves upward so that, to the eye, everything looks perfectly straight. Much of its sculpture is now in museums, but the building still defines classical architecture." },
  { t: "The Pantheon", a: "roman", y: "about 125 CE", med: "Concrete and brick", loc: "Rome, Italy", mv: "Wonders of the World", w: "Pantheon, Rome",
    s: "Its dome is 43 metres wide and remains the largest unreinforced concrete dome in the world. At the top, a circular opening called the oculus, about eight metres across, lets in a moving disc of sunlight and sometimes rain." },
  { t: "The Colosseum", a: "roman", y: "70 to 80 CE", med: "Travertine, tuff and concrete", loc: "Rome, Italy", mv: "Wonders of the World", w: "Colosseum",
    s: "Begun by the emperor Vespasian and opened under his son Titus, it could hold some 50,000 spectators. Eighty numbered entrances and a system of stairways let crowds fill and empty it with surprising speed." },
  { t: "Hagia Sophia", a: "anthemius", y: "532 to 537", med: "Brick, stone and marble", loc: "Istanbul, Turkey", mv: "Wonders of the World", w: "Hagia Sophia",
    s: "Built for the emperor Justinian in just five years, it was the largest cathedral in the world for nearly a thousand years. A ring of windows at the base of the dome makes the great canopy seem to float on light." },
  { t: "The Alhambra", a: "nasrid", y: "13th to 14th century", med: "Plaster, tile, wood and water", loc: "Granada, Spain", mv: "Wonders of the World", w: "Alhambra",
    s: "A palace city on a hill, famous for its courtyards with still pools, carved plaster as fine as lace and honeycomb ceilings. Poetry runs across its walls as decoration." },
  { t: "Angkor Wat", a: "khmer", y: "early 12th century", med: "Sandstone", loc: "Cambodia", mv: "Wonders of the World", w: "Angkor Wat",
    s: "Built under King Suryavarman II as a temple to Vishnu, it is the largest religious monument in the world. Its five towers represent the peaks of Mount Meru, and its galleries are carved with long scenes from the great epics." },
  { t: "Notre Dame de Paris", a: "gothic", y: "1163 to 1345", med: "Limestone", loc: "Paris, France", mv: "Wonders of the World", w: "Notre-Dame de Paris",
    s: "A masterpiece of French Gothic, with flying buttresses that let its walls rise high and fill with stained glass. After the fire of 2019 it was rebuilt by craftspeople using traditional methods and reopened in 2024." },
  { t: "The Eiffel Tower", a: "eiffel", y: "1887 to 1889", med: "Wrought iron", loc: "Paris, France", mv: "Wonders of the World", w: "Eiffel Tower",
    s: "Built as the entrance arch to the 1889 World's Fair, it was meant to stand for twenty years. At about 300 metres it was the tallest structure in the world until 1930. Its open iron lattice lets the wind pass straight through." },
  { t: "Al Khazneh, Petra", a: "nabataean", y: "1st century", med: "Sandstone cut from the living rock", loc: "Petra, Jordan", mv: "Wonders of the World", w: "Al-Khazneh",
    s: "Carved directly into a rose coloured cliff, its façade is about 40 metres high. Visitors reach it by a narrow canyon that suddenly opens onto the glowing front, which is why it is often called the Treasury." },
  { t: "Machu Picchu", a: "inca", y: "about 1450", med: "Granite, laid without mortar", loc: "Cusco Region, Peru", mv: "Wonders of the World", w: "Machu Picchu",
    s: "An Inca estate high in the Andes. Its walls are built of carefully cut blocks that fit together without mortar, and its terraces follow the mountain. It was never found by the Spanish and was little known outside Peru until 1911." },

  /* ---------- Design: Objects and Furniture ---------- */
  { t: "Chair No. 14", a: "thonet", y: "1859", med: "Bent beech wood", loc: "Vienna, Austria", mv: "Objects and Furniture", w: "Chair No. 14", q: "Thonet chair No. 14 bentwood",
    s: "Made from six pieces of wood bent with steam, ten screws and two nuts. It could be shipped flat: 36 dismantled chairs fitted into a crate one cubic metre in size. By 1930 tens of millions had been sold, making it one of the most successful designs ever." },
  { t: "Tiffany Wisteria Lamp", a: "tiffany", y: "about 1901", med: "Leaded glass and bronze", loc: "New York, USA", mv: "Objects and Furniture", w: "Tiffany lamp", q: "Tiffany wisteria lamp",
    s: "Hundreds of cut pieces of coloured glass form a canopy of flowers that glows when lit. Many of the best known lamps are now credited to Clara Driscoll, who led the Tiffany studio's women's glass cutting department." },
  { t: "Fabergé Hen Egg", a: "faberge", y: "1885", med: "Gold and enamel", loc: "Saint Petersburg, Russia", mv: "Objects and Furniture", w: "Fabergé egg", q: "Faberge Hen egg 1885",
    s: "The first of the Imperial Easter eggs, made for Tsar Alexander III to give to his wife. Its plain white shell opens to reveal a golden yolk, and inside that a tiny hen. It set off a tradition of surprise that lasted until 1917." },
  { t: "Shaker Furniture", a: "shakers", y: "18th to 19th century", med: "Pine, maple and cherry", loc: "United States", mv: "Objects and Furniture", w: "Shaker furniture", q: "Shaker chair ladder back",
    s: "The Shakers made furniture without ornament because they believed beauty followed usefulness. Rows of wooden pegs along the walls let them hang chairs out of the way for sweeping. The restraint of their work still looks modern." },
  { t: "Chinese Hardwood Furniture", a: "ming", y: "Ming dynasty, 1368 to 1644", med: "Huanghuali and other hardwoods", loc: "China", mv: "Objects and Furniture", w: "Chinese furniture", q: "Ming dynasty chair huanghuali",
    s: "Ming craftsmen built chairs, tables and cabinets from dense tropical hardwoods using joinery alone, with no nails. Their clean lines and curves later inspired designers in Europe and America." },

  /* ---------- Design: Pattern and Craft ---------- */
  { t: "Strawberry Thief", a: "morris", y: "1883", med: "Indigo discharge woodblock print on cotton", loc: "Merton Abbey, England", mv: "Pattern and Craft", w: "Strawberry Thief", q: "William Morris Strawberry Thief",
    s: "Morris was inspired by thrushes stealing fruit from his kitchen garden. He printed it by an old method called indigo discharge, which took so long to master that it was one of the hardest designs he ever made." },
  { t: "Kashmir Shawl", a: "kashmiri", y: "17th to 19th century", med: "Fine pashmina wool", loc: "Kashmir, India", mv: "Pattern and Craft", w: "Kashmir shawl", q: "Kashmir shawl antique boteh",
    s: "Woven in twill on small looms by teams of weavers, a single shawl could take years. Its boteh motif, shaped like a leaf, travelled to Europe, where Scottish mills copied it so successfully that we now call the pattern paisley, after a town in Scotland." },
  { t: "Bidriware", a: "bidri", y: "14th century onward", med: "Zinc and copper alloy with silver inlay", loc: "Bidar, Karnataka", mv: "Pattern and Craft", w: "Bidriware", q: "Bidriware silver inlay",
    s: "A blackened metal surface is engraved and inlaid with silver, so that the bright pattern stands out as if drawn in moonlight. Craftsmen in Bidar traditionally darken the alloy with the soil of the old fort." },
  { t: "Phulkari", a: "phulkari", y: "centuries old tradition", med: "Silk floss on cotton", loc: "Punjab", mv: "Pattern and Craft", w: "Phulkari", q: "Phulkari embroidery Punjab",
    s: "Phulkari means flower work. Women stitched it counting the threads of the cloth, covering it in flat silk stitches of bright colour. Mothers and grandmothers often made them as gifts for a daughter's wedding." },
  { t: "Chikankari", a: "chikan", y: "centuries old tradition", med: "Thread embroidery on fine cloth", loc: "Lucknow, Uttar Pradesh", mv: "Pattern and Craft", w: "Chikankari", q: "Chikankari embroidery Lucknow",
    s: "White on white embroidery in dozens of stitches, from tiny knots to open lattice. Worked on fine cotton or muslin, it is the quiet counterpart to the bright textiles of other regions." },
  { t: "Jamdani", a: "jamdani", y: "centuries old tradition", med: "Handwoven cotton muslin", loc: "Bengal", mv: "Pattern and Craft", w: "Jamdani", q: "Jamdani sari weaving",
    s: "The pattern is not printed or embroidered but woven into the cloth on the loom, one small motif at a time by two weavers working together. A single sari can take months." }
);

window.EXHIBITIONS.unshift({
  id: "the-mughal-eye", title: "The Mughal Eye", thread: true, by: "Srjan Curators", tagline: "One court, seen as a tomb, a painting and a shawl.",
  text: "Mughal taste ran through everything. The marble of a tomb, the allegory in a court painting and the pattern in a shawl all come from the same eye for symmetry, gardens and fine detail. Walk through them side by side to see how art, spaces and design shared one language.",
  works: ["Taj Mahal", "Humayun's Tomb", "Jahangir Preferring a Sufi Shaikh to Kings", "Kashmir Shawl"]
});


/* ---------- Historic interiors (Spaces) ---------- */
Object.assign(window.ARTISTS, {
  kachwaha: { n: "Kachwaha court builders", life: "16th to 17th century", from: "Amer, Rajasthan",
    bio: "The masons and craftsmen of the Kachwaha rulers of Amer, who built the palace and fort above what is now Jaipur." },
  hardouin: { n: "Jules Hardouin Mansart", life: "1646 to 1708", from: "France", pw: "Jules Hardouin Mansart",
    bio: "Chief architect to Louis XIV, who enlarged the Palace of Versailles and designed its Hall of Mirrors." },
  webb:     { n: "Philip Webb", life: "1831 to 1915", from: "England", pw: "Philip Webb",
    bio: "Architect and a founding figure of the Arts and Crafts movement. He built Red House for his friend William Morris." },
  katsura:  { n: "Katsura builders", life: "17th century", from: "Kyoto, Japan",
    bio: "The carpenters and garden makers who built the princely villa at Katsura for the Hachijo princes." },
  soane:    { n: "John Soane", life: "1753 to 1837", from: "England", pw: "John Soane",
    bio: "English architect of the Bank of England, who remodelled his own London home into one of the most inventive interiors ever made." }
});
window.PAINTINGS.push(
  { t: "Sheesh Mahal, Amer Fort", a: "kachwaha", y: "17th century", med: "Mirror mosaic on plaster", loc: "Amer Fort, Jaipur, India", mv: "Historic Interiors", q: "Sheesh Mahal Amer Fort interior mirror",
    s: "Thousands of small mirrors are set into the walls and ceiling of this hall in the palace at Amer. It is traditionally said that a few candles were enough to fill the room with what looked like a sky of stars. The mirror work is combined with painted flowers and carved marble." },
  { t: "Hall of Mirrors", a: "hardouin", y: "1678 to 1684", med: "Mirror glass, gilded stucco and a painted ceiling", loc: "Palace of Versailles, France", mv: "Historic Interiors", w: "Hall of Mirrors",
    s: "A gallery 73 metres long, with seventeen arched windows facing seventeen arches of mirror, so that the garden seems to continue endlessly inside. The painted ceiling is by Charles Le Brun. In 1919 the Treaty of Versailles was signed here." },
  { t: "Red House", a: "webb", y: "1859 to 1860", med: "Red brick and tile", loc: "Bexleyheath, London", mv: "Historic Interiors", w: "Red House, Bexleyheath",
    s: "Philip Webb designed it for William Morris and his wife Jane. Morris and friends, including the painter Edward Burne Jones, decorated the rooms themselves with murals, furniture and embroidery. The experience led Morris to start his own decorating firm, and the house is often called a starting point of the Arts and Crafts movement." },
  { t: "Katsura Imperial Villa", a: "katsura", y: "1615 to 1663", med: "Wood, paper screens and tatami", loc: "Kyoto, Japan", mv: "Historic Interiors", w: "Katsura Imperial Villa",
    s: "A princely villa laid out around a pond, with tea houses and a garden you walk through. Its sliding paper screens open rooms to the landscape. In the 1930s European modernists such as Bruno Taut praised its plain beauty, and its influence on modern design is still discussed." },
  { t: "Sir John Soane's Museum", a: "soane", y: "1792 to 1824", med: "Brick, plaster, glass and mirrors", loc: "London, England", mv: "Historic Interiors", w: "Sir John Soane's Museum",
    s: "The architect Sir John Soane remodelled his own London house as a home and a teaching collection, filling it with antiquities, models and paintings. He used skylights, mirrors and hinged panels so that every wall could hold more art. He arranged for it to be kept as a museum after his death." }
);
(function () {   /* keep Historic Interiors first among the Spaces rooms */
  const R = window.ROOMS, i = R.findIndex(r => r.id === 'Historic Interiors'), j = R.findIndex(r => r.id === 'Indian Heritage');
  if (i > j) { const [x] = R.splice(i, 1); R.splice(j, 0, x); }
})();

/* ---------- Connected works: [work, work, why] (links run both ways) ---------- */
window.LINKS = [
  ["Taj Mahal", "Humayun's Tomb", "The garden tomb it grew from"],
  ["Taj Mahal", "Jahangir Preferring a Sufi Shaikh to Kings", "Painted at the court of Shah Jahan's father"],
  ["Taj Mahal", "Kashmir Shawl", "The same court taste for flowers and fine detail"],
  ["Gateway of India", "Chhatrapati Shivaji Terminus", "Mumbai's Indo Saracenic and Gothic landmarks"],
  ["Hawa Mahal", "Bani Thani", "Rajasthan's courts, in stone and in paint"],
  ["Strawberry Thief", "Red House", "Morris and his friends decorated its rooms"],
  ["Strawberry Thief", "Tiffany Wisteria Lamp", "A craft revival on both sides of the Atlantic"],
  ["Chair No. 14", "Shaker Furniture", "Plain, useful and made to be copied"],
  ["Hall of Mirrors", "Sheesh Mahal, Amer Fort", "Two halls of mirrors, a world apart"],
  ["Sheesh Mahal, Amer Fort", "Tiffany Wisteria Lamp", "Light turned into decoration"],
  ["Katsura Imperial Villa", "Shaker Furniture", "Beauty through restraint"],
  ["Madhubani Painting", "Phulkari", "Folk traditions carried by women"],
  ["Madhubani Painting", "Chikankari", "Folk traditions carried by women"]
];

/* ---------- Threads: one theme across art, spaces and design ---------- */
window.EXHIBITIONS.splice(1, 0,
  { id: "thread-blue", title: "Blue", thread: true, by: "Srjan Curators", tagline: "One colour across art and design.",
    text: "Prussian blue in a Japanese print, lapis ultramarine in a Dutch turban, a midnight sky in France and indigo on an English wallpaper. Blue was hard to make and costly, and each of these makers solved it in a different way.",
    works: ["The Great Wave off Kanagawa", "Girl with a Pearl Earring", "The Starry Night", "Strawberry Thief"] },
  { id: "thread-lamplight", title: "Lamplight", thread: true, by: "Srjan Curators", tagline: "Four makers who treated light as the main material.",
    text: "A gaslit café, a beam through a tavern window, a glass lamp and a hall of mirrors lit by a few candles. Each uses a small light to build a whole room.",
    works: ["Café Terrace at Night", "The Calling of Saint Matthew", "Tiffany Wisteria Lamp", "Sheesh Mahal, Amer Fort"] },
  { id: "thread-pattern", title: "Pattern Everywhere", thread: true, by: "Srjan Curators", tagline: "A village wall, a palace, a printed cotton and a woven shawl.",
    text: "Repeating pattern is how people have decorated nearly everything they touch. These four show four cultures doing it in four ways, from painted walls to carved plaster to woven wool.",
    works: ["Madhubani Painting", "The Alhambra", "Strawberry Thief", "Kashmir Shawl"] }
);

/* ---------- The walk: one guided tour that crosses all three wings ---------- */
window.WALK = ["Hamsa Damayanti", "Hawa Mahal", "Kashmir Shawl", "Bani Thani", "Hall of Mirrors", "Tiffany Wisteria Lamp", "The Starry Night", "Red House", "Strawberry Thief", "The Great Wave off Kanagawa"];
