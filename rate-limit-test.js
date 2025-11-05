// Rate Limiting Test Script
// Paste this entire block into the browser console on https://dev.laurenslist.org

console.log('🚀 Starting rate limit test (25 requests)...');
console.log('⏱️  Sending requests...');

let successCount = 0;
let rateLimitCount = 0;
let errorCount = 0;

for (let i = 0; i < 25; i++) {
    fetch(`/api/doesthedogdie?q=test${i}`)
        .then(res => {
            // Capture status BEFORE calling res.json()
            const status = res.status;
            
            if (status === 200) {
                successCount++;
                console.log(`✅ Request ${i + 1}: Success (Status: ${status})`);
                return res.json();
            } else if (status === 429) {
                rateLimitCount++;
                console.log(`⛔ Request ${i + 1}: RATE LIMITED! (Status: ${status})`);
                return res.json();
            } else {
                errorCount++;
                console.log(`❌ Request ${i + 1}: Unexpected status ${status}`);
                return res.json();
            }
        })
        .then(data => {
            if (data && data.error) {
                console.log(`   Error message: ${data.error}`);
            }
        })
        .catch(err => {
            errorCount++;
            console.error(`❌ Request ${i + 1}: Error`, err);
        });
}

// Show summary after a few seconds
setTimeout(() => {
    console.log('\n📊 Test Summary:');
    console.log(`✅ Successful requests: ${successCount} (should be 20)`);
    console.log(`⛔ Rate limited requests: ${rateLimitCount} (should be 5)`);
    console.log(`❌ Errors: ${errorCount} (should be 0)`);
    console.log(`\n${rateLimitCount >= 5 ? '✅ Rate limiting is working!' : '⚠️  Rate limiting may not be working correctly'}`);
}, 3000);

