import type { CouncilConfig } from "./types";

type Identity = Pick<CouncilConfig["identities"][number], "id" | "name">;

const ink = "#34271f";
const cream = "#fff0d7";
const gold = "#eabb61";
const palettes = ["#ebc398", "#b9c7b4", "#dfb2b0", "#c5c0a2", "#c3b9ce", "#e2be91", "#b1c1c5", "#d6b893", "#b9c7bc"];
const ids = ["CEO", "CTO", "CMO", "COO", "CFO", "DA_VINCI", "WASHINGTON", "GENGHIS_KHAN", "ELON_MUSK"];

// Original, code-native illustrations for Vorton. Deliberately drawn as characters,
// including fictional interpretations of the named council perspectives.
function Portrait({ id, seed }: { id: string; seed: number }) {
  switch (id) {
    case "CEO":
      return <>
        <path fill={ink} d="M29 83C17 69 25 51 28 40C27 19 47 13 61 18C89 8 101 35 94 55C101 77 88 91 74 93Z" />
        <path fill="#b85639" d="M13 120L20 101Q26 88 48 86H72Q98 88 104 107L108 120" />
        <path fill="#b87654" d="M49 71L47 88L60 101L74 88L70 70" />
        <path fill="#d79b70" d="M36 39Q40 25 60 28Q80 26 86 45L82 64Q78 83 61 84Q43 82 37 64Z" />
        <path fill={ink} d="M31 52Q43 43 51 29Q66 43 87 42L88 29L58 20L36 30Z" />
        <path d="M43 51L53 49M68 49L77 52M60 53L57 65L62 66" fill="none" />
        <path d="M49 73Q61 79 71 70" fill={cream} />
        <circle cx="49" cy="56" r="2" fill={ink} /><circle cx="73" cy="56" r="2" fill={ink} />
        <path fill={cream} d="M45 85L59 100L50 109L34 89M75 85L60 100L70 109L86 89" />
        <path d="M60 102V122" fill="none" />
        <circle cx="37" cy="69" r="4" fill={gold} /><circle cx="83" cy="69" r="4" fill={gold} />
        <path d="M88 98L90 103L95 104L91 108L91 113L86 110L81 112L83 106L80 102L86 102Z" fill={gold} strokeWidth="1.5" />
      </>;
    case "CTO":
      return <>
        <path fill="#b96a40" d="M13 120L20 102Q30 85 49 85H72Q94 88 101 105L107 120" />
        <path fill="#e9b789" d="M49 73V91Q61 102 74 91L71 71" />
        <path fill="#6d8c78" d="M39 89L48 100L37 111L25 95M75 88L66 101L79 111L92 96" />
        <path fill="#f0c99b" d="M34 41Q40 25 61 26Q84 23 88 44L83 70Q78 84 61 86Q43 84 36 69Z" />
        <path fill="#435c50" d="M32 47L28 30L37 33L37 21L49 27L62 13L66 24L80 17L80 29L94 29L87 48L82 39L48 37L38 49Z" />
        <path d="M43 46L52 43M70 43L79 46" fill="none" />
        <circle cx="46" cy="56" r="12" fill={cream} /><circle cx="76" cy="56" r="12" fill={cream} />
        <path d="M58 54H64M34 53L30 51M88 53L92 50M59 62L57 69H62" fill="none" />
        <circle cx="49" cy="57" r="2.5" fill={ink} /><circle cx="79" cy="57" r="2.5" fill={ink} />
        <path d="M53 76Q61 82 71 74M44 108V120M77 109V120" fill="none" />
        <path d="M60 101V120" fill="none" strokeWidth="1.5" />
      </>;
    case "CMO":
      return <>
        <path fill="#5a3634" d="M32 84Q17 78 23 61Q12 51 25 38Q21 21 41 22Q50 8 63 19Q80 8 89 26Q106 29 98 47Q108 62 96 70Q98 89 78 88Z" />
        <path fill="#a96a78" d="M12 120L22 98Q36 85 48 87H74Q95 89 102 107L107 120" />
        <path fill="#a96d50" d="M48 73L45 91Q61 105 77 90L72 71" />
        <path fill="#bf865f" d="M35 43Q41 28 64 32L86 42L81 65Q76 82 61 84Q45 83 37 65Z" />
        <path fill="#5a3634" d="M30 46Q49 47 57 31Q64 45 90 43L85 26L46 25Z" />
        <path d="M43 49L54 47M69 47L77 51M43 56L51 54L55 57M68 55L77 54L81 51M60 56L57 66L62 67" fill="none" />
        <circle cx="74" cy="57" r="2" fill={ink} />
        <path fill={cream} d="M49 73Q59 75 72 69Q65 82 54 78Z" />
        <path d="M37 62Q25 64 31 80Q41 88 44 77M83 62Q95 67 89 80Q82 88 78 76" fill="none" stroke={gold} strokeWidth="4" />
        <path d="M37 93Q44 110 61 112Q78 112 86 94" fill="none" stroke={cream} strokeWidth="4" />
        <circle cx="61" cy="112" r="4" fill={gold} />
      </>;
    case "COO":
      return <>
        <path fill="#667d64" d="M13 120L21 99Q33 88 49 86H73Q95 91 101 105L108 120" />
        <path fill="#a86e50" d="M49 70L47 89L62 101L76 88L72 68" />
        <path fill="#bd8a64" d="M34 39L44 26H72L85 41L82 66Q77 85 60 86Q42 82 37 66Z" />
        <path fill="#d8d4c2" d="M33 50L27 35L37 22L59 17L81 23L89 39L83 51L77 36Q55 44 39 36L39 48Z" />
        <path d="M44 50H53M68 49L78 47M60 54L57 66H63M51 74Q61 76 70 72" fill="none" />
        <circle cx="49" cy="56" r="2" fill={ink} /><circle cx="73" cy="55" r="2" fill={ink} />
        <path fill={cream} d="M45 86L61 100L50 108L35 91M76 86L62 100L72 108L88 94" />
        <path d="M61 101V120M26 107H44V120M80 107H97V120" fill="none" />
        <path fill={gold} d="M32 109L37 102L42 109L37 116Z" />
        <circle cx="88" cy="110" r="3" fill={gold} />
      </>;
    case "CFO":
      return <>
        <path fill="#777087" d="M12 120L22 100Q31 91 48 87H73Q94 92 102 108L106 120" />
        <path fill="#cd9777" d="M49 72L47 90Q59 101 75 91L72 72" />
        <path fill="#e3b391" d="M36 37L59 23L83 37L82 65Q76 84 61 86Q43 81 37 66Z" />
        <path fill="#4b3732" d="M32 52L30 33Q36 18 60 20Q84 17 89 39L83 53L78 33Q60 45 39 39L38 54Z" />
        <path d="M42 47L53 45M68 45L77 48M60 54L57 67L62 69M52 76L69 73" fill="none" />
        <path fill="none" stroke={gold} strokeWidth="3" d="M36 51H55V63H39ZM65 51H85L82 63H65ZM55 55H65" />
        <circle cx="48" cy="56" r="2" fill={ink} /><circle cx="73" cy="56" r="2" fill={ink} />
        <path fill="#494052" d="M44 85Q60 96 78 85L80 98Q63 108 42 99Z" />
        <path d="M34 92L41 118M87 95L80 120" fill="none" />
        <path fill={gold} d="M91 94L98 102L91 110L84 102Z" />
        <path d="M90 98L93 102L90 106" fill="none" strokeWidth="1.4" />
      </>;
    case "DA_VINCI":
      return <>
        <path fill="#e4ddc8" d="M34 32L29 63L22 88L43 102H83L99 85L89 62L87 33Z" />
        <path fill="#687965" d="M11 120L20 101Q34 88 48 87H77Q97 93 105 113L108 120" />
        <path fill="#e1b58b" d="M36 36H84L82 63Q76 84 60 85Q43 82 37 63Z" />
        <path fill="#a3543b" d="M28 35Q21 26 35 20Q57 12 80 18Q96 23 91 36L85 43Q63 37 35 43Z" />
        <path d="M31 34Q62 27 88 34" fill="none" />
        <path d="M42 50L54 48M67 48L78 50M61 53L57 67L63 68" fill="none" />
        <circle cx="49" cy="55" r="2" fill={ink} /><circle cx="72" cy="55" r="2" fill={ink} />
        <path fill="#f1e7ce" d="M37 60L45 68L53 65L60 69L68 65L76 68L83 60L80 86L69 103L61 110L48 102L39 84Z" />
        <path d="M52 74Q61 71 70 74M46 78L51 92M60 80V100M74 78L69 93" fill="none" />
        <path fill={gold} d="M21 120L32 88L37 90L27 122" />
        <path fill={cream} d="M32 89Q28 80 38 71L38 85L37 91Z" />
        <path d="M88 99L81 120" fill="none" />
      </>;
    case "WASHINGTON":
      return <>
        <path fill="#e8e5d6" d="M35 31Q30 20 47 17Q62 11 78 21Q93 23 88 41L93 54L89 70L97 79L91 93L74 90H44L28 92L24 80L32 69L28 53Z" />
        <path fill="#4e6876" d="M11 120L22 100L46 86H74L99 102L109 120" />
        <path fill="#d3a07f" d="M49 71L47 91L61 104L75 90L71 70" />
        <path fill="#e7bd9a" d="M37 37Q50 21 69 26L82 39L79 64Q75 83 60 85Q42 80 38 61Z" />
        <path fill="#e8e5d6" d="M35 51L33 34Q36 24 48 25Q61 14 80 29L83 48L76 37L54 33L42 39L40 53Z" />
        <path d="M43 50L53 48M67 48L77 50M59 54L57 66H62M51 73Q61 77 69 74" fill="none" />
        <circle cx="48" cy="55" r="2" fill={ink} /><circle cx="72" cy="55" r="2" fill={ink} />
        <path d="M31 55L37 59M30 67L39 70M31 81L40 82M84 56L91 54M82 70L90 67M83 82L91 80" fill="none" />
        <path fill={gold} d="M44 86L52 106L40 115L29 98M77 86L70 106L81 115L92 99" />
        <path fill={cream} d="M50 87L60 91L71 87L67 98L72 106L61 115L51 106L55 98Z" />
        <path d="M55 98H66M61 100V112" fill="none" strokeWidth="1.5" />
      </>;
    case "GENGHIS_KHAN":
      return <>
        <path fill="#473831" d="M34 39L27 82L33 101L47 98L47 65H73L76 103L90 98L95 84L86 39Z" />
        <path fill="#976748" d="M12 120L22 101Q34 91 48 88H75L99 102L108 120" />
        <path fill="#c69368" d="M36 40H84L83 61Q79 82 61 85Q42 82 37 62Z" />
        <path fill="#6c6960" d="M31 39Q34 19 52 17L59 8L67 18Q85 20 90 39L88 48H32Z" />
        <path fill="#ded3b8" d="M29 37Q60 28 92 37L93 48Q61 41 28 48Z" />
        <path d="M60 10V32" fill="none" stroke={gold} strokeWidth="4" />
        <path d="M41 53L52 55M68 55L79 52M44 60L52 59M69 59L77 60M60 56L57 68L63 69" fill="none" />
        <path fill={ink} d="M47 72Q55 66 61 72Q68 66 76 72L80 79L68 76L62 74L54 77L42 80Z" />
        <path fill={ink} d="M54 81L61 86L69 80L66 96L61 104L56 96Z" />
        <path fill="#d6b68a" d="M43 85L57 104L46 116L30 96M77 85L65 104L76 116L92 96" />
        <path d="M40 96L49 108M81 96L74 108M61 106V121" fill="none" />
        <circle cx="35" cy="71" r="3.5" fill={gold} /><circle cx="86" cy="71" r="3.5" fill={gold} />
      </>;
    case "ELON_MUSK":
      return <>
        <path fill="#47574e" d="M12 120L20 101Q31 88 47 86H74Q96 91 102 107L108 120" />
        <path fill="#d8a585" d="M48 71L46 89Q58 100 75 90L72 70" />
        <path fill="#ecc3a1" d="M36 34Q58 21 82 37L85 57L79 74Q71 85 60 85Q44 81 38 66Z" />
        <path fill="#655043" d="M34 52L29 33L37 24L52 20L58 16L79 22L89 37L83 53L78 37L65 32L42 36L40 51Z" />
        <path d="M40 31L63 26L76 29M43 49L53 48M67 47L78 50M60 55L58 66L64 67" fill="none" />
        <path d="M45 55L52 56M69 54L77 54" fill="none" strokeWidth="2.5" />
        <path fill={cream} d="M48 71Q63 75 74 69Q67 81 54 77Z" />
        <path d="M42 90Q60 108 80 91M28 104L33 120M92 104L88 121" fill="none" />
        <path fill={cream} strokeWidth="1.5" d="M79 111Q79 102 85 99Q91 106 87 114L81 115ZM81 115L79 119M86 115L87 118" />
        <circle cx="85" cy="107" r="1.5" fill="#879e92" strokeWidth="1" />
      </>;
    default: {
      const skin = ["#e2b28c", "#bc865f", "#965d44", "#efcaa5"][seed % 4];
      const shirt = ["#637f72", "#9d6263", "#7e708e", "#b16c43"][Math.floor(seed / 4) % 4];
      return <>
        <path fill={shirt} d="M12 120L21 100Q34 86 48 86H74Q97 92 105 116L107 120" />
        <path fill={skin} d="M49 71L47 91Q60 103 74 91L71 71" />
        <path fill={skin} d="M35 38Q42 24 62 26Q85 25 86 46L81 69Q76 85 60 86Q44 82 38 68Z" />
        {seed % 2 ? <path fill={ink} d="M32 51L27 33L40 24L44 17L58 21L71 15L83 26L91 36L84 52L78 35Q56 42 41 35L39 51Z" /> : <path fill={ink} d="M30 60L28 36Q35 17 61 19Q88 18 92 39L87 66L80 64L80 38Q57 45 39 34L39 62Z" />}
        <path d="M43 49L53 47M68 47L78 49M60 55L57 66L62 67" fill="none" />
        <circle cx="49" cy="56" r="2" fill={ink} /><circle cx="73" cy="56" r="2" fill={ink} />
        <path d="M50 74Q61 80 71 72M40 91Q59 115 82 92" fill="none" />
        {seed % 3 === 0 && <g fill="none" stroke={gold} strokeWidth="2.5"><circle cx="47" cy="55" r="10" /><circle cx="75" cy="55" r="10" /><path d="M57 54H65" /></g>}
        <path fill={gold} d="M84 103L87 110L84 117L81 110Z" />
      </>;
    }
  }
}

export function CouncilAvatar({ identity, size = 72, className = "" }: {
  identity: Identity;
  size?: number;
  className?: string;
}) {
  // IDs remain stable if the owner renames a custom council perspective.
  const seed = Array.from(identity.id).reduce((value, character) => (value * 31 + character.charCodeAt(0)) >>> 0, 7);
  const index = ids.indexOf(identity.id);
  const background = palettes[index < 0 ? seed % palettes.length : index];
  return <svg
    className={`council-avatar ${className}`.trim()}
    data-identity={identity.id}
    width={size}
    height={size}
    viewBox="0 0 120 120"
    aria-hidden="true"
    focusable="false"
    style={{ display: "block", flexShrink: 0, borderRadius: "50%", overflow: "hidden", background }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="60" cy="60" r="55" fill="none" stroke={ink} strokeOpacity=".12" />
    <path d="M17 51L21 43L25 51L21 59Z" fill={cream} opacity=".75" />
    <path d="M97 22V32M92 27H102" stroke={cream} strokeWidth="2" strokeLinecap="round" />
    <g stroke={ink} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <Portrait id={identity.id} seed={seed} />
    </g>
    <circle cx="60" cy="60" r="58.8" fill="none" stroke={ink} strokeWidth="2.4" />
  </svg>;
}
