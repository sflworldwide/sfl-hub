import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import javascriptObfuscator from "vite-plugin-javascript-obfuscator";

// Wrap the export in a function to access the command ('serve' for dev, 'build' for prod)
export default defineConfig(({ command }) => {
  const isBuild = command === 'build'; // Check if we are running the build command

  // Base plugins that always run
  const plugins = [react()];

  // --- Conditionally add the obfuscator ONLY for the build command ---
  if (isBuild) {
    console.log("Obfuscator enabled for build."); // Optional: Add a log to confirm
    plugins.push(
      javascriptObfuscator({
        options: {
          compact: true,
          controlFlowFlattening: true,
          deadCodeInjection: true,
          debugProtection: true, // You might reconsider this even for build
          disableConsoleOutput: false, // Set to true for final production if desired
          selfDefending: true,
        },
      })
    );
  } else {
    console.log("Obfuscator disabled for development server."); // Optional log
  }
  // --- End conditional obfuscator ---

  return {
    plugins: plugins, // Use the plugins array (will include obfuscator only for build)
    build: {
      chunkSizeWarningLimit: 30000,
      sourcemap: false, // Keep false for build if obfuscating
      minify: "terser",
      terserOptions: {
        compress: {
          // Decide if you want to drop console logs in the final build
          drop_console: false, // Change to true to remove console.log in production build
          drop_debugger: true,
        },
        format: {
          comments: false,
        },
      },
    },
    // Add other Vite config options here if needed
  };
});