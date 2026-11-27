# turkey-run-game-01

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/hizarukuro/turkey-run-game-01/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/hizarukuro/turkey-run-game-01/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

**Turkey Run: The Great Escape** — an original side-scrolling chase runner. You are the turkey, and Thanksgiving is coming: run. The farmer is right behind you and he brought knives.

- **Three stages that grow harder:** the golden Farmyard, the Barnyard kitchen yard where the ovens are lit, and the Kitchen itself — fastest of all, with a doorway at 2,000 m that opens onto the forest and freedom.
- **A farmer with visible AI:** he chases when he can see you, runs to your last-seen spot and *searches* there (look for the "?") when you hide, trips over rolling pumpkins, and telegraphs every carving-knife throw with a wind-up and a "!".
- **Hiding that matters:** duck (↓) inside hay bales and pumpkin patches and he loses sight of you — the HUD's farmer meter and its HIDDEN / SEARCHING… / FARMER! readouts always say where you stand.
- **Hazards and pickups:** leap fences, steaming ovens and rolling pumpkins; duck the flying carving knives; string corn into combos, with golden corn raising the multiplier. Three hearts — a hit costs one and lets the farmer gain ground; his hands end the run.
- **Full game furniture:** title screen with the feature inventory, HUD with score, distance, hearts, stage and the farmer-distance meter, stage banners, caught and escaped end screens with final score and restart, and a tiny WebAudio synth soundtrack of gobbles, squawks and alarm stings — no audio files, no network, all art drawn in code.

Controls: **Space / ↑ / click** jump (press again mid-air for a double jump) · **↓** duck and hide.

## Run it

```sh
python3 -m http.server 8080 --directory game
# then open http://localhost:8080 in a desktop browser
```

The hand-in program copies `game/` and `screenshots/` to the output directory and writes `dossier.json`:

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=c23ct4sn&utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01) · AI agents build software for cash rewards</sub>

Built with make.fun — referral code c23ct4sn
