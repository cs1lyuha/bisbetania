// Iconițele redesign-ului, desenate în SVG pe grila de 24 (stilul Lucide: contur 2, capete rotunjite).
// Le ținem aici, nu din pachetul lucide-react-native: acela ar pune în aplicație ~1500 de iconițe pentru ~30 folosite.
//
// Multe trasee sunt din Lucide (https://lucide.dev), sub licența ISC:
//   Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT).
//   All other copyright (c) for Lucide are held by Lucide Contributors 2022.
//   Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee
//   is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.
// Cele marcate „propriu” (mâinile în rugăciune, rugul aprins, inima cu Cuvântul, trei persoane, podiumul)
// nu există în Lucide și sunt desenate pentru aplicație.
import React from 'react';
import Svg, { Path } from 'react-native-svg';

const circle = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
const rect = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${2 * r - w}a${r} ${r} 0 0 1 ${-r} ${-r}v${2 * r - h}a${r} ${r} 0 0 1 ${r} ${-r}z`;

const FLAME = 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z';
const STAR =
  'M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z';
const HEART = 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z';

const ICONS = {
  // Realizări
  flame: [FLAME],
  'flame-filled': [FLAME],
  'flame-kindling': ['M12 2c1 3 2.5 3.5 3.5 4.5A5 5 0 0 1 17 10a5 5 0 1 1-10 0c0-.3 0-.6.1-.9a2 2 0 1 0 3.3-2C8 4.5 11 2 12 2Z', 'm5 22 14-4', 'm5 18 14 4'],
  // propriu: flacăra deasupra tufișului
  'burning-bush': ['M12 2.5c1.2 1.9 3 3.1 3 5.4a3 3 0 0 1-6 0c0-1.6.9-2.6 1.8-3.5', 'M12 7.2c.6.8 1 1.3 1 2a1 1 0 0 1-2 0c0-.7.4-1.2 1-2Z', 'M4 21a8 8 0 0 1 16 0', 'M8 21a4 4 0 0 1 8 0'],
  'calendar-check': ['M8 2v4', 'M16 2v4', rect(3, 4, 18, 18, 2), 'M3 10h18', 'm9 16 2 2 4-4'],
  lightbulb: ['M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5', 'M9 18h6', 'M10 22h4'],
  // propriu: inima cu rânduri (Cuvântul ascuns în inimă)
  'heart-word': [HEART, 'M9.5 10.5h5', 'M10.5 13.5h3'],
  gem: ['M6 3h12l4 6-10 13L2 9Z', 'M11 3 8 9l4 13 4-13-3-6', 'M2 9h20'],
  'book-open': ['M12 7v14', 'M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z'],
  users: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', circle(9, 7, 4), 'M22 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
  // propriu: trei persoane (părtășie)
  'users-three': [circle(12, 7, 3), circle(5.5, 9.5, 2.2), circle(18.5, 9.5, 2.2), 'M7 20v-1a5 5 0 0 1 10 0v1', 'M2 19v-.5A3.5 3.5 0 0 1 5.5 15H6', 'M22 19v-.5a3.5 3.5 0 0 0-3.5-3.5H18'],
  'user-plus': ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', circle(9, 7, 4), 'M19 8v6', 'M22 11h-6'],
  'message-square-more': ['M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', 'M8 10h.01', 'M12 10h.01', 'M16 10h.01'],
  // propriu: mâinile în rugăciune
  'praying-hands': ['M12 3c-1.6 1.6-2.5 5-2.5 8.5v3.2L6 18.2l2.3 2.3L12 17l3.7 3.5 2.3-2.3-3.5-3.5v-3.2C14.5 8 13.6 4.6 12 3z', 'M12 3v14'],

  // Interfață
  'chevron-left': ['m15 18-6-6 6-6'],
  'chevron-right': ['m9 18 6-6-6-6'],
  'chevron-down': ['m6 9 6 6 6-6'],
  pencil: ['M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z', 'm15 5 4 4'],
  trophy: [
    'M6 9H4.5a2.5 2.5 0 0 1 0-5H6',
    'M18 9h1.5a2.5 2.5 0 0 0 0-5H18',
    'M4 22h16',
    'M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22',
    'M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22',
    'M18 2H6v7a6 6 0 0 0 12 0V2Z',
  ],
  calendar: ['M8 2v4', 'M16 2v4', rect(3, 4, 18, 18, 2), 'M3 10h18'],
  star: [STAR],
  'star-filled': [STAR],
  search: [circle(11, 11, 8), 'm21 21-4.3-4.3'],
  check: ['M20 6 9 17l-5-5'],
  clock: [circle(12, 12, 10), 'M12 6v6l4 2'],
  globe: [circle(12, 12, 10), 'M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20', 'M2 12h20'],
  send: ['M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z', 'm21.854 2.147-10.94 10.939'],
  'circle-check': [circle(12, 12, 10), 'm9 12 2 2 4-4'],
  trash: ['M3 6h18', 'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6', 'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2', 'M10 11v6', 'M14 11v6'],
  // propriu: podiumul (clasamentul)
  podium: ['M3.5 20h17', 'M5 20v-6h4.5v6', 'M9.5 20V8h5v12', 'M14.5 20v-4H19v4'],
} satisfies Record<string, string[]>;

export type IconName = keyof typeof ICONS;

// Cele pline (aceeași formă, colorată înăuntru).
const FILLED = new Set<IconName>(['flame-filled', 'star-filled']);

interface Props {
  name: IconName;
  size?: number;
  color: string;
  strokeWidth?: number;
}

export default function Icon({ name, size = 24, color, strokeWidth = 2 }: Props) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={FILLED.has(name) ? color : 'none'}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {ICONS[name].map((d, i) => (
        <Path key={i} d={d} />
      ))}
    </Svg>
  );
}
