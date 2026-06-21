
// Define the deprecations to silence
const silenceDeprecations = [
  "legacy-js-api"  // Suppress the legacy JS API deprecation warning
];

// Create a Sass configuration object
const sassConfig = {
  includePaths: ["node_modules"],
  silenceDeprecations: silenceDeprecations,
  // You can add other Sass options here as needed
};

export default sassConfig; 