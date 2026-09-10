/**
 * YATRA - Main Application Controller
 * Handles routing, view transitions, user interactions, modals, and data binding
 */

const YatraApp = (function() {
  // Application State
  const state = {
    currentView: 'home',
    activeCityId: 'patna',
    selectedCategory: 'all',
    selectedRadius: 10,
    searchQuery: '',
    currentItinerary: null,
    savedTrips: [],
    favorites: [],
    plannerForm: {
      cityId: 'patna',
      duration: 'half-day',
      budget: 1000,
      interests: ['history', 'culture', 'food'],
      pace: 'balanced',
      companion: 'solo'
    },
    navSimulationIndex: 0,
    navInterval: null
  };

  /**
   * Initialize Application
   */
  function init() {
    loadSavedState();

    // Default to first curated trip
    state.currentItinerary = YATRA_CURATED_TRIPS[0];

    setupEventListeners();
    setupRouting();
    renderExploreList();

    // Initial view based on URL hash or default to home
    const hash = window.location.hash.replace('#', '') || 'home';
    switchView(hash);
  }

  /**
   * LocalStorage persistence
   */
  function loadSavedState() {
    try {
      const saved = localStorage.getItem('yatra_saved_trips');
      if (saved) state.savedTrips = JSON.parse(saved);

      const favs = localStorage.getItem('yatra_favorites');
      if (favs) state.favorites = JSON.parse(favs);

      const dark = localStorage.getItem('yatra_dark_mode');
      if (dark === 'true') document.body.classList.add('dark');
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }

  function persistSavedTrips() {
    try {
      localStorage.setItem('yatra_saved_trips', JSON.stringify(state.savedTrips));
    } catch (e) {}
  }

  function persistFavorites() {
    try {
      localStorage.setItem('yatra_favorites', JSON.stringify(state.favorites));
    } catch (e) {}
  }

  /**
   * View Routing & Switching
   */
  function setupRouting() {
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '') || 'home';
      switchView(hash);
    });
  }

  function switchView(viewName) {
    state.currentView = viewName;

    // Update active nav links (both desktop and mobile)
    document.querySelectorAll('[data-nav-target]').forEach(link => {
      const target = link.getAttribute('data-nav-target');
      if (target === viewName) {
        link.classList.add('text-primary', 'font-bold', 'bg-surface-low');
        link.classList.remove('text-on-surface-variant');
      } else {
        link.classList.remove('text-primary', 'font-bold', 'bg-surface-low');
        link.classList.add('text-on-surface-variant');
      }
    });

    // Close mobile nav drawer if open
    const mobDrawer = document.getElementById('mobile-nav-drawer');
    const mobIcon = document.getElementById('mobile-menu-icon');
    if (mobDrawer && !mobDrawer.classList.contains('hidden')) {
      mobDrawer.classList.add('hidden');
      if (mobIcon) mobIcon.textContent = 'menu';
    }

    // Update view sections
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.remove('active');
    });

    const targetSection = document.getElementById(`view-${viewName}`);
    if (targetSection) {
      targetSection.classList.add('active');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // View-specific initializations
    if (viewName === 'explore') {
      setTimeout(() => {
        YatraMap.initExploreMap(state.activeCityId);
        renderExploreList();
      }, 100);
    } else if (viewName === 'itinerary') {
      renderItineraryView();
    } else if (viewName === 'mytrips') {
      renderMyTripsView();
    }
  }

  /**
   * Setup Event Listeners
   */
  function setupEventListeners() {
    // City Selector dropdown toggle
    const cityBtn = document.getElementById('city-dropdown-btn');
    const cityMenu = document.getElementById('city-dropdown-menu');
    const cityArrow = document.getElementById('city-dropdown-arrow');
    if (cityBtn && cityMenu) {
      cityBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        cityMenu.classList.toggle('hidden');
        if (cityArrow) cityArrow.classList.toggle('rotate-180');
      });

      document.addEventListener('click', (e) => {
        if (!cityMenu.contains(e.target) && e.target !== cityBtn) {
          cityMenu.classList.add('hidden');
          if (cityArrow) cityArrow.classList.remove('rotate-180');
        }
      });
    }

    // City Switcher dropdown items
    document.querySelectorAll('[data-city-select]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const cityId = btn.getAttribute('data-city-select');
        setCity(cityId);
        if (cityMenu) cityMenu.classList.add('hidden');
        if (cityArrow) cityArrow.classList.remove('rotate-180');
      });
    });

    // Mobile Hamburger Menu toggle
    const mobBtn = document.getElementById('mobile-menu-btn');
    const mobDrawer = document.getElementById('mobile-nav-drawer');
    const mobIcon = document.getElementById('mobile-menu-icon');
    if (mobBtn && mobDrawer) {
      mobBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        mobDrawer.classList.toggle('hidden');
        if (mobIcon) {
          mobIcon.textContent = mobDrawer.classList.contains('hidden') ? 'menu' : 'close';
        }
      });
    }

    // Category pills in Explore view
    document.querySelectorAll('[data-category-pill]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-category-pill]').forEach(b => {
          b.classList.remove('bg-primary', 'text-on-primary', 'shadow-sm');
          b.classList.add('bg-surface-container', 'text-on-surface-variant');
        });
        btn.classList.remove('bg-surface-container', 'text-on-surface-variant');
        btn.classList.add('bg-primary', 'text-on-primary', 'shadow-sm');

        state.selectedCategory = btn.getAttribute('data-category-pill');
        renderExploreList();
        YatraMap.renderExploreMarkers(state.activeCityId, state.selectedCategory, state.selectedRadius);
      });
    });

    // Distance Radius pills
    document.querySelectorAll('[data-radius-pill]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-radius-pill]').forEach(b => {
          b.classList.remove('bg-primary', 'text-on-primary', 'shadow-sm');
          b.classList.add('text-on-surface-variant');
        });
        btn.classList.remove('text-on-surface-variant');
        btn.classList.add('bg-primary', 'text-on-primary', 'shadow-sm');

        state.selectedRadius = parseInt(btn.getAttribute('data-radius-pill'), 10) || 10;
        renderExploreList();
        YatraMap.renderExploreMarkers(state.activeCityId, state.selectedCategory, state.selectedRadius);
      });
    });

    // Explore Search Input
    const searchInput = document.getElementById('explore-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase().trim();
        renderExploreList();
      });
    }

    // Hero Search Form
    const heroBtn = document.getElementById('hero-explore-btn');
    if (heroBtn) {
      heroBtn.addEventListener('click', () => {
        window.location.hash = '#explore';
      });
    }

    const heroPlanBtn = document.getElementById('hero-create-yatra-btn');
    if (heroPlanBtn) {
      heroPlanBtn.addEventListener('click', () => {
        triggerQuickPlan();
      });
    }

    // AI Trip Planner Form Handlers
    setupPlannerInteractions();

    // Dark Mode Toggle
    const darkToggle = document.getElementById('theme-toggle-btn');
    if (darkToggle) {
      darkToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        const isDark = document.body.classList.contains('dark');
        localStorage.setItem('yatra_dark_mode', isDark);
      });
    }
  }

  /**
   * Set Active City
   */
  function setCity(cityId) {
    if (!YATRA_CITIES[cityId]) return;
    state.activeCityId = cityId;
    state.plannerForm.cityId = cityId;

    // Update city name labels across DOM
    const cityName = YATRA_CITIES[cityId].name;
    const stateName = YATRA_CITIES[cityId].state;

    document.querySelectorAll('.active-city-name').forEach(el => {
      el.textContent = `${cityName}, ${stateName}`;
    });

    // Update explore & map
    renderExploreList();
    if (state.currentView === 'explore') {
      YatraMap.initExploreMap(cityId);
    }

    showToast(`Switched city to ${cityName}`);
  }

  /**
   * Render Explore List Places
   */
  function renderExploreList() {
    const listContainer = document.getElementById('explore-places-list');
    if (!listContainer) return;

    let places = YATRA_PLACES.filter(p => p.cityId === state.activeCityId);

    // Filter by category
    if (state.selectedCategory !== 'all') {
      places = places.filter(p => p.category === state.selectedCategory);
    }

    // Filter by search query
    if (state.searchQuery) {
      places = places.filter(p => 
        p.name.toLowerCase().includes(state.searchQuery) ||
        p.description.toLowerCase().includes(state.searchQuery) ||
        p.badge.toLowerCase().includes(state.searchQuery)
      );
    }

    const countIndicator = document.getElementById('explore-count-indicator');
    if (countIndicator) {
      countIndicator.textContent = `${places.length} places found`;
    }

    if (places.length === 0) {
      listContainer.innerHTML = `
        <div class="bg-surface-container-lowest p-8 rounded-xl text-center shadow-sm">
          <span class="material-symbols-outlined text-4xl text-outline mb-2">search_off</span>
          <h3 class="font-bold text-lg text-on-surface">No destinations matched</h3>
          <p class="text-sm text-on-surface-variant mt-1">Try clearing filters or search query.</p>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = places.map((place, idx) => `
      <article 
        id="card-${place.id}"
        onmouseenter="YatraMap.highlightMarker('${place.id}')"
        class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row gap-space-md relative group border border-transparent hover:border-primary/20"
      >
        <div class="relative w-full sm:w-48 h-48 sm:h-auto rounded-lg overflow-hidden shrink-0">
          <img 
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
            src="${place.image}" 
            alt="${place.name}"
            loading="lazy"
          />
          <span class="absolute top-2 left-2 bg-primary text-on-primary font-bold text-xs px-2 py-0.5 rounded shadow">
            #${idx + 1} Map Pin
          </span>
          <button 
            onclick="YatraApp.toggleFavorite('${place.id}', event)" 
            class="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-slate-700 hover:text-red-500 transition-colors shadow"
          >
            <span class="material-symbols-outlined text-[18px]">
              ${state.favorites.includes(place.id) ? 'favorite' : 'favorite_border'}
            </span>
          </button>
        </div>

        <div class="flex flex-col flex-1 justify-between min-w-0">
          <div>
            <div class="flex items-start justify-between gap-space-xs">
              <div>
                <span class="inline-block px-2 py-0.5 bg-surface-container text-primary text-xs rounded uppercase tracking-wider font-semibold">
                  ${place.badge}
                </span>
                <h3 class="font-bold text-lg text-on-surface mt-1 truncate">${place.name}</h3>
              </div>
              <div class="flex items-center gap-1 bg-surface-container-low px-2 py-1 rounded text-secondary text-xs font-bold shrink-0">
                <span class="material-symbols-outlined text-[16px] text-amber-500 fill-1">star</span>
                <span class="text-on-surface">${place.rating}</span>
                <span class="text-on-surface-variant font-normal">(${place.reviewsCount})</span>
              </div>
            </div>

            <p class="text-sm text-on-surface-variant line-clamp-2 mt-2 leading-relaxed">
              ${place.description}
            </p>

            <!-- Metadata Metrics Strip -->
            <div class="flex flex-wrap items-center gap-y-1 gap-x-space-md text-on-surface-variant mt-3 text-xs">
              <div class="flex items-center gap-1">
                <span class="material-symbols-outlined text-[16px] text-primary">schedule</span>
                <span>${place.dwellTimeMin}m avg visit</span>
              </div>
              <div class="flex items-center gap-1">
                <span class="material-symbols-outlined text-[16px] text-emerald-600">payments</span>
                <span class="font-semibold text-on-surface">
                  ${place.entryFee === 0 ? 'Free Entry' : '₹' + place.entryFee}
                </span>
              </div>
              <div class="flex items-center gap-1">
                <span class="material-symbols-outlined text-[16px] text-secondary">groups</span>
                <span>${place.crowdToday}</span>
              </div>
            </div>
          </div>

          <!-- Card Actions -->
          <div class="flex items-center justify-between mt-4 pt-3 border-t border-surface-container">
            <span class="text-xs text-on-surface-variant flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              ${place.openStatus.split('(')[0]}
            </span>
            <div class="flex items-center gap-2">
              <button 
                onclick="YatraApp.openPlaceModal('${place.id}')" 
                class="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high text-xs font-semibold transition-colors"
              >
                Place Details
              </button>
              <button 
                onclick="YatraApp.addPlaceToItinerary('${place.id}')" 
                class="px-3 py-1.5 rounded-lg bg-primary text-on-primary hover:bg-primary-hover text-xs font-semibold flex items-center gap-1 shadow-sm transition-all active:scale-95"
              >
                <span class="material-symbols-outlined text-[15px]">add_circle</span>
                <span>Add to Yatra</span>
              </button>
            </div>
          </div>
        </div>
      </article>
    `).join('');
  }

  function highlightPlaceCard(placeId) {
    document.querySelectorAll('#explore-places-list article').forEach(el => {
      el.classList.remove('ring-2', 'ring-primary');
    });
    const card = document.getElementById(`card-${placeId}`);
    if (card) {
      card.classList.add('ring-2', 'ring-primary');
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  /**
   * Setup Planner Interactions
   */
  function setupPlannerInteractions() {
    // Duration selection
    document.querySelectorAll('[data-planner-duration]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-planner-duration]').forEach(b => {
          b.classList.remove('bg-primary', 'text-on-primary', 'shadow-sm', 'border-primary');
          b.classList.add('bg-surface-container-lowest', 'text-on-surface');
        });
        btn.classList.remove('bg-surface-container-lowest', 'text-on-surface');
        btn.classList.add('bg-primary', 'text-on-primary', 'shadow-sm', 'border-primary');
        state.plannerForm.duration = btn.getAttribute('data-planner-duration');
      });
    });

    // Budget slider
    const budgetSlider = document.getElementById('planner-budget-slider');
    const budgetDisplay = document.getElementById('planner-budget-display');
    if (budgetSlider && budgetDisplay) {
      budgetSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        state.plannerForm.budget = val;
        budgetDisplay.textContent = `₹${val.toLocaleString()}`;
      });
    }

    // Interests chips (multi-select)
    document.querySelectorAll('[data-planner-interest]').forEach(btn => {
      btn.addEventListener('click', () => {
        const interest = btn.getAttribute('data-planner-interest');
        if (state.plannerForm.interests.includes(interest)) {
          if (state.plannerForm.interests.length > 1) {
            state.plannerForm.interests = state.plannerForm.interests.filter(i => i !== interest);
            btn.classList.remove('bg-primary', 'text-on-primary', 'shadow-sm');
            btn.classList.add('bg-surface-container-lowest', 'text-on-surface');
          }
        } else {
          state.plannerForm.interests.push(interest);
          btn.classList.remove('bg-surface-container-lowest', 'text-on-surface');
          btn.classList.add('bg-primary', 'text-on-primary', 'shadow-sm');
        }
      });
    });

    // Companion selection
    document.querySelectorAll('[data-planner-companion]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-planner-companion]').forEach(b => {
          b.classList.remove('bg-primary', 'text-on-primary', 'shadow-sm');
          b.classList.add('bg-surface-container-lowest', 'text-on-surface');
        });
        btn.classList.remove('bg-surface-container-lowest', 'text-on-surface');
        btn.classList.add('bg-primary', 'text-on-primary', 'shadow-sm');
        state.plannerForm.companion = btn.getAttribute('data-planner-companion');
      });
    });

    // Submit Plan Button
    const generateBtn = document.getElementById('planner-submit-btn');
    if (generateBtn) {
      generateBtn.addEventListener('click', () => {
        generateTripFromForm();
      });
    }
  }

  function triggerQuickPlan() {
    // Gather quick inputs from hero
    const cityInput = document.getElementById('hero-dest-input');
    if (cityInput && cityInput.value.toLowerCase().includes('varanasi')) {
      state.plannerForm.cityId = 'varanasi';
    } else if (cityInput && cityInput.value.toLowerCase().includes('jaipur')) {
      state.plannerForm.cityId = 'jaipur';
    } else if (cityInput && cityInput.value.toLowerCase().includes('delhi')) {
      state.plannerForm.cityId = 'delhi';
    } else {
      state.plannerForm.cityId = state.activeCityId || 'patna';
    }

    generateTripFromForm();
  }

  function generateTripFromForm() {
    // Show spinner toast
    showToast('AI Route Engine calculating zero-backtrack corridor...');

    setTimeout(() => {
      const newTrip = YatraPlanner.generateItinerary(state.plannerForm);
      state.currentItinerary = newTrip;
      window.location.hash = '#itinerary';
      showToast('Optimal Yatra Generated! 100% Zero-Backtrack.');
    }, 600);
  }

  /**
   * Render Recommended Itinerary View
   */
  function renderItineraryView() {
    const trip = state.currentItinerary || YATRA_CURATED_TRIPS[0];
    if (!trip) return;

    // Set Header metrics
    document.getElementById('itinerary-title').textContent = trip.title;
    document.getElementById('itinerary-subtitle').textContent = trip.subtitle;
    document.getElementById('metric-duration').textContent = trip.duration;
    document.getElementById('metric-spend').textContent = `₹${trip.estimatedCost}`;
    document.getElementById('metric-spend-max').textContent = `of ₹${trip.maxBudget} budget`;
    document.getElementById('metric-distance').textContent = `${trip.distanceKm} km`;

    // Render Timeline Stops
    const timelineContainer = document.getElementById('itinerary-timeline-stops');
    if (!timelineContainer) return;

    timelineContainer.innerHTML = trip.stops.map((stop, idx) => {
      const place = typeof stop.placeId === 'string'
        ? YATRA_PLACES.find(p => p.id === stop.placeId) || stop.place
        : stop.place;

      if (!place) return '';

      const isLast = idx === trip.stops.length - 1;

      return `
        <div class="relative pl-14 pb-8 group">
          <!-- Numbered Waypoint Node -->
          <div class="absolute left-0 top-1 w-9 h-9 rounded-full bg-primary text-white font-bold flex items-center justify-center shadow-md z-10">
            ${idx + 1}
          </div>

          <!-- Stop Card -->
          <div class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all">
            <div class="flex flex-col md:flex-row gap-space-md">
              <div class="w-full md:w-44 h-36 rounded-lg overflow-hidden shrink-0 relative">
                <img src="${place.image}" alt="${place.name}" class="w-full h-full object-cover">
                <span class="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-white text-[11px] px-2 py-0.5 rounded">
                  ${stop.dwell}
                </span>
              </div>

              <div class="flex-1 flex flex-col justify-between">
                <div>
                  <div class="flex items-start justify-between gap-2">
                    <div>
                      <span class="text-xs font-bold text-primary uppercase tracking-wider">${place.badge}</span>
                      <h4 class="font-bold text-lg text-on-surface mt-0.5">${place.name}</h4>
                    </div>
                    <div class="text-right">
                      <span class="text-xs font-bold text-primary px-2.5 py-1 bg-surface-container rounded-full">
                        Arrive ${stop.arrival}
                      </span>
                    </div>
                  </div>

                  <p class="text-xs text-on-surface-variant mt-2 line-clamp-2">${place.description}</p>
                  
                  <div class="mt-2 text-xs text-secondary font-medium flex items-center gap-1">
                    <span class="material-symbols-outlined text-[15px]">tips_and_updates</span>
                    <span>${place.localFoodTip}</span>
                  </div>
                </div>

                <div class="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span class="text-on-surface-variant">
                    Entry: <strong>${place.entryFee === 0 ? 'Free' : '₹' + place.entryFee}</strong>
                  </span>
                  <div class="flex items-center gap-2">
                    <button onclick="YatraApp.openPlaceModal('${place.id}')" class="px-2.5 py-1 text-primary hover:underline font-semibold">
                      Details
                    </button>
                    <button onclick="YatraApp.swapStop(${idx})" class="px-2.5 py-1 bg-surface-container rounded hover:bg-surface-container-high text-on-surface font-medium flex items-center gap-1">
                      <span class="material-symbols-outlined text-[14px]">swap_vert</span> Swap
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Inter-stop transit badge -->
          ${!isLast ? `
            <div class="mt-3 ml-2 flex items-center gap-2 text-xs font-semibold text-primary">
              <span class="material-symbols-outlined text-[16px]">navigation</span>
              <span class="bg-primary-fixed/60 text-on-primary-fixed px-2.5 py-0.5 rounded-full">
                ${stop.transitNext}
              </span>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    // Update map with route
    setTimeout(() => {
      YatraMap.renderItineraryMap(trip.stops);
    }, 150);
  }

  /**
   * Save current trip
   */
  function saveCurrentTrip() {
    if (!state.currentItinerary) return;
    const exists = state.savedTrips.some(t => t.id === state.currentItinerary.id);
    if (!exists) {
      state.savedTrips.push(state.currentItinerary);
      persistSavedTrips();
      showToast('Yatra saved to My Trips!');
    } else {
      showToast('Trip is already saved in your library.');
    }
  }

  /**
   * Render My Trips View
   */
  function renderMyTripsView() {
    const container = document.getElementById('my-trips-list');
    if (!container) return;

    if (state.savedTrips.length === 0) {
      container.innerHTML = `
        <div class="col-span-full bg-surface-container-lowest p-12 rounded-2xl text-center shadow-sm">
          <span class="material-symbols-outlined text-5xl text-outline mb-3">luggage</span>
          <h3 class="font-bold text-xl text-on-surface">No Saved Yatras Yet</h3>
          <p class="text-sm text-on-surface-variant mt-1 max-w-md mx-auto">
            Explore places or create custom AI itineraries and tap "Save Trip" to access them offline anytime.
          </p>
          <a href="#planner" class="inline-flex items-center gap-2 mt-4 px-6 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover shadow-sm">
            <span>Create First Yatra</span>
            <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
          </a>
        </div>
      `;
      return;
    }

    container.innerHTML = state.savedTrips.map(trip => `
      <div class="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-slate-100 dark:border-slate-800 flex flex-col">
        <div class="h-44 w-full relative">
          <img src="${trip.image}" alt="${trip.title}" class="w-full h-full object-cover">
          <span class="absolute top-3 left-3 bg-primary text-white text-xs font-bold px-2.5 py-1 rounded shadow">
            ${trip.duration}
          </span>
          <button onclick="YatraApp.deleteSavedTrip('${trip.id}')" class="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 text-red-600 flex items-center justify-center hover:bg-red-50 shadow">
            <span class="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
        <div class="p-4 flex-1 flex flex-col justify-between">
          <div>
            <h4 class="font-bold text-lg text-on-surface">${trip.title}</h4>
            <p class="text-xs text-on-surface-variant mt-1">${trip.subtitle}</p>
            <div class="flex items-center gap-3 mt-3 text-xs text-on-surface-variant">
              <span><strong>${trip.stopsCount}</strong> stops</span>
              <span>•</span>
              <span><strong>₹${trip.estimatedCost}</strong> total spend</span>
              <span>•</span>
              <span><strong>${trip.distanceKm}</strong> km</span>
            </div>
          </div>
          <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button onclick="YatraApp.loadSavedTrip('${trip.id}')" class="px-4 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-hover transition-colors">
              Open Itinerary
            </button>
            <span class="text-[11px] text-secondary font-bold">${trip.efficiencyScore}</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  function loadSavedTrip(tripId) {
    const trip = state.savedTrips.find(t => t.id === tripId);
    if (trip) {
      state.currentItinerary = trip;
      window.location.hash = '#itinerary';
    }
  }

  function deleteSavedTrip(tripId) {
    state.savedTrips = state.savedTrips.filter(t => t.id !== tripId);
    persistSavedTrips();
    renderMyTripsView();
    showToast('Trip removed from library');
  }

  /**
   * Place Detail Modal
   */
  function openPlaceModal(placeId) {
    const place = YATRA_PLACES.find(p => p.id === placeId);
    if (!place) return;

    const modal = document.getElementById('place-detail-modal');
    if (!modal) return;

    document.getElementById('modal-place-title').textContent = place.name;
    document.getElementById('modal-place-badge').textContent = place.badge;
    document.getElementById('modal-place-image').src = place.image;
    document.getElementById('modal-place-rating').textContent = place.rating;
    document.getElementById('modal-place-reviews').textContent = `(${place.reviewsCount} reviews)`;
    document.getElementById('modal-place-desc').textContent = place.description;
    document.getElementById('modal-place-address').textContent = place.address;
    document.getElementById('modal-place-hours').textContent = place.openStatus;
    document.getElementById('modal-place-fee').textContent = place.entryFee === 0 ? 'Free Entry' : `₹${place.entryFee} per ticket`;
    document.getElementById('modal-place-food').textContent = place.localFoodTip;
    document.getElementById('modal-place-transit').textContent = place.recommendedTransit;

    // Highlights
    const hlContainer = document.getElementById('modal-place-highlights');
    if (hlContainer) {
      hlContainer.innerHTML = place.highlights.map(h => `
        <li class="flex items-center gap-2 text-xs text-on-surface">
          <span class="material-symbols-outlined text-primary text-[16px]">check_circle</span>
          <span>${h}</span>
        </li>
      `).join('');
    }

    // Crowd graph
    const crowdContainer = document.getElementById('modal-place-crowd-bars');
    if (crowdContainer && place.crowdByHour) {
      crowdContainer.innerHTML = place.crowdByHour.map((pct, idx) => `
        <div class="crowd-col ${idx === 4 ? 'active' : ''}" style="height: ${Math.max(10, pct)}%;" title="${8 + idx}:00 - ${pct}% crowd"></div>
      `).join('');
    }

    // Modal action button
    const addBtn = document.getElementById('modal-add-to-trip-btn');
    if (addBtn) {
      addBtn.onclick = () => {
        addPlaceToItinerary(place.id);
        closePlaceModal();
      };
    }

    modal.classList.add('open');
  }

  function closePlaceModal() {
    const modal = document.getElementById('place-detail-modal');
    if (modal) modal.classList.remove('open');
  }

  function addPlaceToItinerary(placeId) {
    const place = YATRA_PLACES.find(p => p.id === placeId);
    if (!place) return;

    if (!state.currentItinerary) {
      state.currentItinerary = YATRA_CURATED_TRIPS[0];
    }

    const exists = state.currentItinerary.stops.some(s => s.placeId === placeId);
    if (exists) {
      showToast(`${place.name} is already in your itinerary!`);
      return;
    }

    state.currentItinerary.stops.push({
      placeId: place.id,
      place: place,
      arrival: "02:30 PM",
      dwell: `${place.dwellTimeMin}m`,
      transitNext: "Tour Concludes"
    });

    state.currentItinerary.stopsCount = state.currentItinerary.stops.length;
    showToast(`Added ${place.name} to your Yatra!`);
  }

  function toggleFavorite(placeId, event) {
    if (event) event.stopPropagation();
    const idx = state.favorites.indexOf(placeId);
    if (idx > -1) {
      state.favorites.splice(idx, 1);
      showToast('Removed from saved places');
    } else {
      state.favorites.push(placeId);
      showToast('Added to saved places');
    }
    persistFavorites();
    renderExploreList();
  }

  /**
   * Turn-by-Turn Navigation Simulator
   */
  function startNavigationSimulation() {
    const trip = state.currentItinerary || YATRA_CURATED_TRIPS[0];
    if (!trip || !trip.stops || trip.stops.length === 0) return;

    const modal = document.getElementById('nav-simulator-modal');
    if (!modal) return;

    modal.classList.add('open');
    state.navSimulationIndex = 0;

    updateNavStepDisplay();

    // Auto advance simulator
    if (state.navInterval) clearInterval(state.navInterval);
    state.navInterval = setInterval(() => {
      state.navSimulationIndex = (state.navSimulationIndex + 1) % trip.stops.length;
      updateNavStepDisplay();
    }, 4500);
  }

  function updateNavStepDisplay() {
    const trip = state.currentItinerary || YATRA_CURATED_TRIPS[0];
    const currentStop = trip.stops[state.navSimulationIndex];
    const place = typeof currentStop.placeId === 'string'
      ? YATRA_PLACES.find(p => p.id === currentStop.placeId) || currentStop.place
      : currentStop.place;

    if (!place) return;

    document.getElementById('nav-current-place').textContent = place.name;
    document.getElementById('nav-step-number').textContent = `Stop ${state.navSimulationIndex + 1} of ${trip.stops.length}`;
    document.getElementById('nav-instruction').textContent = state.navSimulationIndex === 0
      ? `Depart starting location towards ${place.name}`
      : `Continue straight on main corridor towards ${place.name}`;
    document.getElementById('nav-eta').textContent = `ETA: ${currentStop.arrival}`;
    document.getElementById('nav-dist-remaining').textContent = `${(1.2 - state.navSimulationIndex * 0.3).toFixed(1)} km away`;
  }

  function closeNavSimulation() {
    const modal = document.getElementById('nav-simulator-modal');
    if (modal) modal.classList.remove('open');
    if (state.navInterval) clearInterval(state.navInterval);
  }

  /**
   * Share Modal
   */
  function openShareModal() {
    const modal = document.getElementById('share-modal');
    if (modal) modal.classList.add('open');
  }

  function closeShareModal() {
    const modal = document.getElementById('share-modal');
    if (modal) modal.classList.remove('open');
  }

  function copyShareLink() {
    navigator.clipboard?.writeText(window.location.href);
    showToast('Share link copied to clipboard!');
  }

  /**
   * Auth / Profile Modal
   */
  function openAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.add('open');
  }

  function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.remove('open');
  }

  /**
   * Toast notification system
   */
  function showToast(message) {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove('translate-y-20', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');

    setTimeout(() => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('translate-y-20', 'opacity-0');
    }, 3200);
  }

  function swapStop(idx) {
    if (!state.currentItinerary || !state.currentItinerary.stops) return;
    const stops = state.currentItinerary.stops;
    if (idx < stops.length - 1) {
      const temp = stops[idx];
      stops[idx] = stops[idx + 1];
      stops[idx + 1] = temp;
      renderItineraryView();
      showToast('Stops reordered and route updated!');
    }
  }

  return {
    init,
    setCity,
    switchView,
    renderExploreList,
    highlightPlaceCard,
    openPlaceModal,
    closePlaceModal,
    openAuthModal,
    closeAuthModal,
    addPlaceToItinerary,
    toggleFavorite,
    startNavigationSimulation,
    closeNavSimulation,
    openShareModal,
    closeShareModal,
    copyShareLink,
    saveCurrentTrip,
    deleteSavedTrip,
    loadSavedTrip,
    swapStop,
    showToast
  };
})();

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', YatraApp.init);
