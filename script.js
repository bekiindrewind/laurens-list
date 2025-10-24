// API Keys - Loaded from config.js (not committed to version control)
// Check if config.js exists and load API keys from there
let TMDB_API_KEY = 'YOUR_TMDB_API_KEY';
let GOOGLE_BOOKS_API_KEY = 'YOUR_GOOGLE_BOOKS_API_KEY';
let HARDCOVER_BEARER_TOKEN = 'YOUR_HARDCOVER_BEARER_TOKEN';
let DOESTHEDOGDIE_API_KEY = 'YOUR_DTDD_API_KEY';

// Load API keys from config.js if it exists
console.log('🔧 Loading API keys...');
console.log('CONFIG object available:', typeof CONFIG !== 'undefined');

if (typeof CONFIG !== 'undefined') {
    TMDB_API_KEY = CONFIG.TMDB_API_KEY;
    GOOGLE_BOOKS_API_KEY = CONFIG.GOOGLE_BOOKS_API_KEY;
    HARDCOVER_BEARER_TOKEN = CONFIG.HARDCOVER_BEARER_TOKEN;
    DOESTHEDOGDIE_API_KEY = CONFIG.DOESTHEDOGDIE_API_KEY;
    console.log('✅ API keys loaded from config.js');
} else {
    console.log('⚠️ CONFIG object not found, using placeholder values');
}

console.log('📝 Script continuing to load...');

// Cancer-related terms for semantic analysis
const CANCER_TERMS = [
    'cancer', 'tumor', 'tumour', 'malignancy', 'carcinoma', 'sarcoma', 'leukemia', 'leukaemia',
    'lymphoma', 'melanoma', 'metastasis', 'chemotherapy', 'radiation', 'oncology', 'oncologist',
    'biopsy', 'malignant', 'benign', 'stage 1', 'stage 2', 'stage 3', 'stage 4', 'terminal',
    'hospice', 'palliative', 'cancer treatment', 'cancer patient', 'cancer survivor',
    'breast cancer', 'lung cancer', 'prostate cancer', 'colon cancer', 'pancreatic cancer',
    'brain tumor', 'brain tumour', 'cancer diagnosis', 'cancer prognosis', 'cancer remission',
    'thyroid cancer', 'ovarian cancer', 'cervical cancer', 'bone cancer', 'blood cancer'
];

// Known cancer-themed books and movies for enhanced detection
const CANCER_THEMED_CONTENT = {
    books: [
        'the fault in our stars', 'a walk to remember', 'me before you', 'my sister\'s keeper',
        'the notebook', 'five feet apart', 'everything everything', 'the sun is also a star',
        'all the bright places', 'looking for alaska', 'paper towns', 'turtles all the way down',
        'my friends', 'fredrik backman', 'beartown', 'us against you', 'winners',
        'a man called ove', 'anxious people', 'britt-marie was here',
        'the midnight library', 'matt haig', 'the seven husbands of evelyn hugo',
        'taylor jenkins reid', 'the invisible life of addie larue', 'v.e. schwab',
        'the book thief', 'markus zusak', 'the kite runner', 'khaled hosseini',
        'the help', 'kathryn stockett', 'water for elephants', 'sara gruen',
        'the time traveler\'s wife', 'audrey niffenegger', 'the lovely bones',
        'alice sebold', 'the curious incident of the dog in the night-time',
        'mark haddon', 'life of pi', 'yann martel'
    ],
    movies: [
        'the fault in our stars', 'a walk to remember', 'me before you', 'my sister\'s keeper',
        'the notebook', 'five feet apart', 'everything everything', 'the sun is also a star',
        'all the bright places', 'looking for alaska', 'paper towns', 'turtles all the way down',
        'the bucket list', '50/50', 'wish i was here', 'the big sick',
        'my friends', 'a man called ove', 'beartown', 'us against you',
        'the midnight library', 'the seven husbands of evelyn hugo',
        'the invisible life of addie larue', 'the book thief', 'the kite runner',
        'the help', 'water for elephants', 'the time traveler\'s wife',
        'the lovely bones', 'the curious incident of the dog in the night-time',
        'life of pi'
    ]
};

console.log('📚 CANCER_THEMED_CONTENT loaded successfully');

class LaurensList {
    constructor() {
        this.initializeEventListeners();
        this.currentSearchType = 'book';
    }

    initializeEventListeners() {
        console.log('🎧 Setting up event listeners...');
        
        // Media type selection
        const mediaTypeInputs = document.querySelectorAll('input[name="mediaType"]');
        console.log(`Found ${mediaTypeInputs.length} media type inputs`);
        
        mediaTypeInputs.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.currentSearchType = e.target.value;
                this.updatePlaceholder();
            });
        });

        // Search button
        const searchButton = document.getElementById('searchButton');
        console.log('Search button element:', searchButton);
        
        if (searchButton) {
            searchButton.addEventListener('click', () => {
                console.log('🔍 Search button clicked!');
                this.performSearch();
            });
            console.log('✅ Search button event listener added');
        } else {
            console.error('❌ Search button not found!');
        }

        // Enter key in search input
        const searchInput = document.getElementById('searchInput');
        console.log('Search input element:', searchInput);
        
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    console.log('🔍 Enter key pressed in search input!');
                    this.performSearch();
                }
            });
            console.log('✅ Search input event listener added');
        } else {
            console.error('❌ Search input not found!');
        }

        // Trigger tag selection
        document.querySelectorAll('.trigger-tag').forEach(tag => {
            tag.addEventListener('click', (e) => {
                document.querySelectorAll('.trigger-tag').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Analysis toggle button
        document.getElementById('toggleAnalysis').addEventListener('click', () => {
            this.toggleAnalysisSection();
        });

        // API Debug toggle button
        document.getElementById('toggleApiDebug').addEventListener('click', () => {
            this.toggleApiDebugSection();
        });

    }

    updatePlaceholder() {
        const input = document.getElementById('searchInput');
        input.placeholder = this.currentSearchType === 'book' 
            ? 'Enter book title...' 
            : 'Enter movie title...';
    }

    async performSearch() {
        const query = document.getElementById('searchInput').value.trim();
        if (!query) {
            this.showError('Please enter a title to search');
            return;
        }

        console.log('Starting search for:', query, 'Type:', this.currentSearchType);

        this.setLoading(true);
        this.hideResults();
        this.hideError();

        try {
            let result;
            if (this.currentSearchType === 'book') {
                result = await this.searchBook(query);
            } else {
                result = await this.searchMovie(query);
            }

            if (result) {
                const analysis = await this.analyzeContent(result);
                this.displayResults(result, analysis);
            } else {
                this.showError('No results found. Please try a different title.');
            }
        } catch (error) {
            console.error('Search error:', error);
            this.showError('An error occurred while searching. Please try again.');
        } finally {
            this.setLoading(false);
        }
    }

    async searchBook(query) {
        try {
            console.log(`🔍 Starting book search for: "${query}"`);
            
            // Show API debug section
            this.showApiDebugSection();
            
            // Try multiple sources for comprehensive data
            const [googleBooksData, openLibraryData, hardcoverData, dtddData] = await Promise.allSettled([
                this.searchGoogleBooks(query),
                this.searchOpenLibrary(query),
                this.searchHardcover(query),
                this.searchDoesTheDogDie(query)
            ]);

            const googleResult = googleBooksData.status === 'fulfilled' ? googleBooksData.value : null;
            const openLibraryResult = openLibraryData.status === 'fulfilled' ? openLibraryData.value : null;
            const hardcoverResult = hardcoverData.status === 'fulfilled' ? hardcoverData.value : null;
            const dtddResult = dtddData.status === 'fulfilled' ? dtddData.value : null;
            
            console.log('📊 API Results Summary:');
            console.log(`  📚 Google Books: ${googleResult ? '✅ Found' : '❌ No results'}`);
            console.log(`  📖 Open Library: ${openLibraryResult ? '✅ Found' : '❌ No results'}`);
            console.log(`  📘 Hardcover: ${hardcoverResult ? '✅ Found' : '❌ No results'}`);
            console.log(`  🐕 DoesTheDogDie: ${dtddResult ? '✅ Found' : '❌ No results'}`);
            
            // Update API debug section with results
            let debugContent = `<h4>🔍 Search Query: "${query}"</h4>\n`;
            debugContent += `<h4>📊 API Results Summary:</h4>\n`;
            
            if (googleResult) {
                console.log(`  📚 Google Books Details:`, {
                    title: googleResult.title,
                    author: googleResult.author,
                    descriptionLength: googleResult.description?.length || 0,
                    source: googleResult.source
                });
                
                debugContent += `<div class="api-result api-success">
                    <strong>📚 Google Books: ✅ Found</strong><br>
                    Title: ${googleResult.title}<br>
                    Author: ${googleResult.author}<br>
                    Description Length: ${googleResult.description?.length || 0} characters<br>
                    Source: ${googleResult.source}
                </div>`;
            } else {
                debugContent += `<div class="api-result api-no-results">
                    <strong>📚 Google Books: ❌ No results</strong>
                </div>`;
            }
            
            if (openLibraryResult) {
                console.log(`  📖 Open Library Details:`, {
                    title: openLibraryResult.title,
                    author: openLibraryResult.author,
                    descriptionLength: openLibraryResult.description?.length || 0,
                    source: openLibraryResult.source
                });
                
                debugContent += `<div class="api-result api-success">
                    <strong>📖 Open Library: ✅ Found</strong><br>
                    Title: ${openLibraryResult.title}<br>
                    Author: ${openLibraryResult.author}<br>
                    Description Length: ${openLibraryResult.description?.length || 0} characters<br>
                    Source: ${openLibraryResult.source}
                </div>`;
            } else {
                debugContent += `<div class="api-result api-no-results">
                    <strong>📖 Open Library: ❌ No results</strong>
                </div>`;
            }
            
            if (hardcoverResult) {
                console.log(`  📘 Hardcover Details:`, {
                    title: hardcoverResult.title,
                    author: hardcoverResult.author,
                    descriptionLength: hardcoverResult.description?.length || 0,
                    source: hardcoverResult.source
                });
                
                debugContent += `<div class="api-result api-success">
                    <strong>📘 Hardcover: ✅ Found</strong><br>
                    Title: ${hardcoverResult.title}<br>
                    Author: ${hardcoverResult.author}<br>
                    Description Length: ${hardcoverResult.description?.length || 0} characters<br>
                    Source: ${hardcoverResult.source}
                </div>`;
            } else {
                debugContent += `<div class="api-result api-no-results">
                    <strong>📘 Hardcover: ❌ No results</strong>
                </div>`;
            }
            
            if (dtddResult) {
                console.log(`  🐕 DoesTheDogDie Details:`, {
                    title: dtddResult.title,
                    author: dtddResult.author,
                    contentWarnings: dtddResult.contentWarnings,
                    source: dtddResult.source
                });
                
                debugContent += `<div class="api-result api-success">
                    <strong>🐕 DoesTheDogDie: ✅ Found</strong><br>
                    Title: ${dtddResult.title}<br>
                    Author: ${dtddResult.author}<br>
                    Content Warnings: ${dtddResult.contentWarnings || 'None'}<br>
                    Source: ${dtddResult.source}
                </div>`;
            } else {
                debugContent += `<div class="api-result api-no-results">
                    <strong>🐕 DoesTheDogDie: ❌ No results</strong>
                </div>`;
            }
            
            // Combine results from all APIs
            const allResults = [googleResult, openLibraryResult, hardcoverResult, dtddResult].filter(Boolean);
            
            if (allResults.length === 0) {
                console.log('❌ No results found from any API');
                debugContent += `<div class="api-result api-error">
                    <strong>No results found from any API</strong>
                </div>`;
                this.updateApiDebugInfo(debugContent);
                return null;
            }
            
            // Combine data from all sources
            const combinedResult = this.combineBookResults(allResults);
            
            console.log('🎯 Final Selection:');
            console.log(`  Combined from ${allResults.length} sources: ${allResults.map(r => r.source).join(', ')}`);
            console.log(`  Final title: ${combinedResult.title}`);
            console.log(`  Final author: ${combinedResult.author}`);
            
            // Update debug section with final selection
            debugContent += `<h4>🎯 Final Selection:</h4>\n`;
            debugContent += `<div class="api-result api-success">
                <strong>Combined from ${allResults.length} sources</strong><br>
                Sources: ${allResults.map(r => r.source).join(', ')}<br>
                Title: ${combinedResult.title}<br>
                Author: ${combinedResult.author}<br>
                Description Length: ${combinedResult.description?.length || 0} characters<br>
                Content Warnings: ${combinedResult.contentWarnings || 'None'}
            </div>`;
            
            this.updateApiDebugInfo(debugContent);
            
            return combinedResult;
        } catch (error) {
            console.error('❌ Book search error:', error);
            throw error;
        }
    }


    async searchGoogleBooks(query) {
        console.log(`📚 Searching Google Books for: "${query}"`);
        
        // Try exact title search first, then general search
        const exactUrl = `https://www.googleapis.com/books/v1/volumes?q=intitle:"${encodeURIComponent(query)}"&key=${GOOGLE_BOOKS_API_KEY}`;
        const generalUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&key=${GOOGLE_BOOKS_API_KEY}`;
        
        try {
            // Try exact title search first
            console.log(`  🔍 Trying exact title search...`);
            let response = await fetch(exactUrl);
            let data = await response.json();
            
            console.log(`  📊 Exact search results: ${data.items ? data.items.length : 0} items`);
            
            // If no results from exact search, try general search
            if (!data.items || data.items.length === 0) {
                console.log(`  🔍 No exact matches, trying general search...`);
                response = await fetch(generalUrl);
                data = await response.json();
                console.log(`  📊 General search results: ${data.items ? data.items.length : 0} items`);
            } else {
                console.log(`  ✅ Found exact title match!`);
            }
            
            if (data.items && data.items.length > 0) {
                const book = data.items[0].volumeInfo;
                
                // Get more detailed information
                let detailedDescription = book.description || '';
                let plotSummary = '';
                let reviews = '';

                // Try to get more detailed description from the full book details
                if (data.items[0].id) {
                    try {
                        const detailUrl = `https://www.googleapis.com/books/v1/volumes/${data.items[0].id}?key=${GOOGLE_BOOKS_API_KEY}`;
                        const detailResponse = await fetch(detailUrl);
                        const detailData = await detailResponse.json();
                        
                        if (detailData.volumeInfo) {
                            detailedDescription = detailData.volumeInfo.description || detailedDescription;
                            plotSummary = detailData.volumeInfo.subtitle || '';
                        }
                    } catch (e) {
                        console.log('Could not fetch detailed book info');
                    }
                }

                return {
                    title: book.title,
                    author: book.authors ? book.authors.join(', ') : 'Unknown Author',
                    description: detailedDescription,
                    plotSummary: plotSummary,
                    reviews: reviews,
                    publishedDate: book.publishedDate,
                    pageCount: book.pageCount,
                    categories: book.categories || [],
                    type: 'book',
                    source: 'Google Books'
                };
            }
            return null;
        } catch (error) {
            console.error('Google Books search error:', error);
            return null;
        }
    }

    async searchOpenLibrary(query) {
        console.log(`📖 Searching Open Library for: "${query}"`);
        const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=1`;
        
        try {
            console.log(`  🔍 Fetching from Open Library...`);
            console.log(`  🔗 URL: ${url}`);
            const response = await fetch(url);
            const data = await response.json();
            
            console.log(`  📊 Open Library results: ${data.docs ? data.docs.length : 0} items`);
            console.log(`  📊 Full response:`, data);
            
            if (data.docs && data.docs.length > 0) {
                const book = data.docs[0];
                console.log(`  📖 First result:`, book);
                
                // Get more detailed information from Open Library
                let detailedDescription = '';
                let plotSummary = '';
                
                if (book.key) {
                    try {
                        const workUrl = `https://openlibrary.org${book.key}.json`;
                        console.log(`  🔍 Fetching detailed info from: ${workUrl}`);
                        const workResponse = await fetch(workUrl);
                        const workData = await workResponse.json();
                        
                        detailedDescription = workData.description || '';
                        plotSummary = workData.subtitle || '';
                        console.log(`  📖 Detailed description length: ${detailedDescription.length}`);
                    } catch (e) {
                        console.log('Could not fetch detailed Open Library info:', e);
                    }
                }

                return {
                    title: book.title || 'Unknown Title',
                    author: book.author_name ? book.author_name.join(', ') : 'Unknown Author',
                    description: detailedDescription,
                    plotSummary: plotSummary,
                    reviews: '',
                    contentWarnings: '',
                    publishedDate: book.first_publish_year ? book.first_publish_year.toString() : 'Unknown',
                    pageCount: book.number_of_pages_median || null,
                    categories: book.subject || [],
                    type: 'book',
                    source: 'Open Library'
                };
            }
            return null;
        } catch (error) {
            console.error('Open Library search error:', error);
            return null;
        }
    }

    async searchHardcover(query) {
        console.log(`📘 Searching Hardcover for: "${query}"`);
        
        if (HARDCOVER_BEARER_TOKEN === 'YOUR_HARDCOVER_BEARER_TOKEN') {
            console.log(`  ⚠️ Hardcover API key not configured`);
            return null;
        }
        
        // Hardcover uses GraphQL API
        const graphqlQuery = {
            query: `
                query SearchBooks($query: String!) {
                    searchBooks(query: $query, limit: 1) {
                        id
                        title
                        authors {
                            name
                        }
                        description
                        publishedDate
                        pageCount
                        genres
                        contentWarnings {
                            category
                            description
                        }
                    }
                }
            `,
            variables: {
                query: query
            }
        };
        
        try {
            console.log(`  🔍 Fetching from Hardcover GraphQL API...`);
            const response = await fetch('https://hardcover.app/api/graphql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${HARDCOVER_BEARER_TOKEN}`
                },
                body: JSON.stringify(graphqlQuery)
            });
            
            const data = await response.json();
            console.log(`  📊 Hardcover response:`, data);
            
            if (data.data && data.data.searchBooks && data.data.searchBooks.length > 0) {
                const book = data.data.searchBooks[0];
                console.log(`  📘 Hardcover found: ${book.title}`);
                
                return {
                    title: book.title || 'Unknown Title',
                    author: book.authors && book.authors.length > 0 ? book.authors.map(a => a.name).join(', ') : 'Unknown Author',
                    description: book.description || '',
                    plotSummary: '',
                    reviews: '',
                    contentWarnings: book.contentWarnings && book.contentWarnings.length > 0 ? 
                        book.contentWarnings.map(cw => `${cw.category}: ${cw.description}`).join(' ') : '',
                    publishedDate: book.publishedDate || 'Unknown',
                    pageCount: book.pageCount || null,
                    categories: book.genres || [],
                    type: 'book',
                    source: 'Hardcover'
                };
            }
            return null;
        } catch (error) {
            console.error('Hardcover search error:', error);
            return null;
        }
    }

    async searchDoesTheDogDie(query) {
        console.log(`🐕 Searching DoesTheDogDie for: "${query}"`);
        
        if (DOESTHEDOGDIE_API_KEY === 'YOUR_DTDD_API_KEY') {
            console.log(`  ⚠️ DoesTheDogDie API key not configured`);
            return null;
        }
        
        const url = `https://www.doesthedogdie.com/api/search?q=${encodeURIComponent(query)}&api_key=${DOESTHEDOGDIE_API_KEY}`;
        
        try {
            console.log(`  🔍 Fetching from DoesTheDogDie...`);
            console.log(`  🔗 URL: ${url}`);
            const response = await fetch(url);
            const data = await response.json();
            
            console.log(`  📊 DoesTheDogDie response:`, data);
            
            if (data.results && data.results.length > 0) {
                const item = data.results[0];
                console.log(`  🐕 DoesTheDogDie found: ${item.title}`);
                
                // Get detailed trigger warnings
                let triggerWarnings = '';
                if (item.triggers && item.triggers.length > 0) {
                    triggerWarnings = item.triggers.map(trigger => 
                        `${trigger.name}: ${trigger.description || 'Present'}`
                    ).join(' ');
                }
                
                return {
                    title: item.title || 'Unknown Title',
                    author: item.author || 'Unknown Author',
                    description: item.description || '',
                    plotSummary: '',
                    reviews: '',
                    contentWarnings: triggerWarnings,
                    publishedDate: item.year || 'Unknown',
                    pageCount: null,
                    categories: item.genres || [],
                    type: 'book',
                    source: 'DoesTheDogDie'
                };
            }
            return null;
        } catch (error) {
            console.error('DoesTheDogDie search error:', error);
            return null;
        }
    }

    combineBookResults(results) {
        console.log(`🔗 Combining ${results.length} book results...`);
        
        // Start with the first result as base
        const combined = { ...results[0] };
        
        // Merge data from all sources
        for (let i = 1; i < results.length; i++) {
            const result = results[i];
            
            // Use the longest description
            if (result.description && result.description.length > (combined.description?.length || 0)) {
                combined.description = result.description;
            }
            
            // Combine content warnings
            if (result.contentWarnings) {
                if (combined.contentWarnings) {
                    combined.contentWarnings += ' ' + result.contentWarnings;
                } else {
                    combined.contentWarnings = result.contentWarnings;
                }
            }
            
            // Use more specific author if available
            if (result.author && result.author !== 'Unknown Author' && combined.author === 'Unknown Author') {
                combined.author = result.author;
            }
            
            // Use more specific title if available
            if (result.title && result.title !== 'Unknown Title' && combined.title === 'Unknown Title') {
                combined.title = result.title;
            }
            
            // Combine categories/genres
            if (result.categories && result.categories.length > 0) {
                if (combined.categories) {
                    combined.categories = [...new Set([...combined.categories, ...result.categories])];
                } else {
                    combined.categories = result.categories;
                }
            }
            
            // Use more specific published date
            if (result.publishedDate && result.publishedDate !== 'Unknown' && combined.publishedDate === 'Unknown') {
                combined.publishedDate = result.publishedDate;
            }
            
            // Use page count if available
            if (result.pageCount && !combined.pageCount) {
                combined.pageCount = result.pageCount;
            }
        }
        
        // Update source to reflect multiple sources
        combined.source = results.map(r => r.source).join(', ');
        
        console.log(`  📊 Combined result:`, {
            title: combined.title,
            author: combined.author,
            descriptionLength: combined.description?.length || 0,
            contentWarningsLength: combined.contentWarnings?.length || 0,
            sources: combined.source
        });
        
        return combined;
    }

    async searchMovie(query) {
        console.log(`🎬 Searching TMDB for movie: "${query}"`);
        
        // Show API debug section
        this.showApiDebugSection();
        
        // Using TMDB API
        const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
        
        try {
            console.log(`  🔍 Fetching from TMDB...`);
            const response = await fetch(searchUrl);
            const data = await response.json();
            
            console.log(`  📊 TMDB results: ${data.results ? data.results.length : 0} movies`);
            
            // Update API debug section
            let debugContent = `<h4>🎬 Movie Search Query: "${query}"</h4>\n`;
            debugContent += `<h4>📊 TMDB Results:</h4>\n`;
            
            if (data.results && data.results.length > 0) {
                const movie = data.results[0];
                
                debugContent += `<div class="api-result api-success">
                    <strong>🎬 TMDB: ✅ Found ${data.results.length} movies</strong><br>
                    Selected Movie: ${movie.title}<br>
                    Release Date: ${movie.release_date || 'Unknown'}<br>
                    Rating: ${movie.vote_average || 'Not rated'}/10<br>
                    Overview: ${movie.overview ? movie.overview.substring(0, 200) + '...' : 'No overview'}
                </div>`;
                
                // Get additional details
                const detailsUrl = `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${TMDB_API_KEY}`;
                const detailsResponse = await fetch(detailsUrl);
                const details = await detailsResponse.json();
                
                return {
                    title: movie.title,
                    overview: movie.overview || 'No description available',
                    releaseDate: movie.release_date,
                    rating: movie.vote_average,
                    genres: details.genres ? details.genres.map(g => g.name) : [],
                    runtime: details.runtime,
                    type: 'movie'
                };
            } else {
                debugContent += `<div class="api-result api-no-results">
                    <strong>🎬 TMDB: ❌ No movies found</strong>
                </div>`;
                
                this.updateApiDebugInfo(debugContent);
                return null;
            }
        } catch (error) {
            console.error('Movie search error:', error);
            
            // Update debug section with error
            let debugContent = `<h4>🎬 Movie Search Query: "${query}"</h4>\n`;
            debugContent += `<div class="api-result api-error">
                <strong>🎬 TMDB: ❌ Error occurred</strong><br>
                Error: ${error.message}
            </div>`;
            
            this.updateApiDebugInfo(debugContent);
            throw error;
        }
    }

    async analyzeContent(content) {
        console.log(`🔍 Analyzing content: "${content.title}"`);
        
        // Combine all available text content for analysis
        const textToAnalyze = [
            content.title,
            content.description || content.overview || '',
            content.plotSummary || '',
            content.author || '',
            content.categories ? content.categories.join(' ') : '',
            content.genres ? content.genres.join(' ') : ''
        ].join(' ').toLowerCase();

        console.log(`📝 Analysis text length: ${textToAnalyze.length} characters`);
        console.log(`📝 Analysis text preview: "${textToAnalyze.substring(0, 200)}..."`);

        // Simple analysis - check for cancer terms
        const foundTerms = CANCER_TERMS.filter(term => 
            textToAnalyze.includes(term.toLowerCase())
        );

        console.log(`🎯 Cancer terms found: ${foundTerms.length}`);
        if (foundTerms.length > 0) {
            console.log(`  Found terms: ${foundTerms.join(', ')}`);
        }

        // Check against known cancer-themed content
        const knownCancerContent = this.checkKnownCancerContent(content.title, content.type);
        
        console.log(`📚 Known cancer content check: ${knownCancerContent.isKnownCancer ? 'YES' : 'NO'}`);
        if (knownCancerContent.isKnownCancer) {
            console.log(`  Matched: ${knownCancerContent.matchedTitle}`);
        }

        const isSafe = !knownCancerContent.isKnownCancer && foundTerms.length === 0;
        const confidence = knownCancerContent.isKnownCancer ? 0.95 : 
                          foundTerms.length > 0 ? 0.8 : 0.9;

        console.log(`🎯 Final Analysis Result:`);
        console.log(`  Safe: ${isSafe ? 'YES' : 'NO'}`);
        console.log(`  Confidence: ${Math.round(confidence * 100)}%`);
        console.log(`  Reason: ${isSafe ? 'No cancer content detected' : 'Cancer content found'}`);

        return {
            isSafe: isSafe,
            foundTerms: foundTerms,
            confidence: confidence,
            analysisText: this.generateSimpleAnalysisText(foundTerms, knownCancerContent, isSafe),
            detailedAnalysis: {
                directTerms: foundTerms,
                knownCancerContent: knownCancerContent
            }
        };
    }

    generateSimpleAnalysisText(foundTerms, knownCancerContent, isSafe) {
        if (knownCancerContent.isKnownCancer) {
            return `This is a known cancer-themed work. The story prominently features characters dealing with cancer and related medical conditions.`;
        } else if (!isSafe) {
            return `Cancer-related content detected. Found terms: ${foundTerms.join(', ')}. This content may contain sensitive material related to cancer.`;
        } else {
            return `No cancer-related content detected. The analysis searched for cancer-related terms and themes.`;
        }
    }

    checkKnownCancerContent(title, type) {
        const normalizedTitle = title.toLowerCase().trim();
        const contentList = type === 'book' ? CANCER_THEMED_CONTENT.books : CANCER_THEMED_CONTENT.movies;
        
        const isKnownCancer = contentList.some(knownTitle => 
            normalizedTitle.includes(knownTitle) || knownTitle.includes(normalizedTitle)
        );

        return {
            isKnownCancer: isKnownCancer,
            matchedTitle: isKnownCancer ? contentList.find(knownTitle => 
                normalizedTitle.includes(knownTitle) || knownTitle.includes(normalizedTitle)
            ) : null
        };
    }


    displayResults(content, analysis) {
        const resultsSection = document.getElementById('results');
        const resultTitle = document.getElementById('resultTitle');
        const safetyStatus = document.getElementById('safetyStatus');
        const resultInfo = document.getElementById('resultInfo');
        const analysisDetails = document.getElementById('analysisDetails');

        // Set title
        resultTitle.textContent = content.title;

        // Set safety status
        safetyStatus.textContent = analysis.isSafe ? 'SAFE' : 'NOT RECOMMENDED';
        safetyStatus.className = `safety-status ${analysis.isSafe ? 'safe' : 'not-recommended'}`;

        // Set content info
        let infoHtml = '';
        if (content.type === 'book') {
            infoHtml = `
                <p><strong>Author:</strong> ${content.author}</p>
                <p><strong>Published:</strong> ${content.publishedDate || 'Unknown'}</p>
                ${content.pageCount ? `<p><strong>Pages:</strong> ${content.pageCount}</p>` : ''}
                ${content.categories.length > 0 ? `<p><strong>Categories:</strong> ${content.categories.join(', ')}</p>` : ''}
            `;
        } else {
            infoHtml = `
                <p><strong>Release Date:</strong> ${content.releaseDate || 'Unknown'}</p>
                <p><strong>Rating:</strong> ${content.rating ? content.rating + '/10' : 'Not rated'}</p>
                ${content.runtime ? `<p><strong>Runtime:</strong> ${content.runtime} minutes</p>` : ''}
                ${content.genres.length > 0 ? `<p><strong>Genres:</strong> ${content.genres.join(', ')}</p>` : ''}
            `;
        }
        resultInfo.innerHTML = infoHtml;

        // Set analysis details
        analysisDetails.innerHTML = `
            <h4>Content Analysis</h4>
            <p>${analysis.analysisText}</p>
            <p><strong>Confidence:</strong> ${Math.round(analysis.confidence * 100)}%</p>
        `;

        resultsSection.classList.remove('hidden');
    }

    setLoading(loading) {
        const button = document.getElementById('searchButton');
        const buttonText = button.querySelector('.button-text');
        const spinner = button.querySelector('.spinner');

        if (loading) {
            button.disabled = true;
            buttonText.textContent = 'Searching...';
            spinner.classList.remove('hidden');
        } else {
            button.disabled = false;
            buttonText.textContent = 'Search';
            spinner.classList.add('hidden');
        }
    }

    showError(message) {
        const errorElement = document.getElementById('errorMessage');
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    }

    hideError() {
        document.getElementById('errorMessage').classList.add('hidden');
    }

    hideResults() {
        document.getElementById('results').classList.add('hidden');
    }

    toggleAnalysisSection() {
        const analysisDetails = document.getElementById('analysisDetails');
        const toggleButton = document.getElementById('toggleAnalysis');
        const toggleText = toggleButton.querySelector('.toggle-text');
        const toggleIcon = toggleButton.querySelector('.toggle-icon');
        
        if (analysisDetails.classList.contains('hidden')) {
            // Show analysis
            analysisDetails.classList.remove('hidden');
            toggleText.textContent = 'Hide Content Analysis';
            toggleIcon.textContent = '▼';
            toggleButton.classList.remove('expanded');
        } else {
            // Hide analysis
            analysisDetails.classList.add('hidden');
            toggleText.textContent = 'Show Content Analysis';
            toggleIcon.textContent = '▶';
            toggleButton.classList.add('expanded');
        }
    }

    toggleApiDebugSection() {
        const apiDebugContent = document.getElementById('apiDebugContent');
        const toggleButton = document.getElementById('toggleApiDebug');
        const toggleText = toggleButton.querySelector('.toggle-text');
        const toggleIcon = toggleButton.querySelector('.toggle-icon');
        
        if (apiDebugContent.classList.contains('hidden')) {
            // Show API debug
            apiDebugContent.classList.remove('hidden');
            toggleText.textContent = 'Hide API Results';
            toggleIcon.textContent = '▼';
            toggleButton.classList.remove('expanded');
        } else {
            // Hide API debug
            apiDebugContent.classList.add('hidden');
            toggleText.textContent = 'Show API Results';
            toggleIcon.textContent = '▶';
            toggleButton.classList.add('expanded');
        }
    }

    showApiDebugSection() {
        const apiDebugSection = document.getElementById('apiDebugSection');
        apiDebugSection.classList.remove('hidden');
    }

    updateApiDebugInfo(content) {
        const apiDebugInfo = document.getElementById('apiDebugInfo');
        apiDebugInfo.innerHTML = content;
    }

}

// Initialize the application
function initializeApp() {
    console.log('🚀 Initializing LaurensList...');
    
    // Check if API keys are available, otherwise use demo mode
    console.log('🔍 Checking API keys...');
    console.log('TMDB_API_KEY:', TMDB_API_KEY);
    console.log('GOOGLE_BOOKS_API_KEY:', GOOGLE_BOOKS_API_KEY);
    
    if (TMDB_API_KEY === 'YOUR_TMDB_API_KEY' || GOOGLE_BOOKS_API_KEY === 'YOUR_GOOGLE_BOOKS_API_KEY') {
        console.log('Running in demo mode. Please add your API keys to enable full functionality.');
        
        // Override search methods with demo versions
        LaurensList.prototype.searchBook = DemoMode.searchBook;
        LaurensList.prototype.searchMovie = DemoMode.searchMovie;
    } else {
        console.log('Running with real API data! TMDB and Google Books APIs are active.');
    }
    
    console.log('🎯 Creating LaurensList instance...');
    new LaurensList();
    console.log('✅ LaurensList initialized successfully!');
}

// Try multiple initialization methods
if (document.readyState === 'loading') {
    console.log('📄 Document still loading, waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    console.log('📄 Document already loaded, initializing immediately...');
    initializeApp();
}

// Demo mode for when API keys are not available
class DemoMode {
    static async searchBook(query) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const normalizedQuery = query.toLowerCase();
        
        // Special case for "The Fault in Our Stars" to demonstrate cancer detection
        if (normalizedQuery.includes('fault in our stars')) {
            return {
                title: 'The Fault in Our Stars',
                author: 'John Green',
                description: 'Sixteen-year-old Hazel Grace Lancaster reluctantly attends a cancer patients\' support group at her mother\'s behest. There she meets Augustus Waters, a seventeen-year-old boy who lost his leg to osteosarcoma. Despite her medical miracle that has bought her a few more years, Hazel has never been anything but terminal. Augustus\'s story is about to be completely rewritten.',
                plotSummary: 'A story about two teenagers who meet in a cancer support group and fall in love.',
                publishedDate: '2012',
                pageCount: 313,
                categories: ['Young Adult', 'Fiction', 'Romance'],
                type: 'book',
                source: 'Demo Mode'
            };
        }
        
        // Special case for "My Friends" by Fredrik Backman
        if (normalizedQuery.includes('my friends') && normalizedQuery.includes('backman')) {
            return {
                title: 'My Friends',
                author: 'Fredrik Backman',
                description: 'A deeply moving story about friendship, love, and loss. The novel follows characters dealing with terminal illness, cancer diagnosis, and the profound impact of medical conditions on relationships. It explores themes of mortality, friendship in the face of illness, and how people cope with serious health challenges.',
                plotSummary: 'A story about friends supporting each other through terminal illness and cancer diagnosis.',
                publishedDate: '2024',
                pageCount: 400,
                categories: ['Fiction', 'Drama', 'Contemporary'],
                type: 'book',
                source: 'Demo Mode'
            };
        }
        
        // Special case for "How to Climb the Eiffel Tower" - this book contains cancer themes
        if (normalizedQuery.includes('how to climb the eiffel tower')) {
            return {
                title: 'How to Climb the Eiffel Tower',
                author: 'Jacques Lorcey',
                description: 'A poignant memoir about a man\'s journey dealing with terminal cancer diagnosis. The author reflects on life, mortality, and finding meaning in the face of illness. The book explores themes of cancer treatment, medical struggles, and coming to terms with a life-threatening condition.',
                plotSummary: 'A deeply personal account of living with cancer and finding hope in difficult circumstances.',
                publishedDate: '2019',
                pageCount: 256,
                categories: ['Memoir', 'Health', 'Biography'],
                type: 'book',
                source: 'Demo Mode'
            };
        }
        
        // Return mock data for other queries with better author detection
        let author = 'Sample Author';
        
        // Common author mappings for demo mode
        const authorMappings = {
            'harry potter': 'J.K. Rowling',
            'lord of the rings': 'J.R.R. Tolkien',
            'game of thrones': 'George R.R. Martin',
            'dune': 'Frank Herbert',
            '1984': 'George Orwell',
            'pride and prejudice': 'Jane Austen',
            'to kill a mockingbird': 'Harper Lee',
            'the great gatsby': 'F. Scott Fitzgerald',
            'moby dick': 'Herman Melville',
            'war and peace': 'Leo Tolstoy',
            'crime and punishment': 'Fyodor Dostoevsky',
            'the catcher in the rye': 'J.D. Salinger',
            'one hundred years of solitude': 'Gabriel García Márquez',
            'the alchemist': 'Paulo Coelho',
            'the little prince': 'Antoine de Saint-Exupéry'
        };
        
        // Check for known book-author mappings
        for (const [bookTitle, bookAuthor] of Object.entries(authorMappings)) {
            if (normalizedQuery.includes(bookTitle)) {
                author = bookAuthor;
                break;
            }
        }
        
        // Try to extract author from query if it contains common patterns
        if (author === 'Sample Author' && normalizedQuery.includes('by ')) {
            const byIndex = normalizedQuery.indexOf('by ');
            if (byIndex !== -1) {
                author = normalizedQuery.substring(byIndex + 3).trim();
                // Clean up the author name
                author = author.split(' ').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ');
            }
        }
        
        return {
            title: query,
            author: author,
            description: 'This is a sample book description. It contains various themes and plot elements.',
            plotSummary: '',
            publishedDate: '2023',
            pageCount: 300,
            categories: ['Fiction', 'Drama'],
            type: 'book',
            source: 'Demo Mode'
        };
    }

    static async searchMovie(query) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const normalizedQuery = query.toLowerCase();
        
        // Special case for "The Fault in Our Stars" movie
        if (normalizedQuery.includes('fault in our stars')) {
            return {
                title: 'The Fault in Our Stars',
                overview: 'Hazel Grace Lancaster, a 16-year-old cancer patient, meets and falls in love with Gus Waters, a similarly afflicted teen from her cancer support group. Hazel feels that Gus really understands her. They both share the same acerbic wit and a love of books, especially Grace\'s touchstone, "An Imperial Affliction" by Peter Van Houten.',
                releaseDate: '2014',
                rating: 7.7,
                genres: ['Drama', 'Romance'],
                runtime: 126,
                type: 'movie',
                source: 'Demo Mode'
            };
        }
        
        // Return mock data for other queries with better information
        let director = 'Sample Director';
        let genres = ['Drama', 'Romance'];
        
        // Common movie mappings for demo mode
        const movieMappings = {
            'titanic': { director: 'James Cameron', genres: ['Drama', 'Romance'] },
            'avatar': { director: 'James Cameron', genres: ['Action', 'Sci-Fi'] },
            'star wars': { director: 'George Lucas', genres: ['Action', 'Sci-Fi'] },
            'the godfather': { director: 'Francis Ford Coppola', genres: ['Crime', 'Drama'] },
            'pulp fiction': { director: 'Quentin Tarantino', genres: ['Crime', 'Drama'] },
            'forrest gump': { director: 'Robert Zemeckis', genres: ['Drama', 'Romance'] },
            'the shawshank redemption': { director: 'Frank Darabont', genres: ['Drama'] },
            'inception': { director: 'Christopher Nolan', genres: ['Action', 'Sci-Fi'] },
            'the dark knight': { director: 'Christopher Nolan', genres: ['Action', 'Crime'] },
            'goodfellas': { director: 'Martin Scorsese', genres: ['Crime', 'Drama'] }
        };
        
        // Check for known movie mappings
        for (const [movieTitle, movieInfo] of Object.entries(movieMappings)) {
            if (normalizedQuery.includes(movieTitle)) {
                director = movieInfo.director;
                genres = movieInfo.genres;
                break;
            }
        }
        
        return {
            title: query,
            overview: `This is a sample movie overview. Directed by ${director}, it contains various themes and plot elements.`,
            releaseDate: '2023',
            rating: 7.5,
            genres: genres,
            runtime: 120,
            type: 'movie',
            source: 'Demo Mode'
        };
    }
}

