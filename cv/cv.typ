// CV source — compile from the repo root with:
//   typst compile --root . cv/cv.typ cv.pdf
// Publications come from cv/publications.yaml.

#let blue = rgb("#0e6fa8")
#let teal = rgb("#1f9e78")
#let muted = rgb("#5a6b78")
#let owner = "W Lehn-Schiøler"

#let updated = datetime.today().display("[month repr:long] [year]")

#set document(title: "William Theodor Lehn-Schiøler — CV", author: "William Theodor Lehn-Schiøler")
#set page(
  paper: "a4",
  margin: (x: 1.9cm, top: 1.7cm, bottom: 1.6cm),
  footer: context [
    #set text(size: 7.5pt, fill: muted)
    William Theodor Lehn-Schiøler · CV · updated #updated
    #h(1fr)
    #counter(page).display("1 / 1", both: true)
  ],
)
#set text(font: "Libertinus Serif", size: 10.5pt, lang: "en")
#set par(justify: false, leading: 0.55em)
#show link: set text(fill: blue)

// ── Building blocks ────────────────────────────────────────────────
#let section(title) = {
  v(16pt)
  text(size: 9.5pt, weight: "bold", fill: blue, tracking: 0.12em, upper(title))
  v(-5pt)
  line(length: 100%, stroke: 0.5pt + blue.lighten(60%))
  v(2pt)
}

#let entry(org, place: none, role: none, dates, body: none) = {
  block(breakable: false, above: 11pt, below: 0pt)[
    #grid(
      columns: (1fr, auto),
      [*#org*#if place != none [, #place]#if role != none [ — _#role _]],
      text(size: 8.5pt, fill: muted, upper(dates)),
    )
    #if body != none {
      v(-1pt)
      set text(size: 10pt)
      body
    }
  ]
}

#let bold-owner(authors) = {
  let parts = authors.split(owner)
  parts.enumerate().map(((i, p)) => {
    if i > 0 { strong(owner) }
    p
  }).join()
}

#let pub(p) = {
  block(breakable: false, above: 10pt, below: 0pt)[
    #grid(
      columns: (1fr, auto),
      column-gutter: 8pt,
      [
        #if "url" in p [#link(p.url)[#text(fill: black, weight: "semibold", p.title)]] else [#text(weight: "semibold", p.title)] \
        #text(size: 9.3pt, fill: muted)[#bold-owner(p.authors)] \
        #text(size: 9.3pt)[_#p.venue _]
      ],
      align(right, text(size: 8.5pt, fill: muted)[
        #p.year
        #if "citations" in p [ \ #text(fill: teal)[#p.citations cit.]]
      ]),
    )
  ]
}

// ── Header ─────────────────────────────────────────────────────────
#text(size: 24pt, weight: "bold")[William Theodor Lehn-Schiøler]
#v(-8pt)
#text(size: 11pt, fill: muted)[Industrial PhD Student · BrainCapture & DTU Health Tech]
#v(-4pt)
#text(size: 9.5pt)[
  #link("mailto:willehn@gmail.com")[willehn\@gmail.com] ·
  #link("https://willsth.github.io")[willsth.github.io] ·
  #link("https://www.linkedin.com/in/williamtheodor/")[LinkedIn] ·
  #link("https://scholar.google.com/citations?user=7K_-v1UAAAAJ")[Google Scholar]
]

#v(6pt)
#text(size: 10pt)[
  Researcher building large EEG foundation models for clinical use. My work combines self-supervised
  learning and explainable AI to turn neural representations into transparent, actionable insights for
  clinicians — with the aim of automating EEG interpretation and making neurological diagnostics
  available in resource-limited settings.
]

// ── Experience ─────────────────────────────────────────────────────
#section("Experience")

#entry("BrainCapture", place: "Lyngby", role: "Industrial PhD Student", "Sep 2025 – present",
  body: [
    In collaboration with DTU Health Tech (Digital Health). Developing large-scale EEG foundation models
    and methods to interpret them — including sparse-autoencoder–based mechanistic interpretability,
    cross-domain pretraining on sleep data, and point-of-care tools such as real-time electrode detection.
    Co-supervising BSc/MSc theses and special courses at DTU.
  ])

#entry("BrainCapture", place: "Lyngby", role: "Data Scientist", "Jan 2021 – Aug 2025",
  body: list(
    spacing: 5pt,
    [Led the design and development of *large-scale machine learning systems* for EEG analysis in
      *Python*, aimed at bridging diagnostic gaps in resource-limited areas.],
    [Drove *research-to-production integration*, translating ML prototypes into robust, optimised
      features in the core product.],
    [Applied *explainable AI* (concept-based explainability) to improve model transparency on
      medical-device data.],
    [Contributed to clinical evaluation of low-cost EEG, including field studies in Kenya.],
  ))

#entry("DIS – Study Abroad in Scandinavia", place: "Copenhagen", role: "External Lecturer", "Jan 2024 – Jun 2024")

#entry("DTU Compute", place: "Lyngby", role: "Teaching Assistant", "Feb 2022 – Dec 2023",
  body: [
    02463 Active Machine Learning, 02464 Human Cognition and AI, 02471 Machine Learning for Signal
    Processing — communicating technical material clearly to undergraduate and graduate students.
  ])

// ── Education ──────────────────────────────────────────────────────
#section("Education")

#entry("Technical University of Denmark", role: "MSc Mathematical Modelling and Computing", "Sep 2022 – Dec 2024")
#entry("École Polytechnique – Université Paris-Saclay", role: "Exchange semester", "Sep 2021 – Jan 2022",
  body: [Double Majeure Mathématiques & Informatique])
#entry("Technical University of Denmark", role: "BSc Artificial Intelligence and Data", "Sep 2019 – Jun 2022")

// ── Volunteer ──────────────────────────────────────────────────────
#section("Volunteer Experience")

#entry("Technical University Hospital", place: "Copenhagen", role: "Student Ambassador", "Apr 2026 – present")
#entry("Copenhagen MedTech", place: "Copenhagen", role: "Board Member & Chairman", "Sep 2022 – Dec 2024")

// ── Publications ───────────────────────────────────────────────────
#let pubs = yaml("publications.yaml")

#pagebreak()
#v(-16pt)

#section("Publications")
#text(size: 8.5pt, fill: muted)[
  Full and up-to-date list on #link("https://scholar.google.com/citations?user=7K_-v1UAAAAJ")[Google Scholar]
  and #link("https://willsth.github.io/publications.html")[willsth.github.io/publications].
]

#v(4pt)
#text(size: 9.5pt, weight: "bold", fill: teal)[Preprints & under review]
#for p in pubs.preprints { pub(p) }

#v(12pt)
#text(size: 9.5pt, weight: "bold", fill: teal)[Peer-reviewed]
#for p in pubs.peer_reviewed { pub(p) }
