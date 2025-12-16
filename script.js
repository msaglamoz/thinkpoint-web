document.addEventListener('DOMContentLoaded', () => {
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.fade-up');
    animatedElements.forEach(el => observer.observe(el));

    // Fluent Reveal Effect
    const cards = document.querySelectorAll('.eco-card');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });

    // Secure Contact Modal Logic
    const contactBtn = document.querySelector('a[href="#contact"]');
    const heroContactBtn = document.querySelector('.hero .btn-secondary');
    const footerCtaBtn = document.querySelector('.footer-cta button');

    const modal = document.getElementById('contact-modal');
    const closeBtn = document.getElementById('close-modal');

    // Steps
    const stepAuth = document.getElementById('modal-step-auth');
    const step2 = document.getElementById('modal-step-2');

    // Elements
    const statusMsg = document.querySelector('#modal-step-auth .status-message'); // Reuse if needed

    function openModal(e) {
        if (e) e.preventDefault();
        modal.classList.add('active');
        resetModal();

        // Show Auth Step
        if (stepAuth) stepAuth.classList.remove('hidden');
    }

    function closeModal() {
        modal.classList.remove('active');
    }

    // Attach listeners
    if (footerCtaBtn) {
        footerCtaBtn.onclick = null;
        footerCtaBtn.addEventListener('click', openModal);
    }

    document.querySelectorAll('a[href="#contact"]').forEach(btn => {
        btn.addEventListener('click', openModal);
    });

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Handle Form Submission via AJAX (Formspree)
    const form = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');

    async function handleSubmit(event) {
        event.preventDefault();
        const data = new FormData(event.target);

        // Optional: Update UI to show sending state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerText;
        submitBtn.innerText = "Encrypting & Transmitting...";
        submitBtn.disabled = true;

        fetch("https://formspree.io/f/xrbnvyee", {
            method: form.method,
            body: data,
            headers: {
                'Accept': 'application/json'
            }
        }).then(response => {
            if (response.ok) {
                alert('Message Encrypted & Sent Successfully.');
                form.reset();
                closeModal();
            } else {
                response.json().then(data => {
                    if (Object.hasOwn(data, 'errors')) {
                        formStatus.innerText = data["errors"].map(error => error["message"]).join(", ");
                        formStatus.style.color = "red";
                    } else {
                        formStatus.innerText = "Transmission Error.";
                        formStatus.style.color = "red";
                    }
                });
            }
        }).catch(error => {
            formStatus.innerText = "Connection Failed.";
            formStatus.style.color = "red";
        }).finally(() => {
            submitBtn.innerText = originalBtnText;
            submitBtn.disabled = false;
        });
    }

    if (form) {
        form.addEventListener("submit", handleSubmit);
    }



    // Reset helper
    function resetModal() {
        if (stepAuth) stepAuth.classList.add('hidden');
        if (step2) step2.classList.add('hidden');

        // Clear form status
        if (formStatus) formStatus.innerText = '';

        // Reset steps based on openModal logic (which unhides stepAuth)
        // This function just hides everything to ensure a clean slate
    }
});

// Google Sign-In Callback (Global Scope)
window.handleCredentialResponse = function (response) {
    if (response.credential) {
        // Decode JWT to get user info
        const responsePayload = decodeJwtResponse(response.credential);

        // UI Elements (Dynamic selection to ensure availability)
        const stepAuth = document.getElementById('modal-step-auth');
        const step2 = document.getElementById('modal-step-2');
        const form = document.getElementById('contact-form');

        // Transition to Form
        if (stepAuth) stepAuth.classList.add('hidden');
        if (step2) step2.classList.remove('hidden');

        // Pre-fill Email
        if (form) {
            const emailInput = form.querySelector('input[name="email"]');
            if (emailInput) {
                emailInput.value = responsePayload.email;
                emailInput.readOnly = true; // Lock it since it's verified
                emailInput.style.opacity = "0.7";
            }
        }
    }
};

function decodeJwtResponse(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}
