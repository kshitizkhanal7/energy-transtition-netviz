## About

This interactive visualization demonstrates potential occupational transition pathways for retraining into clean energy occupations. Example data will be replaced by real world data soon. 

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
