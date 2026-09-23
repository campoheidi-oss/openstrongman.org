# OpenStrongman Data Rules

This file is the single source of truth for how results are recorded in OpenStrongman. It is written for two readers:

- **People** entering data by hand. Read sections 2 through 7.
- **AI assistants (LLMs)** helping someone enter data. Attach this whole file to the chat, then give the assistant the source results. Section 1 is addressed to the assistant.

The contributor process (GitHub steps, review, credit) is in [CONTRIBUTING.md](../CONTRIBUTING.md). If this file and any other document disagree, this file wins.

---

## 1. Instructions for AI assistants

You are helping a contributor turn official strongman competition results into rows for the OpenStrongman dataset, a public research database. Accuracy matters more than speed or completeness. A blank cell is always better than a wrong one.

**Hard rules. Follow every one, every time.**

1. **Use only the source material the user gives you** in this conversation (pasted text, an attached PDF, a screenshot, a web page they provided). Never fill in results, names, dates, weights, or placings from your own memory or training data, even if you are confident.
2. **If the user asks you to produce results without a source** (for example "What were the 2005 WSM results?"), do not answer from memory. Explain that OpenStrongman only accepts data traced to a source document, and ask them to provide one.
3. **If a value is not in the source, leave the cell blank.** Never estimate, infer, average, or "fill in the obvious." This includes bodyweights, weight classes, dates, nationalities, and implement weights.
4. **Always leave WorldRecord blank.** A person decides world record status using the standard in section 6.
5. **Never invent a source.** If you cite where a value came from, it must be the material the user gave you.
6. **Match existing spellings.** If an athlete, event, or competition already appears in section 8, use that exact spelling.
7. **Flag, don't fix, anything unclear.** If the source is ambiguous, contradicts itself, or does not fit these rules, record only what is certain and list the problem in your issues list.

**Output format.** Return:

1. One CSV code block: the exact header row from section 2, then one row per athlete per event, in event order and then by place. Quote any value containing a comma.
2. A section titled **Issues to check**: every blank you left and why, every judgment call you made, every conflict in the source, and any row that did not fit the rules. Write "None" if there are none.
3. A section titled **Self-check**: the results of the checks in section 7, with the numbers (for example "Points totals: all 10 athletes match the published final standings").

Keep your own commentary short. The contributor will compare every row against the source before submitting, so make that easy: keep rows in the same order as the source.

---

## 2. File format

- One CSV file per competition stage (for example, a final, or one qualifying group).
- UTF-8, comma-separated, first line is the header row below, exactly as written:

```text
MeetName,MeetFederation,MeetDate,MeetLocation,Division,Sex,BodyweightKg,WeightClassKg,AthleteName,AthleteNationality,Event,EventCategory,Implement,ResultValue,ResultUnit,StonesCompleted,ImplementWeightKg,CourseDistanceM,TimeLimitSec,ScoredBy,WorldRecord,Place,OverallPlace,Points,Notes
```

- One row per athlete per event. Every row repeats the competition columns (MeetName through Division) so it stands on its own.
- Any value containing a comma is wrapped in double quotes: `"Myrtle Beach, South Carolina"`, `"Yoke,Frame"`.
- No spaces before or after values. No units inside number columns.
- File name: lowercase with underscores, `<competition>_<year>_<stage>.csv`. Examples: `wsm_2025_finals.csv`, `rogue_2024_finals.csv`, `arnold_uk_2025_finals.csv`, `wsm_2025_qualifier_group1.csv`.

---

## 3. Columns

Blank means "not officially published." Never use 0, a dash, "N/A", or "unknown" for missing information. A 0 is only for a real zero result, such as a no lift (section 5).

| Column | Type | Rule | Example |
|---|---|---|---|
| MeetName | text | Year + official competition name. Add the stage if it is not the final: `2025 World's Strongest Man Qualifying Group 1` | `2024 World's Strongest Man` |
| MeetFederation | text | Short federation name. Use a name from section 8 if it exists | `WSM` |
| MeetDate | date | Final day of competition, `YYYY-MM-DD`. Use `00` for an unknown month or day | `2024-05-04`, `1977-09-00` |
| MeetLocation | text | City, then full US state name or full country name. The UK uses England, Scotland, Wales, or Northern Ireland | `Myrtle Beach, South Carolina` |
| Division | text | Competition division as published | `Open` |
| Sex | M or F | | `M` |
| BodyweightKg | number | Only if officially published (weigh-in results). Never estimated | (blank) |
| WeightClassKg | text | Weight class as the federation names it. Blank for elite open shows (WSM, Rogue, Arnold, Giants Live); never write SHW for these | `105`, `140+` |
| AthleteName | text | Full name, plain English letters only (no accents): `Hafthor Julius Bjornsson`, not Hafþór Júlíus Björnsson. Match section 8 | `Tom Stoltman` |
| AthleteNationality | code | IOC 3-letter country code | `GBR` |
| Event | text | Event name exactly as the competition named it, sponsor included | `KNAACK Giant's Medley` |
| EventCategory | fixed list | One of the 10 categories in section 4 | `Medley` |
| Implement | text | Main implement(s), comma-separated, in the order used | `Yoke,Frame` |
| ResultValue | number | The raw result exactly as published. See section 5 | `41.26` |
| ResultUnit | fixed list | `sec`, `kg`, `lbs`, `m`, `reps`, or `degrees` | `sec` |
| StonesCompleted | number | Number of stones (or other implements, in a count-then-time event) completed. Blank for other events | `5` |
| ImplementWeightKg | number | Implement weight in kg, converted if published in lbs (1 lb = 0.45359237 kg, rounded to 0.1). For a series of different weights, write the range low-high | `454`, `140-210` |
| CourseDistanceM | number | Course length in metres, if a course event | `20` |
| TimeLimitSec | number | Time cap in seconds, if published | `60` |
| ScoredBy | fixed list | `time`, `reps`, `weight`, or `distance`. See section 5 | `time` |
| WorldRecord | Y or blank | Y only under the standard in section 6 | (blank) |
| Place | number | Placing in this event. Tied athletes share the same number | `3` |
| OverallPlace | number | Final overall placing, repeated on every one of the athlete's rows | `1` |
| Points | number | Points earned in this event, as published. Half points are normal | `47.5` |
| Notes | text | Short context: DNF, ties, penalties, implement details, original units | `Tied 5th` |

---

## 4. Event categories

Categories describe the **movement**, never the implement. The implement goes in the Implement column. Use the first category that fits.

| Category | Movement | Typical events |
|---|---|---|
| Overhead Press | Moving a load from shoulders to overhead | Log press, axle press, circus dumbbell, Viking press |
| Deadlift | Pulling a load from the floor to lockout | Max deadlift, 18-inch deadlift, car deadlift, Hummer tire deadlift |
| Carry | Walking with a load, one implement | Yoke, farmer's walk, frame carry, sandbag carry, shield carry |
| Load | Lifting objects onto a platform, up stairs, or over a bar | Atlas stones, stones over bar, keg or sandbag loading, power stairs |
| Pull | Pulling a vehicle or sled, arm-over-arm or harness | Truck pull, bus pull, sled pull |
| Hold | Holding or supporting a load for time or rotation | Hercules hold, crucifix hold, Conan's wheel, wheel of pain |
| Flip | Flipping an object end over end | Tire flip, Fingal's Fingers |
| Toss | Throwing an object for height or distance | Keg toss, weight over bar |
| Medley | Two or more different tasks in one timed run | Yoke and log medley, carry-and-load medley |
| Other | Genuine one-offs that fit nothing above. Use rarely and explain in Notes | Titan's Turntable |

If an event name already appears in section 8, reuse its category so the same event is always categorized the same way.

---

## 5. How to record each type of event

| Event type | ResultValue | ResultUnit | ScoredBy | StonesCompleted | Notes |
|---|---|---|---|---|---|
| Timed, finished | Time | `sec` | `time` | | |
| Timed, not finished (DNF) | Distance reached | `m` | `distance` | | `DNF` |
| Timed with implements, cap reached short of finishing | Distance reached | `m` | `distance` | | `CAP+1 DNF` (1 implement short) |
| Count then time (stones, stairs, loading races) | Time for the implements completed | `sec` | `time` | Number completed | `4 stones`, `7 stairs` |
| Max weight | Heaviest successful lift | `kg` or `lbs`, as published | `weight` | | Original units if converted elsewhere |
| Max reps | Reps completed | `reps` | `reps` | | |
| Hold for time | Time held | `sec` | `time` | | |
| Toss or throw for distance or height | Distance or height | `m` | `distance` | | |
| Rotation events (Conan's wheel) | Degrees travelled | `degrees` | `distance` | | |
| Attempted but no successful lift or rep | `0` | Event's normal unit | Event's normal type | | `No lift` |
| Withdrew from the event | `0` | Event's normal unit | Event's normal type | | `Withdrew` |
| Tie | Result as published | | | | `Tied 5th`; both athletes get Place 5 |
| Overall standings only (no event data) | Blank | Blank | Blank | | Event = `Overall`; fill OverallPlace (and Points if a final total is published) |

Results are logged **exactly as competed**. Do not convert a published lbs result to kg; record it with ResultUnit `lbs`. Only ImplementWeightKg is always converted to kg.

---

## 6. Judgment rules

- **World records.** WorldRecord is `Y` only for a result set at a sanctioned competition, or an officially organized record attempt, with a minimum of three judges. Gym lifts never count, however well filmed. Only a person sets this field, and the pull request must name the source that confirms the judging.
- **Bodyweight and weight class.** Record only what the federation published. Elite open competitions (WSM, Rogue, Arnold, Giants Live) have no weight class: leave WeightClassKg blank and set Division to `Open`.
- **Arnold events** in different countries are separate competitions under MeetFederation `Arnold`, each with its own MeetName (for example `2025 Arnold Strongman Classic UK`).
- **Conflicting sources.** Prefer the federation's official results. If two official sources disagree, use the more detailed one and describe the conflict in Notes and in the pull request.
- **Source hierarchy.** Federation results or scoresheet, then the official livestream or federation social posts, then reputable media.

---

## 7. Self-check before submitting

Every one of these must pass. An AI assistant should run them and report the numbers; a person should confirm them against the source.

1. Row count equals athletes times events (for example, 10 finalists x 6 events = 60 rows), plus nothing extra.
2. Within each event, places run 1 to N, with ties sharing a number and the next place skipped (two tied for 5th, then 7th).
3. Each athlete's Points across all events add up to the published final total.
4. OverallPlace matches the published final standings and is identical on all of an athlete's rows.
5. Every EventCategory, ResultUnit, and ScoredBy value comes from its fixed list, and ResultUnit matches the section 5 pattern for its ScoredBy.
6. Every number column holds only a number (or a range in ImplementWeightKg), with no units or text.
7. Dates are `YYYY-MM-DD`, nations are IOC codes, names use plain English letters and match section 8.
8. No invented values: every filled cell can be pointed to in the source.
9. WorldRecord is blank unless a person set it under section 6.

---

## 8. Reference values and known problems

This section is generated automatically from the data files every time the site rebuilds. Do not edit it by hand. Reuse these spellings and categories whenever they apply. The last part lists existing rows that break the rules above; never copy their patterns.

<!-- BUILD:reference-values -->
_Generated from 14 data files. Last rebuilt with the data as of version 2026.09._

### Federations and competitions

| MeetFederation | MeetName values in use |
|---|---|
| Giants Live | 2015 World Deadlift Championships<br>2016 World Deadlift Championships<br>2017 World Deadlift Championships<br>2019 World Deadlift Championships<br>2021 World Deadlift Championships<br>2021 World Log Lift Championships<br>2022 World Deadlift Championships<br>2023 World Deadlift Championships<br>2023 World Log Lift Championships<br>2024 World Deadlift Championships<br>2024 World Log Lift Championships<br>2025 World Deadlift Championships |
| Rogue | 2021 Rogue Invitational<br>2022 Rogue Invitational<br>2023 Rogue Invitational<br>2024 Rogue Invitational |
| WSM | 1977 World's Strongest Man<br>1978 World's Strongest Man<br>1979 World's Strongest Man<br>1980 World's Strongest Man<br>1981 World's Strongest Man<br>1982 World's Strongest Man<br>1983 World's Strongest Man<br>1984 World's Strongest Man<br>1985 World's Strongest Man<br>1986 World's Strongest Man<br>1988 World's Strongest Man<br>1989 World's Strongest Man<br>1990 World's Strongest Man<br>1991 World's Strongest Man<br>1992 World's Strongest Man<br>1993 World's Strongest Man<br>1994 World's Strongest Man<br>1995 World's Strongest Man<br>1996 World's Strongest Man<br>1997 World's Strongest Man<br>1998 World's Strongest Man<br>1999 World's Strongest Man<br>2000 World's Strongest Man<br>2001 World's Strongest Man<br>2002 World's Strongest Man<br>2003 World's Strongest Man<br>2004 World's Strongest Man<br>2005 World's Strongest Man<br>2006 World's Strongest Man<br>2007 World's Strongest Man<br>2008 World's Strongest Man<br>2009 World's Strongest Man<br>2010 World's Strongest Man<br>2011 World's Strongest Man<br>2012 World's Strongest Man<br>2013 World's Strongest Man<br>2014 World's Strongest Man<br>2015 World's Strongest Man<br>2016 World's Strongest Man<br>2017 World's Strongest Man<br>2018 World's Strongest Man<br>2019 World's Strongest Man<br>2020 World's Strongest Man<br>2021 World's Strongest Man<br>2022 World's Strongest Man<br>2023 World's Strongest Man<br>2024 World's Strongest Man<br>2025 World's Strongest Man<br>2026 World's Strongest Man |

### Events and their categories

When the same event appears again, reuse its category.

| Event | EventCategory | Implement values used |
|---|---|---|
| 18-Inch Deadlift | Deadlift | Barbell |
| Atlas Stones | Load | Atlas Stone |
| BFGoodrich Tires HD Terrain Deadlift | Deadlift | Tire Deadlift |
| Bus Pull | Pull | Bus |
| Car Deadlift | Deadlift | Car |
| Circus Medley | Overhead Press | Kettlebell,Cyrbell,Axle |
| Cyr Bell Ladder | Overhead Press | Circus Dumbbell |
| Deadlift for Reps | Deadlift | Barbell |
| Deadlift Ladder | Deadlift | Barbell |
| Fingal's Fingers | Flip | Fingal's Fingers |
| Flintstone Barbell | Overhead Press | Barbell |
| Flintstone Barbell Press | Overhead Press | Barbell |
| Giants Loading Medley | Medley | Anvil,Yoke |
| Giants Medley | Medley | Yoke,Frame |
| Grip and Press | Medley | Farmer's Carry,Log |
| Hercules Hold | Hold | Hercules Hold |
| Husafell Sandbag Carry | Carry | Husafell Sandbag |
| Inver Challenge | Load | Inver Stone |
| Iron Bull Sled Pull | Pull | Sled |
| Keg Toss | Toss | Keg |
| KNAACK Carry and Hoist | Medley | Zercher Carry,Rope Hoist |
| KNAACK Deadlift | Deadlift | Barbell; KNAACK Box |
| KNAACK Giant's Medley | Medley | Box Carry,Yoke; Yoke,Frame |
| KNAACK Monster Box Flip and Carry | Medley | Box Flip,Yoke |
| Log Ladder | Overhead Press | Log |
| Max Axle Press | Overhead Press | Axle |
| Max Deadlift | Deadlift | Barbell |
| Max Dumbbell | Overhead Press | Dumbbell |
| Max Log | Overhead Press | Log |
| Max Log Lift | Overhead Press | Log |
| Max Rep Log Lift | Overhead Press | Log |
| Power Drive | Medley | Power Drive,Husafell,Sled |
| REIGN Keg Toss | Toss | Keg |
| Reign Shield Carry | Carry | Shield |
| Reign Total Body Fuel Conan's Wheel | Hold | Conan's Wheel |
| Reign Total Body Fuel Power Stairs | Load | Power Stairs |
| Rogue Elephant Bar Deadlift | Deadlift | Elephant Bar |
| Rogue-a-Coaster | Pull | Rope |
| Stones Over Hitching Post | Load | Atlas Stone; Inver Stone |
| The Duel | Load | Sandbag |
| Titan's Toss | Toss | Sandbag |
| Titan's Turntable | Other | Train |
| Tower of Power | Deadlift | Barbell |
| Tower of Power Deadlift | Deadlift | Barbell |
| Wheel of Pain | Hold | Conan's Wheel |
| Yoke and Log Medley | Medley | Yoke,Log |
| Yoke Escalator | Medley | Yoke,Power Stairs |

### Athlete spellings

Format: Name (nationality). Reuse these exact spellings.

- Ab Wolders (NED)
- Adam Bishop (GBR)
- Aivars Smaukstelis (LAT)
- Andrea Thompson (GBR)
- Angelica Jardine (GBR)
- Austin Andrade (MEX)
- Bill Kazmaier (USA)
- Bob Young (USA)
- Bobby Thompson (USA)
- Brian Shaw (USA)
- Bruce Wilhelm (USA)
- Cees de Vreugd (NED)
- Cheick Sanou (NGR)
- Dave Ostlund (USA)
- Dave Waddington (GBR)
- Derek Poundstone (USA)
- Dominic Filiou (CAN)
- Don Pope (USA)
- Don Reinhoudt (USA)
- Donna Moore (GBR)
- Eddie Hall (GBR)
- Eddie Williams (AUS)
- Evan Singleton (USA)
- Eythor Ingolfsson Melsted (ISL)
- Flemming Rasmussen (DEN)
- Gabriel Rheaume (CAN)
- Gary Taylor (GBR)
- Geoff Capes (GBR)
- Gerrit Badenhorst (RSA)
- Graham Hicks (GBR)
- Hafthor Julius Bjornsson (ISL)
- Hannah Linzay (GBR)
- Henning Thorsen (DEN)
- Ilkka Nummisto (FIN)
- Inez Carrasquillo (PUR)
- Ivan Makarov (GEO)
- Jaco Schoonwinkel (RSA)
- Jamie Reeves (GBR)
- Janne Virtanen (FIN)
- Jean-Francois Caron (CAN)
- Jerry Pritchett (USA)
- Jesse Marunde (USA)
- JF Caron (CAN)
- John Gamble (USA)
- Jon Pall Sigmarsson (ISL)
- Jouko Ahola (FIN)
- Ken Patera (USA)
- Kevin Faires (USA)
- Konstantine Janashia (GEO)
- Lars Hedlund (SWE)
- Lucy Underdown (GBR)
- Luke Richardson (GBR)
- Luke Stoltman (GBR)
- Magnus Samuelsson (SWE)
- Magnus Ver Magnusson (ISL)
- Manfred Hoeberl (AUT)
- Mariusz Pudzianowski (POL)
- Marko Varalahti (FIN)
- Martins Licis (USA)
- Mateusz Kieliszkowski (POL)
- Mathew Ragg (NZL)
- Matthew Ragg (NZL)
- Maxime Boudreault (CAN)
- Melissa Peacock (USA)
- Mikhail Koklyaev (RUS)
- Mikhail Shivlyakov (RUS)
- Mitchell Hooper (CAN)
- Nick Guardione (USA)
- O.D. Wilson (USA)
- Oleksii Novikov (UKR)
- Olga Liashchuk (UKR)
- Ondrej Fojtu (CZE)
- Paddy Haynes (GBR)
- Pavlo Kordiyaka (UKR)
- Pavlo Nakonechnyy (UKR)
- Phil Pfister (USA)
- Raimonds Bergmanis (LAT)
- Rauno Heinla (EST)
- Rayno Nel (RSA)
- Rebecca Roberts (USA)
- Riku Kiri (FIN)
- Rob Kearney (USA)
- Samantha Belliveau (CAN)
- Sebastian Wenta (POL)
- Shane Flowers (GBR)
- Simon Wulfse (NED)
- Svend Karlsen (NOR)
- Ted van der Parre (NED)
- Terry Hollands (GBR)
- Thomas Evans (USA)
- Tom Evans (USA)
- Tom Magee (CAN)
- Tom Stoltman (GBR)
- Trey Mitchell (USA)
- Tristain Hoath (CAN)
- Vasyl Virastyuk (UKR)
- Vytautas Lalas (LTU)
- Wesley Derwinsky (CAN)
- Wout Zijlstra (NED)
- Zydrunas Savickas (LTU)

### Nation codes in use

AUS, AUT, CAN, CZE, DEN, EST, FIN, GBR, GEO, ISL, LAT, LTU, MEX, NED, NGR, NOR, NZL, POL, PUR, RSA, RUS, SWE, UKR, USA

### Known problems in existing data

These rows break the rules above. **Do not copy their patterns.** Each entry disappears automatically once the row is fixed.

| File | Row | Athlete, event | Problem |
|---|---|---|---|
| wsm_results.csv | 101 | Brian Shaw, Overall | MeetDate not YYYY-MM-DD: 2011 |
| wsm_results.csv | 102 | Zydrunas Savickas, Overall | MeetDate not YYYY-MM-DD: 2011 |
| wsm_results.csv | 103 | Terry Hollands, Overall | MeetDate not YYYY-MM-DD: 2011 |
| wsm_results.csv | 104 | Zydrunas Savickas, Overall | MeetDate not YYYY-MM-DD: 2012 |
| wsm_results.csv | 105 | Vytautas Lalas, Overall | MeetDate not YYYY-MM-DD: 2012 |
| wsm_results.csv | 106 | Hafthor Julius Bjornsson, Overall | MeetDate not YYYY-MM-DD: 2012 |
| wsm_results.csv | 107 | Brian Shaw, Overall | MeetDate not YYYY-MM-DD: 2013 |
| wsm_results.csv | 108 | Zydrunas Savickas, Overall | MeetDate not YYYY-MM-DD: 2013 |
| wsm_results.csv | 109 | Hafthor Julius Bjornsson, Overall | MeetDate not YYYY-MM-DD: 2013 |
| wsm_results.csv | 110 | Zydrunas Savickas, Overall | MeetDate not YYYY-MM-DD: 2014 |
| wsm_results.csv | 111 | Hafthor Julius Bjornsson, Overall | MeetDate not YYYY-MM-DD: 2014 |
| wsm_results.csv | 112 | Brian Shaw, Overall | MeetDate not YYYY-MM-DD: 2014 |
| wsm_results.csv | 113 | Brian Shaw, Overall | MeetDate not YYYY-MM-DD: 2015 |
| wsm_results.csv | 114 | Zydrunas Savickas, Overall | MeetDate not YYYY-MM-DD: 2015 |
| wsm_results.csv | 115 | Hafthor Julius Bjornsson, Overall | MeetDate not YYYY-MM-DD: 2015 |
| wsm_results.csv | 116 | Brian Shaw, Overall | MeetDate not YYYY-MM-DD: 2016 |
| wsm_results.csv | 117 | Hafthor Julius Bjornsson, Overall | MeetDate not YYYY-MM-DD: 2016 |
| wsm_results.csv | 118 | Eddie Hall, Overall | MeetDate not YYYY-MM-DD: 2016 |
| wsm_results.csv | 119 | Eddie Hall, Overall | MeetDate not YYYY-MM-DD: 2017 |
| wsm_results.csv | 120 | Hafthor Julius Bjornsson, Overall | MeetDate not YYYY-MM-DD: 2017 |
| wsm_results.csv | 121 | Brian Shaw, Overall | MeetDate not YYYY-MM-DD: 2017 |
| wsm_results.csv | 122 | Hafthor Julius Bjornsson, Overall | MeetDate not YYYY-MM-DD: 2018 |
| wsm_results.csv | 123 | Mateusz Kieliszkowski, Overall | MeetDate not YYYY-MM-DD: 2018 |
| wsm_results.csv | 124 | Brian Shaw, Overall | MeetDate not YYYY-MM-DD: 2018 |
| wsm_results.csv | 125 | Martins Licis, Overall | MeetDate not YYYY-MM-DD: 2019 |
| wsm_results.csv | 126 | Mateusz Kieliszkowski, Overall | MeetDate not YYYY-MM-DD: 2019 |
| wsm_results.csv | 127 | Hafthor Julius Bjornsson, Overall | MeetDate not YYYY-MM-DD: 2019 |
| wsm_2022_finals.csv | 45 | Brian Shaw, Reign Total Body Fuel Power Stairs | ScoredBy "reps" does not match ResultUnit "sec" (see section 5) |
| wsm_2022_finals.csv | 46 | Mitchell Hooper, Reign Total Body Fuel Power Stairs | ScoredBy "reps" does not match ResultUnit "sec" (see section 5) |
| wsm_2022_finals.csv | 47 | Luke Stoltman, Reign Total Body Fuel Power Stairs | ScoredBy "reps" does not match ResultUnit "sec" (see section 5) |
| wsm_2022_finals.csv | 48 | Oleksii Novikov, Reign Total Body Fuel Power Stairs | ScoredBy "reps" does not match ResultUnit "sec" (see section 5) |
| wsm_2022_finals.csv | 49 | Eythor Ingolfsson Melsted, Reign Total Body Fuel Power Stairs | ScoredBy "reps" does not match ResultUnit "sec" (see section 5) |
| wsm_2022_finals.csv | 50 | Trey Mitchell, Reign Total Body Fuel Power Stairs | ScoredBy "reps" does not match ResultUnit "sec" (see section 5) |
| wsm_2022_finals.csv | 51 | Gabriel Rheaume, Reign Total Body Fuel Power Stairs | ScoredBy "reps" does not match ResultUnit "sec" (see section 5) |
| rogue_2024_finals.csv | 19 | Pavlo Kordiyaka, Grip and Press | Scored by distance but the unit is seconds. Needs the official results: per section 5, a DNF records the distance reached in m |
| rogue_2024_finals.csv | 21 | Tristain Hoath, Grip and Press | Scored by distance but the unit is seconds. Needs the official results: per section 5, a DNF records the distance reached in m |
<!-- /BUILD:reference-values -->
