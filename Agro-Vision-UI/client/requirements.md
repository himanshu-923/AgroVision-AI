## Packages
framer-motion | Page transitions and micro-animations
lucide-react | High quality icons for the UI

## Notes
- The backend needs to handle `multipart/form-data` for the `/api/analyze` POST request, expecting an 'image' file and a 'language' string.
- The `/api/speak` endpoint should accept a JSON body with `text` and `language`, and return a playable audio file (e.g., audio/mpeg or audio/wav).
- We use the browser's native `window.print()` for the PDF report generation, which requires no extra backend dependencies.
