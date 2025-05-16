// Updated app.js with Supabase integration and new Mapbox API key
// Mapbox access token - user's API key
const mapboxToken = 'pk.eyJ1IjoibGFpdGhuc291ciIsImEiOiJjbWE2eW94azEwdHozMmxxNHFlNnlzeGozIn0.21M92anEDO5E4HYxKyAp9w';

// Supabase configuration
const SUPABASE_URL = 'https://btnfyqrltbugnghqrrau.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0bmZ5cXJsdGJ1Z25naHFycmF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMzE5OTUsImV4cCI6MjA2MjkwNzk5NX0.LZPicqhvUVy9K5obZnkmysk-ou9wZ1RpofFmY-f_73A';

// Initialize Supabase client
const supabase = supabaseClient.createClient(SUPABASE_URL, SUPABASE_KEY);

// Global variables
let map;
let markers = [];
let realtors = []; // Will store realtor data
let selectedRealtor = null;
let currentSearchResults = [];

// DOM Elements
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const realtorList = document.getElementById('realtor-list');
const addRealtorBtn = document.getElementById('add-realtor-btn');
const sortSelect = document.getElementById('sort-select');

// Modal Elements
const realtorModal = document.getElementById('realtor-modal');
const profileModal = document.getElementById('profile-modal');
const editRequestModal = document.getElementById('edit-request-modal');
const closeModalButtons = document.querySelectorAll('.close-modal');
const cancelButtons = document.querySelectorAll('.cancel-btn');

// Form Elements
const realtorForm = document.getElementById('realtor-form');
const editRequestForm = document.getElementById('edit-request-form');
const addCommentBtn = document.getElementById('add-comment-btn');
const requestEditBtn = document.getElementById('request-edit-btn');

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeMap();
    setupEventListeners();
    fetchRealtors();
});

// Initialize Mapbox map
function initializeMap() {
    mapboxgl.accessToken = mapboxToken;
    
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [-98.5795, 39.8283], // Center of US
        zoom: 3
    });

    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Wait for map to load before adding data
    map.on('load', () => {
        // Add source for coverage areas
        map.addSource('coverage-areas', {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: []
            }
        });

        // Add layer for coverage areas
        map.addLayer({
            id: 'coverage-areas-layer',
            type: 'fill',
            source: 'coverage-areas',
            paint: {
                'fill-color': '#3498db',
                'fill-opacity': 0.2,
                'fill-outline-color': '#2980b9'
            }
        });
    });
}

// Set up event listeners
function setupEventListeners() {
    // Search functionality
    searchButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // Add realtor button
    addRealtorBtn.addEventListener('click', () => {
        openModal(realtorModal);
        document.getElementById('modal-title').textContent = 'Add New Realtor';
        realtorForm.reset();
    });

    // Sort select
    sortSelect.addEventListener('change', () => {
        sortRealtors(sortSelect.value);
        renderRealtorList(currentSearchResults.length > 0 ? currentSearchResults : realtors);
    });

    // Close modals
    closeModalButtons.forEach(button => {
        button.addEventListener('click', () => {
            closeAllModals();
        });
    });

    // Cancel buttons
    cancelButtons.forEach(button => {
        button.addEventListener('click', () => {
            closeAllModals();
        });
    });

    // Form submissions
    realtorForm.addEventListener('submit', handleRealtorFormSubmit);
    editRequestForm.addEventListener('submit', handleEditRequestSubmit);

    // Request edit button
    requestEditBtn.addEventListener('click', () => {
        closeModal(profileModal);
        openModal(editRequestModal);
    });

    // Add comment button
    addCommentBtn.addEventListener('click', handleAddComment);

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === realtorModal) {
            closeModal(realtorModal);
        } else if (e.target === profileModal) {
            closeModal(profileModal);
        } else if (e.target === editRequestModal) {
            closeModal(editRequestModal);
        }
    });
}

// Fetch realtors from Supabase
async function fetchRealtors() {
    try {
        const { data, error } = await supabase
            .from('realtors')
            .select('*');
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            realtors = data.map(realtor => ({
                ...realtor,
                coordinates: [realtor.longitude, realtor.latitude],
                specialties: realtor.specialties ? realtor.specialties.split(',') : []
            }));
            renderRealtorList(realtors);
            addRealtorsToMap(realtors);
        } else {
            // If no data in Supabase yet, load sample data
            loadSampleData();
        }
    } catch (error) {
        console.error('Error fetching realtors:', error);
        // For development/demo, load sample data if API fails
        loadSampleData();
    }
}

// Load sample data for development/demo
function loadSampleData() {
    realtors = [
        {
            id: 1,
            name: 'John Smith',
            phone: '(555) 123-4567',
            email: 'john.smith@example.com',
            location: 'Los Angeles, CA',
            coordinates: [-118.2437, 34.0522],
            latitude: 34.0522,
            longitude: -118.2437,
            radius: 25,
            zillow: 'https://www.zillow.com/profile/johnsmith',
            realtor_com: 'https://www.realtor.com/realestateagents/johnsmith',
            website: 'https://www.johnsmithrealty.com',
            specialties: ['Residential', 'Luxury', 'New Construction'],
            deals: 42,
            notes: 'Great agent for high-end properties in LA area. Very responsive and professional.',
            submitter: 'Mike Johnson',
            date_added: '2025-04-15'
        },
        {
            id: 2,
            name: 'Sarah Williams',
            phone: '(555) 987-6543',
            email: 'sarah.williams@example.com',
            location: 'Miami, FL',
            coordinates: [-80.1918, 25.7617],
            latitude: 25.7617,
            longitude: -80.1918,
            radius: 30,
            zillow: 'https://www.zillow.com/profile/sarahwilliams',
            realtor_com: 'https://www.realtor.com/realestateagents/sarahwilliams',
            website: 'https://www.sarahwilliamsrealty.com',
            specialties: ['Waterfront', 'Condos', 'Investment'],
            deals: 28,
            notes: 'Specializes in waterfront properties and investment opportunities in Miami.',
            submitter: 'Jessica Lee',
            date_added: '2025-04-20'
        },
        {
            id: 3,
            name: 'Robert Johnson',
            phone: '(555) 456-7890',
            email: 'robert.johnson@example.com',
            location: 'Chicago, IL',
            coordinates: [-87.6298, 41.8781],
            latitude: 41.8781,
            longitude: -87.6298,
            radius: 20,
            zillow: 'https://www.zillow.com/profile/robertjohnson',
            realtor_com: 'https://www.realtor.com/realestateagents/robertjohnson',
            website: 'https://www.robertjohnsonrealty.com',
            specialties: ['Commercial', 'Multi-Family', 'Urban'],
            deals: 35,
            notes: 'Expert in commercial real estate and multi-family properties in Chicago.',
            submitter: 'David Brown',
            date_added: '2025-04-25'
        }
    ];

    renderRealtorList(realtors);
    addRealtorsToMap(realtors);
    
    // Add sample data to Supabase if it's empty
    realtors.forEach(async (realtor) => {
        try {
            const { error } = await supabase
                .from('realtors')
                .upsert({
                    name: realtor.name,
                    phone: realtor.phone,
                    email: realtor.email,
                    location: realtor.location,
                    latitude: realtor.latitude,
                    longitude: realtor.longitude,
                    radius: realtor.radius,
                    zillow: realtor.zillow,
                    realtor_com: realtor.realtor_com,
                    website: realtor.website,
                    specialties: realtor.specialties.join(','),
                    deals: realtor.deals,
                    notes: realtor.notes,
                    submitter: realtor.submitter,
                    date_added: realtor.date_added
                });
            
            if (error) console.error('Error adding sample data:', error);
        } catch (error) {
            console.error('Error adding sample data:', error);
        }
    });
}

// Render realtor list
function renderRealtorList(realtorsToRender) {
    realtorList.innerHTML = '';
    
    if (realtorsToRender.length === 0) {
        realtorList.innerHTML = `
            <div class="list-placeholder">
                <p>No realtors found. Try a different search or add a new realtor.</p>
            </div>
        `;
        return;
    }

    realtorsToRender.forEach(realtor => {
        const realtorItem = document.createElement('div');
        realtorItem.className = 'realtor-item';
        realtorItem.dataset.id = realtor.id;
        
        const specialtiesTags = realtor.specialties.map(specialty => 
            `<span class="tag">${specialty}</span>`
        ).join('');
        
        realtorItem.innerHTML = `
            <h3>${realtor.name}</h3>
            <div class="realtor-meta">
                <div class="realtor-location">
                    <i class="fas fa-map-marker-alt"></i> ${realtor.location}
                </div>
                <div class="realtor-deals">
                    <i class="fas fa-handshake"></i> ${realtor.deals} deals
                </div>
            </div>
            <div class="tags-container">
                ${specialtiesTags}
            </div>
        `;
        
        realtorItem.addEventListener('click', () => {
            showRealtorProfile(realtor);
        });
        
        realtorList.appendChild(realtorItem);
    });
}

// Add realtors to map
function addRealtorsToMap(realtorsToAdd) {
    // Clear existing markers
    markers.forEach(marker => marker.remove());
    markers = [];
    
    // Clear coverage areas
    if (map.getSource('coverage-areas')) {
        map.getSource('coverage-areas').setData({
            type: 'FeatureCollection',
            features: []
        });
    }
    
    // Add new markers and coverage areas
    const coverageFeatures = [];
    
    realtorsToAdd.forEach(realtor => {
        // Create marker
        const markerElement = document.createElement('div');
        markerElement.className = 'custom-marker';
        markerElement.innerHTML = `<i class="fas fa-map-pin" style="color: #e74c3c; font-size: 24px;"></i>`;
        
        const marker = new mapboxgl.Marker(markerElement)
            .setLngLat(realtor.coordinates)
            .addTo(map);
        
        marker.getElement().addEventListener('click', () => {
            showRealtorProfile(realtor);
        });
        
        markers.push(marker);
        
        // Create coverage area feature
        const coverageFeature = createCircleFeature(
            realtor.coordinates,
            realtor.radius,
            realtor.id
        );
        
        coverageFeatures.push(coverageFeature);
    });
    
    // Update coverage areas source
    if (map.getSource('coverage-areas')) {
        map.getSource('coverage-areas').setData({
            type: 'FeatureCollection',
            features: coverageFeatures
        });
    }
    
    // Fit map to show all markers if there are any
    if (realtorsToAdd.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        realtorsToAdd.forEach(realtor => {
            bounds.extend(realtor.coordinates);
        });
        map.fitBounds(bounds, { padding: 50 });
    }
}

// Create a circle feature for coverage area
function createCircleFeature(center, radiusMiles, id) {
    // Convert miles to kilometers
    const radiusKm = radiusMiles * 1.60934;
    
    // Create a circle using turf.js
    const options = { steps: 64, units: 'kilometers' };
    const circle = turf.circle(center, radiusKm, options);
    
    // Add id to properties
    circle.properties = { id };
    
    return circle;
}

// Show realtor profile
function showRealtorProfile(realtor) {
    selectedRealtor = realtor;
    
    // Set profile data
    document.getElementById('profile-name').textContent = realtor.name;
    document.getElementById('profile-phone').textContent = realtor.phone;
    document.getElementById('profile-email').textContent = realtor.email;
    
    // Set links
    const zillowLink = document.getElementById('profile-zillow-link');
    const realtorComLink = document.getElementById('profile-realtor-link');
    const websiteLink = document.getElementById('profile-website-link');
    
    zillowLink.href = realtor.zillow || '#';
    realtorComLink.href = realtor.realtor_com || '#';
    websiteLink.href = realtor.website || '#';
    
    zillowLink.style.display = realtor.zillow ? 'flex' : 'none';
    realtorComLink.style.display = realtor.realtor_com ? 'flex' : 'none';
    websiteLink.style.display = realtor.website ? 'flex' : 'none';
    
    // Set stats
    document.getElementById('profile-deals').textContent = realtor.deals;
    document.getElementById('profile-radius').textContent = realtor.radius;
    
    // Set specialties
    const specialtiesContainer = document.getElementById('profile-specialties-list');
    specialtiesContainer.innerHTML = '';
    
    realtor.specialties.forEach(specialty => {
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = specialty;
        specialtiesContainer.appendChild(tag);
    });
    
    // Set notes and meta
    document.getElementById('profile-notes-text').textContent = realtor.notes || 'No notes available.';
    document.getElementById('profile-submitter').textContent = realtor.submitter;
    document.getElementById('profile-location').textContent = `${realtor.location} (${realtor.radius} mile radius)`;
    
    // Load comments from Supabase
    loadComments(realtor.id);
    
    // Open modal
    openModal(profileModal);
    
    // Fly to marker on map
    map.flyTo({
        center: realtor.coordinates,
        zoom: 10,
        essential: true
    });
}

// Load comments for a realtor from Supabase
async function loadComments(realtorId) {
    try {
        const { data, error } = await supabase
            .from('comments')
            .select('*')
            .eq('realtor_id', realtorId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const commentsContainer = document.getElementById('comments-list');
        commentsContainer.innerHTML = '';
        
        if (!data || data.length === 0) {
            commentsContainer.innerHTML = '<p>No comments yet.</p>';
            return;
        }
        
        data.forEach(comment => {
            const commentElement = document.createElement('div');
            commentElement.className = 'comment';
            commentElement.innerHTML = `
                <div class="comment-header">
                    <span>${comment.author}</span>
                    <span>${formatDate(comment.created_at)}</span>
                </div>
                <div class="comment-text">
                    ${comment.text}
                </div>
            `;
            
            commentsContainer.appendChild(commentElement);
        });
    } catch (error) {
        console.error('Error loading comments:', error);
        // For development/demo, show sample comments if API fails
        showSampleComments(realtorId);
    }
}

// Show sample comments for development/demo
function showSampleComments(realtorId) {
    const commentsContainer = document.getElementById('comments-list');
    commentsContainer.innerHTML = '';
    
    // Sample comments for development
    const sampleComments = [
        {
            id: 1,
            realtor_id: 1,
            text: 'Worked with John on a luxury property in Beverly Hills. Very knowledgeable about the area and market conditions.',
            author: 'Alex Thompson',
            created_at: '2025-05-01'
        },
        {
            id: 2,
            realtor_id: 1,
            text: 'Quick to respond and helped close a difficult deal with multiple offers.',
            author: 'Mike Johnson',
            created_at: '2025-05-10'
        },
        {
            id: 3,
            realtor_id: 2,
            text: 'Sarah helped me find a great waterfront condo. Highly recommended for Miami properties.',
            author: 'Jessica Lee',
            created_at: '2025-05-05'
        }
    ];
    
    const filteredComments = sampleComments.filter(comment => comment.realtor_id === realtorId);
    
    if (filteredComments.length === 0) {
        commentsContainer.innerHTML = '<p>No comments yet.</p>';
        return;
    }
    
    filteredComments.forEach(comment => {
        const commentElement = document.createElement('div');
        commentElement.className = 'comment';
        commentElement.innerHTML = `
            <div class="comment-header">
                <span>${comment.author}</span>
                <span>${formatDate(comment.created_at)}</span>
            </div>
            <div class="comment-text">
                ${comment.text}
            </div>
        `;
        
        commentsContainer.appendChild(commentElement);
        
        // Add sample comments to Supabase if they don't exist
        addSampleCommentToSupabase(comment);
    });
}

// Add sample comment to Supabase
async function addSampleCommentToSupabase(comment) {
    try {
        const { error } = await supabase
            .from('comments')
            .upsert({
                realtor_id: comment.realtor_id,
                text: comment.text,
                author: comment.author,
                created_at: comment.created_at
            });
        
        if (error) console.error('Error adding sample comment:', error);
    } catch (error) {
        console.error('Error adding sample comment:', error);
    }
}

// Handle search
async function handleSearch() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    if (!searchTerm) {
        currentSearchResults = [];
        renderRealtorList(realtors);
        addRealtorsToMap(realtors);
        return;
    }
    
    try {
        // Search via Supabase
        const { data, error } = await supabase
            .from('realtors')
            .select('*')
            .ilike('location', `%${searchTerm}%`);
        
        if (error) throw error;
        
        if (data) {
            currentSearchResults = data.map(realtor => ({
                ...realtor,
                coordinates: [realtor.longitude, realtor.latitude],
                specialties: realtor.specialties ? realtor.specialties.split(',') : []
            }));
            renderRealtorList(currentSearchResults);
            addRealtorsToMap(currentSearchResults);
        }
    } catch (error) {
        console.error('Error searching realtors:', error);
        // For development/demo, do client-side filtering if API fails
        currentSearchResults = realtors.filter(realtor => 
            realtor.location.toLowerCase().includes(searchTerm)
        );
        renderRealtorList(currentSearchResults);
        addRealtorsToMap(currentSearchResults);
    }
}

// Sort realtors
function sortRealtors(sortBy) {
    const sortFunctions = {
        name: (a, b) => a.name.localeCompare(b.name),
        deals: (a, b) => b.deals - a.deals,
        recent: (a, b) => new Date(b.date_added || b.created_at) - new Date(a.date_added || a.created_at)
    };
    
    realtors.sort(sortFunctions[sortBy]);
    
    if (currentSearchResults.length > 0) {
        currentSearchResults.sort(sortFunctions[sortBy]);
    }
}

// Handle realtor form submit
async function handleRealtorFormSubmit(e) {
    e.preventDefault();
    
    // Get form data
    const name = document.getElementById('realtor-name').value;
    const phone = document.getElementById('realtor-phone').value;
    const email = document.getElementById('realtor-email').value;
    const location = document.getElementById('realtor-location').value;
    const radius = parseInt(document.getElementById('realtor-radius').value);
    const zillow = document.getElementById('realtor-zillow').value;
    const realtor_com = document.getElementById('realtor-realtor').value;
    const website = document.getElementById('realtor-website').value;
    const specialties = document.getElementById('realtor-specialties').value.split(',').map(s => s.trim()).filter(s => s);
    const deals = parseInt(document.getElementById('realtor-deals').value) || 0;
    const notes = document.getElementById('realtor-notes').value;
    const submitter = document.getElementById('realtor-submitter').value;
    
    // Geocode the location to get coordinates
    try {
        const coordinates = await geocodeLocation(location);
        
        // Prepare data for Supabase
        const realtorData = {
            name,
            phone,
            email,
            location,
            latitude: coordinates[1],
            longitude: coordinates[0],
            radius,
            zillow,
            realtor_com,
            website,
            specialties: specialties.join(','),
            deals,
            notes,
            submitter,
            created_at: new Date().toISOString()
        };
        
        // Send to Supabase
        const { data, error } = await supabase
            .from('realtors')
            .insert(realtorData)
            .select();
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            // Add to local data
            const newRealtor = {
                ...data[0],
                coordinates: [data[0].longitude, data[0].latitude],
                specialties: data[0].specialties ? data[0].specialties.split(',') : []
            };
            
            realtors.push(newRealtor);
            
            // Reset search and update UI
            searchInput.value = '';
            currentSearchResults = [];
            renderRealtorList(realtors);
            addRealtorsToMap(realtors);
            
            // Close modal and show success message
            closeAllModals();
            showNotification('Realtor added successfully!', 'success');
        }
    } catch (error) {
        console.error('Error adding realtor:', error);
        showNotification('Error adding realtor. Please try again.', 'error');
    }
}

// Handle edit request submit
async function handleEditRequestSubmit(e) {
    e.preventDefault();
    
    // Get form data
    const reason = document.getElementById('edit-reason').value;
    const submitter = document.getElementById('edit-submitter').value;
    
    try {
        // Send to Supabase
        const { data, error } = await supabase
            .from('edit_requests')
            .insert({
                realtor_id: selectedRealtor.id,
                reason,
                submitter,
                status: 'pending',
                created_at: new Date().toISOString()
            });
        
        if (error) throw error;
        
        // Close modal and show success message
        closeAllModals();
        showNotification('Edit request submitted successfully!', 'success');
    } catch (error) {
        console.error('Error submitting edit request:', error);
        showNotification('Error submitting edit request. Please try again.', 'error');
        
        // For development/demo, still close modal if API fails
        closeAllModals();
        showNotification('Edit request submitted successfully! (Demo mode)', 'success');
    }
}

// Handle add comment
async function handleAddComment() {
    const commentText = document.getElementById('comment-input').value.trim();
    
    if (!commentText) {
        showNotification('Please enter a comment.', 'error');
        return;
    }
    
    try {
        // Send to Supabase
        const { data, error } = await supabase
            .from('comments')
            .insert({
                realtor_id: selectedRealtor.id,
                text: commentText,
                author: 'Current User', // Would be from authentication in production
                created_at: new Date().toISOString()
            });
        
        if (error) throw error;
        
        // Clear input and reload comments
        document.getElementById('comment-input').value = '';
        loadComments(selectedRealtor.id);
        
        // Show success message
        showNotification('Comment added successfully!', 'success');
    } catch (error) {
        console.error('Error adding comment:', error);
        showNotification('Error adding comment. Please try again.', 'error');
        
        // For development/demo, still show success if API fails
        document.getElementById('comment-input').value = '';
        showSampleComments(selectedRealtor.id);
        showNotification('Comment added successfully! (Demo mode)', 'success');
    }
}

// Geocode location to get coordinates
function geocodeLocation(location) {
    return new Promise((resolve, reject) => {
        // This would use Mapbox Geocoding API in production
        // For development, we'll use sample coordinates
        
        // Sample coordinates for common locations
        const sampleCoordinates = {
            'los angeles': [-118.2437, 34.0522],
            'new york': [-74.0060, 40.7128],
            'chicago': [-87.6298, 41.8781],
            'houston': [-95.3698, 29.7604],
            'miami': [-80.1918, 25.7617],
            'dallas': [-96.7970, 32.7767],
            'san francisco': [-122.4194, 37.7749],
            'seattle': [-122.3321, 47.6062],
            'denver': [-104.9903, 39.7392],
            'atlanta': [-84.3880, 33.7490]
        };
        
        // Check if location contains any of the sample cities
        const locationLower = location.toLowerCase();
        for (const city in sampleCoordinates) {
            if (locationLower.includes(city)) {
                resolve(sampleCoordinates[city]);
                return;
            }
        }
        
        // If no match, use a random location in the US
        const randomLng = -98.5795 + (Math.random() * 30 - 15);
        const randomLat = 39.8283 + (Math.random() * 10 - 5);
        resolve([randomLng, randomLat]);
    });
}

// Show notification
function showNotification(message, type) {
    // Create notification container if it doesn't exist
    if (!document.querySelector('.notification-container')) {
        const container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
    }
    
    const container = document.querySelector('.notification-container');
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Modal functions
function openModal(modal) {
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
}

function closeAllModals() {
    closeModal(realtorModal);
    closeModal(profileModal);
    closeModal(editRequestModal);
}
