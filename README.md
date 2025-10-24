# Lauren's List

A trigger warning website that helps users identify sensitive content in books and movies, specifically focused on cancer-related themes.

## Features

- **Book & Movie Search**: Search for books using Google Books API and Open Library
- **Movie Search**: Search for movies using TMDB API
- **Cancer Content Detection**: AI-powered analysis to detect cancer-related themes
- **Toggle Analysis**: Hide/show detailed content analysis
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

2. Add your API keys to `script.js`:
   ```javascript
   const TMDB_API_KEY = 'your_tmdb_api_key';
   const GOOGLE_BOOKS_API_KEY = 'your_google_books_api_key';
   ```

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
3. **Smart Selection**: Prioritizes exact title matches over content length

### Content Analysis
1. **Term Detection**: Searches for cancer-related keywords
2. **Known Content**: Checks against curated database of cancer-themed works
3. **Confidence Scoring**: Provides confidence level for analysis

### Safety Determination
- **SAFE**: No cancer-related content detected
- **NOT RECOMMENDED**: Cancer-related content found

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