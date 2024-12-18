document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('review-modal');
    const btn = document.getElementById('review-btn');
    const span = document.getElementsByClassName('close')[0];
    const stars = document.querySelectorAll('.stars i');
    const submitBtn = document.getElementById('submit-review');
    let selectedRating = 0;

    // Open modal
    btn.onclick = () => {
        modal.style.display = 'block';
    }

    // Sluit modal
    span.onclick = () => {
        modal.style.display = 'none';
    }

    // Sluit modal bij klik buiten modal
    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }

    // Sterren rating systeem
    stars.forEach(star => {
        star.addEventListener('mouseover', () => {
            const rating = star.getAttribute('data-rating');
            highlightStars(rating);
        });

        star.addEventListener('mouseout', () => {
            highlightStars(selectedRating);
        });

        star.addEventListener('click', () => {
            selectedRating = star.getAttribute('data-rating');
            highlightStars(selectedRating);
        });
    });

    function highlightStars(rating) {
        stars.forEach(star => {
            const starRating = star.getAttribute('data-rating');
            if (starRating <= rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    // Verstuur review
    submitBtn.addEventListener('click', () => {
        const reviewText = document.getElementById('review-text').value;
        if (selectedRating === 0) {
            alert('Selecteer alstublieft een aantal sterren');
            return;
        }

        // Hier kun je de review data versturen naar een backend
        alert(`Bedankt voor je ${selectedRating}-sterren review!`);
        modal.style.display = 'none';
        
        // Reset form
        document.getElementById('review-text').value = '';
        selectedRating = 0;
        highlightStars(0);
    });
}); 