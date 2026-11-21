/* Srjan: more of Spaces, Design and Indian art (open-licence demo content).
   Photographs load live from Wikipedia / Wikimedia Commons; each work links to its source page for the credit and licence.
   Stories are written from general knowledge and hedged where facts are disputed. Fact-check before launch. */

window.ROOMS.push(
  { id: "Homes of India", wing: "Spaces", fit: "cover", name: "Homes of India", years: "16th century to 1912",
    blurb: "Havelis, wooden palaces, courtyard houses and round mud homes: how India has built places to live." },
  { id: "Handmade India", wing: "Design", fit: "cover", name: "Handmade India", years: "ancient to present",
    blurb: "Toys, pottery, metal and cloth where a place and its materials decide the design." }
);

Object.assign(window.ARTISTS, {
  /* spaces */
  safavid:  { n: "Safavid builders", life: "16th to 18th century", from: "Isfahan, Iran",
    bio: "The architects and tile makers of the Safavid shahs, who made Isfahan a city of domes, gardens and glazed tile." },
  jaisalmer:{ n: "Jaisalmer masons", life: "19th century", from: "Jaisalmer, Rajasthan",
    bio: "Stone carvers of the desert city, who worked golden sandstone as finely as wood for merchant families." },
  travancore:{ n: "Travancore royal carpenters", life: "16th to 18th century", from: "Kerala and Tamil Nadu",
    bio: "The master carpenters of the Travancore kings, skilled in teak joinery and carved ceilings." },
  kochi:    { n: "Kochi royal builders", life: "16th to 17th century", from: "Kochi, Kerala",
    bio: "Portuguese and then Dutch builders working with local craftspeople for the rajas of Kochi." },
  keralahouse:{ n: "Kerala carpenters", life: "traditional craft", from: "Kerala, India",
    bio: "House builders who follow the old rules of proportion and orientation, joining timber without nails." },
  kutch:    { n: "Kutch mud house builders", life: "traditional craft", from: "Kutch, Gujarat",
    bio: "Communities who build and decorate round mud houses, with women often shaping the relief work and mirror decoration." },
  irwin:    { n: "Henry Irwin", life: "1841 to 1922", from: "Ireland and India",
    bio: "British architect who designed Mysore Palace and other Indo Saracenic buildings in South India." },
  chisholm: { n: "Robert Fellowes Chisholm", life: "1840 to 1915", from: "England and India",
    bio: "British architect in Madras and a leading figure of the Indo Saracenic style, who designed Laxmi Vilas Palace in Vadodara." },
  chettiar: { n: "Chettiar merchant builders", life: "19th to 20th century", from: "Chettinad, Tamil Nadu",
    bio: "Merchant and banking families who built large courtyard mansions, using teak, tile and lime plaster." },
  /* design */
  windsor:  { n: "English chairmakers", life: "18th century onward", from: "Thames Valley, England",
    bio: "Rural woodworkers who made chairs with slender spindle backs from several kinds of local wood, each chosen for its job." },
  channa:   { n: "Channapatna artisans", life: "traditional craft", from: "Karnataka, India",
    bio: "Woodturners of a town near Bengaluru, known as the toy town for their lacquered wooden toys." },
  bluepot:  { n: "Jaipur blue pottery artisans", life: "traditional craft", from: "Jaipur, Rajasthan",
    bio: "Potters who make glazed pieces from quartz and glass, not clay, in a craft with Persian roots." },
  dhokra:   { n: "Dhokra artisans", life: "ancient craft", from: "Odisha, Bengal and Chhattisgarh",
    bio: "Metalworkers who cast brass figures by the lost wax method, one mould and one object at a time." },
  bankura:  { n: "Bankura potters", life: "traditional craft", from: "West Bengal, India",
    bio: "Village potters who make terracotta horses, offered at shrines." },
  pocham:   { n: "Pochampally weavers", life: "traditional craft", from: "Telangana, India",
    bio: "Weavers who tie and dye the threads before weaving, so that the pattern appears as the cloth forms." },
  bandhani: { n: "Bandhani craftspeople", life: "traditional craft", from: "Gujarat and Rajasthan",
    bio: "Dyers who tie thousands of tiny points of cloth by hand before dyeing." },
  kantha:   { n: "Kantha embroiderers", life: "traditional craft", from: "Bengal",
    bio: "Women who stitch layers of old cloth together with running stitch, adding stories and patterns." },
  ajrakh:   { n: "Ajrakh block printers", life: "traditional craft", from: "Kutch and Sindh",
    bio: "Printers who use carved wooden blocks, resists and natural dyes to make deep, layered patterns." },
  /* indian art traditions */
  warli:    { n: "Warli painters", life: "traditional art", from: "Maharashtra, India",
    bio: "Tribal communities of the Thane and Palghar region, who paint village life in white on red mud walls." },
  pichwai:  { n: "Pichwai painters of Nathdwara", life: "traditional art", from: "Rajasthan, India",
    bio: "Painters who make large cloth hangings for the temple of Shrinathji, with scenes from Krishna's life." },
  pattachitra:{ n: "Pattachitra artists", life: "traditional art", from: "Odisha and Bengal",
    bio: "Scroll and cloth painters who work in mineral and plant colours, especially on the stories of Jagannath and Krishna." },
  gond:     { n: "Gond artists", life: "traditional art", from: "Madhya Pradesh, India",
    bio: "Artists of the Gond people who fill animals, trees and gods with patterns of dots and lines." },
  kalamkari:{ n: "Kalamkari artisans", life: "traditional art", from: "Andhra Pradesh, India",
    bio: "Craftspeople who draw or print on cloth with natural dyes and mordants to tell stories." },
  kalighat: { n: "Kalighat painters", life: "19th to 20th century", from: "Kolkata, India",
    bio: "Painters who sold quick, bold pictures of gods and city life to pilgrims near the Kalighat temple." },
  cheriyal: { n: "Cheriyal scroll painters", life: "traditional art", from: "Telangana, India",
    bio: "A family tradition of painting long story scrolls on a bright red ground for travelling storytellers." },
  mysorep:  { n: "Mysore court painters", life: "18th to 19th century", from: "Karnataka, India",
    bio: "Painters under the Wodeyar kings, famous for fine line, gesso relief and gold leaf." }
});

window.PAINTINGS.push(
  /* ---------- Spaces: Historic Interiors (more) ---------- */
  { t: "Court of the Lions", a: "nasrid", y: "14th century", med: "Marble, stucco and tile", loc: "Alhambra, Granada, Spain", mv: "Historic Interiors", w: "Court of the Lions",
    s: "A courtyard ringed by 124 slender marble columns, with a fountain in the middle held up by twelve stone lions. Water flows along channels cut in the floor toward four rooms, so that the courtyard works as a garden, a plan and a piece of engineering." },
  { t: "Sheikh Lotfollah Mosque", a: "safavid", y: "1603 to 1619", med: "Glazed tile and brick", loc: "Isfahan, Iran", mv: "Historic Interiors", w: "Sheikh Lotfollah Mosque",
    s: "Built for the Safavid court, it is traditionally described as a private mosque for the women of the royal household. Its dome is covered in cream and blue tile, and light through the windows makes the shape of a peacock tail appear in the centre." },
  { t: "Chehel Sotoun", a: "safavid", y: "1647", med: "Wood, mirror and painted plaster", loc: "Isfahan, Iran", mv: "Historic Interiors", w: "Chehel Sotoun",
    s: "A garden pavilion whose name means forty columns. It has twenty slender wooden columns, and their reflection in the long pool in front makes forty. Its walls are covered with painted scenes of feasts and battles." },

  /* ---------- Spaces: Homes of India ---------- */
  { t: "Patwon Ki Haveli", a: "jaisalmer", y: "from 1805", med: "Yellow sandstone", loc: "Jaisalmer, Rajasthan", mv: "Homes of India", w: "Patwon Ki Haveli",
    s: "A cluster of five havelis built by a merchant family in the early 1800s, with balconies and windows carved as finely as wood. The golden stone seems to glow at sunset. Havelis like these were homes built around courtyards, to keep out the desert heat." },
  { t: "Padmanabhapuram Palace", a: "travancore", y: "16th to 18th century", med: "Teak, granite and laterite", loc: "Tamil Nadu, India", mv: "Homes of India", w: "Padmanabhapuram Palace",
    s: "A palace complex of carved teak, once the seat of the Travancore kings. It is often described as one of the largest wooden palaces in Asia. Its ceilings, pillars and shutters show the skill of Kerala carpenters, and some rooms keep old murals." },
  { t: "Mattancherry Palace", a: "kochi", y: "1555 and 1663", med: "Wood, lime plaster and murals", loc: "Kochi, Kerala", mv: "Homes of India", w: "Mattancherry Palace",
    s: "Built by the Portuguese and later renovated by the Dutch, which is why it is also called the Dutch Palace. It was built for the rajas of Kochi and is known for its painted murals of scenes from the Ramayana." },
  { t: "Nalukettu", a: "keralahouse", y: "traditional house form", med: "Timber, laterite and clay tile", loc: "Kerala, India", mv: "Homes of India", w: "Nalukettu", q: "Nalukettu Kerala house courtyard",
    s: "A traditional Kerala house with four blocks around an open courtyard. Steep tiled roofs shed the monsoon rain, and the courtyard brings in light and air. Carved wood is used for columns, ceilings and doors." },
  { t: "Bhunga Houses of Kutch", a: "kutch", y: "traditional house form", med: "Mud, thatch and mirror work", loc: "Kutch, Gujarat", mv: "Homes of India", w: "Bhunga", q: "Bhunga Kutch round mud house",
    s: "Round houses with a cone of thatch for a roof, built of mud in a land of strong wind and earthquakes. Their walls are shaped by hand into patterns and set with small mirrors that catch the light." },
  { t: "Mysore Palace", a: "irwin", y: "1897 to 1912", med: "Stone, marble and cast iron", loc: "Mysuru, Karnataka", mv: "Homes of India", w: "Mysore Palace",
    s: "Designed by Henry Irwin for the Wadiyar rulers, it blends Hindu, Islamic, Gothic and Rajput styles in the Indo Saracenic manner. On Sundays and festival days it is lit by around 97,000 bulbs." },
  { t: "Laxmi Vilas Palace", a: "chisholm", y: "1890", med: "Stone and marble", loc: "Vadodara, Gujarat", mv: "Homes of India", w: "Laxmi Vilas Palace",
    s: "Built for Maharaja Sayajirao Gaekwad III, it is often said to be larger than Buckingham Palace, which would make it one of the biggest private homes ever built. Its design mixes Indian domes and arches with European planning." },
  { t: "Chettinad Mansions", a: "chettiar", y: "19th to 20th century", med: "Teak, Athangudi tile and lime plaster", loc: "Chettinad, Tamil Nadu", mv: "Homes of India", w: "Chettinad", q: "Chettinad mansion Karaikudi courtyard",
    s: "Merchant families built large houses around a series of courtyards, with teak pillars, painted tile floors from Athangudi and smooth lime plaster walls. Many stand quiet today, and some have been turned into heritage hotels." },

  /* ---------- Design: Objects and Furniture (one more) ---------- */
  { t: "Windsor Chair", a: "windsor", y: "from the early 1700s", med: "Elm, beech and ash", loc: "England", mv: "Objects and Furniture", w: "Windsor chair", q: "Windsor chair stick back",
    s: "Turned legs and spindles are fixed straight into a shaped solid seat. Makers often chose different woods for different parts, for example elm for the seat, which resists splitting, and beech for turned parts. The form travelled to America and stayed in production for centuries." },

  /* ---------- Design: Handmade India ---------- */
  { t: "Channapatna Toys", a: "channa", y: "traditional craft", med: "Lacquered wood", loc: "Channapatna, Karnataka", mv: "Handmade India", w: "Channapatna toys", q: "Channapatna toys",
    s: "Wooden toys turned on a lathe and finished with lac, a natural resin coloured with vegetable dyes. The town of Channapatna near Bengaluru is known as the toy town, and its toys are meant to be safe for children to hold and chew." },
  { t: "Jaipur Blue Pottery", a: "bluepot", y: "traditional craft", med: "Quartz, glass and glaze", loc: "Jaipur, Rajasthan", mv: "Handmade India", w: "Blue pottery", q: "Jaipur blue pottery",
    s: "Unlike most pottery it contains no clay: it is made from quartz powder and ground glass. The cobalt blue and white patterns show its Persian ancestry, and each piece is painted by hand before firing." },
  { t: "Dhokra Metal Casting", a: "dhokra", y: "ancient craft", med: "Brass, cast by the lost wax method", loc: "Odisha, Bengal and Chhattisgarh", mv: "Handmade India", w: "Dhokra", q: "Dhokra brass figure",
    s: "The artist shapes a figure in wax, covers it with clay, heats it so the wax runs out, and pours molten brass into the gap. The mould is broken to free the figure, so every piece is unique. The same method is believed to be thousands of years old." },
  { t: "Bankura Horse", a: "bankura", y: "traditional craft", med: "Terracotta", loc: "West Bengal", mv: "Handmade India", w: "Bankura horse", q: "Bankura terracotta horse",
    s: "Terracotta horses with long necks made by village potters, often offered at shrines as gifts to local gods. The form is simple and elegant, with a curved neck and sometimes small ears like leaves." },
  { t: "Pochampally Ikat", a: "pocham", y: "traditional craft", med: "Handwoven cotton and silk", loc: "Telangana, India", mv: "Handmade India", w: "Pochampally Ikat", q: "Pochampally ikat saree weaving",
    s: "In ikat the threads are tied and dyed before the cloth is woven, so the design appears as the cloth is made. The edges look slightly blurred, which is the mark of the method. Pochampally is known for geometric patterns of diamonds and zigzags." },
  { t: "Bandhani", a: "bandhani", y: "traditional craft", med: "Tie dyed cotton and silk", loc: "Gujarat and Rajasthan", mv: "Handmade India", w: "Bandhani", q: "Bandhani tie dye dupatta",
    s: "The cloth is pinched into tiny points and tied with thread before being dyed. When the threads are removed, each tied point becomes a small circle of the original colour, so that thousands of dots build up flowers, waves and peacocks." },
  { t: "Kantha", a: "kantha", y: "traditional craft", med: "Embroidery on layered cloth", loc: "Bengal", mv: "Handmade India", w: "Kantha", q: "Kantha embroidery quilt Bengal",
    s: "Layers of old saris and cloth are stitched together with a simple running stitch, and the stitching itself becomes the picture: birds, flowers, boats and village scenes. It began as a way to make something new out of worn cloth." },
  { t: "Ajrakh", a: "ajrakh", y: "traditional craft", med: "Block printed cotton with natural dyes", loc: "Kutch, Gujarat", mv: "Handmade India", w: "Ajrakh", q: "Ajrakh block print Kutch",
    s: "Carved wooden blocks stamp the pattern in several stages, with resists and natural dyes such as indigo and madder applied one after another. The result is a deep, layered cloth in blue and red that looks the same on both sides." },

  /* ---------- Art: more Indian traditions ---------- */
  { t: "Warli Painting", a: "warli", y: "traditional art", med: "Rice paste on mud wall", loc: "Maharashtra, India", mv: "Indian Masters", w: "Warli painting",
    s: "Simple circles, triangles and squares become people, trees and animals. White rice paste is painted on red mud walls, traditionally by women, for weddings and festivals. A spiral of dancers is the best known scene." },
  { t: "Pichwai", a: "pichwai", y: "traditional art", med: "Painting on cloth", loc: "Nathdwara, Rajasthan", mv: "Indian Masters", w: "Pichwai",
    s: "Large painted cloths hung behind the image of Shrinathji, a form of Krishna, in the temple at Nathdwara. Different hangings mark different seasons and festivals, with lotus ponds, cows and bright flowers." },
  { t: "Pattachitra", a: "pattachitra", y: "traditional art", med: "Mineral and plant colours on cloth", loc: "Odisha and Bengal", mv: "Indian Masters", w: "Pattachitra",
    s: "Cloth is prepared with layers of tamarind paste and chalk, then painted with fine outlines and rich colour. Many pictures tell the stories of Jagannath and Krishna, and the village of Raghurajpur in Odisha is known as a centre of the craft." },
  { t: "Gond Painting", a: "gond", y: "traditional art", med: "Acrylic or natural colour on paper and cloth", loc: "Madhya Pradesh, India", mv: "Indian Masters", w: "Gond painting",
    s: "Animals, birds and trees are filled with patterns of dots, dashes and lines that suggest movement. In the 1980s the painter Jangarh Singh Shyam helped bring the Gond style to a wider audience." },
  { t: "Kalamkari", a: "kalamkari", y: "traditional art", med: "Natural dyes on cotton", loc: "Andhra Pradesh, India", mv: "Indian Masters", w: "Kalamkari",
    s: "The name means pen work. Artists draw with a bamboo pen or print with blocks, and a long process of washing, mordanting and dyeing brings out colours from plants. The cloth was once used to tell temple stories." },
  { t: "Kalighat Painting", a: "kalighat", y: "19th century", med: "Watercolour on paper", loc: "Kolkata, India", mv: "Indian Masters", w: "Kalighat painting",
    s: "Painters near the Kalighat temple in Kolkata made bold, quick pictures to sell to pilgrims. Their smooth curved outlines and strong colours influenced later modern artists. Some Kalighat pictures also poked fun at city life." },
  { t: "Cheriyal Scroll Painting", a: "cheriyal", y: "traditional art", med: "Painting on cloth scroll", loc: "Telangana, India", mv: "Indian Masters", w: "Cheriyal scroll painting",
    s: "Long vertical scrolls are painted on a bright red ground, in panels that read like a comic strip. Storytellers once unrolled them as they sang the tales, and the craft is passed down in families." },
  { t: "Mysore Painting", a: "mysorep", y: "18th to 19th century onward", med: "Gesso and gold leaf on cloth or wood", loc: "Karnataka, India", mv: "Indian Masters", w: "Mysore painting",
    s: "Delicate lines, soft colour and raised gesso work covered in gold leaf. The tradition was supported by the Wodeyar rulers and is known for calm, graceful gods and goddesses." }
);

(function () {   /* tidy the order of rooms inside each wing */
  const R = window.ROOMS, move = (id, beforeId) => { const i = R.findIndex(r => r.id === id), j = R.findIndex(r => r.id === beforeId); if (i > j && j >= 0) { const [x] = R.splice(i, 1); R.splice(j, 0, x); } };
  move('Homes of India', 'Indian Heritage');
})();

window.LINKS.push(
  ["Warli Painting", "Bhunga Houses of Kutch", "Mud walls as a canvas"],
  ["Pattachitra", "Kalighat Painting", "Painted pictures from Odisha and Bengal"],
  ["Kantha", "Phulkari", "Stitching traditions of Bengal and Punjab"],
  ["Padmanabhapuram Palace", "Mattancherry Palace", "Kerala's palaces with painted walls"],
  ["Laxmi Vilas Palace", "Mysore Palace", "Two Indo Saracenic palaces"],
  ["Court of the Lions", "The Alhambra", "A courtyard inside the Alhambra"],
  ["Pochampally Ikat", "Bandhani", "Tie dyed thread and tie dyed cloth"],
  ["Jaipur Blue Pottery", "Sheikh Lotfollah Mosque", "Persian blue tile traditions"],
  ["Windsor Chair", "Chair No. 14", "Two chairs that sold by the millions"],
  ["Chettinad Mansions", "Nalukettu", "Courtyard houses of the South"]
);

window.EXHIBITIONS.splice(4, 0,
  { id: "thread-womens-hands", title: "Women's Hands", thread: true, by: "Srjan Curators", tagline: "Four traditions carried largely by women.",
    text: "Painting a mud wall, stitching old cloth, embroidering a wedding wrap. These traditions have been kept alive and handed down mostly by women, often with no signature on the work and no fee for the skill.",
    works: ["Madhubani Painting", "Warli Painting", "Kantha", "Phulkari"] },
  { id: "thread-courtyards", title: "Courtyards", thread: true, by: "Srjan Curators", tagline: "The room with no roof, from Granada to Kerala.",
    text: "A courtyard brings in light, air and rain, and makes one family's house feel like a small world. Here are four ways of building around one, from a Moorish palace to a Kerala home, a merchant's mansion in Tamil Nadu and a desert haveli in Rajasthan.",
    works: ["Court of the Lions", "Nalukettu", "Chettinad Mansions", "Patwon Ki Haveli"] }
);
