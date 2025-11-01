# Lauren's List

A trigger warning website that helps users identify sensitive content in books and movies, specifically focused on cancer-related themes.

## Features

- **Book & Movie Search**: Search for books using Google Books API, Open Library, Goodreads, StoryGraph, Wikipedia, Trigger Warning Database, and web search
- **Movie Search**: Search for movies using TMDB API, DoesTheDogDie, IMDb cancer lists, and Wikipedia
- **Cancer Content Detection**: AI-powered analysis to detect cancer-related themes using multiple data sources
- **Smart Term Detection**: Cancer-specific term detection (avoids false positives from generic death terms)
- **Multi-Source Validation**: Cross-references multiple APIs and databases for accurate results
- **Toggle Analysis**: Hide/show detailed content analysis with source information
- **Known Content Database**: Curated list of books/movies with cancer themes
- **Clean UI**: Modern, responsive design

## Setup

### Prerequisites

- Web browser (Chrome, Firefox, Safari, Edge)
- API keys for:
  - Google Books API
  - TMDB API

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/laurens-list.git
   cd laurens-list
   ```

2. Set up your API keys:
   - Copy `config.production.js` to `config.js` (for local development)
   - Add your actual API keys to `config.js`:
   ```javascript
   const CONFIG = {
       TMDB_API_KEY: 'your_tmdb_api_key',
       GOOGLE_BOOKS_API_KEY: 'your_google_books_api_key',
       DOESTHEDOGDIE_API_KEY: 'your_dtdd_api_key'
   };
   ```
   
   **Note**: For production deployment, API keys are injected during the Docker build process.

3. Open `index.html` in your web browser

### Getting API Keys

#### Google Books API
1. Go to [Google Cloud Console](https://console.developers.google.com/)
2. Create a new project or select existing
3. Enable the Books API
4. Create credentials (API Key)
5. Add the key to `script.js`

#### TMDB API
1. Go to [TMDB](https://www.themoviedb.org/settings/api)
2. Create an account
3. Request an API key
4. Add the key to `script.js`

## Usage

1. Select "Book" or "Movie" using the radio buttons
2. Enter the title in the search box
3. Click "Search" or press Enter
4. View the safety status and content analysis
5. Use the toggle button to show/hide detailed analysis

## Project Structure

```
laurens-list/
├── index.html          # Main HTML file
├── styles.css          # CSS styling
├── script.js           # JavaScript functionality
├── README.md           # This file
└── .gitignore          # Git ignore rules
```

## How It Works

### Book Search
1. **Google Books API**: Primary search with exact title matching
2. **Open Library API**: Fallback search for additional results
3. **Goodreads**: User reviews and detailed book descriptions
4. **StoryGraph**: Content warnings and trigger warnings
5. **Wikipedia**: Plot summaries and thematic analysis
6. **Trigger Warning Database**: Curated database for terminal illnesses/cancer warnings
7. **Web Search**: Additional cancer content detection
8. **Smart Selection**: Prioritizes exact title matches over content length

### Movie Search
1. **TMDB API**: Primary movie search
2. **DoesTheDogDie**: Comprehensive trigger warning database (requires cancer-specific terms)
3. **IMDb Cancer Lists**: Curated lists of movies about cancer
4. **Wikipedia**: Category listings for films about cancer
5. **Web Search**: Additional cancer content detection

### Content Analysis
1. **Cancer-Specific Term Detection**: Searches for cancer-related keywords (avoids false positives from generic death terms)
2. **Known Content**: Checks against curated database of cancer-themed works
3. **Multi-Source Validation**: Cross-references multiple APIs and databases
4. **Confidence Scoring**: Provides confidence level (80-95%) for analysis
5. **Source Attribution**: Shows which sources contributed to the analysis

### Safety Determination
- **SAFE**: No cancer-related content detected across all sources
- **NOT RECOMMENDED**: Cancer-related content found in one or more sources

### Key Improvements
- **Reduced False Positives**: Generic death terms (e.g., "death", "dying") alone no longer trigger "not recommended" status
- **High-Confidence Detection**: Only cancer-specific terms (e.g., "cancer", "chemotherapy", "oncology") trigger DoesTheDogDie warnings
- **Comprehensive Coverage**: Multiple data sources ensure thorough analysis

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Commit: `git commit -m "Add feature"`
5. Push: `git push origin feature-name`
6. Submit a pull request

## License

This project is open source. Please use responsibly and respect content creators' rights.

## Disclaimer

This tool uses AI analysis to detect sensitive content. Results are not guaranteed to be 100% accurate. Always use your own judgment when consuming media.

## Support

If you encounter issues or have suggestions, please open an issue on GitHub.