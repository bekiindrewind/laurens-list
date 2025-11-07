# Regression Test Suite

This regression test suite validates that Lauren's List correctly identifies cancer-related content in movies and books.

## Overview

The test suite:
1. Tests movies from the [IMDb Cancer Movies List](https://www.imdb.com/list/ls004695995/)
2. Tests books from the [Goodreads Fictional Books on Cancer List](https://www.goodreads.com/list/show/11599.Fictional_Books_on_Cancer)
3. Verifies that each item is correctly marked as **Not Safe** (contains cancer content)
4. Generates a markdown report with test results

## Usage

### Run the regression tests:

```bash
npm run test:regression
```

### Output

The test will:
- Test each movie and book against Lauren's List
- Display progress in the console
- Generate a `REGRESSION_TEST_REPORT.md` file with detailed results

## Test Lists

### Movies (from IMDb)

The test includes movies from the IMDb "Movies about Cancer" list. To add more movies, edit the `IMDB_MOVIES` array in `regression-test.js`.

### Books (from Goodreads)

The test includes books from the Goodreads "Fictional Books on Cancer" list. To add more books, edit the `GOODREADS_BOOKS` array in `regression-test.js`.

## Report Format

The generated report includes:

1. **Summary Section**
   - Total tested
   - Number correctly marked as not safe
   - Number incorrectly marked as safe
   - Success rate

2. **Failed Tests Section**
   - List of movies/books incorrectly marked as safe
   - Reason for failure

3. **Detailed Results Section**
   - Individual test results for each item
   - Found cancer terms
   - Analysis reason

## Adding More Test Cases

To add more test cases:

1. **For Movies**: Add titles to the `IMDB_MOVIES` array in `regression-test.js`
2. **For Books**: Add titles to the `GOODREADS_BOOKS` array in `regression-test.js`

Example:
```javascript
const IMDB_MOVIES = [
    'Miss You Already',
    'Me and Earl and the Dying Girl',
    // Add more movies here
    'Your New Movie Title'
];
```

## API Keys

The test uses the same API keys as the main application:
- `TMDB_API_KEY` - For movie searches
- `GOOGLE_BOOKS_API_KEY` - For book searches
- `DOESTHEDOGDIE_API_KEY` - For trigger warning data

These can be set as environment variables or will use defaults from the code.

## Rate Limiting

The test includes 1-second delays between requests to avoid rate limiting. If you encounter rate limit errors, increase the delay in the `runTests()` function.

## Notes

- The test uses the same detection logic as the main application
- Some items may not be found in APIs (TMDB, Google Books, Wikipedia) - these are skipped
- The test focuses on cancer term detection, not all trigger warnings

