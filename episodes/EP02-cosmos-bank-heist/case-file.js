/*
 * EP02 · The Cosmos Bank Heist — the Case File.
 * The board's whole contents, keyed to script lines (EP02-case-file-script.md). Every board scene,
 * close-up or on the narrator's wall, renders this one spec, so the board is identical on every return.
 * Load after uf-casefile.js. Editorial: people are silhouettes only; stamps state legal status exactly.
 */
'use strict';

const CASE = new UF.CaseFile({
  title: 'CASE FILE · COSMOS BANK',
  footnote: 'Case summary · sources shown in each chapter',
  width: 3400, height: 1500,
  columns: [
    { id: 'key', label: 'THE KEYBOARD' },
    { id: 'bank', label: 'INSIDE THE BANK' },
    { id: 'fix', label: 'THE FIXERS' },
    { id: 'crew', label: 'THE CREWS' },
    { id: 'cash', label: 'THE CASH' },
  ],
  rows: [{ id: 'dig', label: 'DIGITAL' }, { id: 'ppl', label: 'PEOPLE' }, { id: 'mon', label: 'MONEY' }],

  slots: [
    { id: '01', col: 'cash', row: 'ppl', kind: 'photo', icon: 'atm', image: null, at: 'L03',
      label: 'LOCATION', title: 'KOLHAPUR ATM', sub: 'SAT 11 AUG 2018',
      clips: [{ text: 'SAT · 15:00', icon: 'clock', tone: 'gold', at: 'L35' }] },

    { id: '02', col: 'bank', row: 'ppl', kind: 'doc', icon: 'bank', at: 'L14', question: 'Which bank?',
      label: 'VICTIM', title: 'Cosmos Co-operative Bank', sub: 'Pune · since 1906',
      clips: [
        { text: 'SWIFT · comes back Monday', icon: 'email', tone: 'blue', at: 'L22', until: 'L49' },
        { text: 'SWIFT · used Mon 13 Aug', icon: 'check', tone: 'green', at: 'L49' },
      ] },

    { id: '03', col: 'bank', row: 'dig', dx: -160, kind: 'doc', icon: 'email', at: 'L22', question: 'How did they get in?',
      label: 'ENTRY', title: 'Phishing email', sub: 'Malware into the network' },

    { id: '04', col: 'bank', row: 'dig', dx: 160, kind: 'doc', icon: 'switch', at: 'L19', question: 'Why did nobody see it?',
      label: 'SYSTEM', title: 'Proxy switch', sub: '"Always yes"' },

    { id: '05', col: 'fix', row: 'dig', kind: 'doc', icon: 'card', at: 'L28', question: 'Where did the cards come from?',
      label: 'TOOLS', title: 'Cloned cards', sub: 'Plain plastic · stolen data' },

    { id: '06', col: 'fix', row: 'ppl', kind: 'figure', figures: 1, at: 'L28', question: 'Who ran the crews abroad?',
      label: 'FIXER', title: 'Big Boss', sub: 'Dark-web forum · Feb 2018',
      fan: {
        at: 'L64', until: 'L68',
        items: [
          { title: 'BIG BOSS', dx: -300, dy: -122 }, { title: 'G', dx: 300, dy: -122 },
          { title: 'HABIBI', dx: -300, dy: 122 }, { title: 'BACKWOOD', dx: 300, dy: 122 },
        ],
        note: { title: 'SAME EMAIL ADDRESS', sub: 'Intel 471 research', dx: 0, dy: 236 },
      },
      flip: { at: 'L68', label: 'NAMED BY US DOJ', title: 'Ghaleb Alaumary', sub: 'Canada · arrested 2019' },
      stamps: [{ text: 'PLEADED GUILTY\n11 YRS 8 MO · 2021', tone: 'guilty', at: 'L68' }],
      clips: [
        { text: 'Restitution ordered · $16.3M to Cosmos', tone: 'gold', at: 'L68', strike: 'L68' },
        { text: 'Ordered ≠ recovered', tone: 'red', at: 'L68' },
      ] },

    { id: '07', col: 'crew', row: 'dig', kind: 'figure', figures: 2, at: 'L31', question: 'Who recruited them?',
      label: 'HANDLERS', title: 'Handlers · India', sub: 'Card data passed down a chain',
      stamps: [{ text: 'WANTED\n3 BELIEVED IN DUBAI', tone: 'wanted', at: 'L60' }],
      clips: [
        { text: 'Supervisor · live laptop', icon: 'computer', tone: 'gold', at: 'L40' },
        { text: 'Interpol Red Notice · 2020', tone: 'gold', at: 'L60' },
      ] },

    { id: '08', col: 'crew', row: 'ppl', kind: 'figure', figures: 3, at: 'L31', question: 'Who took the cash?',
      label: 'CREW', title: 'The mules', sub: 'Waiter · driver · shoe-maker',
      stamps: [
        { text: '18 ARRESTED\n2018', tone: 'neutral', at: 'L57' },
        { text: '11 CONVICTED\nPUNE · APR 2023', tone: 'convicted', at: 'L76' },
      ],
      clips: [{ text: '"Film extras"', tone: 'gold', at: 'L31' }] },

    { id: '09', col: 'cash', row: 'dig', kind: 'tag', tone: 'red', at: 'L46', question: 'How far did it go?',
      label: 'CASH-OUT', title: '28 countries · Visa', value: '₹78 CR', sub: '~12,000 withdrawals' },

    { id: '10', col: 'cash', row: 'mon', kind: 'tag', tone: 'red', at: 'L46', question: 'And at home?',
      label: 'CASH-OUT', title: 'India · RuPay', value: '₹2.5 CR', sub: '~2,849 withdrawals' },

    { id: '11', col: 'fix', row: 'mon', kind: 'tag', tone: 'red', at: 'L49', question: 'Where did the rest go?',
      label: 'SWIFT', title: 'Hong Kong · ALM Trading', value: '₹13.92 CR', sub: 'Mon 13 Aug · Hang Seng Bank',
      clips: [
        { text: '₹10+ cr frozen', tone: 'frozen', at: 'L60' },
        { text: '₹5.72 cr returned · 2020', tone: 'returned', at: 'L60' },
      ] },

    { id: '12', col: 'key', row: 'ppl', kind: 'figure', figures: 3, at: 'L71', question: 'Who wrote the code?',
      label: 'KEYBOARD', title: 'The hackers', sub: 'Named in US charges · 2021',
      stamps: [{ text: 'CHARGED\nNOT TRIED', tone: 'charged', at: 'L71' }] },

    // Pieces that are not slots of the twelve: no blank outline, not counted.
    { id: 'nk', col: 'key', row: 'mon', kind: 'note', count: false, tone: 'grey', at: 'L71',
      title: 'North Korea', sub: 'US allegation · denies involvement' },
    { id: 'fastcash', x: 1246, y: 640, kind: 'note', count: false, paper: true, at: 'L62',
      title: 'US alert · FASTCash', sub: 'CISA · 2 Oct 2018' },
    { id: 'q-small', x: 1410, y: 1400, w: 300, kind: 'note', count: false, tone: 'gold', at: 'L79',
      title: 'A bank too small to defend?' },
    { id: 'q-none', x: 2050, y: 1400, w: 300, kind: 'note', count: false, tone: 'gold', at: 'L79',
      title: 'An attack no bank could stop?' },
  ],

  threads: [
    { id: 'mules-atm', from: '08', to: '01', type: 'people', at: 'L31', label: 'At the machine' },
    { id: 'proxy-atm', from: '04', to: '01', type: 'data', at: 'L19', label: 'Approved', bend: -0.06 },
    { id: 'proxy-core', from: '04', to: '02', type: 'data', at: 'L19', mute: 'L19', label: 'Never asked' },
    { id: 'phish-proxy', from: '03', to: '04', type: 'data', at: 'L22' },
    { id: 'phish-bank', from: '03', to: '02', type: 'data', at: 'L22' },
    { id: 'bb-loose', from: '06', loose: [-90, 250], type: 'people', at: 'L28', until: 'L60' },
    { id: 'cards-mules', from: '05', to: '08', type: 'people', at: 'L31' },
    { id: 'handlers-mules', from: '07', to: '08', type: 'people', at: 'L31', label: 'Recruited' },
    { id: 'proxy-visa', from: '04', to: '09', type: 'data', at: 'L46', bend: -0.05 },
    { id: 'proxy-rupay', from: '04', to: '10', type: 'data', at: 'L46', bend: 0.08 },
    { id: 'bb-crews', from: '06', to: '09', type: 'people', at: 'L46', label: 'Crews · US + Canada' },
    { id: 'bank-hk', from: '02', to: '11', type: 'money', at: 'L49', label: 'SWIFT · ₹13.92 cr' },
    { id: 'bb-hackers', from: '06', to: '12', type: 'alleged', at: 'L60', label: 'US says linked', bend: 0.12 },
    { id: 'fast-proxy', from: 'fastcash', to: '04', type: 'data', at: 'L62', label: 'Match' },
    { id: 'hackers-phish', from: '12', to: '03', type: 'data', at: 'L71' },
    { id: 'hackers-nk', from: '12', to: 'nk', type: 'alleged', at: 'L71' },
  ],

  ledger: {
    title: 'THE MONEY', showEmpty: true,
    rows: [
      { id: 'visa', label: 'Visa ATMs abroad', value: '₹78.00 CR', at: 'L46' },
      { id: 'rupay', label: 'RuPay ATMs · India', value: '₹2.50 CR', at: 'L46' },
      { id: 'swift', label: 'SWIFT to Hong Kong', value: '₹13.92 CR', at: 'L49' },
      { id: 'stolen', label: 'Stolen', value: '₹94.42 CR', at: 'L52', total: true },
      { id: 'back', label: 'Returned · Hong Kong', value: '− ₹5.72 CR', tone: 'returned', at: 'L60' },
      { id: 'open', label: 'No public recovery figure', value: '₹88.70 CR', tone: 'red', total: true, at: 'L76' },
    ],
  },
});
