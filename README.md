# Diwali Games

Live party games for the TV and everyone's phones: **Find the Ravana** and **Pehchaan Kaun?**. The TV runs the show; phones are the controllers.

**Play:** open **tinyurl.com/ravanatv** on the TV browser and choose **Use this screen as the TV**. Everyone scans the QR code. Phones on the same Wi-Fi also get a one-tap **Join** button on the home page. Pick the game in the lobby (on the TV or the host's phone); Play again returns to the lobby so you can switch.

## Pehchaan Kaun? (2 to 8 players)
One player at a time gets a turn (45 s, 1 min or 1½ min). A mithai or snack photo starts zoomed way in and zooms out over 10 seconds; the player taps its name from four choices on their phone. One point per right answer, most right wins. The turn ends with a photo recap of every food.

The food list lives in `foods.js`: 97 vegetarian sweets and snacks with other names, region, a lookalike group (so two near-identical foods are never offered together) and the spot where the zoom starts. Photos are in `food/`, credited in `food/CREDITS.md`. To add a food, drop a 4:3 photo in `food/` and add a line to `foods.js`.

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
The TV plays recorded Bollywood / bhangra tracks that change with the game: a party track in the lobby, a lighter bed while people talk, a driving bhangra track for Pehchaan Kaun? turns, and a celebration track for reveals and the finale. The music dips under the fanfares and drops low with a heartbeat drum during the verdict. Files are in `music/` (credits in `music/CREDITS.md`); if they can't load, the TV falls back to its built-in score. Phones never play music.
