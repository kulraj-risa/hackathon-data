module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx,html}", // Paths to your files
  ],
  theme: {
    extend: {
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-in-out',
      },
      colors: {
        // Primary Green Shades
        primaryGreen: {
          1: "#003d15",
          2: "#00521d",
          3: "#007028",
          4: "#008f32",
          5: "#1db954",
          6: "#20cb5c",
          7: "#2cdd80",
          8: "#58e49b",
          9: "#84ebb5",
          10: "#caf6df",
          11: "#eefcf4",
        },

        // Primary Gray Shades
        primaryGray: {
          1: "#0f0f0f",
          2: "#1f1f1f",
          3: "#2e2e2e",
          4: "#3d3d3d",
          5: "#4d4d4d",
          6: "#5c5c5c",
          7: "#6b6b6b",
          8: "#7a7a7a",
          9: "#8a8a8a",
          10: "#999999",
          11: "#a8a8a8",
          12: "#b8b8b8",
          13: "#c7c7c7",
          14: "#d6d6d6",
          15: "#e6e6e6",
          16: "#f5f5f5",
          17: "#F7F9F5"
        },

        // Secondary Purple Shades
        secondaryPurple: {
          1: "#1a004d",
          2: "#220066",
          3: "#330099",
          4: "#4b00cc",
          5: "#661aff",
          6: "#7e33ff",
          7: "#9e66ff",
          8: "#c599ff",
          9: "#e7ccff",
          10: "#f6e5ff",
        },

        // Secondary Yellow Shades
        secondaryYellow: {
          1: "#474100",
          2: "#665e00",
          3: "#857a00",
          4: "#a39600",
          5: "#c2b200",
          6: "#e0ce00",
          7: "#fae500",
          8: "#ffef3d",
          9: "#fff370",
          10: "#fff8ad",
          11: "#fffcd6",
        },

        // Secondary Orange Shades
        secondaryOrange: {
          1: "#8f3200",
          2: "#c24400",
          3: "#e65100",
          4: "#ef6c00",
          5: "#f57c00",
          6: "#fb8c00",
          7: "#ff9800",
          8: "#ffa726",
          9: "#ffb74d",
          10: "#ffcc80",
          11: "#ffe0b2",
          12: "#fff3e0",
        },

        // Tertiary Red Shades
        tertiaryRed: {
          1: "#7b0300",
          2: "#a3000e",
          3: "#cc0300",
          4: "#f50400",
          5: "#ff332e",
          6: "#ff5452",
          7: "#ff7370",
          8: "#ff9999",
          9: "#ffbdbd",
          10: "#ffd6d6",
          11: "#ffe8e8",
          50: "#FAE6E6",
          600: "#BB0202",
          "form_error": "#cd0202"
        },

        // Tertiary Magenta Shades
        tertiaryMagenta: {
          1: "#5c0048",
          2: "#7a005f",
          3: "#990077",
          4: "#c20097",
          5: "#e000af",
          6: "#ff1fce",
          7: "#ff47d7",
          8: "#ff70e2",
          9: "#ff99eb",
          10: "#ffb8f1",
          11: "#ffd6f7",
          12: "#ffebfb",
        },

        // Tertiary Cyan Shades
        tertiaryCyan: {
          1: "#002929",
          2: "#003d3d",
          3: "#005c5c",
          4: "#007a7a",
          5: "#008f8f",
          6: "#00b8b8",
          7: "#00e0e0",
          8: "#33ffff",
          9: "#70ffff",
          10: "#adffff",
          11: "#d6ffff",
          12: "#ebffff",
        },

        // Tertiary Lime Shades
        tertiaryLime: {
          1: "#2a3d00",
          2: "#375200",
          3: "#537a00",
          4: "#618f00",
          5: "#7db800",
          6: "#9feb00",
          7: "#acff00",
          8: "#c1ff3d",
          9: "#d1ff70",
          10: "#e5ffad",
          11: "#f3ffd6",
        },

        // Tertiary Blue Shades
        tertiaryBlue: {
          1: "#002152",
          2: "#00317a",
          3: "#0041a3",
          4: "#0056d6",
          5: "#0066ff",
          6: "#297fff",
          7: "#5297ff",
          8: "#7aafff",
          9: "#99c2ff",
          10: "#b8d4ff",
          11: "#d6e6ff",
          12: "#eaf2ff",
          13: "#f3f8ff",
        },

        // Grayscale Black Shades
        grayscaleBlack: {
          1: "#606060",
          2: "#404040",
          3: "#303030",
          4: "#202020",
          5: "#101010",
        },
        lightGray: '#F7F9FA',



        tertiaryGreen: {
          700: "#005D49",
          50: "#E6F3F0"
        }
      },
      fontSize: {
        h1: "6rem",
        h2: "5rem",
        h3: "4rem",
        h4: "3.25rem",
        h5: "2.625rem",
        h6: "2rem",
        h7: "1.75rem",
        h8: "1.3125rem",
        h9: "1.3125rem",
        h10: "1.125rem",
        h11: "1rem",
        h12: "0.875rem",
        tiny: "0.75rem",
        "x-large": "1.3125rem",
        large: "1.125rem",
        small: "0.875rem",
        body: "1rem",
        "x-tiny": "0.6875rem",
        overline: "0.625rem",
      },
      fontWeight: {
        hairLine: "100",
        regular: "300",
        semiBold: "400",
        bold: "700",
        extraBold: "900",
      },
      lineHeight: {
        h1: "6rem",
        h2: "5rem",
        h3: "4rem",
        h4: "3.25rem",
        h5: "3rem",
        h6: "2.375rem",
        h7: "2.125rem",
        h8: "1.875rem",
        h9: "1.5rem",
        h10: "1.375rem",
        h11: "1.25rem",
        h12: "1.125rem",
        tiny: "1.125rem",
        "x-large": "1.875rem",
        large: "1.625rem",
        small: "1.375rem",
        body: "1.5rem",
        "x-tiny": "1.125rem",
        overline: "1rem",
      },
      borderWidth: {
        '1': '1.5px',
      },
      height: {
        '42': '10.25rem',
      },
     
    },
  },
  plugins: [],
};