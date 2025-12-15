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
    // Also target the button in the hero section 
    const heroContactBtn = document.querySelector('.hero .btn-secondary');
    // And the footer CTA button
    const footerCtaBtn = document.querySelector('.footer-cta button');

    const modal = document.getElementById('contact-modal');
    const closeBtn = document.getElementById('close-modal');
    const step1 = document.getElementById('modal-step-1');
    const step2 = document.getElementById('modal-step-2');
    const statusMsg = document.querySelector('.status-message');

    function openModal(e) {
        if (e) e.preventDefault();
        modal.classList.add('active');

        // Reset State
        step1.classList.remove('hidden');
        step2.classList.add('hidden');
        statusMsg.innerText = "Establishing Secure Protocol...";
        statusMsg.style.color = "var(--accent-cyan)";

        // Animation Sequence
        setTimeout(() => {
            statusMsg.innerText = "Verifying Identity...";
        }, 800);

        setTimeout(() => {
            statusMsg.innerText = "Channel Encrypted.";
            statusMsg.style.color = "#10b981"; // Green
        }, 1600);

        setTimeout(() => {
            step1.classList.add('hidden');
            step2.classList.remove('hidden');
        }, 2000);
    }

    function closeModal() {
        modal.classList.remove('active');
    }

    // Attach listeners
    // Note: The footer CTA button has an inline onclick which we should override
    if (footerCtaBtn) {
        footerCtaBtn.onclick = null; // Clear inline handler
        footerCtaBtn.addEventListener('click', openModal);
    }

    // The hero contact button links to #contact section, we can hijack it or let it scroll then open?
    // Let's just open the modal for any button we think is 'Contact'
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

        statusMsg.innerText = "Encrypting & Transmitting...";

        // Use Fetch to send to Formspree
        // IMPORTANT: You will need to register your email on Formspree to verify this endpoint
        // or get a unique form ID (e.g. formspree.io/f/xyza...)
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
        });
    }

    if (form) {
        form.addEventListener("submit", handleSubmit);
    }
});
