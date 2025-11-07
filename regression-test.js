const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Load the cancer terms from script.js (matching the website exactly)
const CANCER_TERMS = [
    // Cancer-specific terms
    'cancer', 'tumor', 'tumour', 'malignancy', 'carcinoma', 'sarcoma', 'leukemia', 'leukaemia',
    'lymphoma', 'melanoma', 'metastasis', 'chemotherapy', 'radiation', 'oncology', 'oncologist',
    'biopsy', 'malignant', 'benign', 'cancer treatment', 'cancer patient', 'cancer survivor',
    'breast cancer', 'lung cancer', 'prostate cancer', 'colon cancer', 'pancreatic cancer',
    'brain tumor', 'brain tumour', 'cancer diagnosis', 'cancer prognosis', 'cancer remission',
    'thyroid cancer', 'ovarian cancer', 'cervical cancer', 'bone cancer', 'blood cancer',
    'pediatric oncology', 'oncology unit', 'cancer unit', 'cancer ward', 'oncology ward',
    'oncology department', 'cancer center', 'oncology center',
    
    // Terminal illness terms (broader context)
    'terminal illness', 'terminal disease', 'terminal condition', 'terminal diagnosis',
    'end stage', 'end-stage', 'advanced stage', 'late stage', 'final stage',
    'life expectancy', 'prognosis', 'months to live', 'weeks to live', 'days to live',
    'incurable', 'untreatable',
    'hospice care', 'end of life', 'final days', 'last days', 'deathbed',
    'chronic illness', 'serious illness', 'life-threatening', 'critical condition',
    'medical crisis', 'health crisis', 'declining health', 'failing health',
    'deteriorating condition', 'worsening condition', 'progressive disease',
    'degenerative disease', 'fatal disease', 'lethal disease', 'deadly disease',
    // Keep 'hospice', 'palliative' but require additional context
    // Note: Removed standalone 'terminal' to avoid false positives (e.g., "terminally itchy")
    // Keep 'terminal illness', 'terminal disease', 'terminal cancer', etc.
    'hospice', 'palliative',
    
    // Enhanced Semantic Analysis: Implied cancer phrases
    'battles illness', 'fighting illness', 'struggles with illness', 'deals with illness',
    'battles disease', 'fighting disease', 'struggles with disease', 'deals with disease',
    'terminal diagnosis', 'terminal condition', 'terminal situation',
    'medical condition', 'serious condition', 'life-threatening condition',
    'life-threatening disease', 'life-threatening illness',
    'diagnosed with', 'diagnosis of',
    'fights cancer', 'battles cancer', 'struggles with cancer', 'deals with cancer',
    'medical treatment', 'undergoes treatment', 'receives treatment',
    'hospital stay', 'hospitalization', 'hospitalized',
    'sick with', 'illness strikes', 'disease affects',
    'coping with illness', 'coping with disease', 'living with illness', 'living with disease',
    'illness story', 'disease story', 'medical drama', 'illness drama',
    'health struggles', 'medical struggles', 'health battle', 'medical battle'
];

const CANCER_SPECIFIC_TERMS = [
    'cancer', 'tumor', 'tumour', 'malignancy', 'carcinoma', 'sarcoma', 'leukemia', 'leukaemia',
    'lymphoma', 'melanoma', 'metastasis', 'chemotherapy', 'radiation', 'oncology', 'oncologist',
    'biopsy', 'malignant', 'benign', 'cancer treatment', 'cancer patient', 'cancer survivor',
    'breast cancer', 'lung cancer', 'prostate cancer', 'colon cancer', 'pancreatic cancer',
    'brain tumor', 'brain tumour', 'cancer diagnosis', 'cancer prognosis', 'cancer remission'
];

// Known cancer-themed content (matching script.js exactly)
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
        'all the colors of the dark', 'all the colours of the dark', 'chris whitaker',
        'my oxford year'
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
        'viejas amigas', 'ways to live forever', 'we are family', 'white lie',
        'miss you already', 'me and earl and the dying girl', 'lullaby',
        'cool kids don\'t cry', 'sickos', 'wish list', 'mood indigo',
        'safe haven', 'now is good', 'stuck in love', 'love is all you need',
        'falling overnight', 'after fall winter', 'natural selection',
        'a little bit of heaven', 'one day', 'the heart of christmas',
        'restless', 'endings'
    ]
};

// Test results storage
const testResults = {
    movies: {
        total: 0,
        passed: 0,
        failed: 0,
        failures: []
    },
    books: {
        total: 0,
        passed: 0,
        failed: 0,
        failures: []
    }
};

// Load API keys from environment or use defaults
const TMDB_API_KEY = process.env.TMDB_API_KEY || '58223110ff42b7ab06b12b3460897091';
const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY || 'AIzaSyA364ogCHimNNjIbbCKv7Tnsxx6eQ35IKw';
const DOESTHEDOGDIE_API_KEY = process.env.DOESTHEDOGDIE_API_KEY || 'fb1ce9d557e74a9544cf0385263efa30';

// IMDb list of movies about cancer
const IMDB_MOVIES = [
    'Miss You Already',
    'Me and Earl and the Dying Girl',
    'The Fault in Our Stars',
    'Lullaby',
    'Cool Kids Don\'t Cry',
    'Sickos',
    'Wish List',
    'Mood Indigo',
    'Safe Haven',
    'The Girl with Nine Wigs',
    'Now Is Good',
    'Stuck in Love.',
    'Love Is All You Need',
    'Falling Overnight',
    'After Fall, Winter',
    'Natural Selection',
    'A Little Bit of Heaven',
    '50/50',
    'One Day',
    'The Heart of Christmas',
    'Restless',
    'Endings',
    'Norman'
];

// Goodreads list of books about cancer
// Based on: https://www.goodreads.com/list/show/11599.Fictional_Books_on_Cancer
const GOODREADS_BOOKS = [
    'The Fault in Our Stars',
    'Me Before You',
    'My Sister\'s Keeper',
    'A Walk to Remember',
    'The Last Song',
    'My Oxford Year',
    'The Time Traveler\'s Wife',
    'The Notebook',
    'Five Feet Apart',
    'Everything, Everything',
    'Before I Fall',
    'If I Stay',
    'The Book Thief',
    'The Lovely Bones',
    'The Help',
    'Water for Elephants',
    'The Kite Runner',
    'A Thousand Splendid Suns',
    'The Glass Castle',
    'Educated'
];

/**
 * Check if title is in known cancer content database
 */
function checkKnownCancerContent(title, type) {
    const normalizedTitle = title.toLowerCase().trim();
    const contentList = type === 'book' ? CANCER_THEMED_CONTENT.books : CANCER_THEMED_CONTENT.movies;
    const cleanTitle = normalizedTitle.replace(/^(summary of|book:|the book:)/i, '').trim();
    
    // Normalize titles by removing punctuation for better matching
    const normalizeForMatching = (str) => str.replace(/[.,!?;:'"]/g, '').replace(/\s+/g, ' ').trim();
    const normalizedTitleClean = normalizeForMatching(normalizedTitle);
    const cleanTitleClean = normalizeForMatching(cleanTitle);
    
    const isKnownCancer = contentList.some(knownTitle => {
        const knownTitleLower = knownTitle.toLowerCase();
        const knownTitleClean = normalizeForMatching(knownTitleLower);
        
        return normalizedTitle.includes(knownTitleLower) || 
               knownTitleLower.includes(normalizedTitle) ||
               cleanTitle.includes(knownTitleLower) ||
               knownTitleLower.includes(cleanTitle) ||
               normalizedTitleClean.includes(knownTitleClean) ||
               knownTitleClean.includes(normalizedTitleClean) ||
               cleanTitleClean.includes(knownTitleClean) ||
               knownTitleClean.includes(cleanTitleClean);
    });
    
    return {
        isKnownCancer: isKnownCancer,
        matchedTitle: isKnownCancer ? contentList.find(knownTitle => {
            const knownTitleLower = knownTitle.toLowerCase();
            const knownTitleClean = normalizeForMatching(knownTitleLower);
            return normalizedTitle.includes(knownTitleLower) || 
                   knownTitleLower.includes(normalizedTitle) ||
                   cleanTitle.includes(knownTitleLower) ||
                   knownTitleLower.includes(cleanTitle) ||
                   normalizedTitleClean.includes(knownTitleClean) ||
                   knownTitleClean.includes(normalizedTitleClean) ||
                   cleanTitleClean.includes(knownTitleClean) ||
                   knownTitleClean.includes(cleanTitleClean);
        }) : null
    };
}

/**
 * Test a movie against Lauren's List (matching website logic exactly)
 */
async function testMovie(title) {
    console.log(`\n🎬 Testing movie: "${title}"`);
    
    try {
        // 1. Check Known Cancer Content Database
        const knownCancerContent = checkKnownCancerContent(title, 'movie');
        if (knownCancerContent.isKnownCancer) {
            console.log(`  ✅ Found in known cancer content database: ${knownCancerContent.matchedTitle}`);
            return {
                found: true,
                safe: false,
                reason: `Found in known cancer content database: ${knownCancerContent.matchedTitle}`,
                foundTerms: [],
                detectionMethod: 'Known Cancer Content Database'
            };
        }
        
        // 2. Check Wikipedia Cancer Category
        const normalizedQuery = title.toLowerCase().trim();
        const isInCancerCategory = CANCER_THEMED_CONTENT.movies.some(movie => 
            normalizedQuery.includes(movie) || movie.includes(normalizedQuery)
        );
        if (isInCancerCategory) {
            console.log(`  ✅ Found in Wikipedia cancer films category`);
            return {
                found: true,
                safe: false,
                reason: 'Found in Wikipedia cancer films category',
                foundTerms: [],
                detectionMethod: 'Wikipedia Cancer Category'
            };
        }
        
        // 3. Check IMDb Cancer List
        try {
            const corsProxy = 'https://corsproxy.io/?';
            const imdbUrl = 'https://www.imdb.com/list/ls004695995/';
            const proxyUrl = corsProxy + encodeURIComponent(imdbUrl);
            const imdbResponse = await fetch(proxyUrl);
            if (imdbResponse.ok) {
                const imdbHtml = await imdbResponse.text();
                const queryLower = title.toLowerCase().trim();
                const imdbHtmlLower = imdbHtml.toLowerCase();
                
                // Check if title appears in the HTML (with better matching)
                // Try exact match first
                if (imdbHtmlLower.includes(queryLower)) {
                    console.log(`  ✅ Found in IMDb Cancer Movies list (exact match)`);
                    return {
                        found: true,
                        safe: false,
                        reason: 'Found in IMDb Cancer Movies list',
                        foundTerms: [],
                        detectionMethod: 'IMDb Cancer List'
                    };
                }
                
                // Try matching without punctuation and with variations
                const normalizedQuery = queryLower.replace(/[.,!?;:'"]/g, '').trim();
                const normalizedHtml = imdbHtmlLower.replace(/[.,!?;:'"]/g, '');
                if (normalizedHtml.includes(normalizedQuery)) {
                    console.log(`  ✅ Found in IMDb Cancer Movies list (normalized match)`);
                    return {
                        found: true,
                        safe: false,
                        reason: 'Found in IMDb Cancer Movies list',
                        foundTerms: [],
                        detectionMethod: 'IMDb Cancer List'
                    };
                }
            }
        } catch (imdbError) {
            console.log(`  ⚠️ IMDb Cancer List check error: ${imdbError.message}`);
        }
        
        // 4. Search TMDB
        const tmdbUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`;
        const tmdbResponse = await fetch(tmdbUrl);
        const tmdbData = await tmdbResponse.json();
        
        if (!tmdbData.results || tmdbData.results.length === 0) {
            console.log(`  ⚠️ Not found in TMDB`);
            return { found: false, safe: null, reason: 'Not found in TMDB' };
        }
        
        const movie = tmdbData.results[0];
        const overview = (movie.overview || '').toLowerCase();
        
        // 5. Search Wikipedia
        const wikiTitle = title.replace(/\s+/g, '_');
        const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${wikiTitle}`;
        let wikiText = '';
        
        try {
            const wikiResponse = await fetch(wikiUrl);
            if (wikiResponse.ok) {
                const wikiData = await wikiResponse.json();
                wikiText = (wikiData.extract || '').toLowerCase();
                
                // Try to get Plot section from HTML
                const htmlUrl = `https://en.wikipedia.org/api/rest_v1/page/html/${wikiTitle}`;
                const htmlResponse = await fetch(htmlUrl);
                if (htmlResponse.ok) {
                    const htmlText = await htmlResponse.text();
                    const plotMatch = htmlText.match(/<h2[^>]*>[\s]*Plot[\s]*<\/h2>[\s\S]*?(?=<h2|$)/i);
                    if (plotMatch) {
                        const plotText = plotMatch[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
                        if (plotText.length > wikiText.length) {
                            wikiText = plotText;
                        }
                    }
                }
            }
        } catch (wikiError) {
            console.log(`  ⚠️ Wikipedia error: ${wikiError.message}`);
        }
        
        // 6. Search DoesTheDogDie (only flag if cancer-specific terms found)
        let dtddCancerCheck = null;
        try {
            const dtddUrl = `https://www.doesthedogdie.com/dddsearch?q=${encodeURIComponent(title)}`;
            const dtddResponse = await fetch(dtddUrl, {
                headers: {
                    'Accept': 'application/json',
                    'X-API-KEY': DOESTHEDOGDIE_API_KEY
                }
            });
            const dtddData = await dtddResponse.json();
            if (dtddData.items && dtddData.items.length > 0) {
                const dtddText = [
                    dtddData.items[0].description || '',
                    dtddData.items[0].contentWarnings || ''
                ].join(' ').toLowerCase();
                
                const dtddCancerTerms = CANCER_SPECIFIC_TERMS.filter(term => dtddText.includes(term.toLowerCase()));
                if (dtddCancerTerms.length > 0) {
                    dtddCancerCheck = true;
                    console.log(`  ✅ DoesTheDogDie: Found cancer-specific terms: ${dtddCancerTerms.join(', ')}`);
                }
            }
        } catch (dtddError) {
            console.log(`  ⚠️ DoesTheDogDie error: ${dtddError.message}`);
        }
        
        // 7. Check for cancer terms in all text
        const allText = `${overview} ${wikiText}`.toLowerCase();
        const foundTerms = CANCER_TERMS.filter(term => allText.includes(term.toLowerCase()));
        
        // Final determination (matching website logic)
        const isSafe = !knownCancerContent.isKnownCancer && foundTerms.length === 0 && !isInCancerCategory && !dtddCancerCheck;
        
        console.log(`  📊 Found ${foundTerms.length} cancer terms: ${foundTerms.join(', ') || 'none'}`);
        console.log(`  ${isSafe ? '❌ INCORRECTLY MARKED AS SAFE' : '✅ CORRECTLY MARKED AS NOT SAFE'}`);
        
        return {
            found: true,
            safe: isSafe,
            reason: foundTerms.length > 0 ? `Found cancer terms: ${foundTerms.join(', ')}` : 
                   dtddCancerCheck ? 'DoesTheDogDie found cancer-specific terms' :
                   'No cancer content detected',
            foundTerms,
            detectionMethod: foundTerms.length > 0 ? 'Cancer Terms' : 
                           dtddCancerCheck ? 'DoesTheDogDie' : 'None'
        };
        
    } catch (error) {
        console.log(`  ❌ Error testing movie: ${error.message}`);
        return { found: false, safe: null, reason: `Error: ${error.message}` };
    }
}

/**
 * Test a book against Lauren's List (matching website logic exactly)
 */
async function testBook(title) {
    console.log(`\n📚 Testing book: "${title}"`);
    
    try {
        // 1. Check Known Cancer Content Database
        const knownCancerContent = checkKnownCancerContent(title, 'book');
        if (knownCancerContent.isKnownCancer) {
            console.log(`  ✅ Found in known cancer content database: ${knownCancerContent.matchedTitle}`);
            return {
                found: true,
                safe: false,
                reason: `Found in known cancer content database: ${knownCancerContent.matchedTitle}`,
                foundTerms: [],
                detectionMethod: 'Known Cancer Content Database'
            };
        }
        
        // 2. Check Trigger Warning Database (for books) - this is important!
        let triggerWarningCheck = null;
        try {
            // The website uses a server-side proxy, but we can fetch directly from the URL
            const twUrl = 'https://triggerwarningdatabase.com/terminal-illnesses/';
            console.log(`  🔍 Checking Trigger Warning Database...`);
            const twResponse = await fetch(twUrl, {
                headers: {
                    'Accept': 'text/html',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            if (twResponse.ok) {
                const twHtml = await twResponse.text();
                const queryLower = title.toLowerCase().trim();
                const twHtmlLower = twHtml.toLowerCase();
                
                // Normalize query for better matching (remove punctuation)
                const normalizeForMatching = (str) => str.replace(/[.,!?;:'"]/g, '').replace(/\s+/g, ' ').trim();
                const queryNormalized = normalizeForMatching(queryLower);
                
                // Check if the title appears in the HTML (with normalized matching)
                if (twHtmlLower.includes(queryLower) || twHtmlLower.includes(queryNormalized)) {
                    // Try to extract book titles from the page
                    // The Trigger Warning Database lists books in format: "**Title** by Author"
                    const bookPattern = new RegExp(`\\*\\*([^*]+)\\*\\*\\s+by\\s+[^\\n]+`, 'gi');
                    const matches = twHtml.match(bookPattern);
                    
                    if (matches) {
                        for (const match of matches) {
                            const titleMatch = match.match(/\*\*([^*]+)\*\*/);
                            if (titleMatch) {
                                const bookTitle = titleMatch[1].trim().toLowerCase();
                                const bookTitleNormalized = normalizeForMatching(bookTitle);
                                
                                // Try multiple matching strategies
                                if (bookTitle === queryLower || 
                                    bookTitle.includes(queryLower) || 
                                    queryLower.includes(bookTitle) ||
                                    bookTitleNormalized === queryNormalized ||
                                    bookTitleNormalized.includes(queryNormalized) ||
                                    queryNormalized.includes(bookTitleNormalized)) {
                                    console.log(`  ✅ Found in Trigger Warning Database: ${titleMatch[1]}`);
                                    triggerWarningCheck = true;
                                    break;
                                }
                            }
                        }
                    } else {
                        // If pattern matching fails, try simple text search
                        // Check if title appears in the HTML (might be in different format)
                        if (twHtmlLower.includes(queryLower) || twHtmlLower.includes(queryNormalized)) {
                            console.log(`  ✅ Found in Trigger Warning Database (text match): ${title}`);
                            triggerWarningCheck = true;
                        }
                    }
                }
            }
        } catch (twError) {
            console.log(`  ⚠️ Trigger Warning Database check error: ${twError.message}`);
        }
        
        if (triggerWarningCheck) {
            return {
                found: true,
                safe: false,
                reason: 'Found in Trigger Warning Database',
                foundTerms: [],
                detectionMethod: 'Trigger Warning Database'
            };
        }
        
        // 3. Search Google Books
        const googleUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(title)}&key=${GOOGLE_BOOKS_API_KEY}`;
        const googleResponse = await fetch(googleUrl);
        const googleData = await googleResponse.json();
        
        if (!googleData.items || googleData.items.length === 0) {
            console.log(`  ⚠️ Not found in Google Books`);
            return { found: false, safe: null, reason: 'Not found in Google Books' };
        }
        
        const book = googleData.items[0].volumeInfo;
        let description = (book.description || '').toLowerCase();
        
        // 4. Search Open Library
        let openLibraryText = '';
        try {
            const olUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(title)}&limit=1`;
            const olResponse = await fetch(olUrl);
            const olData = await olResponse.json();
            if (olData.docs && olData.docs.length > 0) {
                const olBook = olData.docs[0];
                if (olBook.key) {
                    const workUrl = `https://openlibrary.org${olBook.key}.json`;
                    const workResponse = await fetch(workUrl);
                    const workData = await workResponse.json();
                    
                    // Handle description - it might be a string or an object
                    let description = '';
                    if (workData.description) {
                        if (typeof workData.description === 'string') {
                            description = workData.description;
                        } else if (typeof workData.description === 'object' && workData.description.value) {
                            description = workData.description.value;
                        } else if (typeof workData.description === 'object' && Array.isArray(workData.description)) {
                            description = workData.description.join(' ');
                        }
                    }
                    openLibraryText = description.toLowerCase();
                }
            }
        } catch (olError) {
            console.log(`  ⚠️ Open Library error: ${olError.message}`);
        }
        
        // 5. Search Goodreads (via CORS proxy)
        let goodreadsText = '';
        try {
            const corsProxy = 'https://corsproxy.io/?';
            const goodreadsUrl = `https://www.goodreads.com/search?q=${encodeURIComponent(title)}&search_type=books`;
            const proxyUrl = corsProxy + encodeURIComponent(goodreadsUrl);
            const grResponse = await fetch(proxyUrl);
            if (grResponse.ok) {
                const grHtml = await grResponse.text();
                // Look for book page links
                const bookLinkMatch = grHtml.match(/\/book\/show\/\d+[^"']*/);
                if (bookLinkMatch) {
                    const bookPageUrl = `https://www.goodreads.com${bookLinkMatch[0]}`;
                    const bookPageProxyUrl = corsProxy + encodeURIComponent(bookPageUrl);
                    const bookPageResponse = await fetch(bookPageProxyUrl);
                    if (bookPageResponse.ok) {
                        const bookPageHtml = await bookPageResponse.text();
                        
                        // Extract description from book page
                        const descMatch = bookPageHtml.match(/<div[^>]*data-testid="description"[^>]*>([\s\S]*?)<\/div>/i);
                        if (descMatch) {
                            goodreadsText = descMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
                        }
                        
                        // Also extract reviews (important for cancer detection!)
                        // The website extracts reviews and includes them in analysis
                        const reviewSelectors = [
                            '[data-testid="review-text"]',
                            '[data-testid="reviewText"]',
                            '[data-testid="review"]',
                            '.ReviewText',
                            '.reviewText',
                            '.review-text'
                        ];
                        
                        let reviewsText = '';
                        for (const selector of reviewSelectors) {
                            const reviewRegex = new RegExp(`<[^>]*class="[^"]*${selector.replace(/[\[\]]/g, '\\$&')}[^"]*"[^>]*>([\\s\\S]*?)<\\/[^>]+>`, 'gi');
                            const reviewMatches = bookPageHtml.match(reviewRegex);
                            if (reviewMatches) {
                                reviewsText = reviewMatches.slice(0, 30).map(match => {
                                    const textMatch = match.match(/>([\s\S]*?)</);
                                    return textMatch ? textMatch[1].replace(/<[^>]+>/g, ' ').trim() : '';
                                }).filter(text => text.length > 0).join(' ').toLowerCase();
                                if (reviewsText.length > 0) {
                                    // Limit to first 5000 chars (matching website behavior)
                                    reviewsText = reviewsText.substring(0, 5000);
                                    break;
                                }
                            }
                        }
                        
                        // ALWAYS search the entire page HTML for cancer-related content (including blurred/spoiler text)
                        // This will catch content that Goodreads hides with CSS blur
                        // The website does this to catch cancer mentions in reviews that might be hidden
                        // Limit to first 50,000 chars to avoid performance issues while still catching most content
                        const pageText = bookPageHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase().substring(0, 50000);
                        
                        // Combine description, reviews, and full page text
                        // The website analyzes all of this for cancer terms
                        goodreadsText = (goodreadsText + ' ' + reviewsText + ' ' + pageText).trim();
                    }
                }
            }
        } catch (grError) {
            console.log(`  ⚠️ Goodreads error: ${grError.message}`);
        }
        
        // 6. Search Wikipedia
        const wikiTitle = title.replace(/\s+/g, '_');
        let wikiText = '';
        
        try {
            // First try the summary API
            const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${wikiTitle}`;
            const wikiResponse = await fetch(wikiUrl);
            if (wikiResponse.ok) {
                const wikiData = await wikiResponse.json();
                wikiText = (wikiData.extract || '').toLowerCase();
            }
            
            // Also try to get the full extract (longer content) - matching website behavior
            // The website uses the action API to get full extracts
            const fullExtractUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=false&explaintext=true&exchars=5000&titles=${wikiTitle}&origin=*`;
            try {
                const fullExtractResponse = await fetch(fullExtractUrl);
                if (fullExtractResponse.ok) {
                    const fullExtractData = await fullExtractResponse.json();
                    const pages = fullExtractData.query?.pages;
                    if (pages) {
                        const pageId = Object.keys(pages)[0];
                        const pageData = pages[pageId];
                        if (pageData.extract && pageData.extract.length > wikiText.length) {
                            // Use full extract if it's longer
                            wikiText = pageData.extract.toLowerCase();
                        }
                    }
                }
            } catch (fullExtractError) {
                // If full extract fails, use summary
                console.log(`  ⚠️ Wikipedia full extract error: ${fullExtractError.message}`);
            }
        } catch (wikiError) {
            console.log(`  ⚠️ Wikipedia error: ${wikiError.message}`);
        }
        
        // 7. Check for cancer terms in all text (from all sources)
        const allText = `${description} ${openLibraryText} ${goodreadsText} ${wikiText}`.toLowerCase();
        const foundTerms = CANCER_TERMS.filter(term => allText.includes(term.toLowerCase()));
        
        // Final determination (matching website logic)
        const isSafe = !knownCancerContent.isKnownCancer && foundTerms.length === 0 && !triggerWarningCheck;
        
        console.log(`  📊 Found ${foundTerms.length} cancer terms: ${foundTerms.join(', ') || 'none'}`);
        console.log(`  ${isSafe ? '❌ INCORRECTLY MARKED AS SAFE' : '✅ CORRECTLY MARKED AS NOT SAFE'}`);
        
        return {
            found: true,
            safe: isSafe,
            reason: foundTerms.length > 0 ? `Found cancer terms: ${foundTerms.join(', ')}` : 
                   triggerWarningCheck ? 'Found in Trigger Warning Database' :
                   'No cancer content detected',
            foundTerms,
            detectionMethod: foundTerms.length > 0 ? 'Cancer Terms' : 
                           triggerWarningCheck ? 'Trigger Warning Database' : 'None'
        };
        
    } catch (error) {
        console.log(`  ❌ Error testing book: ${error.message}`);
        return { found: false, safe: null, reason: `Error: ${error.message}` };
    }
}

/**
 * Generate markdown report
 */
function generateReport() {
    const timestamp = new Date().toISOString();
    const report = `# Regression Test Report

**Generated:** ${timestamp}

## Summary

### Movies
- **Total Tested:** ${testResults.movies.total}
- **Correctly Marked as Not Safe:** ${testResults.movies.passed} ✅
- **Incorrectly Marked as Safe:** ${testResults.movies.failed} ❌
- **Success Rate:** ${testResults.movies.total > 0 ? ((testResults.movies.passed / testResults.movies.total) * 100).toFixed(1) : 0}%

### Books
- **Total Tested:** ${testResults.books.total}
- **Correctly Marked as Not Safe:** ${testResults.books.passed} ✅
- **Incorrectly Marked as Safe:** ${testResults.books.failed} ❌
- **Success Rate:** ${testResults.books.total > 0 ? ((testResults.books.passed / testResults.books.total) * 100).toFixed(1) : 0}%

## Failed Tests

### Movies Incorrectly Marked as Safe

${testResults.movies.failures.length > 0 ? testResults.movies.failures.map(f => `- **${f.title}** - ${f.reason}`).join('\n') : '*None* ✅'}

### Books Incorrectly Marked as Safe

${testResults.books.failures.length > 0 ? testResults.books.failures.map(f => `- **${f.title}** - ${f.reason}`).join('\n') : '*None* ✅'}

## Detailed Results

### Movies

${testResults.movies.details ? testResults.movies.details.map(d => `#### ${d.title}
- **Result:** ${d.safe ? '❌ INCORRECTLY MARKED AS SAFE' : '✅ CORRECTLY MARKED AS NOT SAFE'}
- **Reason:** ${d.reason}
- **Detection Method:** ${d.detectionMethod || 'None'}
- **Found Terms:** ${d.foundTerms && d.foundTerms.length > 0 ? d.foundTerms.join(', ') : 'None'}
`).join('\n') : '*No details available*'}

### Books

${testResults.books.details ? testResults.books.details.map(d => `#### ${d.title}
- **Result:** ${d.safe ? '❌ INCORRECTLY MARKED AS SAFE' : '✅ CORRECTLY MARKED AS NOT SAFE'}
- **Reason:** ${d.reason}
- **Detection Method:** ${d.detectionMethod || 'None'}
- **Found Terms:** ${d.foundTerms && d.foundTerms.length > 0 ? d.foundTerms.join(', ') : 'None'}
`).join('\n') : '*No details available*'}

---

*This report was generated by the regression test script.*
`;

    return report;
}

/**
 * Main test runner
 */
async function runTests() {
    console.log('🚀 Starting Regression Tests...\n');
    console.log('='.repeat(60));
    
    // Initialize details arrays
    testResults.movies.details = [];
    testResults.books.details = [];
    
    // Test movies
    console.log('\n📽️  TESTING MOVIES\n');
    console.log('='.repeat(60));
    
    for (const movie of IMDB_MOVIES) {
        testResults.movies.total++;
        const result = await testMovie(movie);
        
        if (result.found) {
            testResults.movies.details.push({
                title: movie,
                safe: result.safe,
                reason: result.reason,
                foundTerms: result.foundTerms || [],
                detectionMethod: result.detectionMethod || 'None'
            });
            
            if (result.safe) {
                // Incorrectly marked as safe
                testResults.movies.failed++;
                testResults.movies.failures.push({
                    title: movie,
                    reason: result.reason
                });
            } else {
                // Correctly marked as not safe
                testResults.movies.passed++;
            }
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Test books
    console.log('\n📚 TESTING BOOKS\n');
    console.log('='.repeat(60));
    
    for (const book of GOODREADS_BOOKS) {
        testResults.books.total++;
        const result = await testBook(book);
        
        if (result.found) {
            testResults.books.details.push({
                title: book,
                safe: result.safe,
                reason: result.reason,
                foundTerms: result.foundTerms || [],
                detectionMethod: result.detectionMethod || 'None'
            });
            
            if (result.safe) {
                // Incorrectly marked as safe
                testResults.books.failed++;
                testResults.books.failures.push({
                    title: book,
                    reason: result.reason
                });
            } else {
                // Correctly marked as not safe
                testResults.books.passed++;
            }
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Generate and save report
    console.log('\n📝 Generating Report...\n');
    const report = generateReport();
    const reportPath = path.join(__dirname, 'REGRESSION_TEST_REPORT.md');
    fs.writeFileSync(reportPath, report);
    
    console.log('='.repeat(60));
    console.log('\n✅ Regression Tests Complete!');
    console.log(`\n📊 Summary:`);
    console.log(`   Movies: ${testResults.movies.passed}/${testResults.movies.total} passed, ${testResults.movies.failed} failed`);
    console.log(`   Books: ${testResults.books.passed}/${testResults.books.total} passed, ${testResults.books.failed} failed`);
    console.log(`\n📄 Report saved to: ${reportPath}\n`);
}

// Run the tests
runTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
});

