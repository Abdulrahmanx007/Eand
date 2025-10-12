/**
 * Interactive Tutorial System for Effortless Desk
 * Provides step-by-step guided tours for new users
 */

class TutorialManager {
    constructor() {
        this.currentTour = null;
        this.currentStep = 0;
        this.overlay = null;
        this.tooltip = null;
        this.isActive = false;
        this.completedTours = this.loadCompletedTours();
        
        // Tutorial definitions
        this.tours = {
            // Welcome Tour (First Visit)
            'welcome': {
                title: '👋 Welcome to Effortless Desk!',
                description: 'Let\'s take a quick tour of your new workspace',
                autoStart: false,
                steps: [
                    {
                        target: '.site-header',
                        title: '🎯 Welcome!',
                        content: 'Welcome to <strong>Effortless Desk v3.3</strong> - Your centralized workspace for maximum productivity! Let me show you around.',
                        position: 'bottom',
                        highlight: true
                    },
                    {
                        target: '.brand-row',
                        title: '✨ Your Workspace Hub',
                        content: 'This is your <strong>Effortless Desk</strong> - a professional workspace designed to make your job easier and faster.',
                        position: 'bottom'
                    },
                    {
                        target: '.site-nav',
                        title: '🚀 Three Powerful Tools',
                        content: 'You have access to <strong>3 main sections</strong>:<br>⚡ Quick Escalator<br>🛠️ Utility Console<br>🔗 Instant Access',
                        position: 'bottom',
                        highlight: true
                    },
                    {
                        target: '#themeToggle',
                        title: '🌙 Theme Switcher',
                        content: 'Switch between <strong>Dark</strong> and <strong>Light</strong> themes for comfortable viewing anytime!',
                        position: 'bottom',
                        action: 'pulse'
                    },
                    {
                        target: '#perfToggle',
                        title: '⚡ Hero Mode',
                        content: 'Toggle <strong>Hero Mode</strong> for enhanced animations and effects, or turn it OFF for faster performance on slower devices.',
                        position: 'bottom',
                        action: 'pulse'
                    },
                    {
                        target: '#ramMonitor',
                        title: '📊 Performance Monitor',
                        content: 'Keep track of estimated <strong>RAM usage</strong> in real-time. Lower is better!',
                        position: 'bottom'
                    }
                ]
            },
            
            // Quick Escalator Tour
            'escalator': {
                title: '⚡ Quick Escalator Guide',
                description: 'Master the escalation workflow',
                steps: [
                    {
                        target: '.app-header',
                        title: '⚡ Quick Escalator',
                        content: 'This tool helps you create <strong>professional escalations</strong> in seconds!',
                        position: 'bottom'
                    },
                    {
                        target: '#issueType',
                        title: '📋 Step 1: Issue Type',
                        content: 'Start by selecting the <strong>type of issue</strong> you\'re escalating.',
                        position: 'right',
                        highlight: true
                    },
                    {
                        target: '#priority',
                        title: '🔥 Step 2: Priority Level',
                        content: 'Choose the <strong>urgency level</strong>. This affects the escalation template.',
                        position: 'right',
                        highlight: true
                    },
                    {
                        target: '#accountNumber',
                        title: '📱 Step 3: Account Details',
                        content: 'Enter the <strong>customer account number</strong> and contact information.',
                        position: 'right',
                        highlight: true
                    },
                    {
                        target: '#description',
                        title: '📝 Step 4: Description',
                        content: 'Describe the issue clearly. The system will help you format it professionally.',
                        position: 'right',
                        highlight: true
                    },
                    {
                        target: '#output',
                        title: '✅ Your Professional Escalation',
                        content: 'Your formatted escalation appears here. Click <strong>"Copy to Clipboard"</strong> and you\'re done!',
                        position: 'top',
                        highlight: true
                    },
                    {
                        target: '.btn-gradient',
                        title: '🚀 Generate Button',
                        content: 'Click this to <strong>generate your escalation</strong> instantly!',
                        position: 'top',
                        action: 'pulse'
                    }
                ]
            },
            
            // Utility Console Tour
            'utilities': {
                title: '🛠️ Utility Console Guide',
                description: 'Explore powerful calculation tools',
                steps: [
                    {
                        target: '.app-header',
                        title: '🛠️ Utility Console',
                        content: 'Your toolkit for <strong>quick calculations</strong> and conversions!',
                        position: 'bottom'
                    },
                    {
                        target: '.tool-card:first-child',
                        title: '💰 VAT Calculator',
                        content: 'Calculate <strong>VAT (5%)</strong> instantly. Just enter the amount!',
                        position: 'bottom',
                        highlight: true
                    },
                    {
                        target: '.tool-card:nth-child(2)',
                        title: '📅 Prorated Calculator',
                        content: 'Calculate <strong>prorated charges</strong> based on days used vs. total days.',
                        position: 'bottom',
                        highlight: true
                    },
                    {
                        target: '.app-footer',
                        title: '💡 Pro Tip',
                        content: 'All calculations are <strong>instant</strong> and don\'t require page reload!',
                        position: 'top'
                    }
                ]
            },
            
            // Instant Access (QuickLinks) Tour
            'quicklinks': {
                title: '🔗 Instant Access Guide',
                description: 'Navigate your resource directory',
                steps: [
                    {
                        target: '.app-header',
                        title: '🔗 Instant Access',
                        content: 'Your <strong>centralized directory</strong> of all essential tools and resources!',
                        position: 'bottom'
                    },
                    {
                        target: '#searchBox',
                        title: '🔍 Smart Search',
                        content: 'Type here to <strong>instantly filter</strong> through all 59+ resources!',
                        position: 'bottom',
                        highlight: true,
                        action: 'pulse'
                    },
                    {
                        target: '.fav-btn:first-of-type',
                        title: '⭐ Favorites System',
                        content: 'Click the <strong>star icon</strong> on any link to save it to your favorites!',
                        position: 'left',
                        highlight: true
                    },
                    {
                        target: '#healthCheckBtn',
                        title: '🏥 Link Health Checker',
                        content: 'Check if all links are <strong>online and responsive</strong>. 🟢 Online, 🟡 Slow, 🔴 Offline',
                        position: 'bottom',
                        highlight: true
                    },
                    {
                        target: '.category-section:first-of-type',
                        title: '📚 Organized Categories',
                        content: 'All resources are organized into <strong>categories</strong> for easy navigation!',
                        position: 'top',
                        highlight: true
                    },
                    {
                        target: '.link-card:first-of-type',
                        title: '🎯 Quick Access Cards',
                        content: 'Click any card to <strong>open the tool</strong> in a new tab. Hover to see full details!',
                        position: 'right'
                    }
                ]
            },
            
            // Features Overview Tour
            'features': {
                title: '✨ Key Features Overview',
                description: 'Discover what makes Effortless Desk powerful',
                steps: [
                    {
                        target: 'body',
                        title: '🚀 Feature Highlights',
                        content: 'Let\'s explore the <strong>key features</strong> that make Effortless Desk amazing!',
                        position: 'center'
                    },
                    {
                        target: '#themeToggle',
                        title: '🎨 Theme Customization',
                        content: '<strong>Dark/Light themes</strong> - Switch anytime for your comfort!',
                        position: 'bottom',
                        highlight: true
                    },
                    {
                        target: '#perfToggle',
                        title: '⚡ Performance Control',
                        content: '<strong>Hero Mode</strong> - Toggle between smooth animations or fast performance!',
                        position: 'bottom',
                        highlight: true
                    },
                    {
                        target: '.app-footer',
                        title: '📱 PWA Ready',
                        content: 'This workspace is a <strong>Progressive Web App</strong> - Install it on your device for offline access!',
                        position: 'top'
                    },
                    {
                        target: 'body',
                        title: '🎉 You\'re All Set!',
                        content: 'You\'re ready to be <strong>effortlessly productive</strong>! Need help? Click the <strong>?</strong> button anytime.',
                        position: 'center'
                    }
                ]
            }
        };
        
        this.init();
    }
    
    init() {
        // Create overlay and tooltip elements
        this.createUI();
        
        // Check if this is first visit
        if (!this.hasSeenWelcome()) {
            // Auto-start welcome tour after 1 second
            setTimeout(() => {
                this.startTour('welcome');
            }, 1000);
        }
    }
    
    createUI() {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'tutorial-overlay';
        this.overlay.style.display = 'none';
        
        // Create tooltip
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'tutorial-tooltip';
        this.tooltip.style.display = 'none';
        
        document.body.appendChild(this.overlay);
        document.body.appendChild(this.tooltip);
        
        // Close on overlay click
        this.overlay.addEventListener('click', () => this.endTour());
    }
    
    startTour(tourId) {
        const tour = this.tours[tourId];
        if (!tour) {
            console.error('Tour not found:', tourId);
            return;
        }
        
        this.currentTour = tourId;
        this.currentStep = 0;
        this.isActive = true;
        
        // Show overlay
        this.overlay.style.display = 'block';
        setTimeout(() => this.overlay.classList.add('active'), 10);
        
        // Show first step
        this.showStep(0);
    }
    
    showStep(stepIndex) {
        const tour = this.tours[this.currentTour];
        const step = tour.steps[stepIndex];
        
        if (!step) {
            this.endTour();
            return;
        }
        
        this.currentStep = stepIndex;
        
        // Find target element
        let targetEl = document.body;
        if (step.target && step.target !== 'body') {
            targetEl = document.querySelector(step.target);
            if (!targetEl) {
                console.warn('Target not found:', step.target);
                targetEl = document.body;
            }
        }
        
        // Highlight target
        this.highlightElement(targetEl, step.highlight);
        
        // Position and show tooltip
        this.positionTooltip(targetEl, step);
        
        // Apply action if specified
        if (step.action === 'pulse') {
            targetEl.classList.add('tutorial-pulse');
        }
    }
    
    highlightElement(element, shouldHighlight) {
        // Remove previous highlights
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });
        
        if (shouldHighlight && element !== document.body) {
            element.classList.add('tutorial-highlight');
            
            // Scroll into view smoothly
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    positionTooltip(targetEl, step) {
        const tour = this.tours[this.currentTour];
        const totalSteps = tour.steps.length;
        
        // Build tooltip content
        const progress = `${this.currentStep + 1}/${totalSteps}`;
        const progressPercent = ((this.currentStep + 1) / totalSteps) * 100;
        
        this.tooltip.innerHTML = `
            <div class="tutorial-header">
                <h3 class="tutorial-title">${step.title}</h3>
                <button class="tutorial-close" onclick="window.tutorialManager.endTour()">✕</button>
            </div>
            <div class="tutorial-content">${step.content}</div>
            <div class="tutorial-progress">
                <div class="tutorial-progress-bar">
                    <div class="tutorial-progress-fill" style="width: ${progressPercent}%"></div>
                </div>
                <span class="tutorial-progress-text">${progress}</span>
            </div>
            <div class="tutorial-controls">
                ${this.currentStep > 0 ? '<button class="tutorial-btn tutorial-btn-secondary" onclick="window.tutorialManager.previousStep()">← Back</button>' : '<button class="tutorial-btn tutorial-btn-secondary" onclick="window.tutorialManager.endTour()">Skip Tour</button>'}
                ${this.currentStep < totalSteps - 1 ? '<button class="tutorial-btn tutorial-btn-primary" onclick="window.tutorialManager.nextStep()">Next →</button>' : '<button class="tutorial-btn tutorial-btn-primary" onclick="window.tutorialManager.completeTour()">Finish! 🎉</button>'}
            </div>
        `;
        
        // Position tooltip
        this.tooltip.style.display = 'block';
        
        if (step.position === 'center' || targetEl === document.body) {
            // Center on screen
            this.tooltip.style.position = 'fixed';
            this.tooltip.style.top = '50%';
            this.tooltip.style.left = '50%';
            this.tooltip.style.transform = 'translate(-50%, -50%)';
        } else {
            // Position relative to target
            const rect = targetEl.getBoundingClientRect();
            const tooltipRect = this.tooltip.getBoundingClientRect();
            
            this.tooltip.style.position = 'fixed';
            
            switch (step.position) {
                case 'top':
                    this.tooltip.style.top = `${rect.top - tooltipRect.height - 20}px`;
                    this.tooltip.style.left = `${rect.left + rect.width / 2}px`;
                    this.tooltip.style.transform = 'translateX(-50%)';
                    break;
                case 'bottom':
                    this.tooltip.style.top = `${rect.bottom + 20}px`;
                    this.tooltip.style.left = `${rect.left + rect.width / 2}px`;
                    this.tooltip.style.transform = 'translateX(-50%)';
                    break;
                case 'left':
                    this.tooltip.style.top = `${rect.top + rect.height / 2}px`;
                    this.tooltip.style.left = `${rect.left - tooltipRect.width - 20}px`;
                    this.tooltip.style.transform = 'translateY(-50%)';
                    break;
                case 'right':
                    this.tooltip.style.top = `${rect.top + rect.height / 2}px`;
                    this.tooltip.style.left = `${rect.right + 20}px`;
                    this.tooltip.style.transform = 'translateY(-50%)';
                    break;
            }
            
            // Ensure tooltip stays in viewport
            this.constrainToViewport();
        }
        
        this.tooltip.classList.add('active');
    }
    
    constrainToViewport() {
        const rect = this.tooltip.getBoundingClientRect();
        const padding = 10;
        
        if (rect.left < padding) {
            this.tooltip.style.left = `${padding}px`;
            this.tooltip.style.transform = 'translateX(0)';
        }
        if (rect.right > window.innerWidth - padding) {
            this.tooltip.style.left = `${window.innerWidth - rect.width - padding}px`;
            this.tooltip.style.transform = 'translateX(0)';
        }
        if (rect.top < padding) {
            this.tooltip.style.top = `${padding}px`;
        }
        if (rect.bottom > window.innerHeight - padding) {
            this.tooltip.style.top = `${window.innerHeight - rect.height - padding}px`;
        }
    }
    
    nextStep() {
        // Remove pulse animation
        document.querySelectorAll('.tutorial-pulse').forEach(el => {
            el.classList.remove('tutorial-pulse');
        });
        
        this.showStep(this.currentStep + 1);
    }
    
    previousStep() {
        if (this.currentStep > 0) {
            this.showStep(this.currentStep - 1);
        }
    }
    
    completeTour() {
        // Mark tour as completed
        this.markTourCompleted(this.currentTour);
        
        // Show completion message
        this.showCompletionMessage();
        
        // End tour after delay
        setTimeout(() => this.endTour(), 2000);
    }
    
    showCompletionMessage() {
        this.tooltip.innerHTML = `
            <div class="tutorial-completion">
                <div class="completion-icon">🎉</div>
                <h3 class="completion-title">Tutorial Complete!</h3>
                <p class="completion-message">You're now ready to use this feature like a pro!</p>
            </div>
        `;
        
        // Center the completion message
        this.tooltip.style.position = 'fixed';
        this.tooltip.style.top = '50%';
        this.tooltip.style.left = '50%';
        this.tooltip.style.transform = 'translate(-50%, -50%)';
    }
    
    endTour() {
        this.isActive = false;
        
        // Remove highlights and animations
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });
        document.querySelectorAll('.tutorial-pulse').forEach(el => {
            el.classList.remove('tutorial-pulse');
        });
        
        // Hide UI
        this.overlay.classList.remove('active');
        this.tooltip.classList.remove('active');
        
        setTimeout(() => {
            this.overlay.style.display = 'none';
            this.tooltip.style.display = 'none';
        }, 300);
        
        this.currentTour = null;
        this.currentStep = 0;
    }
    
    // Persistence methods
    loadCompletedTours() {
        try {
            const saved = localStorage.getItem('completedTutorials');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    }
    
    markTourCompleted(tourId) {
        if (!this.completedTours.includes(tourId)) {
            this.completedTours.push(tourId);
            localStorage.setItem('completedTutorials', JSON.stringify(this.completedTours));
        }
    }
    
    hasSeenWelcome() {
        return this.completedTours.includes('welcome');
    }
    
    resetProgress() {
        this.completedTours = [];
        localStorage.removeItem('completedTutorials');
        console.log('Tutorial progress reset!');
    }
    
    getTourStatus(tourId) {
        return this.completedTours.includes(tourId);
    }
}

// Initialize tutorial manager globally
if (typeof window !== 'undefined') {
    window.tutorialManager = new TutorialManager();
    
    // Expose helper function for manual tour start
    window.startTutorial = (tourId) => {
        if (window.tutorialManager) {
            window.tutorialManager.startTour(tourId);
        }
    };
    
    // Keyboard shortcut: F1 to restart current page tour
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F1') {
            e.preventDefault();
            
            // Determine which tour to start based on current page
            const path = window.location.pathname;
            let tourId = 'welcome';
            
            if (path.includes('Escaltion.html')) {
                tourId = 'escalator';
            } else if (path.includes('AdvancedWorkspaceHub.html')) {
                tourId = 'utilities';
            } else if (path.includes('QuickLinks.html')) {
                tourId = 'quicklinks';
            }
            
            window.tutorialManager.startTour(tourId);
        }
    });
}
