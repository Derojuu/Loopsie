/** Bespoke artwork used by the app demo (logo, timer blob, notification mark, recording thumbnails). */

interface ClassProps {
  className?: string;
}

/** Loopsii logo as drawn in the app sidebar and the Ask launcher. */
export function LoopsiiLogo({ className }: ClassProps) {
  return (
    <svg viewBox="0 0 32 26" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className={className}>
      <path
        d="M25.3884 3.44499C26.8817 4.30719 27.8808 6.03878 28.0855 8.42002C28.2895 10.7946 27.6723 13.6571 26.0936 16.3915C24.5149 19.1259 22.344 21.0925 20.1856 22.103C18.0211 23.1163 16.0223 23.1161 14.529 22.254C13.036 21.3918 12.037 19.6611 11.8323 17.2803C11.6282 14.9057 12.2459 12.0424 13.8246 9.30798C15.4034 6.57363 17.5738 4.60781 19.7322 3.59726C21.8965 2.58398 23.8951 2.58304 25.3884 3.44499Z"
        stroke="currentColor"
        strokeWidth="3.28205"
      />
      <path
        d="M15.465 3.44499C16.9584 4.30719 17.9575 6.03878 18.1621 8.42002C18.3662 10.7946 17.7489 13.6571 16.1703 16.3915C14.5915 19.1259 12.4207 21.0925 10.2622 22.103C8.09781 23.1163 6.09895 23.1161 4.60567 22.254C3.11262 21.3918 2.11368 19.6611 1.90896 17.2803C1.70489 14.9057 2.32255 12.0424 3.90129 9.30798C5.48003 6.57363 7.65042 4.60781 9.80886 3.59726C11.9732 2.58398 13.9717 2.58304 15.465 3.44499Z"
        fill="var(--app-color-surface)"
        stroke="currentColor"
        strokeWidth="3.28205"
      />
      <path d="M13.1714 13.4252L15.3191 17.2706L20.3924 15.3034" stroke="var(--app-color-surface)" strokeWidth="2.46154" />
      <path d="M14.0029 12.0631L16.3531 15.7883L21.3139 13.5528" stroke="currentColor" strokeWidth="2.46154" />
      <path d="M23.0513 13.6174L25.4014 17.3426L30.3623 15.1071" stroke="var(--app-color-surface)" strokeWidth="2.46154" />
      <path d="M23.8397 12.0631L26.1898 15.7883L31.1507 13.5528" stroke="currentColor" strokeWidth="2.46154" />
    </svg>
  );
}

const GLYPH_FILL = "var(--app-color-label-button, #151515)";

/** Lime blob behind the timer buttons, with a play triangle or a stop square. */
export function TimerBlob({ running }: { running: boolean }) {
  return (
    <svg
      className="app:absolute app:left-0 app:top-[-9.6%] app:h-[119.1%] app:w-full app:overflow-visible"
      viewBox="0 0 34.0613 40.5006"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <ellipse
        cx="17.0089"
        cy="20.2503"
        rx="15.1327"
        ry="21.6828"
        transform="rotate(30 17.0089 20.2503)"
        fill="var(--app-color-lime, #dff760)"
      />
      {running ? (
        <rect
          x="14"
          y="17.25"
          width="6.1"
          height="6.1"
          rx="0.8"
          fill={GLYPH_FILL}
          stroke={GLYPH_FILL}
          strokeWidth="1.16667"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M14.5613 16.5389L20.3947 20.2889L14.5613 24.0389V16.5389Z"
          fill={GLYPH_FILL}
          stroke={GLYPH_FILL}
          strokeWidth="1.16667"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

/** Small filled circle used as a project colour dot. */
export function ProjectDot() {
  return (
    <svg width="100%" height="100%" style={{ aspectRatio: 1 }} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6" fill="currentColor" />
    </svg>
  );
}

/** Noisy lime blob in the corner of the time-tracker card. */
export function TrackerBlob() {
  return (
    <svg
      className="app:absolute app:-top-1 app:-right-75 app:h-273 app:w-[289.92px] app:max-w-none"
      viewBox="0 0 400.621 377.23"
      preserveAspectRatio="none"
      overflow="visible"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g opacity="0.2" filter="url(#adm-home-tracker-blob)">
        <path
          d="M341.971 207.279C341.971 272.422 284.216 325.23 212.971 325.23C141.726 325.23 73.9712 306.716 73.9712 241.574C73.9712 207.841 240.335 263.743 266.972 241.574C157.471 211.5 23.1182 52 57.4709 52C304.47 155.5 371.97 85.7305 341.971 207.279Z"
          fill="#DFF760"
        />
      </g>
      <defs>
        <filter
          id="adm-home-tracker-blob"
          x="2.69535e-07"
          y="0"
          width="400.621"
          height="377.23"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feTurbulence type="fractalNoise" baseFrequency="0.99900001287460327 0.99900001287460327" numOctaves={3} seed="5201" />
          <feDisplacementMap
            in="shape"
            scale="104"
            xChannelSelector="R"
            yChannelSelector="G"
            result="displacedImage"
            width="100%"
            height="100%"
          />
          <feMerge result="effect1_texture_0_8">
            <feMergeNode in="displacedImage" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}

/** macOS-style Loopsii mark used in the notification card. */
export function NoticeMark() {
  return (
    <svg className="mnc-mark" viewBox="0 0 25.477 24" width="25" height="24" fill="currentColor" aria-hidden="true">
      <g transform="translate(0 2.591)">
        <path d="M6.87856 0.86772C8.80642 -0.109087 11.0536 -0.393626 12.9656 0.710086C14.8775 1.81401 15.755 3.90246 15.873 6.06063C15.9674 7.78795 15.5936 9.68826 14.7825 11.5302L12.9836 11.8275L12.043 10.3978C12.7074 8.91375 12.9799 7.44972 12.9128 6.22212C12.8287 4.68538 12.2439 3.71646 11.4832 3.27727C10.7225 2.83833 9.59134 2.81662 8.21871 3.51211C6.86015 4.20052 5.44735 5.52158 4.38804 7.35644C3.32885 9.19124 2.89137 11.075 2.97453 12.5957C3.0586 14.1322 3.64296 15.1012 4.40348 15.5405C5.16412 15.9797 6.29584 16.0012 7.66862 15.3057C8.80279 14.731 9.97337 13.7146 10.946 12.3274L12.0372 13.9874L13.5774 13.7326C12.3266 15.6141 10.7188 17.0836 9.00878 17.9501C7.08082 18.9269 4.8331 19.2116 2.92113 18.1077C1.00952 17.0037 0.13237 14.9151 0.014349 12.7572C-0.104474 10.5831 0.516162 8.13419 1.82096 5.87404C3.12579 3.61391 4.93647 1.85188 6.87856 0.86772Z" />
        <path d="M16.9142 12.1841L12.5231 12.9092L10.0784 9.1906L11.7297 8.10441L13.4689 10.7491L16.5919 10.2336L16.9142 12.1841Z" />
        <g transform="translate(9.905 0)">
          <path d="M10.0356 13.988L11.5752 13.7332C10.3245 15.6144 8.71699 17.0837 7.00719 17.9501C5.07923 18.9269 2.83151 19.2116 0.919545 18.1077C0.58092 17.9122 0.275381 17.6851 0.000157026 17.4328C0.812861 16.9091 1.59091 16.2511 2.3041 15.4788C2.3366 15.5 2.36869 15.5214 2.40189 15.5405C3.16253 15.9797 4.29425 16.0012 5.66704 15.3057C6.8012 14.731 7.97178 13.7146 8.94441 12.3274L10.0356 13.988ZM4.87697 0.867722C6.80483 -0.109085 9.05206 -0.393623 10.964 0.710088C12.876 1.81401 13.7534 3.90247 13.8714 6.06063C13.9658 7.78795 13.592 9.68826 12.7809 11.5302L10.982 11.8275L10.0414 10.3978C10.7058 8.91375 10.9784 7.44973 10.9112 6.22213C10.8271 4.68538 10.2423 3.71646 9.48163 3.27727C8.72093 2.83833 7.58976 2.81663 6.21712 3.51211C6.0003 3.62198 5.78266 3.74883 5.56474 3.89043C5.24242 2.9336 4.72496 2.06516 3.98203 1.38438C4.27656 1.19455 4.57466 1.02092 4.87697 0.867722Z" />
          <path d="M14.9074 12.1841L10.5162 12.9092L8.07153 9.19059L9.7229 8.1044L11.4621 10.7491L14.585 10.2336L14.9074 12.1841Z" />
        </g>
      </g>
    </svg>
  );
}

const THUMB_PROPS = {
  className: "app:h-full app:w-full",
  viewBox: "0 0 320 180",
  preserveAspectRatio: "xMidYMid slice",
  fontFamily: "Helvetica, Arial, sans-serif",
  xmlns: "http://www.w3.org/2000/svg",
  "aria-hidden": true,
} as const;

const CAL_COLS = [24, 41, 58, 75, 92, 109, 126];
const CAL_ROWS = [76, 91, 106, 121, 136];

/** Screen-recording thumbnail: Harbor & Vale booking page. */
export function ThumbBooking() {
  return (
    <svg {...THUMB_PROPS}>
      <rect width="320" height="180" fill="#fbfaf6" />
      <rect width="320" height="22" fill="#ffffff" />
      <rect x="12" y="8" width="44" height="6" rx="3" fill="#1d1d1b" />
      <rect x="232" y="7" width="76" height="9" rx="4.5" fill="#1d1d1b" />
      <text x="16" y="44" fontSize="11" fontWeight="700" fill="#1d1d1b">
        Book a table
      </text>
      <text x="16" y="57" fontSize="7" fill="#8a8a85">
        Harbor &amp; Vale · Friday dinner
      </text>
      <rect x="16" y="66" width="128" height="94" rx="8" fill="#ffffff" />
      {CAL_ROWS.map((y) =>
        CAL_COLS.map((x) => (
          <rect
            key={`${x}-${y}`}
            x={x}
            y={y}
            width="13"
            height="11"
            rx="3"
            fill={x === 75 && y === 106 ? "#fff08f" : "#f1f1f1"}
          />
        )),
      )}
      <rect x="156" y="66" width="148" height="94" rx="8" fill="#ffffff" />
      <text x="166" y="82" fontSize="7" fill="#8a8a85">
        Available times
      </text>
      <rect x="166" y="90" width="38" height="16" rx="8" fill="#f1f1f1" />
      <text x="174" y="101" fontSize="7" fill="#1d1d1b">
        18:30
      </text>
      <rect x="210" y="90" width="38" height="16" rx="8" fill="#1d1d1b" />
      <text x="218" y="101" fontSize="7" fill="#ffffff">
        19:00
      </text>
      <rect x="254" y="90" width="38" height="16" rx="8" fill="#f1f1f1" />
      <text x="262" y="101" fontSize="7" fill="#1d1d1b">
        19:30
      </text>
      <rect x="166" y="114" width="126" height="8" rx="4" fill="#f1f1f1" />
      <rect x="166" y="130" width="126" height="20" rx="10" fill="#fff08f" />
      <text x="206" y="143" fontSize="7.5" fontWeight="700" fill="#1d1d1b">
        Continue
      </text>
    </svg>
  );
}

/** Screen-recording thumbnail: Pixelbrew logo options. */
export function ThumbLogos() {
  return (
    <svg {...THUMB_PROPS}>
      <rect width="320" height="180" fill="#eef7fb" />
      <text x="16" y="24" fontSize="10" fontWeight="700" fill="#14222b">
        Pixelbrew · logo options, round two
      </text>
      <rect x="16" y="36" width="90" height="120" rx="10" fill="#ffffff" />
      <circle cx="61" cy="86" r="22" fill="#14222b" />
      <circle cx="61" cy="86" r="9" fill="#abeaff" />
      <rect x="36" y="128" width="50" height="6" rx="3" fill="#d7e3e8" />
      <rect x="115" y="36" width="90" height="120" rx="10" fill="#ffffff" />
      <rect x="138" y="66" width="44" height="40" rx="12" fill="#abeaff" />
      <path d="M148 96 L160 72 L172 96 Z" fill="#14222b" />
      <rect x="135" y="128" width="50" height="6" rx="3" fill="#d7e3e8" />
      <rect x="214" y="36" width="90" height="120" rx="10" fill="#14222b" />
      <text x="232" y="94" fontSize="17" fontWeight="800" fill="#ffffff">
        pb.
      </text>
      <rect x="234" y="128" width="50" height="6" rx="3" fill="#2f4552" />
    </svg>
  );
}
