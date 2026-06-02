/** @type {import('tailwindcss').Config} */
const spaceTokens = {
  0: "0rem", // 0.2rem
  0.5: "0.2rem", // 0.2rem
  1: "0.4rem", // 0.4rem
  // Valores com incremento de 0.2rem a partir de 0.6rem
  1.5: "0.6rem", // 0.6rem
  2: "0.8rem", // 0.8rem
  2.5: "1rem", // 1rem
  3: "1.2rem", // 1.2rem
  3.5: "1.4rem", // 1.4rem
  4: "1.6rem", // 1.6rem
  4.5: "1.8rem", // 1.8rem
  5: "2rem", // 2rem
  // Valores com incremento de 0.2rem a partir de 5rem até 9rem
  5.5: "2.2rem", // 2.2rem
  6: "2.4rem", // 2.4rem
  6.5: "2.6rem", // 2.6rem
  7: "2.8rem", // 2.8rem
  7.5: "3rem", // 3rem
  8: "3.2rem", // 3.2rem
  8.5: "3.4rem", // 3.4rem
  9: "3.6rem", // 3.6rem
  // Valores com incremento de 0.2rem de 9.2rem até 9.8rem
  9.2: "3.8rem", // 3.8rem
  9.4: "4rem", // 4rem
  9.6: "4.2rem", // 4.2rem
  9.8: "4.4rem", // 4.4rem
  10: "4.6rem", // 4.6rem
  10.2: "4.8rem", // 4.8rem
  10.4: "5rem", // 5rem
  10.6: "5.2rem", // 5.2rem
  10.8: "5.4rem", // 5.4rem
  11: "5.6rem", // 5.6rem
  11.2: "5.8rem", // 5.8rem
  11.4: "6rem", // 6rem
  11.6: "6.2rem", // 6.2rem
  11.8: "6.4rem", // 6.4rem
  12: "6.6rem", // 6.6rem
  12.2: "6.8rem", // 6.8rem
  12.4: "7rem", // 7rem
  12.6: "7.2rem", // 7.2rem
  12.8: "7.4rem", // 7.4rem
  13: "7.6rem", // 7.6rem
  13.2: "7.8rem", // 7.8rem
  13.4: "8rem", // 8rem
  13.6: "8.2rem", // 8.2rem
  13.8: "8.4rem", // 8.4rem
  14: "8.6rem", // 8.6rem
  14.2: "8.8rem", // 8.8rem
  14.4: "9rem", // 9rem
  14.6: "9.2rem", // 9.2rem
  14.8: "9.4rem", // 9.4rem
  15: "9.6rem", // 9.6rem
  15.2: "9.8rem", // 9.8rem
  15.4: "10rem", // 10rem
  15.6: "10.2rem", // 10.2rem
  15.8: "10.4rem", // 10.4rem
  16: "10.6rem", // 10.6rem
  16.2: "10.8rem", // 10.8rem
  16.4: "11rem", // 11rem
  16.6: "11.2rem", // 11.2rem
  16.8: "11.4rem", // 11.4rem
  17: "11.6rem", // 11.6rem
  17.2: "11.8rem", // 11.8rem
  17.4: "12rem", // 12rem
  17.6: "12.2rem", // 12.2rem
  17.8: "12.4rem", // 12.4rem
  18: "12.6rem", // 12.6rem
  18.2: "12.8rem", // 12.8rem
  18.4: "13rem", // 13rem
  18.6: "13.2rem", // 13.2rem
  18.8: "13.4rem", // 13.4rem
  19: "13.6rem", // 13.6rem
  19.2: "13.8rem", // 13.8rem
  19.4: "14rem", // 14rem
  19.6: "14.2rem", // 14.2rem
  19.8: "14.4rem", // 14.4rem
  20: "14.6rem", // 14.6rem
  20.2: "14.8rem", // 14.8rem
  20.4: "15rem", // 15rem
  20.6: "15.2rem", // 15.2rem
  20.8: "15.4rem", // 15.4rem
  21: "15.6rem", // 15.6rem
  21.2: "15.8rem", // 15.8rem
  21.4: "16rem", // 16rem
  21.6: "16.2rem", // 16.2rem
  21.8: "16.4rem", // 16.4rem
  22: "16.6rem", // 16.6rem
  22.2: "16.8rem", // 16.8rem
  22.4: "17rem", // 17rem
  22.6: "17.2rem", // 17.2rem
  22.8: "17.4rem", // 17.4rem
  23: "17.6rem", // 17.6rem
  23.2: "17.8rem", // 17.8rem
  23.4: "18rem", // 18rem
  23.6: "18.2rem", // 18.2rem
  23.8: "18.4rem", // 18.4rem
  24: "18.6rem", // 18.6rem
  24.2: "18.8rem", // 18.8rem
  24.4: "19rem", // 19rem
  24.6: "19.2rem", // 19.2rem
  24.8: "19.4rem", // 19.4rem
  25: "19.6rem", // 19.6rem
};

const primitiveColors = {
  // Red
  R1000: "#42221F",
  R900: "#5D1F1A",
  R800: "#AE2E24",
  R700: "#C9372C",
  R600: "#E2483D",
  R500: "#F15B50",
  R400: "#F87168",
  R300: "#FD9891",
  R200: "#FFD5D2",
  R100: "#FFECEB",
  // Yellow
  Y1000: "#332E1B",
  Y900: "#533F04",
  Y800: "#7F5F01",
  Y700: "#946F00",
  Y600: "#B38600",
  Y500: "#CF9F02",
  Y400: "#E2B203",
  Y300: "#F5CD47",
  Y200: "#F8E6A0",
  Y100: "#FFF7D6",
  // Green
  G1000: "#1C3329",
  G900: "#164B35",
  G800: "#216E4E",
  G700: "#1F845A",
  G600: "#22A06B",
  G500: "#2ABB7F",
  G400: "#4BCE97",
  G300: "#7EE2B8",
  G200: "#BAF3DB",
  G100: "#DCFFF1",
  // Blue
  B1000: "#1C2B41",
  B900: "#09326C",
  B800: "#0055CC",
  B700: "#0C66E4",
  B600: "#1D7AFC",
  B500: "#388BFF",
  B400: "#579DFF",
  B300: "#85B8FF",
  B200: "#CCE0FF",
  B100: "#E9F2FF",
  // Teal
  T1000: "#1E3137",
  T900: "#164555",
  T800: "#206A83",
  T700: "#227D9B",
  T600: "#2898BD",
  T500: "#42B2D7",
  T400: "#6CC3E0",
  T300: "#9DD9EE",
  T200: "#C6EDFB",
  T100: "#E7F9FF",
  // Lime
  L1000: "#28311B",
  L900: "#37471F",
  L800: "#4C6B1F",
  L700: "#5B7F24",
  L600: "#6A9A23",
  L500: "#82B536",
  L400: "#94C748",
  L300: "#B3DF72",
  L200: "#D3F1A7",
  L100: "#EFFFD6",
  // Purple
  P1000: "#2B273F",
  P900: "#352C63",
  P800: "#5E4DB2",
  P700: "#6E5DC6",
  P600: "#8270DB",
  P500: "#8F7EE7",
  P400: "#9F8FEF",
  P300: "#B8ACF6",
  P200: "#DFD8FD",
  P100: "#F3F0FF",
  // Magenta
  M1000: "#3D2232",
  M900: "#50253F",
  M800: "#943D73",
  M700: "#AE4787",
  M600: "#CD519D",
  M500: "#DA62AC",
  M400: "#E774BB",
  M300: "#F797D2",
  M200: "#FDD0EC",
  M100: "#FDD0EC",
  // Orange
  O1000: "#38291E",
  O900: "#702E00",
  O800: "#A54800",
  O700: "#C25100",
  O600: "#E56910",
  O500: "#F38A3F",
  O400: "#FEA362",
  O300: "#FEC195",
  O200: "#FEDEC8",
  O100: "#FFF3EB",
  // Neutral
  N1000: "#2D3037",
  N900: "#3E424B",
  N800: "#515762",
  N700: "#687080",
  N600: "#798191",
  N500: "#89909E",
  N400: "#B5B9C2",
  N300: "#DDDFE3",
  N200: "#F1F2F4",
  N100: "#F7F8F9",
  N0: "#FFFFFF",
  // Neutral
  NA80: "#3E424BCC",
  NA60: "#3E424B99",
  NA50: "#3E424B80",
  NA40: "#3E424B66",
  NA30: "#3E424B4D",
  NA20: "#3E424B33",
  NA15: "#3E424B26",
  NA10: "#3E424B1A",
  NA05: "#3E424B0D",
  NA03: "#3E424B08",
};
const timeScale = {
  0: "0ms",
  2: "2ms",
  5: "5ms",
  10: "10ms",
  50: "50ms",
  100: "100ms",
  200: "200ms",
  300: "300ms",
  400: "400ms",
  500: "500ms",
  600: "600ms",
  700: "700ms",
  800: "800ms",
  900: "900ms",
  1000: "1000ms",
  1100: "1100ms",
  1200: "1200ms",
  1300: "1300ms",
  1400: "1400ms",
  1500: "1500ms",
  1600: "1600ms",
  1700: "1700ms",
  1800: "1800ms",
  1900: "1900ms",
  2000: "2000ms",
  2100: "2100ms",
  2200: "2200ms",
  2300: "2300ms",
  2400: "2400ms",
  2500: "2500ms",
  2600: "2600ms",
  2700: "2700ms",
  2800: "2800ms",
  2900: "2900ms",
  3000: "3000ms",
  3100: "3100ms",
  3200: "3200ms",
  3300: "3300ms",
  3400: "3400ms",
  3500: "3500ms",
  3600: "3600ms",
  3700: "3700ms",
  3800: "3800ms",
  3900: "3900ms",
  4000: "4000ms",
  4100: "4100ms",
  4200: "4200ms",
  4300: "4300ms",
  4400: "4400ms",
  4500: "4500ms",
  4600: "4600ms",
  4700: "4700ms",
  4800: "4800ms",
  4900: "4900ms",
  5000: "5000ms",
  5100: "5100ms",
  5200: "5200ms",
  5300: "5300ms",
  5400: "5400ms",
  5500: "5500ms",
  5600: "5600ms",
  5700: "5700ms",
  5800: "5800ms",
  5900: "5900ms",
  6000: "6000ms",
  6100: "6100ms",
  6200: "6200ms",
  6300: "6300ms",
  6400: "6400ms",
  6500: "6500ms",
  6600: "6600ms",
  6700: "6700ms",
  6800: "6800ms",
  6900: "6900ms",
  7000: "7000ms",
  7100: "7100ms",
  7200: "7200ms",
  7300: "7300ms",
  7400: "7400ms",
  7500: "7500ms",
  7600: "7600ms",
  7700: "7700ms",
  7800: "7800ms",
  7900: "7900ms",
  8000: "8000ms",
  8100: "8100ms",
  8200: "8200ms",
  8300: "8300ms",
  8400: "8400ms",
  8500: "8500ms",
  8600: "8600ms",
  8700: "8700ms",
  8800: "8800ms",
  8900: "8900ms",
  9000: "9000ms",
  9100: "9100ms",
  9200: "9200ms",
  9300: "9300ms",
  9400: "9400ms",
  9500: "9500ms",
  9600: "9600ms",
  9700: "9700ms",
  9800: "9800ms",
  9900: "9900ms",
  10000: "10000ms",
};

const config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/ds/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/screens/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/translations/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    extend: {
      transitionDelay: timeScale,
      transitionDuration: timeScale,

      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "default-gradient":
          "linear-gradient(to right, #FF0097, #784BA0, #00B5FF)",
      },
      borderImage: {
        "default-gradient":
          "linear-gradient(to right, #FF0097, #784BA0, #00B5FF)",
      },
      fontFamily: {
        sfpro: ["sfpro", "sans-serif"],
        sfmono: ["sfmono", "sans-serif"],
      },
      colors: {
        DSGlobalBackgroundColor: "var(--ds-global-background)",
        DSGlobalText: "var(--ds-global-text)",
        DSGlobalPrimary: "var(--ds-global-primary)",
        // header colors
        DSHeaderBackground: "var(--ds-header-background)",
        DSHeadertext: "var(--ds-header-text)",
        DSHeaderBorder: "var(--ds-header-border)",
        // footer colors
        DSFooterBackground: "var(--ds-header-background)",
        DSFootertext: "var(--ds-header-text)",
        DSFooterBorder: "var(--ds-header-border)",

        // --
        R1000: primitiveColors.R1000,
        R900: primitiveColors.R900,
        R800: primitiveColors.R800,
        R700: primitiveColors.R700,
        R600: primitiveColors.R600,
        R500: primitiveColors.R500,
        R400: primitiveColors.R400,
        R300: primitiveColors.R300,
        R200: primitiveColors.R200,
        R100: primitiveColors.R100,
        Y1000: primitiveColors.Y1000,
        Y900: primitiveColors.Y900,
        Y800: primitiveColors.Y800,
        Y700: primitiveColors.Y700,
        Y600: primitiveColors.Y600,
        Y500: primitiveColors.Y500,
        Y400: primitiveColors.Y400,
        Y300: primitiveColors.Y300,
        Y200: primitiveColors.Y200,
        Y100: primitiveColors.Y100,
        G1000: primitiveColors.G1000,
        G900: primitiveColors.G900,
        G800: primitiveColors.G800,
        G700: primitiveColors.G700,
        G600: primitiveColors.G600,
        G500: primitiveColors.G500,
        G400: primitiveColors.G400,
        G300: primitiveColors.G300,
        G200: primitiveColors.G200,
        G100: primitiveColors.G100,
        B1000: primitiveColors.B1000,
        B900: primitiveColors.B900,
        B800: primitiveColors.B800,
        B700: primitiveColors.B700,
        B600: primitiveColors.B600,
        B500: primitiveColors.B500,
        B400: primitiveColors.B400,
        B300: primitiveColors.B300,
        B200: primitiveColors.B200,
        B100: primitiveColors.B100,
        T1000: primitiveColors.T1000,
        T900: primitiveColors.T900,
        T800: primitiveColors.T800,
        T700: primitiveColors.T700,
        T600: primitiveColors.T600,
        T500: primitiveColors.T500,
        T400: primitiveColors.T400,
        T300: primitiveColors.T300,
        T200: primitiveColors.T200,
        T100: primitiveColors.T100,
        L1000: primitiveColors.L1000,
        L900: primitiveColors.L900,
        L800: primitiveColors.L800,
        L700: primitiveColors.L700,
        L600: primitiveColors.L600,
        L500: primitiveColors.L500,
        L400: primitiveColors.L400,
        L300: primitiveColors.L300,
        L200: primitiveColors.L200,
        L100: primitiveColors.L100,
        P1000: primitiveColors.P1000,
        P900: primitiveColors.P900,
        P800: primitiveColors.P800,
        P700: primitiveColors.P700,
        P600: primitiveColors.P600,
        P500: primitiveColors.P500,
        P400: primitiveColors.P400,
        P300: primitiveColors.P300,
        P200: primitiveColors.P200,
        P100: primitiveColors.P100,
        M1000: primitiveColors.M1000,
        M900: primitiveColors.M900,
        M800: primitiveColors.M800,
        M700: primitiveColors.M700,
        M600: primitiveColors.M600,
        M500: primitiveColors.M500,
        M400: primitiveColors.M400,
        M300: primitiveColors.M300,
        M200: primitiveColors.M200,
        M100: primitiveColors.M100,
        O1000: primitiveColors.O1000,
        O900: primitiveColors.O900,
        O800: primitiveColors.O800,
        O700: primitiveColors.O700,
        O600: primitiveColors.O600,
        O500: primitiveColors.O500,
        O400: primitiveColors.O400,
        O300: primitiveColors.O300,
        O200: primitiveColors.O200,
        O100: primitiveColors.O100,
        N1000: primitiveColors.N1000,
        N900: primitiveColors.N900,
        N800: primitiveColors.N800,
        N700: primitiveColors.N700,
        N600: primitiveColors.N600,
        N500: primitiveColors.N500,
        N400: primitiveColors.N400,
        N300: primitiveColors.N300,
        N200: primitiveColors.N200,
        N100: primitiveColors.N100,
        NA80: primitiveColors.NA80,
        NA60: primitiveColors.NA60,
        NA50: primitiveColors.NA50,
        NA40: primitiveColors.NA40,
        NA30: primitiveColors.NA30,
        NA20: primitiveColors.NA20,
        NA15: primitiveColors.NA15,
        NA10: primitiveColors.NA10,
        NA05: primitiveColors.NA05,
        NA03: primitiveColors.NA03,
        "GrayScale-Surface-Subtle": primitiveColors.N0,
        "GrayScale-Surface-Default": primitiveColors.N100,
        "GrayScale-Surface-Disabled": primitiveColors.N100,
        "GrayScale-Border-Default": primitiveColors.N300,
        "GrayScale-Border-Disabled": primitiveColors.N200,
        "GrayScale-Border-Darker": primitiveColors.N600,
        "GrayScale-Border-Negative": primitiveColors.N0,
        "GrayScale-TextIcon-Title": primitiveColors.N1000,
        "GrayScale-TextIcon-Body": primitiveColors.N900,
        "GrayScale-TextIcon-Subtitle": primitiveColors.N700,
        "GrayScale-TextIcon-Caption": primitiveColors.N700,
        "GrayScale-TextIcon-Negative": primitiveColors.N100,
        "GrayScale-TextIcon-Disabled": primitiveColors.N400,
        "Primary-Surface-Subtle": primitiveColors.G100,
        "Primary-Surface-Lighter": primitiveColors.G300,
        "Primary-Surface-Default": primitiveColors.G600,
        "Primary-Surface-Darker": primitiveColors.G800,
        "Primary-Border-Subtle": primitiveColors.G100,
        "Primary-Border-Lighter": primitiveColors.G300,
        "Primary-Border-Default": primitiveColors.G600,
        "Primary-Border-Darker": primitiveColors.G800,
        "Primary-TextIcon-Label": primitiveColors.G800,
        "Error-Surface-Subtle": primitiveColors.R100,
        "Error-Surface-Lighter": primitiveColors.R300,
        "Error-Surface-Default": primitiveColors.R600,
        "Error-Surface-Darker": primitiveColors.R800,
        "Error-Border-Subtle": primitiveColors.R100,
        "Error-Border-Lighter": primitiveColors.R300,
        "Error-Border-Default": primitiveColors.R600,
        "Error-Border-Darker": primitiveColors.R800,
        "Error-TextIcon-Label": primitiveColors.R800,
        "Warning-Surface-Subtle": primitiveColors.O100,
        "Warning-Surface-Lighter": primitiveColors.O300,
        "Warning-Surface-Default": primitiveColors.O600,
        "Warning-Surface-Darker": primitiveColors.O800,
        "Warning-Border-Subtle": primitiveColors.O100,
        "Warning-Border-Lighter": primitiveColors.O300,
        "Warning-Border-Default": primitiveColors.O600,
        "Warning-Border-Darker": primitiveColors.O800,
        "Warning-TextIcon-Label": primitiveColors.O800,
        "Success-Surface-Subtle": primitiveColors.L100,
        "Success-Surface-Lighter": primitiveColors.L300,
        "Success-Surface-Default": primitiveColors.L600,
        "Success-Surface-Darker": primitiveColors.L800,
        "Success-Border-Subtle": primitiveColors.L100,
        "Success-Border-Lighter": primitiveColors.L300,
        "Success-Border-Default": primitiveColors.L600,
        "Success-Border-Darker": primitiveColors.L800,
        "Success-TextIcon-Label": primitiveColors.L800,
      },
      fontSize: {
        xxs: "1.2rem", // 12px
        xs: "1.3rem", // 13px
        sm: "1.4rem", // 14px
        base: "1.6rem", // 16px
        lg: "1.8rem", // 18px
        xl: "2rem", // 20px
        xxl: "2.2rem", // 22px
        xxxl: "2.4rem", // 24px
        hu0: "2.6rem", // 26px
        "hu0.2": "2.8", // 28px
        "hu0.4": "3", // 30px
        "hu0.6": "3.2", // 32px
        "hu0.8": "3.4", // 34px
        "hu1.2": "3.6", // 36px
        "hu1.4": "3.8", // 38px
        "hu1.6": "4", // 40px
        "hu1.8": "4.2", // 42px
        "hu2.0": "4.4", // 44px
        "hu2.2": "4.6", // 46px
        "hu2.4": "4.8", // 48px
        "hu2.6": "5", // 50px
        "hu2.8": "5.2", // 52px
        "hu3.0": "5.4", // 54px
        "hu3.2": "5.6", // 56px
        "hu3.4": "5.8", // 58px
        "hu3.6": "6", // 60px
        "hu3.8": "6.2", // 62px
        "hu4.0": "6.4", // 64px
        "hu4.2": "6.6", // 66px
        "hu4.4": "6.8", // 68px
        "hu4.6": "7", // 70px
        "hu4.8": "7.2", // 72px
        "hu5.0": "7.4", // 74px
        "hu5.2": "7.6", // 76px
        "hu5.4": "7.8", // 78px
        "hu5.6": "8", // 80px
        "hu5.8": "8.2", // 82px
        "hu6.0": "8.4", // 84px
        "hu6.2": "8.6", // 86px
        "hu6.4": "8.8", // 88px
        "hu6.6": "9", // 90px
        "hu6.8": "9.2", // 92px
        "hu7.0": "9.4", // 94px
        "hu7.2": "9.6", // 96px
        "hu7.4": "9.8", // 98px
        "hu7.6": "10", // 100px
        "hu7.8": "10.2", // 102px
        "hu8.0": "10.4", // 104px
      },
      padding: spaceTokens,
      margin: spaceTokens,
      spacing: spaceTokens,
      width: spaceTokens,
      height: spaceTokens,
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    // ...
  ],
};
export default config;
