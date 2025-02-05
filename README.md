./
├── index.html                 # Main entry point
├── static/
│   ├── css/
│   │   └── styles.css        # Custom styling
│   ├── data/
│   │   └── career_network.json # Career transition data
│   └── js/
│       └── network.js        # D3.js visualization logic
└── README.md
```

## Features
- Interactive force-directed graph visualization
- Salary progression insights
- Direct and indirect career transition paths
- Detailed job information on hover
- Step-by-step transition guidance

## Technologies Used
- D3.js for visualization
- Bootstrap for styling
- Vanilla JavaScript for interactions

## GitHub Pages Deployment
1. Upload all files maintaining the exact folder structure
2. Enable GitHub Pages:
   - Go to repository Settings
   - Navigate to "Pages" section
   - Under "Source", select "Deploy from a branch"
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