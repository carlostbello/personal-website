// Homepage copy. DRAFT: structure-only placeholders built from the old
// about page. Every string here gets rewritten in the content pass.
// Run `npm run lint:copy` after editing.

export const home = {
  role: 'TK AI security engineer at TK Employer.',
  hello: 'Hi. I build AI for networks that never touch the internet.',
  work: {
    caption: 'By day',
    heading: 'AI that works offline',
    body: [
      'TK Most of my work is retrieval systems that run inside disconnected networks: the documents, the index and the model all live on the inside, and nothing calls out.',
      'TK I also speak at security conferences about what actually goes wrong when you deploy these systems.',
    ],
    talksLink: 'Talks',
  },
  lab: {
    heading: 'After hours',
    panels: [
      { caption: 'The homelab', line: 'TK Servers built from computers other people threw out.', href: '/projects/homelab' },
      { caption: 'The espresso rig', line: 'TK An Arduino graphs the pressure of every shot.', href: '/projects/espresso-rig' },
      { caption: 'The signal path', line: 'TK Guitars, basses and too much recording gear.', href: '/log' },
    ],
  },
  projects: { heading: 'Things I built', all: 'Every project' },
  log: { heading: 'The log', all: 'Every post' },
  narrator: {
    work: 'This is the day job.',
    lab: 'This is what happens after the day job.',
    projects: 'Pick one. Any one.',
    log: 'I write things down here.',
  },
  quips: ['Hey, that tickles.', 'Shot number four today. Do not ask.', 'Yes, the servers are under my desk.', 'OK, back to scrolling.'],
};
