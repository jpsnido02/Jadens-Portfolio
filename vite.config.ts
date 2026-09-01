import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
    // Relative asset paths, so the build works both at the project-pages
    // subpath (jpsnido02.github.io/Jadens-Portfolio/) and at the apex custom
    // domain. An absolute "/" base 404s on the former.
    base: "./",
    plugins: [react()],
})
