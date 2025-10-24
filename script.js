// API Keys - Injected at build time from environment variables
let TMDB_API_KEY = 'YOUR_TMDB_API_KEY';
let GOOGLE_BOOKS_API_KEY = 'YOUR_GOOGLE_BOOKS_API_KEY';
let HARDCOVER_BEARER_TOKEN = 'YOUR_HARDCOVER_BEARER_TOKEN';
let DOESTHEDOGDIE_API_KEY = 'YOUR_DTDD_API_KEY';

// Load API keys from config.js if available (for local development)
console.log('🔧 Loading API keys...');
console.log('CONFIG object available:', typeof CONFIG !== 'undefined');

if (typeof CONFIG !== 'undefined') {
    // Override with config.js values for local development
    TMDB_API_KEY = CONFIG.TMDB_API_KEY;
    GOOGLE_BOOKS_API_KEY = CONFIG.GOOGLE_BOOKS_API_KEY;
    HARDCOVER_BEARER_TOKEN = CONFIG.HARDCOVER_BEARER_TOKEN;
    DOESTHEDOGDIE_API_KEY = CONFIG.DOESTHEDOGDIE_API_KEY;
    console.log('✅ API keys loaded from config.js (local development)');
} else {
    console.log('✅ API keys loaded from build process (deployed)');
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
    'thyroid cancer', 'ovarian cancer', 'cervical cancer', 'bone cancer', 'blood cancer',
    'pediatric oncology', 'oncology unit', 'cancer unit', 'cancer ward', 'oncology ward',
    'cancer hospital', 'oncology department', 'cancer center', 'oncology center'
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
        'a monster calls', 'patrick ness', 'siobhan dowd',
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
            const [googleBooksData, openLibraryData, hardcoverData, dtddData, goodreadsData] = await Promise.allSettled([
                this.searchGoogleBooks(query),
                this.searchOpenLibrary(query),
                this.searchHardcover(query),
                this.searchDoesTheDogDie(query),
                this.searchGoodreads(query)
            ]);

            const googleResult = googleBooksData.status === 'fulfilled' ? googleBooksData.value : null;
            const openLibraryResult = openLibraryData.status === 'fulfilled' ? openLibraryData.value : null;
            const hardcoverResult = hardcoverData.status === 'fulfilled' ? hardcoverData.value : null;
            const dtddResult = dtddData.status === 'fulfilled' ? dtddData.value : null;
            const goodreadsResult = goodreadsData.status === 'fulfilled' ? goodreadsData.value : null;
            
            console.log('📊 API Results Summary:');
            console.log(`  📚 Google Books: ${googleResult ? '✅ Found' : '❌ No results'}`);
            console.log(`  📖 Open Library: ${openLibraryResult ? '✅ Found' : '❌ No results'}`);
            console.log(`  📘 Hardcover: ${hardcoverResult ? '✅ Found' : '❌ No results'}`);
            console.log(`  🐕 DoesTheDogDie: ${dtddResult ? '✅ Found' : '❌ No results'}`);
            console.log(`  📖 Goodreads: ${goodreadsResult ? '✅ Found' : '❌ No results'}`);
            
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
            
            if (goodreadsResult) {
                console.log(`  📖 Goodreads Details:`, {
                    title: goodreadsResult.title,
                    author: goodreadsResult.author,
                    reviewsLength: goodreadsResult.reviews?.length || 0,
                    source: goodreadsResult.source
                });
                
                debugContent += `<div class="api-result api-success">
                    <strong>📖 Goodreads: ✅ Found</strong><br>
                    Title: ${goodreadsResult.title}<br>
                    Author: ${goodreadsResult.author}<br>
                    Reviews Length: ${goodreadsResult.reviews?.length || 0} characters<br>
                    Source: ${goodreadsResult.source}
                </div>`;
            } else {
                debugContent += `<div class="api-result api-no-results">
                    <strong>📖 Goodreads: ❌ No results</strong>
                </div>`;
            }
            
            // Combine results from all APIs
            const allResults = [googleResult, openLibraryResult, hardcoverResult, dtddResult, goodreadsResult].filter(Boolean);
            
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
        
        // Check if we're running from file:// protocol (CORS will block this)
        if (window.location.protocol === 'file:') {
            console.log(`  ⚠️ CORS blocked: Running from file:// protocol`);
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
        
        // Check if we're running from file:// protocol (CORS will block this)
        if (window.location.protocol === 'file:') {
            console.log(`  ⚠️ CORS blocked: Running from file:// protocol`);
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

    async searchGoodreads(query) {
        console.log(`📖 Searching Goodreads for: "${query}"`);
        
        // Check if we're running from file:// protocol (CORS will block this)
        if (window.location.protocol === 'file:') {
            console.log(`  ⚠️ CORS blocked: Running from file:// protocol`);
            return null;
        }
        
            try {
                // Use a CORS proxy to access Goodreads
                const corsProxy = 'https://corsproxy.io/?';
                const goodreadsUrl = `https://www.goodreads.com/search?q=${encodeURIComponent(query)}&search_type=books`;
                const proxyUrl = corsProxy + encodeURIComponent(goodreadsUrl);
            
            console.log(`  🔍 Fetching from Goodreads via CORS proxy...`);
            console.log(`  🔗 Proxy URL: ${proxyUrl}`);
            
            const response = await fetch(proxyUrl);
            const html = await response.text();
            
            console.log(`  📊 Goodreads HTML length: ${html.length} characters`);
            
            // Parse the HTML to extract book information
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Debug: Log the HTML structure to understand what we're getting
            console.log(`  🔍 HTML contains 'searchResultItem': ${html.includes('searchResultItem')}`);
            console.log(`  🔍 HTML contains 'bookTitle': ${html.includes('bookTitle')}`);
            console.log(`  🔍 HTML contains 'authorName': ${html.includes('authorName')}`);
            
            // Try multiple selectors for book results
            let bookElement = doc.querySelector('.searchResultItem') || 
                            doc.querySelector('.searchResult') ||
                            doc.querySelector('.bookContainer') ||
                            doc.querySelector('[data-testid="book-item"]');
            
            // If no specific book element found, try to find any book-related content
            if (!bookElement) {
                console.log(`  🔍 Trying alternative selectors...`);
                const allElements = doc.querySelectorAll('*');
                for (let element of allElements) {
                    if (element.textContent && element.textContent.toLowerCase().includes(query.toLowerCase())) {
                        console.log(`  🔍 Found potential match: ${element.tagName} with text: "${element.textContent.substring(0, 100)}..."`);
                        bookElement = element;
                        break;
                    }
                }
            }
            
            if (bookElement) {
                console.log(`  📖 Found book element: ${bookElement.tagName}`);
                
                // Try multiple selectors for title
                const titleElement = bookElement.querySelector('.bookTitle') ||
                                   bookElement.querySelector('.book-title') ||
                                   bookElement.querySelector('h3') ||
                                   bookElement.querySelector('h2') ||
                                   bookElement.querySelector('[data-testid="book-title"]');
                
                // Try multiple selectors for author
                const authorElement = bookElement.querySelector('.authorName') ||
                                    bookElement.querySelector('.author-name') ||
                                    bookElement.querySelector('.author') ||
                                    bookElement.querySelector('[data-testid="author-name"]');
                
                const title = titleElement ? titleElement.textContent.trim() : 'Unknown Title';
                const author = authorElement ? authorElement.textContent.trim() : 'Unknown Author';
                
                console.log(`  📖 Goodreads found: ${title} by ${author}`);
                
                // Try to get the book's individual page for detailed description
                let detailedDescription = '';
                let reviews = '';
                
                try {
                    // Look for a link to the individual book page
                    console.log(`  🔍 Looking for book page link...`);
                    
                    // Try multiple strategies to find the book link
                    let bookLink = bookElement.querySelector('a[href*="/book/show/"]') ||
                                 bookElement.querySelector('a[href*="/book/"]') ||
                                 bookElement.querySelector('a[href*="book/show"]') ||
                                 bookElement.querySelector('a[href*="book/"]');
                    
                    // If not found in bookElement, try searching the entire document
                    if (!bookLink) {
                        console.log(`  🔍 Book link not found in book element, searching entire document...`);
                        bookLink = doc.querySelector('a[href*="/book/show/"]') ||
                                 doc.querySelector('a[href*="/book/"]') ||
                                 doc.querySelector('a[href*="book/show"]') ||
                                 doc.querySelector('a[href*="book/"]');
                    }
                    
                    // If still not found, try to construct the URL from the title
                    if (!bookLink && title && title !== 'Unknown Title') {
                        console.log(`  🔍 Constructing book URL from title: "${title}"`);
                        // This is a fallback - we'll try to fetch the book page directly
                        const bookSlug = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-');
                        const constructedUrl = `https://www.goodreads.com/book/show/${bookSlug}`;
                        console.log(`  🔍 Constructed URL: ${constructedUrl}`);
                        
                        // Try to fetch this constructed URL
                        try {
                            const constructedPageUrl = corsProxy + encodeURIComponent(constructedUrl);
                            const constructedResponse = await fetch(constructedPageUrl);
                            if (constructedResponse.ok) {
                                const constructedHtml = await constructedResponse.text();
                                console.log(`  📊 Constructed page HTML length: ${constructedHtml.length} characters`);
                                
                                // Parse the constructed page
                                const constructedDoc = parser.parseFromString(constructedHtml, 'text/html');
                                
                                // Try to get the detailed description from constructed page
                                const descriptionSelectors = [
                                    '[data-testid="description"]',
                                    '.readable',
                                    '.description',
                                    '.book-description',
                                    '#description',
                                    '.bookPageMetaData .description'
                                ];
                                
                                for (const selector of descriptionSelectors) {
                                    const descElement = constructedDoc.querySelector(selector);
                                    if (descElement && descElement.textContent.trim().length > 50) {
                                        detailedDescription = descElement.textContent.trim();
                                        console.log(`  📖 Found detailed description (${detailedDescription.length} chars) using constructed URL and selector: ${selector}`);
                                        break;
                                    }
                                }
                            }
                        } catch (e) {
                            console.log(`  ⚠️ Could not fetch constructed URL: ${e.message}`);
                        }
                    }
                    
                    console.log(`  🔍 Book link found: ${bookLink ? 'YES' : 'NO'}`);
                    if (bookLink) {
                        console.log(`  🔍 Book link href: ${bookLink.getAttribute('href')}`);
                        const bookUrl = 'https://www.goodreads.com' + bookLink.getAttribute('href');
                        console.log(`  🔍 Fetching detailed book page: ${bookUrl}`);
                        
                        // Fetch the individual book page
                        const bookPageUrl = corsProxy + encodeURIComponent(bookUrl);
                        const bookPageResponse = await fetch(bookPageUrl);
                        const bookPageHtml = await bookPageResponse.text();
                        
                        console.log(`  📊 Book page HTML length: ${bookPageHtml.length} characters`);
                        
                        // Parse the book page
                        const bookPageDoc = parser.parseFromString(bookPageHtml, 'text/html');
                        
                        // Try to get the detailed description
                        const descriptionSelectors = [
                            '[data-testid="description"]',
                            '.readable',
                            '.description',
                            '.book-description',
                            '#description',
                            '.bookPageMetaData .description'
                        ];
                        
                        for (const selector of descriptionSelectors) {
                            const descElement = bookPageDoc.querySelector(selector);
                            if (descElement && descElement.textContent.trim().length > 50) {
                                detailedDescription = descElement.textContent.trim();
                                console.log(`  📖 Found detailed description (${detailedDescription.length} chars) using selector: ${selector}`);
                                break;
                            }
                        }
                        
                        // Try to get reviews from the book page
                        console.log(`  🔍 Searching for reviews on book page...`);
                        const reviewSelectors = [
                            '.reviewText',
                            '.review-text', 
                            '.review',
                            '.gr-review-text',
                            '.reviewTextContainer',
                            '.reviewContainer',
                            '[data-testid="review-text"]',
                            '.reviewShelf',
                            '.reviewTextShelf',
                            '.gr-review',
                            '.reviewTextShelf',
                            '.reviewTextContainer',
                            '.reviewText',
                            '.gr-review-text',
                            '.reviewTextShelf'
                        ];
                        
                        let reviewElements = [];
                        for (const selector of reviewSelectors) {
                            const elements = bookPageDoc.querySelectorAll(selector);
                            console.log(`  🔍 Selector "${selector}": found ${elements.length} elements`);
                            if (elements.length > 0) {
                                reviewElements = elements;
                                console.log(`  📝 Found ${elements.length} reviews using selector: ${selector}`);
                                break;
                            }
                        }
                        
                        // If no reviews found with selectors, try to find any text that might contain reviews
                        if (reviewElements.length === 0) {
                            console.log(`  🔍 No reviews found with selectors, searching for any review-like content...`);
                            const allTextElements = bookPageDoc.querySelectorAll('*');
                            for (let element of allTextElements) {
                                if (element.textContent && element.textContent.toLowerCase().includes('pediatric oncology')) {
                                    console.log(`  🎯 Found element containing "pediatric oncology": ${element.tagName}`);
                                    console.log(`  🎯 Element text: "${element.textContent.substring(0, 200)}..."`);
                                    reviewElements = [element];
                                    break;
                                }
                            }
                        }
                        
                        if (reviewElements.length > 0) {
                            reviews = Array.from(reviewElements)
                                .slice(0, 10) // Get first 10 reviews for better coverage
                                .map(el => el.textContent.trim())
                                .join(' ')
                                .substring(0, 5000); // Increased limit to 5000 characters
                            
                            console.log(`  📝 Combined reviews length: ${reviews.length} chars`);
                            console.log(`  📝 Reviews preview: "${reviews.substring(0, 200)}..."`);
                        }
                    }
                } catch (e) {
                    console.log(`  ⚠️ Could not fetch detailed book page: ${e.message}`);
                }
                
                // Fallback to search result description if no detailed description found
                if (!detailedDescription) {
                    const descriptionElement = bookElement.querySelector('.readable') ||
                                             bookElement.querySelector('.description') ||
                                             bookElement.querySelector('.book-description') ||
                                             bookElement.querySelector('p');
                    detailedDescription = descriptionElement ? descriptionElement.textContent.trim() : '';
                    console.log(`  📖 Using search result description (${detailedDescription.length} chars)`);
                }
                
                // Fallback to search result reviews if no detailed reviews found
                if (!reviews) {
                    const reviewElements = bookElement.querySelectorAll('.reviewText, .review-text, .review, .comment');
                    reviews = Array.from(reviewElements)
                        .map(el => el.textContent.trim())
                        .join(' ')
                        .substring(0, 2000);
                    
                    console.log(`  📝 Using search result reviews (${reviewElements.length} snippets)`);
                }
                
                console.log(`  📖 Goodreads final result:`);
                console.log(`    Title: "${title}"`);
                console.log(`    Author: "${author}"`);
                console.log(`    Description length: ${detailedDescription.length} chars`);
                console.log(`    Reviews length: ${reviews.length} chars`);
                
                return {
                    title: title,
                    author: author,
                    description: detailedDescription,
                    plotSummary: '',
                    reviews: reviews,
                    contentWarnings: '',
                    publishedDate: 'Unknown',
                    pageCount: null,
                    categories: [],
                    type: 'book',
                    source: 'Goodreads'
                };
            }
            
            console.log(`  📖 No book results found on Goodreads`);
            console.log(`  🔍 HTML preview: ${html.substring(0, 500)}...`);
            return null;
            
        } catch (error) {
            console.error('Goodreads search error:', error);
            return null;
        }
    }

    combineBookResults(results) {
        console.log(`🔗 Combining ${results.length} book results...`);
        
        // Start with the first result as base
        const combined = { ...results[0] };
        
        // Store all individual results for comprehensive analysis
        combined.allSources = results;
        
        // Merge data from all sources
        for (let i = 1; i < results.length; i++) {
            const result = results[i];
            
            console.log(`  🔍 Processing result ${i}: ${result.source || 'Unknown source'}`);
            console.log(`    Description length: ${result.description?.length || 0} chars`);
            console.log(`    Current combined description length: ${combined.description?.length || 0} chars`);
            
            // Use the longest description, but prioritize Goodreads for detailed content
            if (result.description && result.description.length > 0) {
                // If this is from Goodreads and has substantial content, prioritize it
                if (result.source === 'Goodreads' && result.description.length > 500) {
                    console.log(`  📖 Prioritizing Goodreads description (${result.description.length} chars) over existing (${combined.description?.length || 0} chars)`);
                    combined.description = result.description;
                } else if (result.source !== 'Goodreads' || result.description.length <= 500) {
                    // Only use non-Goodreads or short Goodreads descriptions if they're significantly longer
                    if (result.description.length > (combined.description?.length || 0) + 100) {
                        console.log(`  📖 Using longer description from ${result.source} (${result.description.length} chars)`);
                        combined.description = result.description;
                    } else {
                        console.log(`  📖 Not using description from ${result.source} - not significantly longer`);
                    }
                }
            } else {
                console.log(`  📖 Not using description from ${result.source} - no description available`);
            }
            
            // Combine content warnings
            if (result.contentWarnings) {
                if (combined.contentWarnings) {
                    combined.contentWarnings += ' ' + result.contentWarnings;
                } else {
                    combined.contentWarnings = result.contentWarnings;
                }
            }
            
            // Combine reviews (especially from Goodreads)
            if (result.reviews) {
                if (combined.reviews) {
                    combined.reviews += ' ' + result.reviews;
                } else {
                    combined.reviews = result.reviews;
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
        
        // Debug: Log what data we have
        console.log(`📊 Content data for analysis:`);
        console.log(`  Title: "${content.title}"`);
        console.log(`  Description length: ${content.description?.length || 0} chars`);
        console.log(`  Plot summary length: ${content.plotSummary?.length || 0} chars`);
        console.log(`  Reviews length: ${content.reviews?.length || 0} chars`);
        console.log(`  Content warnings: "${content.contentWarnings || 'None'}"`);
        console.log(`  Source: "${content.source || 'Unknown'}"`);
        
        // Check if we have multiple sources to analyze separately
        let foundTerms = [];
        let allTextToAnalyze = '';
        
        if (content.allSources && content.allSources.length > 1) {
            console.log(`🔍 Multiple sources detected: ${content.allSources.length} sources`);
            console.log(`📝 Analyzing each source separately for cancer content...`);
            
            // Analyze each source individually
            for (let i = 0; i < content.allSources.length; i++) {
                const source = content.allSources[i];
                console.log(`  🔍 Analyzing source ${i + 1}: ${source.source || 'Unknown'}`);
                
                // Use the combined description if this is the source that was prioritized
                let descriptionToUse = source.description || '';
                if (source.source === 'Goodreads' && content.description && content.description.length > 500) {
                    console.log(`    📖 Using combined detailed description (${content.description.length} chars) for Goodreads analysis`);
                    console.log(`    📖 Detailed description preview: "${content.description.substring(0, 200)}..."`);
                    descriptionToUse = content.description;
                }
                
                const sourceText = [
                    source.title || '',
                    descriptionToUse,
                    source.plotSummary || '',
                    source.author || '',
                    source.categories ? source.categories.join(' ') : '',
                    source.genres ? source.genres.join(' ') : '',
                    source.reviews || '',
                    source.contentWarnings || ''
                ].join(' ').toLowerCase();
                
                console.log(`    Text length: ${sourceText.length} chars`);
                console.log(`    Text preview: "${sourceText.substring(0, 200)}..."`);
                
                // Check this source for cancer terms
                const sourceTerms = CANCER_TERMS.filter(term => 
                    sourceText.includes(term.toLowerCase())
                );
                
                if (sourceTerms.length > 0) {
                    console.log(`    🎯 CANCER TERMS FOUND in ${source.source}: ${sourceTerms.join(', ')}`);
                    foundTerms = [...foundTerms, ...sourceTerms];
                } else {
                    console.log(`    ✅ No cancer terms found in ${source.source}`);
                }
                
                // Add to combined text for overall analysis
                allTextToAnalyze += ' ' + sourceText;
            }
            
            // Remove duplicates
            foundTerms = [...new Set(foundTerms)];
            console.log(`🎯 Total unique cancer terms found across all sources: ${foundTerms.length}`);
            if (foundTerms.length > 0) {
                console.log(`  Found terms: ${foundTerms.join(', ')}`);
            }
        } else {
            // Single source analysis (fallback)
            console.log(`📝 Single source analysis...`);
            
            // Combine all available text content for analysis
            allTextToAnalyze = [
                content.title,
                content.description || content.overview || '',
                content.plotSummary || '',
                content.author || '',
                content.categories ? content.categories.join(' ') : '',
                content.genres ? content.genres.join(' ') : '',
                content.reviews || '',
                content.contentWarnings || ''
            ].join(' ').toLowerCase();

            // Simple analysis - check for cancer terms
            foundTerms = CANCER_TERMS.filter(term => 
                allTextToAnalyze.includes(term.toLowerCase())
            );

            console.log(`🎯 Cancer terms found: ${foundTerms.length}`);
            if (foundTerms.length > 0) {
                console.log(`  Found terms: ${foundTerms.join(', ')}`);
            }
        }

        console.log(`📝 Total analysis text length: ${allTextToAnalyze.length} characters`);
        console.log(`📝 Analysis text preview: "${allTextToAnalyze.substring(0, 200)}..."`);

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
    
    if (TMDB_API_KEY !== 'YOUR_TMDB_API_KEY' && GOOGLE_BOOKS_API_KEY !== 'YOUR_GOOGLE_BOOKS_API_KEY') {
        console.log('Running with real API data! TMDB and Google Books APIs are active.');
        if (HARDCOVER_BEARER_TOKEN !== 'YOUR_HARDCOVER_BEARER_TOKEN') {
            console.log('Hardcover API is also active for enhanced book data.');
        }
        if (DOESTHEDOGDIE_API_KEY !== 'YOUR_DTDD_API_KEY') {
            console.log('DoesTheDogDie API is active for comprehensive trigger warnings.');
        }
    } else {
        console.log('⚠️ API keys not configured - some features may not work properly.');
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


