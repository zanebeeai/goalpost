/** @type {import('prettier').Config} */
const config = {
  plugins: ["prettier-plugin-tailwindcss"],
  // Tailwind v4: the plugin reads the theme from the CSS entry point.
  tailwindStylesheet: "./src/app/globals.css",
  semi: true,
  tabWidth: 2,
  trailingComma: "all",
};

export default config;
