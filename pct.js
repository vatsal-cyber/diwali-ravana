/* Puzzles for Ek Percent, written for this game. Logic and common sense, no general knowledge needed.
   p: difficulty level, shown as "about p% get this right" (our estimate, not a survey)
   t: "c" = pick one of o (a = index of the right option), "n" = type a whole number (a = the number)
   why: one line shown after the reveal. svg: optional picture key (see pctArt in app.js)
   Add a puzzle: add a line with a new id at the level you think fits. Keep at least 2 per level. */
window.PCT_Q = [
  /* 90% */
  { id: "seq5", p: 90, t: "n", q: "What comes next?  5, 10, 15, 20, …", a: 25, why: "Add 5 each time." },
  { id: "square", p: 90, t: "c", q: "A shape has 4 equal sides and 4 right angles. What is it?", o: ["Triangle", "Square", "Circle", "Hexagon"], a: 1, why: "Four equal sides and four right angles make a square." },
  { id: "diyas7", p: 90, t: "n", q: "Riya has 3 diyas. Her friend gives her 4 more. How many diyas does Riya have now?", a: 7, why: "3 + 4 = 7." },
  { id: "fruit", p: 90, t: "c", q: "Which of these grows on a tree?", o: ["Potato", "Mango", "Carrot", "Onion"], a: 1, why: "Mangoes grow on trees; the others grow in the ground." },
  /* 80% */
  { id: "dozen", p: 80, t: "n", q: "What is half of 3 dozen?", a: 18, why: "3 dozen is 36, and half of 36 is 18." },
  { id: "sat3", p: 80, t: "c", q: "If today is Saturday, what day will it be 3 days from now?", o: ["Monday", "Tuesday", "Wednesday", "Sunday"], a: 1, why: "Sunday, Monday, Tuesday." },
  { id: "sq36", p: 80, t: "n", q: "What comes next?  1, 4, 9, 16, 25, …", a: 36, why: "1×1, 2×2, 3×3, 4×4, 5×5, so next is 6×6 = 36." },
  { id: "mirror", p: 80, t: "c", q: "Which capital letter looks exactly the same in a mirror?", o: ["R", "N", "A", "S"], a: 2, why: "A is the same on its left and right side." },
  /* 70% */
  { id: "cows", p: 70, t: "n", q: "A farmer has 15 cows. All but 8 run away. How many cows are left?", a: 8, why: "“All but 8” means 8 stayed." },
  { id: "kilo", p: 70, t: "c", q: "Which is heavier: a kilo of feathers or a kilo of jalebis?", o: ["The feathers", "The jalebis", "They weigh the same"], a: 2, why: "A kilo is a kilo." },
  { id: "moon", p: 70, t: "c", q: "Which is the odd one out?", o: ["Mercury", "Venus", "Moon", "Mars"], a: 2, why: "The others are planets. The Moon goes round the Earth." },
  { id: "tallest", p: 70, t: "c", q: "Ravi is taller than Sita. Sita is taller than Arjun. Who is the shortest?", o: ["Ravi", "Sita", "Arjun"], a: 2, why: "Ravi, then Sita, then Arjun." },
  /* 60% */
  { id: "months", p: 60, t: "c", q: "What comes next?  J, F, M, A, M, J, J, …", o: ["A", "S", "J", "O"], a: 0, why: "They are the months: … June, July, August." },
  { id: "pct10", p: 60, t: "n", q: "What is 10% of 10% of 1,000?", a: 10, why: "10% of 1,000 is 100, and 10% of 100 is 10." },
  { id: "prime", p: 60, t: "c", q: "Which number is the odd one out?", o: ["3", "5", "9", "11"], a: 2, why: "9 can be divided by 3. The others can only be divided by 1 and themselves." },
  { id: "mary", p: 60, t: "c", q: "Mary’s mother has four children: April, May, June and …?", o: ["July", "Mary", "August", "March"], a: 1, why: "It’s Mary’s mother, so the fourth child is Mary." },
  /* 50% */
  { id: "samosa3", p: 50, t: "n", q: "3 people eat 3 samosas in 3 minutes. How many minutes do 6 people take to eat 6 samosas?", a: 3, why: "Each person eats one samosa in 3 minutes." },
  { id: "shorter", p: 50, t: "c", q: "Which word becomes shorter when you add two letters to it?", o: ["Long", "Short", "Small", "Tiny"], a: 1, why: "Short + er = shorter." },
  { id: "fib", p: 50, t: "n", q: "What comes next?  1, 1, 2, 3, 5, 8, …", a: 13, why: "Each number is the two before it added together: 5 + 8 = 13." },
  { id: "day", p: 50, t: "c", q: "Which word fits in front of light, time, break and dream?", o: ["Sun", "Day", "Out", "Head"], a: 1, why: "Daylight, daytime, daybreak, daydream." },
  /* 40% */
  { id: "brick", p: 40, t: "n", q: "A brick weighs 1 kg plus half a brick. How many kg does a whole brick weigh?", a: 2, why: "Half a brick weighs 1 kg, so a whole brick weighs 2 kg." },
  { id: "take5", p: 40, t: "c", q: "How many times can you take 5 away from 25?", o: ["5 times", "4 times", "Once", "6 times"], a: 2, why: "After the first time you’re taking it away from 20, not 25." },
  { id: "seq42", p: 40, t: "n", q: "What comes next?  2, 6, 12, 20, 30, …", a: 42, why: "The gaps grow by 2: +4, +6, +8, +10, then +12." },
  { id: "race", p: 40, t: "c", q: "In a race, you overtake the person in 2nd place. What place are you in now?", o: ["1st", "2nd", "3rd"], a: 1, why: "You take their place, so you’re 2nd." },
  /* 30% */
  { id: "batball", p: 30, t: "n", q: "A bat and a ball cost ₹110 together. The bat costs ₹100 more than the ball. How many rupees is the ball?", a: 5, why: "Ball ₹5, bat ₹105: together ₹110, and the bat costs ₹100 more." },
  { id: "pacific", p: 30, t: "c", q: "Rearrange the letters C I F A I P C. You get the name of …", o: ["A city", "An animal", "An ocean", "A country"], a: 2, why: "They spell PACIFIC." },
  { id: "consonant", p: 30, t: "c", q: "Take the vowels out of the alphabet. What is the 10th letter now?", o: ["L", "M", "N", "P"], a: 1, why: "B C D F G H J K L M: the 10th is M." },
  { id: "ones", p: 30, t: "n", q: "You write every number from 1 to 20. How many times do you write the digit 1?", a: 12, why: "1, 10, 11 (twice), 12, 13, 14, 15, 16, 17, 18, 19: that’s 12." },
  /* 20% */
  { id: "fcount", p: 20, t: "n", q: "How many letter Fs are in this line?  FIFTY FRIENDS OF OURS FLEW OFF FOR A FESTIVAL OF FIREWORKS", a: 11, why: "FIFTY has 2, OFF has 2, and the two OFs are easy to miss." },
  { id: "otte", p: 20, t: "c", q: "What comes next?  O, T, T, F, F, S, S, E, …", o: ["N", "T", "E", "O"], a: 0, why: "One, Two, Three, Four, Five, Six, Seven, Eight, Nine." },
  { id: "swims", p: 20, t: "c", q: "Which word still reads the same when you turn it upside down?", o: ["SWIMS", "LEVEL", "MOM", "DEED"], a: 0, why: "Turned upside down, SWIMS still says SWIMS. MOM becomes WOW." },
  { id: "snail", p: 20, t: "n", q: "A snail climbs 3 m up a 10 m wall each day and slips 2 m down each night. On which day does it reach the top?", a: 8, why: "After 7 days it’s at 7 m. On day 8 it climbs the last 3 m before it can slip." },
  /* 10% */
  { id: "grid", p: 10, t: "n", q: "How many squares of any size are in this 3 × 3 grid?", a: 14, svg: "grid3", why: "9 small, 4 medium (2 × 2) and 1 big one: 14." },
  { id: "clock315", p: 10, t: "c", q: "A clock shows 3:15. What is the angle between the two hands?", o: ["0°", "7.5°", "15°", "90°"], a: 1, why: "By 3:15 the hour hand has moved a quarter of the way to 4: a quarter of 30° is 7.5°." },
  { id: "gauss", p: 10, t: "n", q: "What do you get if you add up every whole number from 1 to 100?", a: 5050, why: "Pair them up: 1 + 100, 2 + 99 … that’s 50 pairs of 101 = 5050." },
  { id: "halfq", p: 10, t: "n", q: "Think of a number. Half of it is 3 more than a quarter of it. What is the number?", a: 12, why: "Half of 12 is 6, a quarter is 3, and 6 is 3 more than 3." },
  /* 5% */
  { id: "portrait", p: 5, t: "c", q: "A man points at a photo: “I have no brothers or sisters, but that man’s father is my father’s son.” Who is in the photo?", o: ["The man himself", "His father", "His son", "His nephew"], a: 2, why: "His father’s son is himself, so the man in the photo is his son." },
  { id: "nines", p: 5, t: "n", q: "You write every number from 1 to 100. How many times do you write the digit 9?", a: 20, why: "Ten 9s in the ones place (9, 19 … 99) and ten in the tens place (90 to 99)." },
  { id: "seq33", p: 5, t: "n", q: "What comes next?  2, 3, 5, 9, 17, …", a: 33, why: "Double the number and take away 1: 17 × 2 − 1 = 33." },
  { id: "agarbatti", p: 5, t: "c", q: "Two agarbattis each take exactly 60 minutes to burn, but they burn unevenly. How can you time 45 minutes?", o: ["Light both at one end at the same time", "Light one at both ends and the other at one end", "Break both in half and light all four pieces", "Light one, then light the other when it finishes"], a: 1, why: "The one lit at both ends lasts 30 minutes. Then light the other end of the second: its last 30 minutes now takes 15." },
  /* 1% */
  { id: "bridge", p: 1, t: "n", q: "Four friends cross a bridge at night with one lamp. At most two can cross at once, and the lamp must go with them. They take 1, 2, 5 and 10 minutes; a pair walks at the slower speed. What is the fewest minutes for all four?", a: 17, why: "1 and 2 cross (2), 1 comes back (1), 5 and 10 cross (10), 2 comes back (2), 1 and 2 cross (2): 17." },
  { id: "overlap", p: 1, t: "c", q: "A clock’s hands are on top of each other at 12:00. When are they next on top of each other?", o: ["1:00", "1:05 exactly", "About 1:05 and 27 seconds", "1:10"], a: 2, why: "By 1:05 the hour hand has moved on a little, so the minute hand meets it about 27 seconds later." },
  { id: "eq5", p: 1, t: "n", q: "If 1 = 5, 2 = 25, 3 = 125 and 4 = 625, then 5 = ?", a: 1, why: "The first line says 1 = 5, so 5 = 1." },
  { id: "looksay", p: 1, t: "n", q: "What comes next?  1, 11, 21, 1211, 111221, …", a: 312211, why: "Each line reads out the one before: 111221 is three 1s, two 2s, one 1 = 312211." }
];
