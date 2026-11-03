const liftStatusCards = document.querySelectorAll('[data-lift-id]');

async function refreshLiftStatuses() {
    try {
        const response = await fetch('/services/lift-status', { cache: 'no-store' });
        if (!response.ok) return;

        const { liftStatuses } = await response.json();
        liftStatuses.forEach((lift) => {
            const card = document.querySelector(`[data-lift-id="${lift.id}"]`);
            if (!card) return;

            const pill = card.querySelector('[data-lift-status]');
            const label = card.querySelector('[data-lift-label]');
            const isWorking = lift.status === 'Working';

            pill.classList.toggle('is-open', isWorking);
            pill.classList.toggle('is-closed', !isWorking);
            label.textContent = lift.status;
        });
    } catch (error) {
        // Keep the last known status visible if a refresh temporarily fails.
        console.error('Unable to refresh campus lift statuses:', error);
    }
}

if (liftStatusCards.length) {
    refreshLiftStatuses();
    window.setInterval(refreshLiftStatuses, 5000);
}
