console.log('Testing OTP functionality...');

// Test the get-otp endpoint
async function testOtpEndpoint() {
    try {
        const response = await fetch('http://localhost:3000/api/get-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'test@example.com'
            })
        });
        
        const result = await response.json();
        console.log('GET OTP Response:', result);
        
        // Test sending OTP
        const sendResponse = await fetch('http://localhost:3000/api/send-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'test@example.com'
            })
        });
        
        const sendResult = await sendResponse.json();
        console.log('SEND OTP Response:', sendResult);
        
        // Now check if OTP is stored
        const checkResponse = await fetch('http://localhost:3000/api/get-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'test@example.com'
            })
        });
        
        const checkResult = await checkResponse.json();
        console.log('CHECK OTP Response:', checkResult);
        
    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Only run if this file is executed directly
if (require.main === module) {
    testOtpEndpoint();
}