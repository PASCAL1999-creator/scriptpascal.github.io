document.addEventListener('DOMContentLoaded', () => {
    const languageToggle = document.getElementById('language-toggle');
    const currentLang = document.querySelector('.current-lang');
    let isEnglish = false;

    // Taal vertalingen
    const translations = {
        nl: {
            home: 'Home',
            games: 'Games',
            contact: 'Contact',
            share: 'Delen',
            welcome: 'Welkom bij mijn Portfolio',
            title: 'Frontend Developer & Grafisch Ontwerper',
            skills: {
                html: 'Semantische en toegankelijke websites bouwen',
                css: 'Responsive en moderne styling',
                js: 'Interactieve web applicaties',
                design: 'Creatief grafisch ontwerp'
            },
            work: {
                title: 'Werkervaring',
                role: 'Frontend Developer',
                description: 'Als Frontend Developer bij Script werk ik aan het ontwikkelen van moderne, gebruiksvriendelijke websites en webapplicaties.'
            },
            review: 'Beoordeel deze Website',
            loading: 'Laden...'
        },
        en: {
            home: 'Home',
            games: 'Games',
            contact: 'Contact',
            share: 'Share',
            welcome: 'Welcome to my Portfolio',
            title: 'Frontend Developer & Graphic Designer',
            skills: {
                html: 'Building semantic and accessible websites',
                css: 'Responsive and modern styling',
                js: 'Interactive web applications',
                design: 'Creative graphic design'
            },
            work: {
                title: 'Work Experience',
                role: 'Frontend Developer',
                description: 'As a Frontend Developer at Script, I work on developing modern, user-friendly websites and web applications.'
            },
            review: 'Review this Website',
            loading: 'Loading...'
        }
    };

    // Functie om de taal te wijzigen
    function toggleLanguage() {
        isEnglish = !isEnglish;
        const lang = isEnglish ? 'en' : 'nl';
        currentLang.textContent = lang.toUpperCase();
        updateContent(lang);
    }

    // Functie om de inhoud bij te werken
    function updateContent(lang) {
        const t = translations[lang];

        // Update navigatie
        document.querySelector('a[href="index.html"]').textContent = t.home;
        document.querySelector('a[href="games.html"]').textContent = t.games;
        document.querySelector('a[href="contact.html"]').textContent = t.contact;
        document.querySelector('.share-button-nav span').textContent = t.share;

        // Update welkom tekst
        document.querySelector('.welcome-text').textContent = t.welcome;

        // Update titel
        document.querySelector('.title').textContent = t.title;

        // Update skills
        document.querySelectorAll('.skill-card').forEach(card => {
            const skill = card.querySelector('h3').textContent.toLowerCase();
            if (t.skills[skill]) {
                card.querySelector('p').textContent = t.skills[skill];
            }
        });

        // Update werkervaring
        document.querySelector('.work-experience h2').textContent = t.work.title;
        document.querySelector('.work-info h3').textContent = t.work.role;
        document.querySelector('.work-description').textContent = t.work.description;

        // Update review knop
        document.querySelector('.review-btn').innerHTML = 
            `<i class="fas fa-star"></i> ${t.review}`;

        // Update loader tekst
        document.querySelector('.loader-text').textContent = t.loading;
    }

    // Event listener voor de taal schakelaar
    languageToggle.addEventListener('click', toggleLanguage);
}); 