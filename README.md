# Diwali Games

Live party games for the TV and everyone's phones: **Find the Ravana**, **Thali Thriller** and **Calorie Clash**. The TV runs the show; phones are the controllers.

**Play:** open **tinyurl.com/ravanatv** on the TV browser and choose **Use this screen as the TV**. Everyone scans the QR code. Phones on the same Wi-Fi also get a one-tap **Join** button on the home page. Pick the game in the lobby (on the TV or the host's phone); Play again returns to the lobby so you can switch.

## Thali Thriller (2 to 8 players)
One player at a time gets a turn (45 s, 1 min or 1½ min). A food photo (Indian sweets and snacks, or favourites from around the world) starts zoomed way in and zooms out over 10 seconds; the player taps its name from four choices on their phone. One point per right answer, most right wins. The turn ends with a photo recap of every food.

The food list lives in `foods.js`: 80 vegetarian dishes (51 Indian, 29 from around the world), each with other names, region, cuisine, a lookalike group (so two near-identical foods are never offered together) and the spot where the zoom starts. The host picks Mix, Indian or World foods in the lobby; wrong answers always come from the same cuisine and kind (sweet or savoury). Photos are real photographs from Pexels and Unsplash in `food/`, listed in `food/CREDITS.md`. To add a food, drop a 4:3 photo in `food/` and add a line to `foods.js`.

## Calorie Clash (2 to 8 players)
Inspired by the calorie round in Ranveer Brar's *Yess Chef!*. Two food photos appear side by side on the TV and on every phone, each with a serving size (for example "1 samosa" or "2 slices"). Players tap the one with more calories within 10 seconds. The reveal counts up both calorie numbers and shows who picked what.

- **Everyone** (default): all players answer every pair. A right answer earns 1 point; the fastest right answer earns 1 more (only when at least two people answered). The reveal comes as soon as everyone has answered. Game length: 8, 12 or 16 pairs.
- **One at a time**: each player gets a turn of 4, 6 or 8 pairs while the others watch on their phones. 1 point per right answer.

Pairs are never closer than 35% apart (so rough calorie values can't flip the answer) and never more than 3x apart (so it isn't a no-brainer). The serving and calories for each food are in `foods.js` (`sv`, `cal`); they are typical values, and real numbers vary by recipe. The Mix / Indian / World foods setting applies here too.

## Photos on phones
In both food games every phone shows the same photo as the TV: in Thali Thriller the photo zooms out on the phone in step with the TV, and in Calorie Clash both foods appear as big tap targets. Phones load smaller 720px copies from `food/m/`.

## Find the Ravana (3 to 8 players): how a round works
1. **Cards:** everyone holds their phone card to see the secret word. One player is the Ravana: they get a private hint (the topic) instead of the word. The TV never shows the topic.
2. **Clues:** in turn, each player says one word that hints at the secret word.
3. **Talk:** the group discusses who doesn't seem to know the word.
4. **Vote:** everyone votes on their phone.
5. **Verdict and reveal:** the TV shows who the group picked and stamps whether they were the Ravana. If the Ravana is caught, everyone who voted for them gets 1 point and the Ravana gets one guess at the word to steal 2. If the Ravana escapes, they get 2.

## Built to survive a real party
- Phones that lock or lose signal stay in the game, show as away, and reconnect when they wake.
- Votes and card checks are confirmed by the TV and kept on the phone, so a reload doesn't lose them.
- A reloaded phone rejoins as the same player. A reloaded TV can resume the same room.
- The first player to join gets a crown and can run the game from their phone: start, pause, skip, next round.
- The TV screen is a fixed 16:9 layout that always fits. Settings has screen size and position for TVs whose browser bar covers the top.
- Arrow keys and OK on a TV remote move between buttons.
- Music (tanpura, dhol and bansuri) is generated live on the TV. Phones stay silent.

Live sync uses public MQTT relays (broker.emqx.io, broker.hivemq.com and mqtt.eclipseprojects.io), so nobody needs an account.

## Music
The TV plays game-show music by Kevin MacLeod that changes with the game: a bouncy lobby track, a fast quiz track for Thali Thriller turns, a sneaky track for Find the Ravana, thinking music for the vote, a quiet track for the verdict and "Winner Winner!" for reveals and the finale. It dips under the fanfares. The host can pick any of the 12 tracks (or Auto mix) in TV Settings → Song or on their phone under Host controls; the TV remembers the pick. Files are in `music/` (credits in `music/CREDITS.md`); if they can't load, the TV falls back to its built-in score. Sound effects (fireworks booms and whistles, thunder and a villain laugh when the Ravana rises, a drum roll before the verdict, clock ticks in the last seconds, a ding for right answers and a buzzer for wrong ones, cheers and a fanfare at the end) are in `sfx/`. Phones never play music or effects.

## If a phone leaves the page
Switching apps or locking the phone is fine. After the first tap, the phone plays a silent track (it shows on the lock screen as "Diwali Games · Connected to room …") so the browser keeps the game running in the background. If the phone still drops (for example another app takes over the audio), the player shows as away on the TV but stays in the game, and the phone reconnects within a second of coming back. If the phone's browser reloads the tab, it rejoins the room by itself as the same player; a reloaded TV tab resumes the same room.
