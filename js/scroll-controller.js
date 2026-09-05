/**
 * scroll-controller.js — Intersection Observer-based navigation & section tracking
 *
 * Updates active states on the floating navigation pill as sections scroll into view.
 * Kept calm and deliberate: no decorative fade-in lag.
 */

export class ScrollController {
    constructor() {
        this.sections = [];
        this.navLinks = [];
        this.observer = null;
    }

    init() {
        this._setupSections();
        this._setupNavigation();
    }

    _setupSections() {
        this.sections = Array.from(document.querySelectorAll('section[id]'));

        // Intersection observer for active section tracking
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this._setActiveSection(entry.target.id);
                }
            });
        }, {
            rootMargin: '-30% 0px -30% 0px',
            threshold: 0.1
        });

        this.sections.forEach(section => this.observer.observe(section));
    }

    _setupNavigation() {
        this.navLinks = Array.from(document.querySelectorAll('.nav-link[data-section]'));

        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const sectionId = link.dataset.section;
                const section = document.getElementById(sectionId);
                if (section) {
                    e.preventDefault();
                    section.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }

    _setActiveSection(sectionId) {
        this.navLinks.forEach(link => {
            const isActive = link.dataset.section === sectionId;
            link.classList.toggle('active', isActive);
            if (isActive) {
                link.setAttribute('aria-current', 'true');
            } else {
                link.removeAttribute('aria-current');
            }
        });
    }

    destroy() {
        if (this.observer) this.observer.disconnect();
    }
}
