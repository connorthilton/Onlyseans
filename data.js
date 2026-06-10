// Company data. Each entry: { id, industry, name, phone, city, note }
// `id` must be stable & unique — it's the key used to store call outcomes in localStorage.
// Industry labels: "Plumbers", "Electricians", "Mechanics", "Restaurants", "Car Washes".
// Utah County businesses. Phone numbers researched from public listings — verify before relying on them.
window.COMPANIES = [
  // --- Plumbers ---
  { id: "plumbers-1",  industry: "Plumbers", name: "Blue Plumbing and Drain Cleaning", phone: "385-325-6400", city: "Orem", note: "Serves Provo/Orem/Springville; 24/7" },
  { id: "plumbers-2",  industry: "Plumbers", name: "Valley Plumbing and Drain Cleaning", phone: "801-369-6870", city: "Lehi", note: "24/7 service across Utah County" },
  { id: "plumbers-3",  industry: "Plumbers", name: "AAA Action Quick Response Plumbing", phone: "801-636-3333", city: "Provo", note: "24/7 emergency plumbing" },
  { id: "plumbers-4",  industry: "Plumbers", name: "Professional Plumbing Systems (PPS)", phone: "801-794-3636", city: "Springville", note: "Office line; serves all Utah County" },
  { id: "plumbers-5",  industry: "Plumbers", name: "MAC Plumbing & Heating", phone: "801-361-6842", city: "American Fork", note: "Serves AF, Highland, Cedar Hills, Lehi" },
  { id: "plumbers-6",  industry: "Plumbers", name: "Prime Plumbing", phone: "801-494-1790", city: "Spanish Fork", note: "Serves Springville, Payson, Spanish Fork" },
  { id: "plumbers-7",  industry: "Plumbers", name: "Roto-Rooter Plumbing", phone: "801-736-0055", city: "American Fork", note: "Emergency plumbing, Utah Valley" },
  { id: "plumbers-8",  industry: "Plumbers", name: "Sunset Plumbing Utah", phone: "385-231-1713", city: "Springville", note: "Springville/Spanish Fork/Payson area" },
  { id: "plumbers-9",  industry: "Plumbers", name: "Thomas Plumbing & Affordable Drain Service", phone: "801-889-9539", city: "Spanish Fork", note: "Drain service, Utah County" },
  { id: "plumbers-10", industry: "Plumbers", name: "Whipple Service Champions", phone: "385-786-9891", city: "Provo", note: "Plumbing, heating, cooling, electrical" },
  { id: "plumbers-11", industry: "Plumbers", name: "PPS After-Hours Emergency", phone: "801-835-5629", city: "Springville", note: "24-hour emergency plumbing" },

  // --- Electricians ---
  { id: "electricians-1",  industry: "Electricians", name: "Same Day Electric", phone: "801-361-1502", city: "Orem", note: "Serves Provo, Orem, AF, Lehi, PG" },
  { id: "electricians-2",  industry: "Electricians", name: "Bar H Bar Electric", phone: "385-257-3541", city: "Lehi", note: "Serves Lehi, PG, American Fork" },
  { id: "electricians-3",  industry: "Electricians", name: "Tri-Phase Electric", phone: "801-756-6008", city: "American Fork", note: "775 E Utah Valley Dr" },
  { id: "electricians-4",  industry: "Electricians", name: "EZ Electric", phone: "385-220-7312", city: "American Fork", note: "Residential/commercial electrical" },
  { id: "electricians-5",  industry: "Electricians", name: "High Altitude Electric", phone: "801-473-4481", city: "Spanish Fork", note: "7310 S 3200 W; serves Utah County" },
  { id: "electricians-6",  industry: "Electricians", name: "Envision Electric", phone: "801-509-1314", city: "Lehi", note: "24+ years experience, Northern Utah" },
  { id: "electricians-7",  industry: "Electricians", name: "Mint Electric", phone: "801-473-0901", city: "Mapleton", note: "Mapleton/Springville area" },
  { id: "electricians-8",  industry: "Electricians", name: "Haupt Electrical", phone: "801-489-6565", city: "Mapleton", note: "312 N 1600 W" },
  { id: "electricians-9",  industry: "Electricians", name: "CV Electric", phone: "801-489-3503", city: "Mapleton", note: "927 E 1200 N" },
  { id: "electricians-10", industry: "Electricians", name: "O'Connor's Electrical", phone: "844-484-2612", city: "Provo", note: "24/7 emergency, statewide" },
  { id: "electricians-11", industry: "Electricians", name: "Callahan Electric", phone: "385-402-6220", city: "Pleasant Grove", note: "348 S 2000 W area" },
  { id: "electricians-12", industry: "Electricians", name: "Same Day Electric (alt line)", phone: "801-900-4064", city: "Provo", note: "Provo/Orem electrical" },

  // --- Mechanics ---
  { id: "mechanics-1",  industry: "Mechanics", name: "Doug's Auto Repair", phone: "801-224-4055", city: "Orem", note: "673 E 1775 S" },
  { id: "mechanics-2",  industry: "Mechanics", name: "Clegg Auto Provo", phone: "801-374-8708", city: "Provo", note: "546 N Freedom Blvd" },
  { id: "mechanics-3",  industry: "Mechanics", name: "Certified Tire & Service", phone: "801-426-5535", city: "Provo", note: "Auto mechanic and tires" },
  { id: "mechanics-4",  industry: "Mechanics", name: "Computune Certified Auto Repair", phone: "385-375-3025", city: "Provo", note: "1272 N 300 W" },
  { id: "mechanics-5",  industry: "Mechanics", name: "Master AutoTech (Provo)", phone: "801-228-0044", city: "Provo", note: "825 W Center St" },
  { id: "mechanics-6",  industry: "Mechanics", name: "Master AutoTech (Orem)", phone: "801-228-0045", city: "Orem", note: "1795 N State St" },
  { id: "mechanics-7",  industry: "Mechanics", name: "Garrin's Automotive", phone: "801-766-9834", city: "Lehi", note: "266 E Main St" },
  { id: "mechanics-8",  industry: "Mechanics", name: "Rogers Automotive", phone: "801-768-2590", city: "Lehi", note: "198 W State St" },
  { id: "mechanics-9",  industry: "Mechanics", name: "Main Street Mechanic", phone: "801-756-2661", city: "American Fork", note: "337 W Main St" },
  { id: "mechanics-10", industry: "Mechanics", name: "Sam's Automotive Repair", phone: "801-499-6782", city: "Lehi", note: "681 E State St; serves American Fork" },
  { id: "mechanics-11", industry: "Mechanics", name: "Big O Tires (Provo)", phone: "801-374-1177", city: "Provo", note: "1461 N State St; repair and tires" },
  { id: "mechanics-12", industry: "Mechanics", name: "Big O Tires (Orem)", phone: "801-224-1177", city: "Orem", note: "703 N State St" },
  { id: "mechanics-13", industry: "Mechanics", name: "Burt Brothers Tire & Service (Highland)", phone: "801-492-6300", city: "Highland", note: "10918 Town Center Blvd" },
  { id: "mechanics-14", industry: "Mechanics", name: "Big O Tires (Lehi)", phone: "801-917-6062", city: "Lehi", note: "144 N 850 E" },
  { id: "mechanics-15", industry: "Mechanics", name: "Cascade Collision Repair", phone: "801-373-8020", city: "Provo", note: "1155 S State St; collision/auto body" },

  // --- Restaurants ---
  { id: "restaurants-1",  industry: "Restaurants", name: "Black Sheep Cafe", phone: "801-754-4762", city: "Provo", note: "19 N University Ave; Southwestern" },
  { id: "restaurants-2",  industry: "Restaurants", name: "Bombay House", phone: "801-373-6677", city: "Provo", note: "463 N University Ave; Indian" },
  { id: "restaurants-3",  industry: "Restaurants", name: "Communal", phone: "801-373-8000", city: "Provo", note: "102 N University Ave; New American" },
  { id: "restaurants-4",  industry: "Restaurants", name: "J Dawgs", phone: "801-373-3294", city: "Provo", note: "858 N 700 E; hot dogs" },
  { id: "restaurants-5",  industry: "Restaurants", name: "Brick Oven", phone: "801-374-8800", city: "Provo", note: "111 E 800 N; pizza/Italian" },
  { id: "restaurants-6",  industry: "Restaurants", name: "Joe's Cafe", phone: "801-607-5377", city: "Orem", note: "1126 S State St; breakfast/brunch" },
  { id: "restaurants-7",  industry: "Restaurants", name: "Asa Ramen", phone: "801-842-1898", city: "Orem", note: "1120 S State St; ramen" },
  { id: "restaurants-8",  industry: "Restaurants", name: "Tamashi Ramen", phone: "801-691-1894", city: "Orem", note: "206 E University Pkwy; Japanese" },
  { id: "restaurants-9",  industry: "Restaurants", name: "Pizza Pie Cafe", phone: "801-226-4277", city: "Orem", note: "573 W 1600 N; pizza buffet" },
  { id: "restaurants-10", industry: "Restaurants", name: "Sabaidee Thai Cuisine", phone: "801-766-4076", city: "Lehi", note: "250 W State St; Thai" },
  { id: "restaurants-11", industry: "Restaurants", name: "Sol Agave", phone: "385-233-6756", city: "American Fork", note: "749 W 100 N; Mexican" },
  { id: "restaurants-12", industry: "Restaurants", name: "JCW's The Burger Boys", phone: "801-492-1762", city: "American Fork", note: "580 E State Rd; burgers" },
  { id: "restaurants-13", industry: "Restaurants", name: "Cafe Rio", phone: "801-210-5200", city: "Spanish Fork", note: "782 N 800 E; Mexican grill" },
  { id: "restaurants-14", industry: "Restaurants", name: "Five Guys", phone: "801-798-7878", city: "Spanish Fork", note: "529 E 1000 N; burgers" },
  { id: "restaurants-15", industry: "Restaurants", name: "Magleby's", phone: "801-370-1129", city: "Springville", note: "198 S Main St; American" },
  { id: "restaurants-16", industry: "Restaurants", name: "Texas Roadhouse", phone: "385-200-7356", city: "Spanish Fork", note: "508 E Commerce Way; steakhouse" },

  // --- Car Washes ---
  { id: "carwashes-1", industry: "Car Washes", name: "Quick Quack Car Wash", phone: "888-772-2792", city: "Provo", note: "Chain — shared call center (multiple Utah County locations)" },
  { id: "carwashes-2", industry: "Car Washes", name: "Wiggy Wash", phone: "385-355-6696", city: "Orem", note: "Wash + detailing (Orem/Spanish Fork/Springville)" },
  { id: "carwashes-3", industry: "Car Washes", name: "Mister Car Wash (Orem)", phone: "385-286-5733", city: "Orem", note: "1408 S State St" },
  { id: "carwashes-4", industry: "Car Washes", name: "Mister Car Wash (American Fork)", phone: "801-756-9699", city: "American Fork", note: "83 N West State Rd" },
  { id: "carwashes-5", industry: "Car Washes", name: "Take 5 Car Wash", phone: "385-324-2050", city: "Orem", note: "367 N State St" },
  { id: "carwashes-6", industry: "Car Washes", name: "Cleaner Bros Detailing", phone: "801-472-2066", city: "Orem", note: "Wash and detailing, Utah County" },
  { id: "carwashes-7", industry: "Car Washes", name: "Clean Mobile Detailing", phone: "801-997-5919", city: "Orem", note: "Mobile; serves Provo, Lehi, AF" },
  { id: "carwashes-8", industry: "Car Washes", name: "Express Wash", phone: "801-607-5733", city: "Orem", note: "75 N 1200 W; self-serve" }
];
