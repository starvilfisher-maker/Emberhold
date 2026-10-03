import {DEFS} from './engine.js';

// Original vector portraits mirror the silhouettes of the real-time models.
export function unitPortrait(key){
  const d=DEFS[key];if(!d)return '';
  const c=d.color,metal='#bdcdc2',skin='#e4c9a2',dark='#263e42';
  const headgear={
    sentinel:`<path d="M30 30 36 18 60 18 66 30V38H30Z" fill="${c}"/><path d="M36 22H60V27H36Z" fill="${metal}"/>`,
    archer:`<path d="M29 32 45 16 62 20 67 34 49 29Z" fill="${c}"/><path d="m53 22 12-14-2 17" fill="#eaddb4"/>`,
    warden:`<path d="m33 29-10-13 1-11m8 17-1-12m31 19 10-13-1-11m-7 17 1-12" fill="none" stroke="#bbc596" stroke-width="4"/><path d="M31 32 48 21 65 32V40H31Z" fill="${c}"/>`,
    druid:`<path d="M25 36 43 10 52 12 68 37 48 30Z" fill="${c}"/><path d="M43 11 39 33 57 32 51 12" fill="#749978"/>`,
    seeker:`<path d="M29 31 44 13 62 19 66 33 49 28Z" fill="${c}"/><path d="m49 9-5 13h7l-3 12 11-17h-7l5-8" fill="#e5ddfa"/>`,
    oracle:`<path d="M23 36 44 6 52 6 71 36 48 30Z" fill="${c}"/><path d="m44 13 2 18 8 1-3-19" fill="#7b729e"/>`,
    bulwark:`<path d="M28 22 40 15 59 18 68 25V45H28Z" fill="${metal}"/><path d="M34 31H62V40H34Z" fill="${dark}"/><path d="M48 19V47" stroke="${c}" stroke-width="6"/>`,
    gunner:`<path d="M28 27 36 16H60L68 28 64 35H31Z" fill="${c}"/><path d="M32 30H64V36H32Z" fill="${dark}"/><circle cx="41" cy="33" r="5" fill="#d1b76f"/><circle cx="56" cy="33" r="5" fill="#d1b76f"/>`,
    pyromancer:`<path d="M26 36 43 9 55 12 68 36 49 29Z" fill="${c}"/><path d="m47 5-4 12 8 6 8-5-5-8 1 7-6 1Z" fill="#f8d99b"/>`,
    thorn:`<path d="M27 34 44 14 63 23 66 38 48 28Z" fill="${c}"/><path d="m59 24 10-8 4 10-11 4" fill="#bdd39b"/>`,
    tempest:`<path d="M29 27 39 18 59 18 67 29V40H29Z" fill="${c}"/><path d="m43 23 5-17 7 5-3 15" fill="#ddd0ed"/><path d="M35 32H60V37H35Z" fill="${metal}"/>`,
    artificer:`<path d="M28 29 36 17H59L68 31Z" fill="${c}"/><path d="M30 28H66V35H30Z" fill="#d7bc7e"/><path d="M39 30H58V39H39Z" fill="${dark}"/>`
  };
  let weapon='';
  if(d.role==='guardian')weapon=`<path d="M13 43 28 39 33 47 31 71 22 79 13 68Z" fill="${key==='warden'?'#78916b':metal}"/><path d="M22 45V68M17 54H27" stroke="${c}" stroke-width="3"/><path d="M75 16 79 22 76 65 72 65Z" fill="#e5dec5"/><path d="M66 58H83V62H66Z" fill="#c4a774"/>`;
  else if(key==='gunner')weapon='<path d="M58 55 84 39 92 50 66 69Z" fill="#567481"/><ellipse cx="86" cy="44" rx="7" ry="9" transform="rotate(-40 86 44)" fill="#273c46"/><path d="m67 56 12-9 4 5-11 9" fill="#b2c8ce"/>';
  else if(key==='artificer')weapon='<path d="m70 36 6 1-8 44-6-1Z" fill="#b59565"/><path d="M61 27 83 31 83 43 59 40Z" fill="#b9ced2"/>';
  else if(d.role==='caster')weapon=`<path d="M75 29 79 29 76 82H72Z" fill="#a9946e"/><path d="M77 10 87 23 77 36 67 23Z" fill="${c}"/><path d="M77 10V35L67 23Z" fill="#e4e1c8" opacity=".65"/>`;
  else weapon=`<path d="M74 27Q99 50 74 79" fill="none" stroke="${key==='thorn'?'#b6c58f':'#c7b080'}" stroke-width="4"/><path d="M74 27V79" stroke="#e6dab5" stroke-width="1"/><path d="M62 55H91L86 50M91 55 86 60" fill="none" stroke="${metal}" stroke-width="2"/>`;
  return `<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false"><path d="M8 95 16 66 35 54 61 54 83 70 91 95Z" fill="${dark}"/><path d="M15 95 24 65 37 55 48 62 61 55 73 66 83 95Z" fill="${c}"/><path d="M48 61V95H79L64 59Z" fill="${dark}" opacity=".35"/><path d="M34 30H63V48L55 58H42L34 48Z" fill="${skin}"/><path d="M51 30H63V48L54 57 50 50Z" fill="#c2aa87"/><path d="M39 40H44M53 40H58" stroke="${dark}" stroke-width="2.4"/>${headgear[key]||''}<path d="M27 62 35 55 47 63 59 55 69 63 65 72 33 72Z" fill="${metal}"/><path d="M46 64H53V73H46Z" fill="#d6b877"/>${weapon}</svg>`;
}
