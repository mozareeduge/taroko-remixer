# What Is TAROKO REMIXER?

Mohammad Zare (Mozare) · TAROKO REMIXER v1.0.4 · https://taroke-remixer.theblackbirdfield.com/

---

## Statement

In 2009 Nick Montfort wrote *Taroko Gorge*, a short program, first in Python and then in JavaScript, that generates a nature poem without end. The JavaScript version keeps its word lists in plain view in the page source. Within a few years the poem had become the ground of a remix ecosystem: Scott Rettberg's *Tokyo Garage*, Talan Memmott's *Toy Garbage*, Mark Sample's *Takei, George*, J.R. Carpenter's *Along the Briny Beach* and many more, each one a copy of the page with the words changed and, sometimes, the rules.

At the Electronic Literature Organization's 2012 conference, a panel of these remixers discussed how this happened (*Taroko Gorge Remixed: Repetition and Difference in Machine Texts*, 21 June 2012, West Virginia University). Several speakers located a reason in the simplicity of the code. Mark Sample, chairing, described *Taroko Gorge* as "lean and elegantly coded with self-evident algorithms and a clearly demarcated word list" and said that "simply altering the word list ... creates an entirely different, randomly generated poem, while the underlying sentence structure ... remains the same." Sonny Rae Tempest, speaking "from a non-academic place," said: "I don't know how to program in JavaScript. But I used Taroko Gorge as a template," and added that "the code is simple enough that I can show my metalhead friends the input and the output, and they can go and do this themselves." The poem could be remade by people who were not programmers, because what had to be changed was visible and small.

TAROKO REMIXER follows that aspect of *Taroko Gorge* toward no-code creation tools. The choices a remixer made by editing the source become modules in an interface: Banks of Materials with weights and roles; Forms that inflect each Material; Instruments whose weighted Routes build lines from those Materials; Stanzas and a Flow that order the Instruments in time; Rules that change a line when stated conditions are met; a Performance surface where the poem runs and where any line can be taken apart to show how it was made. Each module is configured through fields and choices, and the modules are wired to one another by name, so that a person can design a working poem-machine, run it, and export it as a standalone HTML work without writing a line of code. Fifteen historical remixes are bundled as starting points; opening one makes a new derivative project and leaves the original untouched.

This continues a movement that runs through programming itself. Every programming language is an interface over a more basic one, and each layer lets more people state what they want a machine to do without stating how the layer beneath does it. No-code takes that track one step further toward accessibility. The procedure does not disappear in TAROKO REMIXER: Banks, weights, Routes, Rules and timing remain the composition of the poem, and the app shows them. What changes is the medium in which a maker meets them.

I use the word platform in the sense developed by Montfort and Ian Bogost in *Racing the Beam: The Atari Video Computer System* (MIT Press, 2009) and in the Platform Studies series they edit at MIT Press: a computational system whose design makes some kinds of work possible and shapes the works made on it. TAROKO REMIXER is itself such a platform. It makes one family of works possible, the procedural e-poem built from banks, routes and rules, and it allows an open-ended number of them, each one a remix.

The same panel also holds a caution. Montfort said there: "I spent literally years creating very elaborate systems explicitly for people to use as platforms to modify. ... practically no one modified them. Then, something I wrote in one day in Python ... takes off." His "platforms" there are kits offered for others to modify, a narrower, everyday sense than the platform-studies sense above. A tool built for remixing cannot assume that people will remix with it. The remix ecosystem grew around a poem that was small enough to read whole, so the test for TAROKO REMIXER is whether its modules stay as readable as that word list was.

---

## What the app is

A static, local-first browser application in one file (`next2/index.html`). It runs at https://taroke-remixer.theblackbirdfield.com/ or from a local copy; there is no server, no account and no build step.

The navigator holds nine chambers:

| Chamber | What it controls |
|---------|-----------------|
| **00 · Intakes** | *Ready to remix*: 15 validated baselines from the *Taroko Gorge* lineage. *Ecosystem*: all 35 records, including procedure records, witnesses and reference links. *Start from this intake* opens a baseline as a derivative project. |
| **01 · Source** | Identity, lineage, statement and public attribution; the provenance of a project started from an intake. |
| **02 · Materials** | Banks of Materials, each with a weight and a role; bulk paste. |
| **03 · Forms** | Base, plural, possessive and compound forms of each Material, a global case policy, and in-place overrides. |
| **04 · Instruments** | Line-making Instruments: Inputs that receive Materials and weighted Routes that build lines from `{input:form}` templates; Route tests. |
| **05 · Composition** | Stanzas built from Instruments and Breaths, and the Flow that arranges them (once, loop, or by chance). |
| **06 · Rules** | Typed conditions (Bank, Material, Instrument, Route, runtime) and an action that appends, prepends or replaces text; Rule tests. |
| **07 · Performance** | Run, Pause, Stop and Step; the Surface; *Unmix* for a selected line; Takes; revisions of a line under the current settings. |
| **08 · Archive** | Preview and export as standalone HTML: *Dynamic* (the audience can keep generating) or *Static* (a fixed reading of the current Surface). |

**Save project** downloads the editable project as a `.taroke.json` file; **Open project** reopens one, and converts projects from the pre-v1 (v07) editor to the v1 model, listing what changed. Every edit is also kept as a browser recovery copy in `localStorage`, and an unsaved session is recovered on the next visit; the saved project file remains the durable archive.

---

## What it is not

- **Not a general-purpose no-code builder.** It is a platform for one family of works: procedural poems built from banks, routes, stanzas and rules in the *Taroko Gorge* lineage.
- **Not an AI text-generation service.** Lines are built from authored Materials by weighted selection. No language model is involved.
- **Not a cloud service.** Nothing is sent anywhere; no account is needed. The browser's `localStorage` holds only the local recovery copy.
- **Not a replacement for the original works.** The bundled baselines are reconstructions for remixing. The original works, and their rights, belong to their authors; see [RIGHTS.md](../RIGHTS.md).

## Sources

- Montfort, Nick. *Taroko Gorge*. 2009. https://nickm.com/taroko_gorge/
- *Taroko Gorge Remixed: Repetition and Difference in Machine Texts*. Panel, Electronic Literature Organization Conference, West Virginia University, Morgantown, 21 June 2012. Speakers quoted: Mark Sample (chair), Sonny Rae Tempest, Nick Montfort. Quotations are from a transcript of the session audio archived by Christopher T. Funkhouser ("Funk's SoundBox 2012").
- Montfort, Nick, and Ian Bogost. *Racing the Beam: The Atari Video Computer System*. MIT Press, 2009. Platform Studies series.
