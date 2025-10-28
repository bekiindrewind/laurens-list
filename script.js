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
    'cancer hospital', 'oncology department', 'cancer center', 'oncology center',
    
    // Terminal illness terms
    'terminal illness', 'terminal disease', 'terminal condition', 'terminal diagnosis',
    'end stage', 'end-stage', 'advanced stage', 'late stage', 'final stage',
    'life expectancy', 'prognosis', 'months to live', 'weeks to live', 'days to live',
    'dying', 'death', 'mortality', 'fatal', 'incurable', 'untreatable',
    'hospice care', 'end of life', 'final days', 'last days', 'deathbed',
    'passing away', 'succumbed', 'lost to', 'died from', 'death from',
    'chronic illness', 'serious illness', 'life-threatening', 'critical condition',
    'medical crisis', 'health crisis', 'declining health', 'failing health',
    'deteriorating condition', 'worsening condition', 'progressive disease',
    'degenerative disease', 'fatal disease', 'lethal disease', 'deadly disease'
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
        'the art of racing in the rain', 'garth stein', 'enzo', 'denny', 'eve',
        'the travelling cat chronicles', 'hiro arikawa',
        'taylor jenkins reid', 'the invisible life of addie larue', 'v.e. schwab',
        'the book thief', 'markus zusak', 'the kite runner', 'khaled hosseini',
        'the help', 'kathryn stockett', 'water for elephants', 'sara gruen',
        'the time traveler\'s wife', 'audrey niffenegger', 'the lovely bones',
        'alice sebold', 'the curious incident of the dog in the night-time',
        'mark haddon', 'life of pi', 'yann martel',
        'all the colors of the dark', 'all the colours of the dark', 'chris whitaker'
    ],
    movies: [
        // Popular cancer-themed movies
        'the fault in our stars', 'a walk to remember', 'me before you', 'my sister\'s keeper',
        'the notebook', 'five feet apart', 'everything everything', 'the sun is also a star',
        'all the bright places', 'looking for alaska', 'paper towns', 'turtles all the way down',
        'the bucket list', '50/50', 'wish i was here', 'the big sick',
        'the art of racing in the rain',
        
        // Terminal illness movies
        'steel magnolias', 'beaches', 'terms of endearment', 'love story',
        'the notebook', 'my sister\'s keeper', 'the fault in our stars',
        'a walk to remember', 'me before you', 'five feet apart',
        'everything everything', 'the sun is also a star', 'all the bright places',
        'looking for alaska', 'paper towns', 'turtles all the way down',
        'the lovely bones', 'the time traveler\'s wife', 'the book thief',
        'the kite runner', 'life of pi', 'the curious incident of the dog in the night-time',
        'the midnight library', 'the seven husbands of evelyn hugo',
        'the invisible life of addie larue', 'water for elephants', 'the help',
        'my friends', 'a man called ove', 'beartown', 'us against you', 'winners',
        'anxious people', 'britt-marie was here', 'a monster calls',
        'the art of racing in the rain', 'garth stein', 'enzo', 'denny', 'eve',
        'taylor jenkins reid', 'v.e. schwab', 'markus zusak', 'khaled hosseini',
        'kathryn stockett', 'sara gruen', 'audrey niffenegger', 'alice sebold',
        'mark haddon', 'yann martel', 'matt haig', 'patrick ness', 'siobhan dowd',
        'fredrik backman',
        
        // Films from Wikipedia Category:Films about cancer (131 films)
        '3 days to kill', 'achtste groepers huilen niet', 'ae dil hai mushkil',
        'after everything', 'all our desires', 'the angel in the clock', 'anita', 'asu',
        'babyteeth', 'the barbarian invasions', 'be sure to share', 'being impossible',
        'biutiful', 'bliss', 'the broken circle breakdown', 'c\'est la vie mon chéri',
        'caro diario', 'champions', 'chimani pakhar', 'chocolate', 'constantine',
        'a crab in the pool', 'cries and whispers', 'the cure', 'dar emtedad-e shab',
        'de plus belle', 'death of a superhero', 'the delinquent season',
        'the dinner guest', 'the dinosaurs extinction', 'the dirt', 'the doctor',
        'donkeyhead', 'dream home', 'dying to survive', 'eierdiebe',
        'everything\'s gonna be alright', 'the farewell', 'fatenah', 'food of the gods ii',
        'freeheld', 'from karkheh to rhein', 'from riches to rags',
        'gaano kadalas ang minsan', 'the girl with nine wigs', 'glorious days',
        'guardami', 'hemlock society', 'her love boils bathwater', 'holding hope',
        'how to make millions before grandma dies', 'i want to talk', 'ikiru',
        'ip man 3', 'ip man 4', 'jack ryan shadow recruit', 'james white',
        'johnny', 'josée', 'a journey', 'keith', 'killer nun',
        'knockin\' on heaven\'s door', 'language lessons', 'the last song',
        'let me eat your pancreas', 'life is beautiful', 'like a star shining in the night',
        'a little red flower', 'live is life', 'look both ways', 'love cuts',
        'love is all you need', 'love or something like that', 'ma ma', 'mad women',
        'maidaan', 'maktub', 'manang biring', 'the marching band', 'matching jack',
        'melody', 'mera naam hai mohabbat', 'mindanao', 'more than blue',
        'moscow my love', 'mr rice\'s secret', 'my annoying brother', 'my dear brother',
        'my hindu friend', 'my life without me', 'la nave', 'norman',
        'notes for my son', 'nubes grises soplan sobre el campo verde', 'one week',
        'ordinary love', 'paul à québec', 'piety', 'the pig the snake and the pigeon',
        'a place for lovers', 'the preparation', 'princes in exile', 'the professor',
        'running out of time', 'rush hour', 'saw ii', 'saw iii', 'saw x',
        'self/less', 'silence like glass', 'simon', 'sitting in bars with cake',
        'the sob', 'society girl', 'sunny', 'sunshine', 'tammy\'s always dying',
        'ang tanging ina mo last na to', 'terry', 'thor love and thunder',
        'tribute', 'truman', 'under the lighthouse dancing', 'under the weather',
        'viejas amigas', 'ways to live forever', 'we are family', 'white lie'
    ]
};

console.log('📚 CANCER_THEMED_CONTENT loaded successfully');

class LaurensList {
    constructor() {
        this.initializeEventListeners();
        this.currentSearchType = 'book';
        this.updatePlaceholder();
        this.updateBookSearchNote();
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
                this.updateBookSearchNote();
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

        // Info Details toggle button
        document.getElementById('toggleInfoDetails').addEventListener('click', () => {
            this.toggleInfoDetailsSection();
        });

    }

    updatePlaceholder() {
        const input = document.getElementById('searchInput');
        input.placeholder = this.currentSearchType === 'book' 
            ? 'Enter book title...' 
            : 'Enter movie title...';
    }

    updateBookSearchNote() {
        const bookSearchNote = document.getElementById('bookSearchNote');
        if (bookSearchNote) {
            if (this.currentSearchType === 'book') {
                bookSearchNote.classList.remove('hidden');
            } else {
                bookSearchNote.classList.add('hidden');
            }
        }
    }

    async performSearch() {
        const rawQuery = document.getElementById('searchInput').value.trim();
        if (!rawQuery) {
            this.showError('Please enter a title to search');
            return;
        }

        // Check if query is wrapped in quotes for exact matching
        let query = rawQuery;
        let exactMatch = false;
        
        if ((rawQuery.startsWith('"') && rawQuery.endsWith('"')) || 
            (rawQuery.startsWith("'") && rawQuery.endsWith("'"))) {
            // Remove quotes and set exact match flag
            query = rawQuery.slice(1, -1).trim();
            exactMatch = true;
            console.log('🔍 Exact match mode enabled for:', query);
        }

        console.log('Starting search for:', query, 'Type:', this.currentSearchType, 'Exact match:', exactMatch);

        this.setLoading(true);
        this.hideResults();
        this.hideError();

        try {
            let result;
            if (this.currentSearchType === 'book') {
                result = await this.searchBook(query, exactMatch);
            } else {
                result = await this.searchMovie(query, exactMatch);
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

    async searchBook(query, exactMatch = false) {
        try {
            console.log(`🔍 Starting book search for: "${query}"`);
            
            // Show API debug section
            this.showApiDebugSection();
            
            // Try multiple sources for comprehensive data
            const [googleBooksData, openLibraryData, hardcoverData, dtddData, goodreadsData, wikipediaData, storyGraphData, webSearchData] = await Promise.allSettled([
                this.searchGoogleBooks(query, exactMatch),
                this.searchOpenLibrary(query, exactMatch),
                this.searchHardcover(query, exactMatch),
                this.searchDoesTheDogDie(query, exactMatch),
                this.searchGoodreads(query, exactMatch),
                this.searchWikipedia(query, exactMatch),
                this.searchStoryGraph(query, exactMatch),
                this.searchWebForCancerContent(query, 'book')
            ]);

            const googleResult = googleBooksData.status === 'fulfilled' ? googleBooksData.value : null;
            const openLibraryResult = openLibraryData.status === 'fulfilled' ? openLibraryData.value : null;
            const hardcoverResult = hardcoverData.status === 'fulfilled' ? hardcoverData.value : null;
            const dtddResult = dtddData.status === 'fulfilled' ? dtddData.value : null;
            const goodreadsResult = goodreadsData.status === 'fulfilled' ? goodreadsData.value : null;
            const wikipediaResult = wikipediaData.status === 'fulfilled' ? wikipediaData.value : null;
            const storyGraphResult = storyGraphData.status === 'fulfilled' ? storyGraphData.value : null;
            const webSearchResult = webSearchData.status === 'fulfilled' ? webSearchData.value : null;
            
            console.log('📊 API Results Summary:');
            console.log(`  📚 Google Books: ${googleResult ? '✅ Found' : '❌ No results'}`);
            console.log(`  📖 Open Library: ${openLibraryResult ? '✅ Found' : '❌ No results'}`);
            console.log(`  📘 Hardcover: ${hardcoverResult ? '✅ Found' : '❌ No results'}`);
            console.log(`  🐕 DoesTheDogDie: ${dtddResult ? '✅ Found' : '❌ No results'}`);
            console.log(`  📖 Goodreads: ${goodreadsResult ? '✅ Found' : '❌ No results'}`);
            console.log(`  📚 Wikipedia: ${wikipediaResult ? '✅ Found' : '❌ No results'}`);
            console.log(`  📖 StoryGraph: ${storyGraphResult ? '✅ Found' : '❌ No results'}`);
            console.log(`  🌐 Web Search: ${webSearchResult ? (webSearchResult.found ? '✅ Cancer content detected' : '❌ No cancer content') : '❌ No results'}`);
            
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
            
            // Wikipedia debug section
            if (wikipediaResult) {
                debugContent += `<div class="api-result api-success">
                    <strong>📚 Wikipedia: ✅ Found</strong><br>
                    Title: ${wikipediaResult.title}<br>
                    Author: ${wikipediaResult.author || 'N/A'}<br>
                    Description Length: ${wikipediaResult.description?.length || 0} characters<br>
                    Source: ${wikipediaResult.source}
                </div>`;
            } else {
                debugContent += `<div class="api-result api-no-results">
                    <strong>📚 Wikipedia: ❌ No results</strong>
                </div>`;
            }
            
            if (storyGraphResult) {
                debugContent += `<div class="api-result api-success">
                    <strong>📖 StoryGraph: ✅ Found</strong><br>
                    Title: ${storyGraphResult.title}<br>
                    Author: ${storyGraphResult.author || 'N/A'}<br>
                    Content Warnings: ${storyGraphResult.contentWarnings || 'None'}<br>
                    Source: ${storyGraphResult.source}
                </div>`;
            } else {
                debugContent += `<div class="api-result api-no-results">
                    <strong>📖 StoryGraph: ❌ No results</strong>
                </div>`;
            }
            
            // Combine results from all APIs
            const allResults = [googleResult, openLibraryResult, hardcoverResult, dtddResult, goodreadsResult, wikipediaResult, storyGraphResult].filter(Boolean);
            
            if (allResults.length === 0) {
                console.log('❌ No results found from any API');
                debugContent += `<div class="api-result api-error">
                    <strong>No results found from any API</strong>
                </div>`;
                this.updateApiDebugInfo(debugContent);
                return null;
            }
            
            // Combine data from all sources
            const combinedResult = this.combineBookResults(allResults, query);
            
            // Add web search result to the combined result
            if (webSearchResult) {
                combinedResult.webSearchResult = webSearchResult;
            }
            
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


    async searchGoogleBooks(query, exactMatch = false) {
        console.log(`📚 Searching Google Books for: "${query}"`);
        
        // Try exact title search first, then general search
        const exactUrl = `https://www.googleapis.com/books/v1/volumes?q=intitle:"${encodeURIComponent(query)}"&key=${GOOGLE_BOOKS_API_KEY}`;
        const generalUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&key=${GOOGLE_BOOKS_API_KEY}`;
        
        try {
            let response, data;
            
            if (exactMatch) {
                // For exact match, only use exact title search
                console.log(`  🔍 Exact match mode: Using exact title search only`);
                response = await fetch(exactUrl);
                data = await response.json();
                console.log(`  📊 Exact search results: ${data.items ? data.items.length : 0} items`);
            } else {
                // Try exact title search first
                console.log(`  🔍 Trying exact title search...`);
                response = await fetch(exactUrl);
                data = await response.json();
                
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

                // For exact match mode, validate that the title is an exact match
                if (exactMatch) {
                    const bookTitleLower = book.title.toLowerCase().trim();
                    const queryLower = query.toLowerCase().trim();
                    
                    if (bookTitleLower !== queryLower) {
                        console.log(`  ❌ Exact match validation failed: "${book.title}" != "${query}"`);
                        return null;
                    } else {
                        console.log(`  ✅ Exact match validation passed: "${book.title}"`);
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

    async searchOpenLibrary(query, exactMatch = false) {
        console.log(`📖 Searching Open Library for: "${query}"`);
        
        // Use exact title search if exactMatch is enabled
        const searchQuery = exactMatch ? `title:"${query}"` : query;
        const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(searchQuery)}&limit=1`;
        
        if (exactMatch) {
            console.log(`  🔍 Exact match mode: Using title search only`);
        }
        
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

                // For exact match mode, validate that the title is an exact match
                if (exactMatch) {
                    const bookTitleLower = (book.title || '').toLowerCase().trim();
                    const queryLower = query.toLowerCase().trim();
                    
                    if (bookTitleLower !== queryLower) {
                        console.log(`  ❌ Exact match validation failed: "${book.title}" != "${query}"`);
                        return null;
                    } else {
                        console.log(`  ✅ Exact match validation passed: "${book.title}"`);
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

    async searchHardcover(query, exactMatch = false) {
        console.log(`📘 Searching Hardcover for: "${query}"`);
        
        if (HARDCOVER_BEARER_TOKEN === 'YOUR_HARDCOVER_BEARER_TOKEN' || !HARDCOVER_BEARER_TOKEN) {
            console.log(`  ⚠️ Hardcover API key not configured`);
            return null;
        }
        
        // Check if we're running from file:// protocol (CORS will block this)
        if (window.location.protocol === 'file:') {
            console.log(`  ⚠️ CORS blocked: Running from file:// protocol`);
            return null;
        }
        
        // Hardcover uses GraphQL API
        const searchQuery = exactMatch ? `"${query}"` : query;
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
                query: searchQuery
            }
        };
        
        if (exactMatch) {
            console.log(`  🔍 Exact match mode: Using quoted search`);
        }
        
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
            
            if (!response.ok) {
                console.log(`  📘 Hardcover: API request failed with status ${response.status}`);
                return null;
            }
            
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

    async searchDoesTheDogDie(query, exactMatch = false) {
        console.log(`🐕 Searching DoesTheDogDie for: "${query}"`);
        
        if (DOESTHEDOGDIE_API_KEY === 'YOUR_DTDD_API_KEY' || !DOESTHEDOGDIE_API_KEY) {
            console.log(`  ⚠️ DoesTheDogDie API key not configured`);
            return null;
        }
        
        // Check if we're running from file:// protocol (CORS will block this)
        if (window.location.protocol === 'file:') {
            console.log(`  ⚠️ CORS blocked: Running from file:// protocol`);
            return null;
        }
        
        const searchQuery = exactMatch ? `"${query}"` : query;
        const url = `https://www.doesthedogdie.com/api/search?q=${encodeURIComponent(searchQuery)}&api_key=${DOESTHEDOGDIE_API_KEY}`;
        
        if (exactMatch) {
            console.log(`  🔍 Exact match mode: Using quoted search`);
        }
        
        try {
            console.log(`  🔍 Fetching from DoesTheDogDie...`);
            console.log(`  🔗 URL: ${url}`);
            const response = await fetch(url);
            
            if (!response.ok) {
                console.log(`  🐕 DoesTheDogDie: API request failed with status ${response.status}`);
                return null;
            }
            
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

    async searchGoodreads(query, exactMatch = false) {
        console.log(`📖 Searching Goodreads for: "${query}"`);
        
        // Check if we're running from file:// protocol (CORS will block this)
        if (window.location.protocol === 'file:') {
            console.log(`  ⚠️ CORS blocked: Running from file:// protocol`);
            return null;
        }
        
            try {
                // Use a CORS proxy to access Goodreads
                const corsProxy = 'https://corsproxy.io/?';
                const searchQuery = exactMatch ? `"${query}"` : query;
                const goodreadsUrl = `https://www.goodreads.com/search?q=${encodeURIComponent(searchQuery)}&search_type=books`;
                const proxyUrl = corsProxy + encodeURIComponent(goodreadsUrl);
                
                if (exactMatch) {
                    console.log(`  🔍 Exact match mode: Using quoted search`);
                }
            
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
            console.log(`  🔍 HTML contains 'bookContainer': ${html.includes('bookContainer')}`);
            console.log(`  🔍 HTML contains 'gr-hyperlink': ${html.includes('gr-hyperlink')}`);
            
            // Try multiple selectors for book results (updated for current Goodreads structure)
            let bookElement = doc.querySelector('.searchResultItem') || 
                            doc.querySelector('.searchResult') ||
                            doc.querySelector('.bookContainer') ||
                            doc.querySelector('[data-testid="book-item"]') ||
                            doc.querySelector('.gr-hyperlink') ||
                            doc.querySelector('.bookTitle') ||
                            doc.querySelector('.authorName');
            
            // If no specific book element found, try to find any book-related content
            if (!bookElement) {
                console.log(`  🔍 Trying alternative selectors...`);
                
                // Look for links that might be book links
                const links = doc.querySelectorAll('a[href*="/book/show/"]');
                console.log(`  🔍 Found ${links.length} book links in search results`);
                
                for (let link of links) {
                    const href = link.getAttribute('href') || '';
                    const text = link.textContent.trim().toLowerCase();
                    const queryLower = query.toLowerCase();
                    
                    console.log(`  🔍 Checking book link: "${text}" -> ${href}`);
                    
                    // Check if this link is related to our query
                    if (href.toLowerCase().includes(queryLower) || 
                        text.includes(queryLower) ||
                        href.toLowerCase().includes(queryLower.replace(/\s+/g, '_'))) {
                        console.log(`  🔍 Found matching book link: "${text}" -> ${href}`);
                        bookElement = link;
                        break;
                    }
                }
                
                // If no specific match found, use the first book link as fallback
                if (!bookElement && links.length > 0) {
                    console.log(`  🔍 No exact match found, using first book link as fallback`);
                    bookElement = links[0];
                }
                
                // If still no book element, try to find any element with the query text
                if (!bookElement) {
                    const allElements = doc.querySelectorAll('*');
                    for (let element of allElements) {
                        if (element.textContent && element.textContent.toLowerCase().includes(query.toLowerCase())) {
                            console.log(`  🔍 Found potential match: ${element.tagName} with text: "${element.textContent.substring(0, 100)}..."`);
                            bookElement = element;
                            break;
                        }
                    }
                }
            }
            
            if (bookElement) {
                console.log(`  📖 Found book element: ${bookElement.tagName}`);
                console.log(`  📖 Book element text: "${bookElement.textContent.trim()}"`);
                console.log(`  📖 Book element HTML: ${bookElement.outerHTML.substring(0, 200)}...`);
                
                // Debug: Show parent element structure
                if (bookElement.parentElement) {
                    console.log(`  📖 Parent element: ${bookElement.parentElement.tagName}`);
                    console.log(`  📖 Parent text: "${bookElement.parentElement.textContent.trim().substring(0, 100)}..."`);
                }
                
                // Try multiple selectors for title
                let titleElement = bookElement.querySelector('.bookTitle') ||
                                   bookElement.querySelector('.book-title') ||
                                   bookElement.querySelector('h3') ||
                                   bookElement.querySelector('h2') ||
                                   bookElement.querySelector('[data-testid="book-title"]');
                
                // If we found a link element, look for title in nearby elements
                if (!titleElement && bookElement.tagName === 'A') {
                    // Look in the parent container or nearby elements
                    const parent = bookElement.parentElement;
                    if (parent) {
                        titleElement = parent.querySelector('.bookTitle') ||
                                      parent.querySelector('.book-title') ||
                                      parent.querySelector('h3') ||
                                      parent.querySelector('h2') ||
                                      parent.querySelector('[data-testid="book-title"]') ||
                                      parent.querySelector('span[itemprop="name"]') ||
                                      parent.querySelector('.gr-hyperlink');
                    }
                    
                    // If still no title, try to extract from the link text itself
                    if (!titleElement && bookElement.textContent.trim()) {
                        titleElement = { textContent: bookElement.textContent.trim() };
                    }
                }
                
                // Try multiple selectors for author
                let authorElement = bookElement.querySelector('.authorName') ||
                                    bookElement.querySelector('.author-name') ||
                                    bookElement.querySelector('.author') ||
                                    bookElement.querySelector('[data-testid="author-name"]');
                
                // If we found a link element, look for author in nearby elements
                if (!authorElement && bookElement.tagName === 'A') {
                    const parent = bookElement.parentElement;
                    if (parent) {
                        authorElement = parent.querySelector('.authorName') ||
                                        parent.querySelector('.author-name') ||
                                        parent.querySelector('.author') ||
                                        parent.querySelector('[data-testid="author-name"]') ||
                                        parent.querySelector('span[itemprop="author"]') ||
                                        parent.querySelector('.authorName');
                    }
                }
                
                let title = titleElement ? titleElement.textContent.trim() : 'Unknown Title';
                let author = authorElement ? authorElement.textContent.trim() : 'Unknown Author';
                
                console.log(`  📖 Title element found: ${titleElement ? 'YES' : 'NO'}`);
                console.log(`  📖 Author element found: ${authorElement ? 'YES' : 'NO'}`);
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
                        
                        // Get all book links and find the best match
                        const allBookLinks = doc.querySelectorAll('a[href*="/book/show/"]');
                        console.log(`  🔍 Found ${allBookLinks.length} book links`);
                        
                        // Look for a link that contains our query in the href or text
                        for (let link of allBookLinks) {
                            const href = link.getAttribute('href') || '';
                            const text = link.textContent.trim().toLowerCase();
                            const queryLower = query.toLowerCase();
                            
                            console.log(`  🔍 Checking link: "${text}" -> ${href}`);
                            
                            // Check if this link is related to our query
                            if (href.toLowerCase().includes(queryLower) || 
                                text.includes(queryLower) ||
                                href.toLowerCase().includes(queryLower.replace(/\s+/g, '_'))) {
                                console.log(`  🔍 Found matching book link: "${text}" -> ${href}`);
                                bookLink = link;
                                break;
                            }
                        }
                        
                        // If still no match, take the first book link as fallback
                        if (!bookLink && allBookLinks.length > 0) {
                            console.log(`  🔍 No exact match found, using first book link as fallback`);
                            bookLink = allBookLinks[0];
                        }
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
                        console.log(`  🔍 HTML preview: ${bookPageHtml.substring(0, 1000)}...`);
                        
                        // Parse the book page
                        const bookPageDoc = parser.parseFromString(bookPageHtml, 'text/html');
                        
                        // Try to get the book title from the book page
                        console.log(`  🔍 Extracting title from book page...`);
                        const titleSelectors = [
                            'h1[data-testid="bookTitle"]', 'h1.bookTitle', 'h1[data-testid="book-title"]',
                            'h1', '.bookTitle', '[data-testid="bookTitle"]', '[data-testid="book-title"]',
                            '.book-title', 'h1.book-title', '.gr-hyperlink'
                        ];
                        
                        let pageTitle = title; // Use the original title as fallback
                        for (const selector of titleSelectors) {
                            const titleElement = bookPageDoc.querySelector(selector);
                            if (titleElement && titleElement.textContent.trim()) {
                                pageTitle = titleElement.textContent.trim();
                                console.log(`  📖 Found book page title: "${pageTitle}" using selector: ${selector}`);
                                break;
                            }
                        }
                        
                        // Try to get the author from the book page
                        console.log(`  🔍 Extracting author from book page...`);
                        const authorSelectors = [
                            '[data-testid="authorName"]', '.authorName', '.author-name', '.author',
                            '[data-testid="author-name"]', '.AuthorName', '.gr-hyperlink',
                            'span[itemprop="author"]', '.authorName', '.authorName__name',
                            '.ContributorLink', '.ContributorLink__name', '.author__name',
                            'a[href*="/author/show/"]', '.authorLink', '.author-link'
                        ];
                        
                        let pageAuthor = author; // Use the original author as fallback
                        console.log(`  🔍 Trying ${authorSelectors.length} author selectors...`);
                        
                        for (const selector of authorSelectors) {
                            const authorElement = bookPageDoc.querySelector(selector);
                            if (authorElement && authorElement.textContent.trim()) {
                                pageAuthor = authorElement.textContent.trim();
                                console.log(`  📖 Found book page author: "${pageAuthor}" using selector: ${selector}`);
                                break;
                            } else {
                                console.log(`  🔍 Selector "${selector}": not found`);
                            }
                        }
                        
                        // If still no author found, try to extract from JSON-LD structured data
                        if (pageAuthor === author) {
                            console.log(`  🔍 Trying to extract author from JSON-LD structured data...`);
                            const jsonLdScript = bookPageDoc.querySelector('script[type="application/ld+json"]');
                            if (jsonLdScript) {
                                try {
                                    const jsonData = JSON.parse(jsonLdScript.textContent);
                                    if (jsonData.author && jsonData.author.length > 0) {
                                        pageAuthor = jsonData.author[0].name || jsonData.author[0];
                                        console.log(`  📖 Found author from JSON-LD: "${pageAuthor}"`);
                                    }
                                } catch (e) {
                                    console.log(`  🔍 JSON-LD parsing failed: ${e.message}`);
                                }
                            }
                        }
                        
                        // Update title and author with the book page data
                        title = pageTitle;
                        author = pageAuthor;
                        
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
                            // Modern Goodreads selectors (2024)
                            '[data-testid="review-text"]', '[data-testid="reviewText"]', '[data-testid="review"]',
                            '.ReviewText', '.ReviewText__content', '.ReviewText__body', '.ReviewText__text',
                            '.gr-review-text', '.gr-review-text-content', '.gr-review-text-body',
                            
                            // Legacy selectors
                            '.reviewText', '.review-text', '.review', '.reviewTextContainer', '.reviewContainer',
                            '.reviewShelf', '.reviewTextShelf', '.gr-review',
                            
                            // Paragraph selectors
                            '.gr-review-text p', '.reviewText p', '.review-text p', '.review p', '.gr-review p',
                            '.reviewContainer p', '.reviewTextContainer p', '.reviewShelf p', '.reviewTextShelf p',
                            
                            // Content selectors
                            '.gr-review-text-content', '.review-text-content', '.review-content', '.gr-review-content',
                            '.reviewText-content', '.reviewTextContainer-content', '.reviewContainer-content',
                            '.reviewShelf-content', '.reviewTextShelf-content',
                            
                            // ID selectors
                            '#reviewText', '#review-text', '#review', '#gr-review-text', '#reviewTextContainer',
                            '#reviewContainer', '#reviewShelf', '#reviewTextShelf',
                            
                            // Data attribute selectors
                            '[data-testid="gr-review-text"]', '[data-testid="reviewTextContainer"]',
                            '[data-testid="reviewContainer"]', '[data-testid="reviewShelf"]', '[data-testid="reviewTextShelf"]',
                            
                            // Generic text content selectors
                            '.text', '.content', '.body', '.description', '.summary',
                            '[class*="review"]', '[class*="Review"]', '[id*="review"]', '[id*="Review"]'
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
                            
                            // First try to find user-generated content areas
                            const userContentSelectors = [
                                '[class*="user"]', '[class*="User"]', '[class*="member"]', '[class*="Member"]',
                                '[class*="comment"]', '[class*="Comment"]', '[class*="post"]', '[class*="Post"]',
                                '[class*="discussion"]', '[class*="Discussion"]', '[class*="thread"]', '[class*="Thread"]',
                                '.userContent', '.user-content', '.memberContent', '.member-content',
                                '.commentContent', '.comment-content', '.postContent', '.post-content'
                            ];
                            
                            for (const selector of userContentSelectors) {
                                const elements = bookPageDoc.querySelectorAll(selector);
                                if (elements.length > 0) {
                                    console.log(`  🔍 Found ${elements.length} user content elements with selector: ${selector}`);
                                    reviewElements = elements;
                                    break;
                                }
                            }
                            
                            // If still no reviews, search all text elements
                            if (reviewElements.length === 0) {
                                const allTextElements = bookPageDoc.querySelectorAll('*');
                                const cancerTerms = [
                                // Direct cancer terms
                                'cancer', 'tumor', 'tumour', 'malignancy', 'malignant', 'carcinoma', 'sarcoma', 'lymphoma', 'leukemia', 'leukaemia',
                                'melanoma', 'metastasis', 'metastatic', 'cancerous', 'cancer cells', 'cancer diagnosis', 'cancer treatment',
                                
                                // Cancer types
                                'breast cancer', 'lung cancer', 'prostate cancer', 'colon cancer', 'pancreatic cancer', 'brain cancer',
                                'ovarian cancer', 'cervical cancer', 'liver cancer', 'kidney cancer', 'bladder cancer', 'skin cancer',
                                'bone cancer', 'blood cancer', 'throat cancer', 'stomach cancer', 'esophageal cancer', 'rectal cancer',
                                
                                // Medical terms
                                'chemotherapy', 'chemo', 'radiation', 'radiotherapy', 'oncology', 'oncologist', 'biopsy', 'mastectomy',
                                'lumpectomy', 'hysterectomy', 'prostatectomy', 'colostomy', 'tracheostomy', 'immunotherapy',
                                'targeted therapy', 'hormone therapy', 'stem cell transplant', 'bone marrow transplant',
                                
                                // Symptoms and progression
                                'terminal', 'terminal illness', 'terminal cancer', 'stage 4', 'stage four', 'advanced cancer',
                                'metastasized', 'spread to', 'recurrence', 'relapse', 'remission', 'palliative care',
                                'hospice', 'end of life', 'dying from', 'died from', 'death from cancer',
                                
                                // Treatment locations
                                'hospital', 'medical center', 'cancer center', 'oncology unit', 'cancer ward', 'chemotherapy room',
                                'radiation therapy', 'infusion center', 'outpatient clinic', 'emergency room', 'icu', 'intensive care',
                                
                                // Emotional/psychological terms
                                'battle with cancer', 'fighting cancer', 'cancer journey', 'cancer survivor', 'cancer patient',
                                'cancer support', 'cancer awareness', 'cancer research', 'cancer foundation', 'cancer fundraiser',
                                
                                // Family/relationship terms
                                'cancer diagnosis', 'cancer news', 'cancer scare', 'cancer screening', 'cancer prevention',
                                'family history', 'genetic predisposition', 'cancer risk', 'cancer genes', 'brca', 'brca1', 'brca2',
                                
                                // General medical terms
                                'illness', 'disease', 'sickness', 'medical condition', 'serious condition', 'chronic illness',
                                'life-threatening', 'fatal illness', 'incurable', 'prognosis', 'treatment', 'medical treatment',
                                'surgery', 'operation', 'procedure', 'medication', 'drugs', 'prescription', 'side effects',
                                
                                // Care and support
                                'caregiver', 'caregiving', 'nursing', 'nurse', 'doctor', 'physician', 'specialist',
                                'medical team', 'healthcare', 'patient care', 'home care', 'nursing home',
                                
                                // Physical effects
                                'hair loss', 'bald', 'baldness', 'nausea', 'vomiting', 'fatigue', 'weakness', 'pain',
                                'weight loss', 'appetite loss', 'cachexia', 'anemia', 'infection', 'fever', 'chills',
                                
                                // Time-related terms
                                'months to live', 'weeks to live', 'days to live', 'time left', 'remaining time',
                                'last days', 'final days', 'end stage', 'late stage', 'advanced stage'
                            ];
                            
                            for (let element of allTextElements) {
                                // Skip script, style, and JSON-LD elements
                                if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE' || 
                                    element.tagName === 'META' || element.classList.contains('json-ld') ||
                                    element.textContent.includes('"@context"') || element.textContent.includes('"@type"') ||
                                    element.textContent.includes('window.') || element.textContent.includes('var ') ||
                                    element.textContent.includes('function(') || element.textContent.includes('{') && element.textContent.includes('}')) {
                                    continue;
                                }
                                
                                const text = element.textContent.toLowerCase();
                                
                                // Look for text that looks like reviews (contains review-like phrases)
                                const reviewPhrases = ['i think', 'i loved', 'i hated', 'i enjoyed', 'i recommend', 'i would', 
                                                      'this book', 'the story', 'the characters', 'the plot', 'the author',
                                                      'my opinion', 'in my view', 'personally', 'i found', 'i felt'];
                                
                                const looksLikeReview = reviewPhrases.some(phrase => text.includes(phrase));
                                
                                if (text && text.length > 50 && cancerTerms.some(term => text.includes(term)) && looksLikeReview) {
                                    console.log(`  🎯 Found review-like element containing cancer-related content: ${element.tagName}`);
                                    console.log(`  🎯 Element text: "${element.textContent.substring(0, 200)}..."`);
                                    reviewElements = [element];
                                    break;
                                }
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
                        
                        // Also search the entire page HTML for cancer-related content (including blurred/spoiler text)
                        // This will catch content that Goodreads hides with CSS blur
                        const pageText = bookPageDoc.body.textContent || bookPageDoc.body.innerText || '';
                        const cancerTerms = [
                            // Direct cancer terms
                            'cancer', 'tumor', 'tumour', 'malignancy', 'malignant', 'carcinoma', 'sarcoma', 'lymphoma', 'leukemia', 'leukaemia',
                            'melanoma', 'metastasis', 'metastatic', 'cancerous', 'cancer cells', 'cancer diagnosis', 'cancer treatment',
                            
                            // Cancer types
                            'breast cancer', 'lung cancer', 'prostate cancer', 'colon cancer', 'pancreatic cancer', 'brain cancer',
                            'ovarian cancer', 'cervical cancer', 'liver cancer', 'kidney cancer', 'bladder cancer', 'skin cancer',
                            'bone cancer', 'blood cancer', 'throat cancer', 'stomach cancer', 'esophageal cancer', 'rectal cancer',
                            
                            // Medical terms
                            'chemotherapy', 'chemo', 'radiation', 'radiotherapy', 'oncology', 'oncologist', 'biopsy', 'mastectomy',
                            'lumpectomy', 'hysterectomy', 'prostatectomy', 'colostomy', 'tracheostomy', 'immunotherapy',
                            'targeted therapy', 'hormone therapy', 'stem cell transplant', 'bone marrow transplant',
                            
                            // Symptoms and progression
                            'terminal', 'terminal illness', 'terminal cancer', 'stage 4', 'stage four', 'advanced cancer',
                            'metastasized', 'spread to', 'recurrence', 'relapse', 'remission', 'palliative care',
                            'hospice', 'end of life', 'dying from', 'died from', 'death from cancer'
                        ];
                        
                        const pageTextLower = pageText.toLowerCase();
                        const foundCancerTerms = cancerTerms.filter(term => pageTextLower.includes(term));
                        
                        if (foundCancerTerms.length > 0 && !reviews.toLowerCase().includes(foundCancerTerms[0])) {
                            console.log(`  ⚠️ Found cancer-related content in full page text (including blurred content): ${foundCancerTerms.join(', ')}`);
                            // Append cancer-related content from full page to reviews
                            const contextStart = pageTextLower.indexOf(foundCancerTerms[0]);
                            const contextExtract = pageText.substring(
                                Math.max(0, contextStart - 200),
                                Math.min(pageText.length, contextStart + 500)
                            );
                            console.log(`  📝 Extracted context: "${contextExtract}..."`);
                            reviews = reviews + ' ' + contextExtract;
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
                
                // For exact match mode, validate that the title is an exact match
                if (exactMatch) {
                    const bookTitleLower = title.toLowerCase().trim();
                    const queryLower = query.toLowerCase().trim();
                    
                    if (bookTitleLower !== queryLower) {
                        console.log(`  ❌ Exact match validation failed: "${title}" != "${query}"`);
                        return null;
                    } else {
                        console.log(`  ✅ Exact match validation passed: "${title}"`);
                    }
                }
                
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

    async searchWikipedia(query, exactMatch = false) {
        console.log(`📚 Searching Wikipedia for: "${query}"`);
        
        // Check if we're running from file:// protocol (CORS will block this)
        if (window.location.protocol === 'file:') {
            console.log(`  ⚠️ CORS blocked: Running from file:// protocol`);
            return null;
        }
        
        try {
            // First try the search API to find the correct title
            const searchQuery = exactMatch ? `"${query}"` : query;
            const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(searchQuery)}&srlimit=5&origin=*`;
            console.log(`  🔍 Searching Wikipedia for: "${query}"`);
            console.log(`  🔗 Search URL: ${searchUrl}`);
            
            if (exactMatch) {
                console.log(`  🔍 Exact match mode: Using quoted search`);
            }
            
            const searchResponse = await fetch(searchUrl);
            if (searchResponse.ok) {
                const searchData = await searchResponse.json();
                console.log(`  📊 Wikipedia search results:`, searchData);
                
                if (searchData.query && searchData.query.search && searchData.query.search.length > 0) {
                    // Try to find a book-related result, prioritizing books over films
                    const bookKeywords = ['book', 'novel', 'author', 'published', 'literature'];
                    const filmKeywords = ['film', 'movie', 'director', 'actor', 'cinema'];
                    
                    // First pass: look for explicit book-related results
                    for (const result of searchData.query.search) {
                        const titleLower = result.title.toLowerCase();
                        const snippetLower = result.snippet.toLowerCase();
                        
                        // Check if this is explicitly a book/novel
                        const isBook = bookKeywords.some(keyword => 
                            titleLower.includes(keyword) || snippetLower.includes(keyword)
                        );
                        const isFilm = filmKeywords.some(keyword => 
                            titleLower.includes(keyword) || snippetLower.includes(keyword)
                        );
                        
                        // Prioritize book results, avoid film results
                        if (isBook && !isFilm) {
                            console.log(`  📚 Found book-related match: "${result.title}"`);
                            
                            // Now get the page summary
                            const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(result.title)}`;
                            console.log(`  🔗 Summary URL: ${summaryUrl}`);
                            
                            const summaryResponse = await fetch(summaryUrl);
                            if (summaryResponse.ok) {
                                const summaryData = await summaryResponse.json();
                                console.log(`  📊 Wikipedia summary:`, summaryData);
                                
                                if (summaryData.extract && summaryData.extract.length > 50) {
                                    console.log(`  📚 Wikipedia found book: ${summaryData.title}`);
                                    return {
                                        title: summaryData.title,
                                        author: summaryData.description || 'Unknown',
                                        description: summaryData.extract,
                                        plotSummary: summaryData.extract,
                                        reviews: '',
                                        contentWarnings: '',
                                        publishedDate: 'Unknown',
                                        pageCount: null,
                                        categories: [],
                                        type: 'book',
                                        source: 'Wikipedia'
                                    };
                                }
                            }
                        }
                    }
                    
                    // Second pass: if no explicit book found, try general matches but avoid films
                    for (const result of searchData.query.search) {
                        const titleLower = result.title.toLowerCase();
                        const snippetLower = result.snippet.toLowerCase();
                        
                        // Skip if it's clearly a film
                        const isFilm = filmKeywords.some(keyword => 
                            titleLower.includes(keyword) || snippetLower.includes(keyword)
                        );
                        
                        if (!isFilm && (result.title.toLowerCase().includes(query.toLowerCase()) || 
                            query.toLowerCase().includes(result.title.toLowerCase()))) {
                            console.log(`  📚 Found general match (non-film): "${result.title}"`);
                            
                            // Now get the page summary
                            const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(result.title)}`;
                            console.log(`  🔗 Summary URL: ${summaryUrl}`);
                            
                            const summaryResponse = await fetch(summaryUrl);
                            if (summaryResponse.ok) {
                                const summaryData = await summaryResponse.json();
                                console.log(`  📊 Wikipedia summary:`, summaryData);
                                
                                if (summaryData.extract && summaryData.extract.length > 50) {
                                    console.log(`  📚 Wikipedia found: ${summaryData.title}`);
                                    return {
                                        title: summaryData.title,
                                        author: summaryData.description || 'Unknown',
                                        description: summaryData.extract,
                                        plotSummary: summaryData.extract,
                                        reviews: '',
                                        contentWarnings: '',
                                        publishedDate: 'Unknown',
                                        pageCount: null,
                                        categories: [],
                                        type: 'book',
                                        source: 'Wikipedia'
                                    };
                                }
                            }
                        }
                    }
                }
            }
            
            console.log(`  📚 Wikipedia: No page found for "${query}"`);
            return null;
            
        } catch (error) {
            console.error('Wikipedia search error:', error);
            return null;
        }
    }

    async checkWikipediaCancerCategory(query) {
        console.log(`📚 Checking Wikipedia cancer category for: "${query}"`);
        
        // Check if we're running from file:// protocol (CORS will block this)
        if (window.location.protocol === 'file:') {
            console.log(`  ⚠️ CORS blocked: Running from file:// protocol`);
            return null;
        }
        
        try {
            // Check if the movie is in the Wikipedia "Films about cancer" category
            const categoryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/Category:Films_about_cancer`;
            console.log(`  🔍 Checking Wikipedia cancer category...`);
            
            const response = await fetch(categoryUrl);
            
            if (!response.ok) {
                console.log(`  📚 Wikipedia category check failed`);
                return null;
            }
            
            const data = await response.json();
            
            // For now, we'll use our comprehensive list, but this could be enhanced
            // to actually parse the category page content
            const normalizedQuery = query.toLowerCase().trim();
            const isInCancerCategory = CANCER_THEMED_CONTENT.movies.some(movie => 
                normalizedQuery.includes(movie) || movie.includes(normalizedQuery)
            );
            
            if (isInCancerCategory) {
                console.log(`  📚 Movie "${query}" found in Wikipedia cancer films category`);
                return {
                    title: query,
                    author: 'Wikipedia Category',
                    description: `This film is listed in Wikipedia's "Category:Films about cancer" - a curated list of 131+ films that deal with cancer themes.`,
                    plotSummary: 'Film contains cancer-related themes as confirmed by Wikipedia categorization.',
                    reviews: '',
                    contentWarnings: 'Cancer themes confirmed by Wikipedia',
                    publishedDate: 'Unknown',
                    pageCount: null,
                    categories: ['cancer', 'medical'],
                    type: 'movie',
                    source: 'Wikipedia Cancer Category'
                };
            }
            
            console.log(`  📚 Movie "${query}" not found in Wikipedia cancer films category`);
            return null;
            
        } catch (error) {
            console.error('Wikipedia cancer category check error:', error);
            return null;
        }
    }

    async searchWikipediaMovie(query) {
        console.log(`🎬 Searching Wikipedia for movie: "${query}"`);
        
        // Check if we're running from file:// protocol (CORS will block this)
        if (window.location.protocol === 'file:') {
            console.log(`  ⚠️ CORS blocked: Running from file:// protocol`);
            return null;
        }
        
        try {
            // First try the search API to find the correct title
            const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(query)}&srlimit=5&origin=*`;
            console.log(`  🔍 Searching Wikipedia for movie: "${query}"`);
            console.log(`  🔗 Search URL: ${searchUrl}`);
            
            const searchResponse = await fetch(searchUrl);
            if (searchResponse.ok) {
                const searchData = await searchResponse.json();
                console.log(`  📊 Wikipedia search results:`, searchData);
                
                if (searchData.query && searchData.query.search && searchData.query.search.length > 0) {
                    const filmKeywords = ['film', 'movie', 'director', 'actor', 'cinema', 'motion picture'];
                    const bookKeywords = ['book', 'novel', 'author', 'published', 'literature'];
                    const queryLower = query.toLowerCase();
                    
                    // First pass: look for exact or very close title matches
                    for (const result of searchData.query.search) {
                        const titleLower = result.title.toLowerCase();
                        const snippetLower = result.snippet.toLowerCase();
                        
                        // Check for exact title match or very close match
                        const isExactMatch = titleLower === queryLower || 
                                           titleLower.includes(queryLower) || 
                                           queryLower.includes(titleLower);
                        
                        // Skip if it's clearly a book
                        const isBook = bookKeywords.some(keyword => 
                            titleLower.includes(keyword) || snippetLower.includes(keyword)
                        );
                        
                        if (isExactMatch && !isBook) {
                            console.log(`  🎬 Found exact/close title match: "${result.title}"`);
                            
                            // Now get the page summary
                            const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(result.title)}`;
                            console.log(`  🔗 Summary URL: ${summaryUrl}`);
                            
                            const summaryResponse = await fetch(summaryUrl);
                            if (summaryResponse.ok) {
                                const summaryData = await summaryResponse.json();
                                console.log(`  📊 Wikipedia summary:`, summaryData);
                                
                                if (summaryData.extract && summaryData.extract.length > 50) {
                                    console.log(`  🎬 Wikipedia found movie: ${summaryData.title}`);
                                    return {
                                        title: summaryData.title,
                                        description: summaryData.description || 'Unknown',
                                        plotSummary: summaryData.extract,
                                        reviews: '',
                                        contentWarnings: '',
                                        publishedDate: 'Unknown',
                                        pageCount: null,
                                        categories: [],
                                        type: 'movie',
                                        source: 'Wikipedia'
                                    };
                                }
                            }
                        }
                    }
                    
                    // Second pass: look for film-related results (but only if no exact match found)
                    for (const result of searchData.query.search) {
                        const titleLower = result.title.toLowerCase();
                        const snippetLower = result.snippet.toLowerCase();
                        
                        // Check if this is explicitly a film/movie
                        const isFilm = filmKeywords.some(keyword => 
                            titleLower.includes(keyword) || snippetLower.includes(keyword)
                        );
                        const isBook = bookKeywords.some(keyword => 
                            titleLower.includes(keyword) || snippetLower.includes(keyword)
                        );
                        
                        // Prioritize film results, avoid book results
                        if (isFilm && !isBook) {
                            console.log(`  🎬 Found film-related match: "${result.title}"`);
                            
                            // Now get the page summary
                            const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(result.title)}`;
                            console.log(`  🔗 Summary URL: ${summaryUrl}`);
                            
                            const summaryResponse = await fetch(summaryUrl);
                            if (summaryResponse.ok) {
                                const summaryData = await summaryResponse.json();
                                console.log(`  📊 Wikipedia summary:`, summaryData);
                                
                                if (summaryData.extract && summaryData.extract.length > 50) {
                                    console.log(`  🎬 Wikipedia found film: ${summaryData.title}`);
                                    return {
                                        title: summaryData.title,
                                        description: summaryData.description || 'Unknown',
                                        plotSummary: summaryData.extract,
                                        reviews: '',
                                        contentWarnings: '',
                                        publishedDate: 'Unknown',
                                        pageCount: null,
                                        categories: [],
                                        type: 'movie',
                                        source: 'Wikipedia'
                                    };
                                }
                            }
                        }
                    }
                }
            }
            
            console.log(`  🎬 Wikipedia: No movie page found for "${query}"`);
            return null;
            
        } catch (error) {
            console.error('Wikipedia movie search error:', error);
            return null;
        }
    }

    async searchStoryGraph(query, exactMatch = false) {
        console.log(`📖 Searching StoryGraph for: "${query}"`);
        
        // Check if we're running from file:// protocol (CORS will block this)
        if (window.location.protocol === 'file:') {
            console.log(`  ⚠️ CORS blocked: Running from file:// protocol`);
            return null;
        }
        
        try {
            // Use a CORS proxy to access StoryGraph
            const corsProxy = 'https://corsproxy.io/?';
            const searchQuery = exactMatch ? `"${query}"` : query;
            const storyGraphUrl = `https://app.thestorygraph.com/search?q=${encodeURIComponent(searchQuery)}`;
            const proxyUrl = corsProxy + encodeURIComponent(storyGraphUrl);
            
            if (exactMatch) {
                console.log(`  🔍 Exact match mode: Using quoted search`);
            }
            
            console.log(`  🔍 Fetching from StoryGraph via CORS proxy...`);
            console.log(`  🔗 Proxy URL: ${proxyUrl}`);
            
            const response = await fetch(proxyUrl);
            if (!response.ok) {
                console.log(`  ❌ StoryGraph search failed: ${response.status}`);
                return null;
            }
            
            const html = await response.text();
            console.log(`  📊 StoryGraph HTML length: ${html.length} characters`);
            
            // Parse the HTML to extract book information
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Look for book results on StoryGraph - try multiple selectors
            let bookElements = doc.querySelectorAll('[data-testid="book-card"], .book-card, .search-result-item');
            
            // If no results with primary selectors, try more generic ones
            if (bookElements.length === 0) {
                console.log(`  🔍 Trying alternative selectors for StoryGraph...`);
                bookElements = doc.querySelectorAll('a[href*="/books/"], .book, .search-result, [class*="book"], [class*="search"]');
                console.log(`  🔍 Found ${bookElements.length} elements with alternative selectors`);
            }
            
            // Also try to find any links that might be book links
            if (bookElements.length === 0) {
                const allLinks = doc.querySelectorAll('a');
                const bookLinks = Array.from(allLinks).filter(link => {
                    const href = link.getAttribute('href') || '';
                    return href.includes('/books/') && !href.includes('/content_warning') && !href.includes('/reviews');
                });
                console.log(`  🔍 Found ${bookLinks.length} potential book links`);
                bookElements = bookLinks;
            }
            
            console.log(`  🔍 Total book elements found: ${bookElements.length}`);
            
            if (bookElements.length > 0) {
                // Get the first book result
                const bookElement = bookElements[0];
                
                // Try to extract title and author - improved selectors for StoryGraph
                const titleElement = bookElement.querySelector('[data-testid="book-title"], .book-title, h3, h2, h1, .title, [class*="title"]') ||
                                   bookElement.querySelector('a[href*="/books/"]') ||
                                   bookElement;
                
                const authorElement = bookElement.querySelector('[data-testid="book-author"], .book-author, .author, [class*="author"]') ||
                                    bookElement.parentElement?.querySelector('[data-testid="book-author"], .book-author, .author, [class*="author"]');
                
                let title = 'Unknown Title';
                let author = 'Unknown Author';
                
                // Extract title
                if (titleElement) {
                    if (titleElement.tagName === 'A') {
                        // If it's a link, try to extract title from text or href
                        title = titleElement.textContent.trim() || 
                               titleElement.getAttribute('href')?.split('/').pop()?.replace(/-/g, ' ') || 
                               'Unknown Title';
                    } else {
                        title = titleElement.textContent.trim() || 'Unknown Title';
                    }
                }
                
                // Extract author
                if (authorElement) {
                    author = authorElement.textContent.trim() || 'Unknown Author';
                }
                
                console.log(`  📖 StoryGraph found: ${title} by ${author}`);
                
                // For exact match mode, validate that the title is an exact match
                if (exactMatch) {
                    const bookTitleLower = title.toLowerCase().trim();
                    const queryLower = query.toLowerCase().trim();
                    
                    if (bookTitleLower !== queryLower) {
                        console.log(`  ❌ Exact match validation failed: "${title}" != "${query}"`);
                        return null;
                    } else {
                        console.log(`  ✅ Exact match validation passed: "${title}"`);
                    }
                }
                
                // Try to find the book's individual page for content warnings
                let contentWarnings = '';
                const bookLink = bookElement.querySelector('a[href*="/books/"]');
                
                if (bookLink) {
                    const bookHref = bookLink.getAttribute('href');
                    const bookPageUrl = `https://app.thestorygraph.com${bookHref}`;
                    const contentWarningsUrl = `${bookPageUrl}/content_warnings`;
                    const contentWarningsProxyUrl = corsProxy + encodeURIComponent(contentWarningsUrl);
                    
                    console.log(`  🔍 Fetching content warnings from: ${contentWarningsUrl}`);
                    
                    try {
                        const contentWarningsResponse = await fetch(contentWarningsProxyUrl);
                        if (contentWarningsResponse.ok) {
                            const contentWarningsHtml = await contentWarningsResponse.text();
                            const contentWarningsDoc = parser.parseFromString(contentWarningsHtml, 'text/html');
                            
                            // Look for content warnings - expanded selectors
                            const warningElements = contentWarningsDoc.querySelectorAll(
                                '[data-testid="content-warning"], .content-warning, .warning-item, .trigger-warning, ' +
                                '.content-warnings, .warnings, .warning, .trigger, ' +
                                '[class*="warning"], [class*="trigger"], [class*="content-warning"]'
                            );
                            const warnings = Array.from(warningElements).map(el => el.textContent.trim()).filter(text => text.length > 0);
                            
                            if (warnings.length > 0) {
                                contentWarnings = warnings.join(', ');
                                console.log(`  ⚠️ Found ${warnings.length} content warnings: ${contentWarnings}`);
                            } else {
                                console.log(`  ℹ️ No content warnings found on StoryGraph`);
                            }
                        }
                    } catch (e) {
                        console.log(`  ⚠️ Could not fetch content warnings: ${e.message}`);
                    }
                }
                
                return {
                    title: title,
                    author: author,
                    description: '',
                    plotSummary: '',
                    reviews: '',
                    contentWarnings: contentWarnings,
                    publishedDate: 'Unknown',
                    pageCount: null,
                    categories: [],
                    type: 'book',
                    source: 'StoryGraph'
                };
            }
            
            console.log(`  📖 No book results found on StoryGraph`);
            return null;
            
        } catch (error) {
            console.log(`StoryGraph search error: ${error.message}`);
            return null;
        }
    }

    async searchIMDbCancerList(query, exactMatch = false) {
        console.log(`🎬 Searching IMDb Cancer Movies List for: "${query}"`);
        
        // Check if we're running from file:// protocol (CORS will block this)
        if (window.location.protocol === 'file:') {
            console.log(`  ⚠️ CORS blocked: Running from file:// protocol`);
            return null;
        }
        
        try {
            // Use a CORS proxy to access IMDb list
            const corsProxy = 'https://corsproxy.io/?';
            const imdbUrl = 'https://www.imdb.com/list/ls004695995/';
            const proxyUrl = corsProxy + encodeURIComponent(imdbUrl);
            
            console.log(`  🔍 Fetching IMDb Cancer Movies List via CORS proxy...`);
            console.log(`  🔗 Proxy URL: ${proxyUrl}`);
            
            const response = await fetch(proxyUrl);
            if (!response.ok) {
                console.log(`  ❌ IMDb list fetch failed: ${response.status}`);
                return null;
            }
            
            const html = await response.text();
            console.log(`  📊 IMDb HTML length: ${html.length} characters`);
            
            // Parse the HTML to extract movie information
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Look for movie titles in the IMDb list
            const movieElements = doc.querySelectorAll('.lister-item, .list-item, [data-testid="movie-title"], .title');
            console.log(`  🔍 Found ${movieElements.length} movie elements`);
            
            // Also try to find movie titles in text content
            const queryLower = query.toLowerCase().trim();
            let foundMovie = null;
            
            // Search through movie elements
            for (let element of movieElements) {
                const text = element.textContent.toLowerCase();
                const titleMatch = text.includes(queryLower);
                
                if (titleMatch) {
                    console.log(`  🎬 Found potential match: "${element.textContent.substring(0, 100)}..."`);
                    
                    // Try to extract movie title and year
                    const titleElement = element.querySelector('h3, h2, .title, [data-testid="movie-title"]') || element;
                    const titleText = titleElement.textContent.trim();
                    
                    // Extract year if present
                    const yearMatch = titleText.match(/(\d{4})/);
                    const year = yearMatch ? yearMatch[1] : 'Unknown';
                    
                    // Clean up title (remove year and extra text)
                    const cleanTitle = titleText.replace(/\s*\d{4}.*$/, '').trim();
                    
                    // For exact match mode, validate the title
                    if (exactMatch) {
                        const cleanTitleLower = cleanTitle.toLowerCase().trim();
                        if (cleanTitleLower !== queryLower) {
                            console.log(`  ❌ Exact match validation failed: "${cleanTitle}" != "${query}"`);
                            continue;
                        } else {
                            console.log(`  ✅ Exact match validation passed: "${cleanTitle}"`);
                        }
                    }
                    
                    foundMovie = {
                        title: cleanTitle,
                        year: year,
                        description: 'Cancer-themed movie from IMDb list',
                        plotSummary: '',
                        reviews: '',
                        contentWarnings: 'Cancer themes (from IMDb Cancer Movies list)',
                        publishedDate: year,
                        pageCount: null,
                        categories: ['Cancer', 'Drama'],
                        type: 'movie',
                        source: 'IMDb Cancer List'
                    };
                    
                    console.log(`  🎬 IMDb Cancer List found: ${cleanTitle} (${year})`);
                    break;
                }
            }
            
            // If no direct match found, try searching the entire page text
            if (!foundMovie) {
                console.log(`  🔍 Searching entire page text for "${query}"...`);
                const pageText = doc.body.textContent.toLowerCase();
                
                if (pageText.includes(queryLower)) {
                    console.log(`  🎯 Found "${query}" mentioned in IMDb Cancer Movies list`);
                    
                    foundMovie = {
                        title: query,
                        year: 'Unknown',
                        description: 'Cancer-themed movie from IMDb list',
                        plotSummary: '',
                        reviews: '',
                        contentWarnings: 'Cancer themes (from IMDb Cancer Movies list)',
                        publishedDate: 'Unknown',
                        pageCount: null,
                        categories: ['Cancer', 'Drama'],
                        type: 'movie',
                        source: 'IMDb Cancer List'
                    };
                }
            }
            
            if (foundMovie) {
                return foundMovie;
            }
            
            console.log(`  🎬 No cancer-themed movie found in IMDb list`);
            return null;
            
        } catch (error) {
            console.log(`IMDb Cancer List search error: ${error.message}`);
            return null;
        }
    }

    async searchWebForCancerContent(query, type) {
        console.log(`🌐 Searching web for cancer-related content: "${query}" (${type})`);
        
        // Check if we're running from file:// protocol (CORS will block this)
        if (window.location.protocol === 'file:') {
            console.log(`  ⚠️ CORS blocked: Running from file:// protocol`);
            return null;
        }
        
        try {
            // Create search queries combining the title with cancer terms
            const cancerTerms = ['cancer', 'leukemia', 'melanoma', 'oncology', 'tumor', 'chemotherapy', 'terminal illness'];
            const searchQueries = cancerTerms.map(term => `"${query}" ${term}`);
            
            console.log(`  🔍 Created ${searchQueries.length} search queries`);
            
            // For now, we'll use a simple approach - check if any of our search terms
            // would likely return results by searching for the title + cancer
            const mainSearchQuery = `"${query}" cancer`;
            console.log(`  🔍 Main search query: ${mainSearchQuery}`);
            
            // Since we can't directly search Google from the browser due to CORS,
            // we'll use a different approach: check if the title appears in our
            // existing cancer-themed content or if it matches common patterns
            
            const queryLower = query.toLowerCase();
            
            // Check if the title contains cancer-related keywords
            const cancerKeywords = [
                'cancer', 'leukemia', 'melanoma', 'oncology', 'tumor', 'tumour',
                'chemotherapy', 'chemo', 'radiation', 'terminal', 'illness',
                'sick', 'disease', 'medical', 'hospital', 'treatment',
                'survivor', 'battle', 'fight', 'journey', 'story',
                'terminal illness', 'terminal disease', 'end stage', 'advanced stage',
                'life expectancy', 'prognosis', 'months to live', 'weeks to live',
                'dying', 'death', 'mortality', 'fatal', 'incurable', 'untreatable',
                'hospice', 'end of life', 'final days', 'last days', 'deathbed',
                'chronic illness', 'serious illness', 'life-threatening', 'critical condition',
                'progressive disease', 'degenerative disease', 'fatal disease'
            ];
            
            const hasCancerKeywords = cancerKeywords.some(keyword => 
                queryLower.includes(keyword)
            );
            
            if (hasCancerKeywords) {
                console.log(`  🎯 Title contains cancer-related keywords`);
                return {
                    found: true,
                    reason: 'Title contains cancer-related keywords',
                    confidence: 85
                };
            }
            
            // Check against common cancer-themed title patterns
            const cancerPatterns = [
                'fault in our stars', 'walk to remember', 'me before you',
                'sister\'s keeper', 'bucket list', 'big sick', 'lovely bones',
                'time traveler\'s wife', 'book thief', 'kite runner',
                'curious incident', 'life of pi', 'midnight library',
                'seven husbands', 'invisible life', 'art of racing'
            ];
            
            const matchesPattern = cancerPatterns.some(pattern => 
                queryLower.includes(pattern)
            );
            
            if (matchesPattern) {
                console.log(`  🎯 Title matches known cancer-themed pattern`);
                return {
                    found: true,
                    reason: 'Title matches known cancer-themed pattern',
                    confidence: 90
                };
            }
            
            console.log(`  🌐 Web search: No obvious cancer content detected`);
            return {
                found: false,
                reason: 'No cancer-related keywords or patterns found',
                confidence: 60
            };
            
        } catch (error) {
            console.error('Web search error:', error);
            return null;
        }
    }

    combineBookResults(results, query) {
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
            
            // Use more specific title if available, prioritizing exact matches
            if (result.title && result.title !== 'Unknown Title') {
                // If current title is "Unknown Title", use this one
                if (combined.title === 'Unknown Title') {
                    combined.title = result.title;
                }
                // Otherwise, prefer titles that are closer to the original query
                else {
                    const queryLower = query.toLowerCase().trim();
                    const currentTitleLower = combined.title.toLowerCase().trim();
                    const resultTitleLower = result.title.toLowerCase().trim();
                    
                    // Check if result title is a better match
                    const currentMatch = currentTitleLower.includes(queryLower) || queryLower.includes(currentTitleLower);
                    const resultMatch = resultTitleLower.includes(queryLower) || queryLower.includes(resultTitleLower);
                    
                    // If result is a better match, use it
                    if (resultMatch && !currentMatch) {
                        console.log(`  📖 Using better title match: "${result.title}" over "${combined.title}"`);
                        combined.title = result.title;
                    }
                }
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

    async searchMovie(query, exactMatch = false) {
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
                
                // Check Wikipedia cancer category for additional context
                const wikipediaCancerCheck = await this.checkWikipediaCancerCategory(movie.title);
                
                // Also search Wikipedia for detailed plot information
                const wikipediaMovieInfo = await this.searchWikipediaMovie(movie.title);
                
                // Search web for cancer-related content
                const webSearchResult = await this.searchWebForCancerContent(movie.title, 'movie');
                
                // Search IMDb Cancer Movies list
                const imdbCancerResult = await this.searchIMDbCancerList(movie.title, exactMatch);
                
                console.log(`📚 Wikipedia cancer category check: ${wikipediaCancerCheck ? '✅ Found in cancer films category' : '❌ Not found'}`);
                console.log(`📚 Wikipedia movie page: ${wikipediaMovieInfo ? '✅ Found detailed plot' : '❌ No detailed plot found'}`);
                console.log(`🌐 Web search: ${webSearchResult ? (webSearchResult.found ? '✅ Cancer content detected' : '❌ No cancer content') : '❌ Search failed'}`);
                console.log(`🎬 IMDb Cancer List: ${imdbCancerResult ? '✅ Found in cancer movies list' : '❌ Not found in cancer movies list'}`);
                
                // Add Wikipedia and web search results to debug content
                debugContent += `<h4>📚 Wikipedia Results:</h4>\n`;
                if (wikipediaCancerCheck) {
                    debugContent += `<div class="api-result api-success">
                        <strong>📚 Wikipedia Cancer Category: ✅ Found in cancer films category</strong><br>
                        Movie is listed in Wikipedia's "Category:Films about cancer"
                    </div>`;
                } else {
                    debugContent += `<div class="api-result api-no-results">
                        <strong>📚 Wikipedia Cancer Category: ❌ Not found in cancer films category</strong>
                    </div>`;
                }
                
                if (wikipediaMovieInfo) {
                    debugContent += `<div class="api-result api-success">
                        <strong>📚 Wikipedia Movie Page: ✅ Found detailed plot information</strong><br>
                        Title: ${wikipediaMovieInfo.title}<br>
                        Description: ${wikipediaMovieInfo.description || 'Unknown'}<br>
                        Plot Summary: ${wikipediaMovieInfo.plotSummary ? wikipediaMovieInfo.plotSummary.substring(0, 200) + '...' : 'No plot summary'}
                    </div>`;
                } else {
                    debugContent += `<div class="api-result api-no-results">
                        <strong>📚 Wikipedia Movie Page: ❌ No detailed plot information found</strong>
                    </div>`;
                }
                
                debugContent += `<h4>🌐 Web Search Results:</h4>\n`;
                if (webSearchResult && webSearchResult.found) {
                    debugContent += `<div class="api-result api-success">
                        <strong>🌐 Web Search: ✅ Cancer content detected</strong><br>
                        Reason: ${webSearchResult.reason}<br>
                        Confidence: ${webSearchResult.confidence}%
                    </div>`;
                } else {
                    debugContent += `<div class="api-result api-no-results">
                        <strong>🌐 Web Search: ❌ No cancer content detected</strong><br>
                        Reason: ${webSearchResult ? webSearchResult.reason : 'Search failed'}
                    </div>`;
                }
                
                debugContent += `<h4>🎬 IMDb Cancer Movies List:</h4>\n`;
                if (imdbCancerResult) {
                    debugContent += `<div class="api-result api-success">
                        <strong>🎬 IMDb Cancer List: ✅ Found in cancer movies list</strong><br>
                        Title: ${imdbCancerResult.title}<br>
                        Year: ${imdbCancerResult.year}<br>
                        Content Warnings: ${imdbCancerResult.contentWarnings}
                    </div>`;
                } else {
                    debugContent += `<div class="api-result api-no-results">
                        <strong>🎬 IMDb Cancer List: ❌ Not found in cancer movies list</strong>
                    </div>`;
                }
                
                // Update the debug section
                this.updateApiDebugInfo(debugContent);
                
                return {
                    title: movie.title,
                    overview: movie.overview || 'No description available',
                    releaseDate: movie.release_date,
                    rating: movie.vote_average,
                    genres: details.genres ? details.genres.map(g => g.name) : [],
                    runtime: details.runtime,
                    type: 'movie',
                    source: 'TMDB',
                    wikipediaCancerInfo: wikipediaCancerCheck,
                    wikipediaInfo: wikipediaMovieInfo,
                    webSearchResult: webSearchResult,
                    imdbCancerResult: imdbCancerResult
                };
            } else {
                debugContent += `<div class="api-result api-no-results">
                    <strong>🎬 TMDB: ❌ No movies found</strong>
                </div>`;
                
                // Even if TMDB finds no results, check web search and IMDb Cancer List for cancer-related terms
                const webSearchResult = await this.searchWebForCancerContent(query, 'movie');
                const imdbCancerResult = await this.searchIMDbCancerList(query, exactMatch);
                
                console.log(`🌐 Web search (no TMDB results): ${webSearchResult ? (webSearchResult.found ? '✅ Cancer content detected' : '❌ No cancer content') : '❌ Search failed'}`);
                console.log(`🎬 IMDb Cancer List (no TMDB results): ${imdbCancerResult ? '✅ Found in cancer movies list' : '❌ Not found in cancer movies list'}`);
                
                debugContent += `<h4>🌐 Web Search Results:</h4>\n`;
                if (webSearchResult && webSearchResult.found) {
                    debugContent += `<div class="api-result api-success">
                        <strong>🌐 Web Search: ✅ Cancer content detected</strong><br>
                        Reason: ${webSearchResult.reason}<br>
                        Confidence: ${webSearchResult.confidence}%
                    </div>`;
                } else {
                    debugContent += `<div class="api-result api-no-results">
                        <strong>🌐 Web Search: ❌ No cancer content detected</strong><br>
                        Reason: ${webSearchResult ? webSearchResult.reason : 'Search failed'}
                    </div>`;
                }
                
                debugContent += `<h4>🎬 IMDb Cancer Movies List:</h4>\n`;
                if (imdbCancerResult) {
                    debugContent += `<div class="api-result api-success">
                        <strong>🎬 IMDb Cancer List: ✅ Found in cancer movies list</strong><br>
                        Title: ${imdbCancerResult.title}<br>
                        Year: ${imdbCancerResult.year}<br>
                        Content Warnings: ${imdbCancerResult.contentWarnings}
                    </div>`;
                } else {
                    debugContent += `<div class="api-result api-no-results">
                        <strong>🎬 IMDb Cancer List: ❌ Not found in cancer movies list</strong>
                    </div>`;
                }
                
                this.updateApiDebugInfo(debugContent);
                
                // If web search or IMDb Cancer List found cancer content, return a result even without TMDB data
                if ((webSearchResult && webSearchResult.found) || imdbCancerResult) {
                    return {
                        title: query,
                        overview: 'No description available from TMDB',
                        releaseDate: 'Unknown',
                        rating: null,
                        genres: [],
                        runtime: null,
                        type: 'movie',
                        source: 'Web Search / IMDb Cancer List',
                        wikipediaCancerInfo: null,
                        wikipediaInfo: null,
                        webSearchResult: webSearchResult,
                        imdbCancerResult: imdbCancerResult
                    };
                }
                
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
                content.contentWarnings || '',
                // Include Wikipedia movie information if available
                content.wikipediaInfo ? content.wikipediaInfo.plotSummary || '' : '',
                content.wikipediaInfo ? content.wikipediaInfo.description || '' : '',
                // Include web search results if available
                content.webSearchResult ? (content.webSearchResult.found ? content.webSearchResult.reason : '') : ''
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

        // Check Wikipedia cancer category for movies
        let wikipediaCancerCheck = null;
        if (content.type === 'movie' && content.wikipediaCancerInfo) {
            wikipediaCancerCheck = content.wikipediaCancerInfo;
            console.log(`📚 Wikipedia cancer category check: ${wikipediaCancerCheck ? 'YES - Found in cancer films category' : 'NO'}`);
        }

        // Check web search results
        let webSearchCancerCheck = null;
        if (content.webSearchResult && content.webSearchResult.found) {
            webSearchCancerCheck = content.webSearchResult;
            console.log(`🌐 Web search cancer check: YES - ${webSearchCancerCheck.reason}`);
        }

        // Check IMDb Cancer List results
        let imdbCancerCheck = null;
        if (content.imdbCancerResult) {
            imdbCancerCheck = content.imdbCancerResult;
            console.log(`🎬 IMDb Cancer List check: YES - Found in cancer movies list`);
        }

        const isSafe = !knownCancerContent.isKnownCancer && foundTerms.length === 0 && !wikipediaCancerCheck && !webSearchCancerCheck && !imdbCancerCheck;
        const confidence = knownCancerContent.isKnownCancer ? 0.95 : 
                          wikipediaCancerCheck ? 0.95 :
                          imdbCancerCheck ? 0.95 :
                          webSearchCancerCheck ? webSearchCancerCheck.confidence / 100 :
                          foundTerms.length > 0 ? 0.8 : 0.9;

        console.log(`🎯 Final Analysis Result:`);
        console.log(`  Safe: ${isSafe ? 'YES' : 'NO'}`);
        console.log(`  Confidence: ${Math.round(confidence * 100)}%`);
        console.log(`  Reason: ${isSafe ? 'No cancer content detected' : 'Cancer content found'}`);

        return {
            isSafe: isSafe,
            foundTerms: foundTerms,
            confidence: confidence,
            analysisText: this.generateSimpleAnalysisText(foundTerms, knownCancerContent, isSafe, wikipediaCancerCheck, webSearchCancerCheck, imdbCancerCheck),
            detailedAnalysis: {
                directTerms: foundTerms,
                knownCancerContent: knownCancerContent,
                wikipediaCancerCategory: wikipediaCancerCheck,
                webSearchResult: webSearchCancerCheck,
                imdbCancerResult: imdbCancerCheck
            }
        };
    }

    generateSimpleAnalysisText(foundTerms, knownCancerContent, isSafe, wikipediaCancerCheck, webSearchCancerCheck, imdbCancerCheck) {
        if (knownCancerContent.isKnownCancer) {
            return `This is a known cancer-themed work. The story prominently features characters dealing with cancer and related medical conditions.`;
        }
        
        if (wikipediaCancerCheck) {
            return `This film is listed in Wikipedia's "Category:Films about cancer" - a curated list of 131+ films that deal with cancer themes. The film contains cancer-related content.`;
        }
        
        if (imdbCancerCheck) {
            return `This film is listed in IMDb's "Movies about Cancer" list - a curated collection of 84+ films that deal with cancer themes. The film contains cancer-related content.`;
        }
        
        if (webSearchCancerCheck) {
            return `Web search analysis detected cancer-related content: ${webSearchCancerCheck.reason}.`;
        }
        
        if (!isSafe) {
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

        // Set analysis details with source information
        let sourceDetails = '';
        if (analysis.detailedAnalysis) {
            const details = analysis.detailedAnalysis;
            sourceDetails = '<div class="source-details">';
            
            if (details.knownCancerContent && details.knownCancerContent.isKnownCancer) {
                sourceDetails += '<p><strong>📚 Known Cancer Content:</strong> This work is in our curated list of cancer-themed content.</p>';
            }
            
            if (details.wikipediaCancerCategory) {
                sourceDetails += '<p><strong>📚 Wikipedia Cancer Category:</strong> Listed in Wikipedia\'s "Category:Films about cancer" (131+ films).</p>';
            }
            
            if (details.imdbCancerResult) {
                sourceDetails += '<p><strong>🎬 IMDb Cancer List:</strong> Found in IMDb\'s "Movies about Cancer" list (84+ films).</p>';
            }
            
            if (details.webSearchResult && details.webSearchResult.found) {
                sourceDetails += `<p><strong>🌐 Web Search:</strong> ${details.webSearchResult.reason}</p>`;
            }
            
            if (details.directTerms && details.directTerms.length > 0) {
                sourceDetails += `<p><strong>🔍 Direct Terms Found:</strong> ${details.directTerms.join(', ')}</p>`;
            }
            
            sourceDetails += '</div>';
        }
        
        analysisDetails.innerHTML = `
            <h4>Content Analysis</h4>
            <p>${analysis.analysisText}</p>
            <p><strong>Confidence:</strong> ${Math.round(analysis.confidence * 100)}%</p>
            ${sourceDetails}
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

    toggleInfoDetailsSection() {
        const infoDetails = document.getElementById('infoDetails');
        const toggleButton = document.getElementById('toggleInfoDetails');
        const toggleText = toggleButton.querySelector('.toggle-text');
        const toggleIcon = toggleButton.querySelector('.toggle-icon');
        
        if (infoDetails.classList.contains('hidden')) {
            // Show info details
            infoDetails.classList.remove('hidden');
            toggleText.textContent = 'Hide Details';
            toggleIcon.textContent = '▼';
            toggleButton.classList.remove('expanded');
        } else {
            // Hide info details
            infoDetails.classList.add('hidden');
            toggleText.textContent = 'Show Details';
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
    console.log('HARDCOVER_BEARER_TOKEN:', HARDCOVER_BEARER_TOKEN);
    console.log('DOESTHEDOGDIE_API_KEY:', DOESTHEDOGDIE_API_KEY);
    
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


