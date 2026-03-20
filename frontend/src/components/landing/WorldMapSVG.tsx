"use client";

export function WorldMapSVG() {
  return (
    <svg
      width="1280"
      height="640"
      viewBox="0 0 1280 640"
      className="absolute"
      style={{ left: 80, top: 20, opacity: 0.25 }}
    >
      <defs>
        <pattern id="dotPattern" x="0" y="0" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1.3" fill="#fff" />
        </pattern>
      </defs>
      {/* Greenland */}
      <path d="M80,95 L95,80 L115,72 L140,68 L160,72 L175,85 L165,95 L150,92 L135,88 L120,92 L105,98 L95,105 L85,100 Z" fill="url(#dotPattern)" />
      {/* North America */}
      <path d="M140,68 L165,58 L190,50 L220,48 L255,50 L280,55 L305,52 L325,55 L340,62 L350,72 L355,85 L352,100 L345,112 L340,125 L348,132 L355,128 L360,118 L368,115 L372,125 L365,138 L355,148 L340,155 L325,162 L315,172 L308,185 L298,192 L285,195 L272,198 L260,202 L250,210 L242,222 L238,235 L230,242 L218,248 L208,242 L198,232 L188,225 L178,222 L168,225 L160,232 L152,228 L148,218 L145,205 L142,192 L138,178 L132,165 L125,155 L118,148 L112,140 L108,130 L105,118 L108,108 L118,98 L132,88 L140,78 Z" fill="url(#dotPattern)" />
      {/* Central America */}
      <path d="M298,192 L305,198 L310,210 L312,225 L308,235 L302,238 L298,228 L295,215 L295,200 Z" fill="url(#dotPattern)" />
      {/* Caribbean */}
      <path d="M178,222 L188,225 L198,232 L208,242 L218,248 L225,258 L228,268 L225,278 L218,285 L210,290 L205,298 L200,305 L195,298 L188,288 L182,278 L178,265 L175,252 L172,240 L175,230 Z" fill="url(#dotPattern)" />
      {/* South America */}
      <path d="M225,318 L238,312 L255,308 L272,310 L288,318 L302,328 L312,342 L318,358 L322,378 L320,398 L315,415 L308,432 L298,448 L288,460 L278,470 L270,478 L262,488 L255,498 L252,508 L248,498 L245,482 L242,465 L240,448 L238,428 L235,408 L232,388 L228,368 L225,348 L222,332 Z" fill="url(#dotPattern)" />
      {/* Iceland */}
      <path d="M528,100 L535,92 L542,88 L548,92 L550,102 L546,112 L540,118 L534,115 L530,108 Z" fill="url(#dotPattern)" />
      {/* Faroe */}
      <path d="M522,98 L526,95 L528,100 L526,106 L522,104 Z" fill="url(#dotPattern)" />
      {/* Ireland */}
      <path d="M530,152 L540,148 L548,145 L556,148 L560,155 L556,165 L548,170 L538,168 L532,162 Z" fill="url(#dotPattern)" />
      {/* Britain */}
      <path d="M548,125 L558,118 L568,120 L575,128 L572,138 L565,145 L556,148 L548,145 L545,135 Z" fill="url(#dotPattern)" />
      {/* Scandinavia */}
      <path d="M578,138 L585,135 L590,140 L592,152 L588,165 L582,175 L576,172 L574,162 L575,148 Z" fill="url(#dotPattern)" />
      <path d="M570,55 L580,48 L592,45 L600,52 L605,65 L602,82 L596,95 L588,105 L580,108 L575,100 L572,85 L568,70 Z" fill="url(#dotPattern)" />
      {/* Europe */}
      <path d="M600,80 L615,72 L632,68 L648,72 L660,82 L668,95 L672,110 L668,128 L660,142 L648,152 L632,155 L618,150 L608,140 L602,128 L598,112 L596,95 Z" fill="url(#dotPattern)" />
      {/* Africa */}
      <path d="M545,200 L562,192 L580,188 L600,190 L618,195 L632,205 L642,218 L650,235 L655,255 L658,275 L660,295 L655,315 L648,332 L638,348 L625,362 L612,372 L598,378 L585,382 L575,378 L568,368 L562,352 L555,335 L548,315 L542,295 L538,275 L535,255 L534,235 L536,218 Z" fill="url(#dotPattern)" />
      {/* Madagascar */}
      <path d="M665,338 L670,332 L676,335 L678,348 L675,362 L670,368 L665,362 L663,348 Z" fill="url(#dotPattern)" />
      {/* Middle East */}
      <path d="M635,178 L652,172 L668,175 L682,182 L692,195 L695,210 L688,222 L678,228 L665,225 L652,218 L642,208 L638,195 Z" fill="url(#dotPattern)" />
      {/* Russia/Central Asia */}
      <path d="M668,68 L700,55 L740,45 L780,38 L820,35 L860,38 L900,45 L935,55 L960,68 L975,82 L978,98 L972,110 L958,118 L938,122 L910,118 L878,115 L845,112 L810,108 L778,105 L748,100 L720,95 L698,88 L682,80 Z" fill="url(#dotPattern)" />
      {/* India */}
      <path d="M718,178 L732,170 L748,172 L760,182 L768,198 L770,218 L765,238 L755,255 L742,268 L728,272 L718,262 L712,245 L708,228 L708,210 L710,195 Z" fill="url(#dotPattern)" />
      {/* China/East Asia */}
      <path d="M788,95 L815,85 L845,82 L872,88 L895,100 L908,115 L912,132 L905,148 L892,162 L875,170 L855,172 L835,168 L815,162 L798,152 L788,138 L782,122 L785,108 Z" fill="url(#dotPattern)" />
      {/* Japan */}
      <path d="M910,128 L918,122 L925,128 L928,142 L925,155 L918,158 L912,148 L910,138 Z" fill="url(#dotPattern)" />
      {/* Korea */}
      <path d="M932,112 L940,105 L948,108 L952,120 L950,135 L945,148 L938,155 L932,148 L930,135 L928,122 Z" fill="url(#dotPattern)" />
      {/* Southeast Asia */}
      <path d="M808,195 L822,188 L838,192 L848,205 L852,222 L848,238 L838,248 L825,252 L812,248 L805,235 L802,218 Z" fill="url(#dotPattern)" />
      {/* Indonesia */}
      <path d="M825,272 L845,265 L868,268 L890,275 L908,285 L918,298 L912,308 L898,312 L878,310 L858,305 L840,298 L828,288 Z" fill="url(#dotPattern)" />
      {/* Australia */}
      <path d="M888,370 L918,358 L948,352 L978,355 L1005,365 L1020,380 L1028,398 L1025,418 L1015,432 L998,442 L978,445 L955,440 L935,430 L918,415 L905,398 L895,382 Z" fill="url(#dotPattern)" />
      {/* New Zealand */}
      <path d="M1045,418 L1052,412 L1058,418 L1060,432 L1055,445 L1048,448 L1042,438 L1042,428 Z" fill="url(#dotPattern)" />
    </svg>
  );
}
