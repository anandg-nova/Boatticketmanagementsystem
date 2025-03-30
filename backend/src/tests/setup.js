require('dotenv').config({ path: '.env.test' });

// Increase timeout for all tests
jest.setTimeout(10000);

// Suppress console logs during tests
console.log = jest.fn();
console.error = jest.fn();
console.warn = jest.fn(); 