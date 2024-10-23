import http from 'k6/http';
import { check, sleep } from 'k6';

// Base URL for the API
const BASE_URL = 'https://test-api.k6.io';

export let options = {
    vus: 1,
    duration: '10s',
};

// Function to login and get a token
export function loginK6() {
    const url = `${BASE_URL}/auth/basic/login/`;
    const payload = JSON.stringify({
        username: 'nkjshjkcckjhxewewjfhxkjqehnqlx@example.com',
        password: 'secret'
    });
    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    let response = http.post(url, payload, params);

    // Check for successful login
    check(response, {
        'login successful': (r) => r.status === 200,
    });

    if (response.status === 200) {
        const cookies = response.cookies;
        const token = `sessionid=${cookies.sessionid[0].value}`;
        return token;
    } else {
        console.log(`Login failed. Status: ${response.status}, Body: ${response.body}`);
        return null;
    }
}

// Function to get user data
export function getUserDataK6(token) {
    const url = `${BASE_URL}/my/crocodiles/`;
    const params = {
        headers: {
            'Cookie': token, // Use session cookie token here
        },
    };

    let response = http.get(url, params);

    // Check the response status before parsing JSON
    if (response.status === 200) {
        let users = response.json();
        let totalUsers = users.length;

        console.log(`Total users: ${totalUsers}`);
        
        // Show first and second users
        if (totalUsers >= 2) {
            console.log(`First user: ${JSON.stringify(users[0])}`);
            console.log(`Second user: ${JSON.stringify(users[1])}`);
        }

        // If more than 100 users, delete the first and second user
        if (totalUsers > 100) {
            let userId1 = users[0].id;
            let userId2 = users[1].id;

            console.log(`Deleting first user with ID: ${userId1}`);
            http.del(`${url}${userId1}/`, null, params);

            console.log(`Deleting second user with ID: ${userId2}`);
            http.del(`${url}${userId2}/`, null, params);
        }

        return users;
    } else {
        console.log(`Failed to get user data. Status: ${response.status}, Body: ${response.body}`);
        return [];
    }
}

// Function to create a new user
export function createUserK6(token) {
    const url = `${BASE_URL}/my/crocodiles/`;
    const payload = JSON.stringify({
        name: 'CakoCakoan',
        sex: 'M',
        date_of_birth: '2001-01-01',
    });
    const params = {
        headers: {
            'Cookie': token, // Use session cookie token here
            'Content-Type': 'application/json',
        },
    };

    let response = http.post(url, payload, params);

    // Check the response status before parsing JSON
    if (response.status === 201) {
        let createdUser = response.json();
        console.log(`Created user - Name: ${createdUser.name}, Sex: ${createdUser.sex}, DOB: ${createdUser.date_of_birth}`);
        return createdUser;
    } else {
        console.log(`Failed to create user. Status: ${response.status}, Body: ${response.body}`);
        return null;
    }
}

// Function to get updated user data after creating a new user
export function getUserDataUpdateK6(token, newUser) {
    const url = `${BASE_URL}/my/crocodiles/`;
    const params = {
        headers: {
            'Cookie': token, // Use session cookie token here
        },
    };

    let response = http.get(url, params);

    // Check the response status before parsing JSON
    if (response.status === 200) {
        let users = response.json();

        // Manual loop to check if the newly added user exists
        let userExists = false;
        for (let i = 0; i < users.length; i++) {
            if (users[i].id === newUser.id) {
                userExists = true;
                console.log(`Added user found - Name: ${newUser.name}, ID: ${newUser.id}`);
                break;
            }
        }

        if (!userExists) {
            console.log(`Added user with ID: ${newUser.id} not found.`);
        }

        return users;
    } else {
        console.log(`Failed to retrieve updated users. Status: ${response.status}, Body: ${response.body}`);
        return [];
    }
}

// Function to update a user
export function updateUserK6(token, userId) {
    const url = `${BASE_URL}/my/crocodiles/${userId}/`;
    const payload = JSON.stringify({
        name: 'Cako Update',
        sex: 'F',
        date_of_birth: '2000-01-01',
    });
    const params = {
        headers: {
            'Cookie': token, // Use session cookie token here
            'Content-Type': 'application/json',
        },
    };

    let response = http.put(url, payload, params);

    // Check the response status before parsing JSON
    if (response.status === 200) {
        let updatedUser = response.json();
        console.log(`Updated user - Name: ${updatedUser.name}, Sex: ${updatedUser.sex}, DOB: ${updatedUser.date_of_birth}`);
        return updatedUser;
    } else {
        console.log(`Failed to update user. Status: ${response.status}, Body: ${response.body}`);
        return null;
    }
}

// Main function to execute the script
export default function () {
    let token = loginK6();

    // Ensure the token exists and proceed with further operations
    if (token) {
        console.log("Proceeding with user data retrieval...");

        let users = getUserDataK6(token);
        console.log("Retrieved initial user data.");

        let newUser = createUserK6(token);
        
        if (newUser) {
            console.log("New user created");

            getUserDataUpdateK6(token, newUser);

            console.log("Proceeding to update the user...");
            updateUserK6(token, newUser.id);
        } else {
            console.log("User creation failed, skipping update.");
        }
    } else {
        console.log("Login failed. Script will not proceed further.");
    }


    sleep(1);
}
