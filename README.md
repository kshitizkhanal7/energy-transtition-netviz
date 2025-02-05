your-repo/
   ├── index.html
   ├── static/
   │   ├── css/
   │   │   └── styles.css
   │   ├── data/
   │   │   └── career_network.json
   │   └── js/
   │       └── network.js
   └── README.md
   ```
3. Enable GitHub Pages:
   - Go to repository Settings
   - Navigate to "Pages" section
   - Under "Branch", select "main" and "/(root)"
   - Click Save

Your site will be available at: `https://[username].github.io/[repository-name]/`

## Local Development
To test locally:
1. Open terminal in project directory
2. Start a local server:
   ```bash
   # Using Python 3
   python -m http.server 8000
   # Then open http://localhost:8000 in your browser
   ```

## Technologies Used
- D3.js for visualization
- Bootstrap for styling
- Vanilla JavaScript for interactions

## Data Structure
The visualization uses `career_network.json` which contains:
- Nodes: Job positions with type and salary
- Links: Transitions between jobs with similarity scores

## Project Structure
```
project/
├── index.html                 # Main entry point
├── static/
│   ├── css/
│   │   └── styles.css        # Custom styling
│   ├── data/
│   │   └── career_network.json # Career transition data
│   └── js/
│       └── network.js        # D3.js visualization logic